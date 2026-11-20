import { eq, sql, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { cuotas, socios, familias, categorias, club } from '../db/schema.js';

export async function getCuotasEstadoMes(periodo: string) {
  const [clubData] = await db.select().from(club).where(eq(club.id, 1)).limit(1);

  // Socios activos
  const sociosActivos = await db.select().from(socios).where(eq(socios.estado, 'activo'));
  const totalSocios = sociosActivos.length;

  // Cuotas del periodo
  const cuotasMes = await db.select().from(cuotas).where(
    and(eq(cuotas.periodo, periodo), eq(cuotas.anulado, false))
  );

  const emitidas = cuotasMes.length;
  const sinCuota = Math.max(0, totalSocios - emitidas);
  const cobradas = cuotasMes.filter((c) => c.pagado).length;
  const faltaCobrar = emitidas - cobradas;
  const emitidoMonto = cuotasMes.reduce((acc, c) => acc + c.importe, 0);
  const cobradoMonto = cuotasMes.filter((c) => c.pagado).reduce((acc, c) => acc + c.importe, 0);
  const cobrabilidad = emitidas > 0 ? Math.round((cobradas / emitidas) * 100) : 0;

  // Fecha vencimiento del periodo
  const [anio, mes] = periodo.split('-').map(Number);
  const diaVenc = clubData?.dia_vencimiento || 10;
  const fechaVencimiento = `${String(diaVenc).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${anio}`;

  return {
    totalSocios,
    sinCuota,
    emitidas,
    cobradas,
    faltaCobrar,
    emitidoMonto,
    cobradoMonto,
    cobrabilidad,
    fechaVencimiento,
    periodo,
  };
}

export async function generarCuotasMes(periodo: string): Promise<{ generadas: number; existentes: number }> {
  const [clubData] = await db.select().from(club).where(eq(club.id, 1)).limit(1);
  const [anio, mes] = periodo.split('-').map(Number);
  const diaVenc = clubData?.dia_vencimiento || 10;
  const fechaVence = `${anio}-${String(mes).padStart(2, '0')}-${String(diaVenc).padStart(2, '0')}`;
  const descuentoPct = clubData?.descuento_familiar_pct || 0;

  const sociosActivos = await db.select().from(socios).where(eq(socios.estado, 'activo'));
  const cats = await db.select().from(categorias);
  const catMap = new Map(cats.map((c) => [c.id, c]));

  // Agrupar socios activos por familia para aplicar descuento familiar
  const familiaSociosMap = new Map<number, typeof sociosActivos>();
  for (const s of sociosActivos) {
    if (s.familia_id) {
      const list = familiaSociosMap.get(s.familia_id) || [];
      list.push(s);
      familiaSociosMap.set(s.familia_id, list);
    }
  }

  // Cuotas ya existentes para el periodo
  const yaExisten = await db.select({ socio_id: cuotas.socio_id }).from(cuotas).where(eq(cuotas.periodo, periodo));
  const yaExistenSet = new Set(yaExisten.map((c) => c.socio_id));

  let generadas = 0;
  let existentes = 0;

  for (const socio of sociosActivos) {
    if (yaExistenSet.has(socio.id)) {
      existentes++;
      continue;
    }

    const cat = socio.categoria_id ? catMap.get(socio.categoria_id) : null;
    let importe = cat?.valor_cuota_centavos || 0;

    // Regla de Descuento Familiar:
    // Si el club tiene configurado descuento_familiar_pct > 0 y la familia tiene más de 1 socio activo:
    // El primer miembro (mayor cuota) abona el 100%, y a partir del segundo miembro activo se aplica el porcentaje de descuento.
    if (descuentoPct > 0 && socio.familia_id) {
      const miembros = familiaSociosMap.get(socio.familia_id) || [];
      if (miembros.length > 1) {
        const ordenados = [...miembros].sort((a, b) => {
          const cuotaA = (a.categoria_id ? catMap.get(a.categoria_id)?.valor_cuota_centavos : 0) || 0;
          const cuotaB = (b.categoria_id ? catMap.get(b.categoria_id)?.valor_cuota_centavos : 0) || 0;
          return cuotaB - cuotaA;
        });

        const posicion = ordenados.findIndex((m) => m.id === socio.id);
        if (posicion > 0) {
          const montoDescuento = Math.round(importe * (descuentoPct / 100));
          importe = Math.max(0, importe - montoDescuento);
        }
      }
    }

    await db.insert(cuotas).values({
      socio_id: socio.id,
      periodo,
      importe,
      vence_en: fechaVence,
      pagado: false,
      anulado: false,
    });
    generadas++;
  }

  return { generadas, existentes };
}

export async function getFamiliaDeudas() {
  // Cuotas vencidas y no pagadas
  const hoy = new Date().toISOString().split('T')[0];
  const cuotasVencidas = await db.select({
    socio_id: cuotas.socio_id,
    importe: cuotas.importe,
    vence_en: cuotas.vence_en,
    periodo: cuotas.periodo,
  })
    .from(cuotas)
    .where(and(eq(cuotas.pagado, false), eq(cuotas.anulado, false)));

  const soloVencidas = cuotasVencidas.filter((c) => c.vence_en < hoy);

  if (soloVencidas.length === 0) return [];

  const sociosData = await db.select().from(socios);
  const familiasData = await db.select().from(familias);
  const socioMap = new Map(sociosData.map((s) => [s.id, s]));
  const familiaMap = new Map(familiasData.map((f) => [f.id, f]));

  // Agrupar por familia
  const porFamilia = new Map<number, { monto: number; cantidad: number; masAntigua: string; telefono: string | null }>();

  for (const c of soloVencidas) {
    const socio = socioMap.get(c.socio_id);
    if (!socio || socio.estado !== 'activo') continue;
    const familiaId = socio.familia_id || 0;
    const actual = porFamilia.get(familiaId) || { monto: 0, cantidad: 0, masAntigua: c.vence_en, telefono: socio.telefono };
    actual.monto += c.importe;
    actual.cantidad++;
    if (c.vence_en < actual.masAntigua) actual.masAntigua = c.vence_en;
    porFamilia.set(familiaId, actual);
  }

  const result = [];
  for (const [familiaId, datos] of porFamilia.entries()) {
    const familia = familiaId ? familiaMap.get(familiaId) : null;
    result.push({
      familia_id: familiaId || null,
      familia_nombre: familia?.nombre || 'Sin familia',
      responsable_nombre: familia?.responsable_nombre || null,
      responsable_telefono: familia?.responsable_telefono || datos.telefono || null,
      monto: datos.monto,
      cantidad_cuotas: datos.cantidad,
      debe_desde: datos.masAntigua,
    });
  }

  return result.sort((a, b) => b.monto - a.monto);
}

