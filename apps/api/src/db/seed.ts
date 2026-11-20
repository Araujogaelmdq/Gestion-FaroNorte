import argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { db } from './client.js';
import { runMigrations } from './migrate.js';
import { categorias, club, cuentas, rubros, usuarios } from './schema.js';

export async function runSeed() {
  console.log('🌱 Ejecutando seed de base de datos...');
  await runMigrations();

  // 1. Club
  const [clubExistente] = await db.select().from(club).where(eq(club.id, 1)).limit(1);
  if (!clubExistente) {
    await db.insert(club).values({
      id: 1,
      nombre: 'Club Social y Deportivo Faro Norte',
      contacto: 'Av. Costanera y Faro, Mar del Plata | Tel: (0223) 456-7890 | contacto@faronorte.club',
      escudo_url: '/LogoFN.jpg',
      dia_vencimiento: 10,
      descuento_familiar_pct: 15,
      actualizado_en: new Date().toISOString(),
    });
    console.log('  ✅ Club Faro Norte creado');
  } else {
    console.log('  ℹ️ Club Faro Norte ya existe');
  }

  // 2. Usuario Administrador
  const adminEmail = 'admin@faronorte.club';
  const [adminExistente] = await db.select().from(usuarios).where(eq(usuarios.email, adminEmail)).limit(1);
  if (!adminExistente) {
    const hash = await argon2.hash('Admin1234!');
    await db.insert(usuarios).values({
      email: adminEmail,
      nombre: 'Administrador Faro Norte',
      rol: 'administrador',
      contrasena_hash: hash,
      activo: true,
      debe_cambiar_clave: false,
    });
    console.log(`  ✅ Usuario administrador (${adminEmail}) creado`);
  } else {
    console.log(`  ℹ️ Usuario administrador (${adminEmail}) ya existe`);
  }

  // 3. Cuentas iniciales (si no existen)
  const cuentasExistentes = await db.select().from(cuentas);
  if (cuentasExistentes.length === 0) {
    await db.insert(cuentas).values([
      { nombre: 'Caja efectivo', saldo_inicial: 15000, activa: true },
      { nombre: 'Banco Provincia', saldo_inicial: 85000, activa: true },
      { nombre: 'Mercado Pago', saldo_inicial: 45000, activa: true },
      { nombre: 'Cantina / Buffet', saldo_inicial: 20000, activa: true },
    ]);
    console.log('  ✅ Cuentas iniciales creadas');
  }

  // 4. Categorías iniciales (si no existen)
  const categoriasExistentes = await db.select().from(categorias);
  if (categoriasExistentes.length === 0) {
    await db.insert(categorias).values([
      { nombre: 'Mayor', valor_cuota_centavos: 18000, activa: true },
      { nombre: 'Menor', valor_cuota_centavos: 12000, activa: true },
      { nombre: 'Cadete', valor_cuota_centavos: 15000, activa: true },
      { nombre: 'Vitalicio', valor_cuota_centavos: 0, activa: true },
    ]);
    console.log('  ✅ Categorías iniciales creadas');
  }

  // 5. Rubros iniciales (si no existen)
  const rubrosExistentes = await db.select().from(rubros);
  if (rubrosExistentes.length === 0) {
    await db.insert(rubros).values([
      { nombre: 'Cuotas sociales', tipo: 'ingreso', privado: false, activo: true },
      { nombre: 'Cantina', tipo: 'ingreso', privado: false, activo: true },
      { nombre: 'Servicios (Luz/Gas/Agua)', tipo: 'gasto', privado: false, activo: true },
      { nombre: 'Mantenimiento e infraestructura', tipo: 'gasto', privado: false, activo: true },
      { nombre: 'Materiales deportivos', tipo: 'gasto', privado: false, activo: true },
    ]);
    console.log('  ✅ Rubros iniciales creados');
  }

  console.log('🎉 Seed finalizado con éxito.');
}

if (process.argv[1] && process.argv[1].includes('seed')) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Error en seed:', err);
      process.exit(1);
    });
}
