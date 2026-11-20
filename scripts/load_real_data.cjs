const Database = require('better-sqlite3');
const ExcelJS = require('exceljs');
const path = require('path');

const dbPath = path.resolve('apps/api/sqlite.db');
const db = new Database(dbPath);

console.log('--- ACTUALIZANDO DATOS DEL CLUB FARO NORTE ---');

// 1. Actualizar Club
db.prepare(`
  UPDATE club SET
    nombre = 'Club Social y Deportivo Faro Norte',
    contacto = 'Av. Costanera y Faro, Mar del Plata | Tel: (0223) 456-7890 | contacto@faronorte.club',
    escudo_url = '/LogoFN.jpg',
    dia_vencimiento = 10,
    descuento_familiar_pct = 15,
    actualizado_en = datetime('now')
  WHERE id = 1
`).run();
console.log('✅ Club Faro Norte actualizado (Descuento familiar 15%, Vencimiento día 10)');

// 2. Actualizar / Insertar Cuentas
const cuentasData = [
  { id: 1, nombre: 'Caja efectivo', saldo_inicial: 15000 },
  { id: 2, nombre: 'Banco Provincia', saldo_inicial: 85000 },
  { id: 3, nombre: 'Mercado Pago', saldo_inicial: 45000 },
  { id: 4, nombre: 'Cantina / Buffet', saldo_inicial: 20000 },
];
for (const c of cuentasData) {
  const existe = db.prepare('SELECT id FROM cuentas WHERE id = ?').get(c.id);
  if (existe) {
    db.prepare('UPDATE cuentas SET nombre = ?, saldo_inicial = ?, activa = 1 WHERE id = ?').run(c.nombre, c.saldo_inicial, c.id);
  } else {
    db.prepare('INSERT INTO cuentas (id, nombre, saldo_inicial, activa) VALUES (?, ?, ?, 1)').run(c.id, c.nombre, c.saldo_inicial);
  }
}
console.log('✅ Cuentas de tesorería actualizadas');

// 3. Categorías
const categoriasData = [
  { id: 1, nombre: 'Mayor', valor: 18000 },
  { id: 2, nombre: 'Menor', valor: 12000 },
  { id: 3, nombre: 'Cadete', valor: 15000 },
  { id: 4, nombre: 'Vitalicio', valor: 0 },
];
for (const cat of categoriasData) {
  const existe = db.prepare('SELECT id FROM categorias WHERE id = ?').get(cat.id);
  if (existe) {
    db.prepare('UPDATE categorias SET nombre = ?, valor_cuota_centavos = ?, activa = 1 WHERE id = ?').run(cat.nombre, cat.valor, cat.id);
  } else {
    db.prepare('INSERT INTO categorias (id, nombre, valor_cuota_centavos, activa) VALUES (?, ?, ?, 1)').run(cat.id, cat.nombre, cat.valor);
  }
}
console.log('✅ Categorías actualizadas (Mayor: $18.000, Menor: $12.000, Cadete: $15.000, Vitalicio: $0)');

// 4. Familias y Socios
const familiasData = [
  { id: 1, nombre: 'Familia García', responsable_nombre: 'Juan García', responsable_dni: '28456123', responsable_telefono: '2234567890' },
  { id: 2, nombre: 'Familia Martínez', responsable_nombre: 'Carlos Martínez', responsable_dni: '30112233', responsable_telefono: '2235678901' },
  { id: 3, nombre: 'Familia Pérez', responsable_nombre: 'Romina Pérez', responsable_dni: '32445566', responsable_telefono: '2236789012' },
  { id: 4, nombre: 'Familia González', responsable_nombre: 'Fernando González', responsable_dni: '26778899', responsable_telefono: '2237890123' },
  { id: 5, nombre: 'Familia Rossi', responsable_nombre: 'Alberto Rossi', responsable_dni: '14223344', responsable_telefono: '2238901234' },
  { id: 6, nombre: 'Familia Fernández', responsable_nombre: 'Mateo Fernández', responsable_dni: '44556677', responsable_telefono: '2239012345' },
];

for (const f of familiasData) {
  const existe = db.prepare('SELECT id FROM familias WHERE id = ?').get(f.id);
  if (!existe) {
    db.prepare('INSERT INTO familias (id, nombre, responsable_nombre, responsable_dni, responsable_telefono) VALUES (?, ?, ?, ?, ?)').run(
      f.id, f.nombre, f.responsable_nombre, f.responsable_dni, f.responsable_telefono
    );
  }
}

const sociosData = [
  { numero: 1, apellido: 'García', nombre: 'Juan', dni: '28456123', nacimiento: '15/03/1981', categoria_id: 1, familia_id: 1, tutor: null, telefono: '2234567890', estado: 'activo', vencimiento_apto: '2026-12-31' },
  { numero: 2, apellido: 'García', nombre: 'Tomás', dni: '48123456', nacimiento: '10/06/2012', categoria_id: 2, familia_id: 1, tutor: 'Juan García', telefono: '2234567890', estado: 'activo', vencimiento_apto: '2026-11-30' },
  { numero: 3, apellido: 'Martínez', nombre: 'Carlos', dni: '30112233', nacimiento: '22/08/1983', categoria_id: 1, familia_id: 2, tutor: null, telefono: '2235678901', estado: 'activo', vencimiento_apto: '2026-10-15' },
  { numero: 4, apellido: 'Martínez', nombre: 'Lucía', dni: '50223344', nacimiento: '05/11/2015', categoria_id: 2, familia_id: 2, tutor: 'Carlos Martínez', telefono: '2235678901', estado: 'activo', vencimiento_apto: null },
  { numero: 5, apellido: 'Pérez', nombre: 'Romina', dni: '32445566', nacimiento: '14/02/1987', categoria_id: 1, familia_id: 3, tutor: null, telefono: '2236789012', estado: 'activo', vencimiento_apto: '2027-03-31' },
  { numero: 6, apellido: 'González', nombre: 'Fernando', dni: '26778899', nacimiento: '19/09/1978', categoria_id: 1, familia_id: 4, tutor: null, telefono: '2237890123', estado: 'activo', vencimiento_apto: '2026-12-15' },
  { numero: 7, apellido: 'González', nombre: 'Sofía', dni: '45889900', nacimiento: '03/04/2007', categoria_id: 3, familia_id: 4, tutor: 'Fernando González', telefono: '2237890123', estado: 'activo', vencimiento_apto: '2026-09-30' },
  { numero: 8, apellido: 'González', nombre: 'Joaquín', dni: '49001122', nacimiento: '18/12/2013', categoria_id: 2, familia_id: 4, tutor: 'Fernando González', telefono: '2237890123', estado: 'activo', vencimiento_apto: null },
  { numero: 9, apellido: 'Rossi', nombre: 'Alberto', dni: '14223344', nacimiento: '25/05/1955', categoria_id: 4, familia_id: 5, tutor: null, telefono: '2238901234', estado: 'vitalicio', vencimiento_apto: null },
  { numero: 10, apellido: 'Fernández', nombre: 'Mateo', dni: '44556677', nacimiento: '12/01/2005', categoria_id: 3, familia_id: 6, tutor: null, telefono: '2239012345', estado: 'activo', vencimiento_apto: '2026-12-01' },
];

for (const s of sociosData) {
  const existe = db.prepare('SELECT id FROM socios WHERE dni = ?').get(s.dni);
  if (!existe) {
    db.prepare(`
      INSERT INTO socios (numero, apellido, nombre, dni, nacimiento, categoria_id, familia_id, tutor, telefono, estado, vencimiento_apto, creado_en)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(s.numero, s.apellido, s.nombre, s.dni, s.nacimiento, s.categoria_id, s.familia_id, s.tutor, s.telefono, s.estado, s.vencimiento_apto);
  }
}
console.log('✅ Padrón oficial de 10 socios y 6 familias cargado');

// 5. Crear archivo Excel en documents/padron_socios_faronorte.xlsx
const workbook = new ExcelJS.Workbook();
const sheet = workbook.addWorksheet('Socios');
const headers = ['apellido', 'nombre', 'dni', 'nacimiento', 'categoria', 'familia', 'tutor', 'telefono', 'estado', 'vencimiento_apto'];
sheet.addRow(headers);

const rowsExcel = [
  ['García', 'Juan', '28456123', '15/03/1981', 'Mayor', 'Familia García', '', '2234567890', 'activo', '31/12/2026'],
  ['García', 'Tomás', '48123456', '10/06/2012', 'Menor', 'Familia García', 'Juan García', '2234567890', 'activo', '30/11/2026'],
  ['Martínez', 'Carlos', '30112233', '22/08/1983', 'Mayor', 'Familia Martínez', '', '2235678901', 'activo', '15/10/2026'],
  ['Martínez', 'Lucía', '50223344', '05/11/2015', 'Menor', 'Familia Martínez', 'Carlos Martínez', '2235678901', 'activo', ''],
  ['Pérez', 'Romina', '32445566', '14/02/1987', 'Mayor', 'Familia Pérez', '', '2236789012', 'activo', '31/03/2027'],
  ['González', 'Fernando', '26778899', '19/09/1978', 'Mayor', 'Familia González', '', '2237890123', 'activo', '15/12/2026'],
  ['González', 'Sofía', '45889900', '03/04/2007', 'Cadete', 'Familia González', 'Fernando González', '2237890123', 'activo', '30/09/2026'],
  ['González', 'Joaquín', '49001122', '18/12/2013', 'Menor', 'Familia González', 'Fernando González', '2237890123', 'activo', ''],
  ['Rossi', 'Alberto', '14223344', '25/05/1955', 'Vitalicio', 'Familia Rossi', '', '2238901234', 'vitalicio', ''],
  ['Fernández', 'Mateo', '44556677', '12/01/2005', 'Cadete', 'Familia Fernández', '', '2239012345', 'activo', '01/12/2026'],
];

rowsExcel.forEach((r) => sheet.addRow(r));
sheet.getRow(1).font = { bold: true };
headers.forEach((_, i) => { sheet.getColumn(i + 1).width = 20; });

const outputPath = path.resolve('documents/padron_socios_faronorte.xlsx');
workbook.xlsx.writeFile(outputPath).then(() => {
  console.log('✅ Archivo Excel generado en:', outputPath);
  process.exit(0);
});

