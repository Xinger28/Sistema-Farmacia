import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const rawUrl = process.env.DATABASE_URL || '';
const connectionString = rawUrl.includes('sslmode') ? rawUrl : rawUrl + '?sslmode=require';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // ── Sucursales ──────────────────────────────────────────────
  const sucursal1 = await prisma.sucursal.upsert({
    where: { id: 1 },
    update: {},
    create: { nombre: 'Sucursal Centro', direccion: 'Av. Principal #123, Centro', telefono: '555-0101', email: 'centro@farmacia.com' },
  });
  const sucursal2 = await prisma.sucursal.upsert({
    where: { id: 2 },
    update: {},
    create: { nombre: 'Sucursal Norte', direccion: 'Blvd. Norte #456, Col. Industrial', telefono: '555-0102', email: 'norte@farmacia.com' },
  });
  const sucursal3 = await prisma.sucursal.upsert({
    where: { id: 3 },
    update: {},
    create: { nombre: 'Sucursal Sur', direccion: 'Calle Sur #789, Col. Reforma', telefono: '555-0103', email: 'sur@farmacia.com' },
  });
  console.log('✅ Sucursales creadas');

  // ── Usuarios ────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('123456', 10);

  const cajero1 = await prisma.usuario.upsert({
    where: { email: 'admin@farmacia.com' },
    update: {},
    create: { nombre: 'Admin', apellido: 'Sistema', email: 'admin@farmacia.com', passwordHash, rol: 'ADMIN', sucursalId: 1 },
  });
  await prisma.usuario.upsert({
    where: { email: 'gerente@farmacia.com' },
    update: {},
    create: { nombre: 'María', apellido: 'García', email: 'gerente@farmacia.com', passwordHash, rol: 'GERENTE_SUCURSAL', sucursalId: 1 },
  });
  const cajeroUser = await prisma.usuario.upsert({
    where: { email: 'cajero@farmacia.com' },
    update: {},
    create: { nombre: 'Juan', apellido: 'López', email: 'cajero@farmacia.com', passwordHash, rol: 'CAJERO', sucursalId: 1 },
  });
  const gerente2 = await prisma.usuario.upsert({
    where: { email: 'gerente2@farmacia.com' },
    update: {},
    create: { nombre: 'Ana', apellido: 'Martínez', email: 'gerente2@farmacia.com', passwordHash, rol: 'GERENTE_SUCURSAL', sucursalId: 2 },
  });
  console.log('✅ Usuarios creados');

  // ── Laboratorios ────────────────────────────────────────────
  const labs = await Promise.all([
    prisma.laboratorio.upsert({ where: { id: 1 }, update: {}, create: { nombre: 'Bayer', paisOrigen: 'Alemania' } }),
    prisma.laboratorio.upsert({ where: { id: 2 }, update: {}, create: { nombre: 'Pfizer', paisOrigen: 'Estados Unidos' } }),
    prisma.laboratorio.upsert({ where: { id: 3 }, update: {}, create: { nombre: 'Roche', paisOrigen: 'Suiza' } }),
    prisma.laboratorio.upsert({ where: { id: 4 }, update: {}, create: { nombre: 'Laboratorios Silanes', paisOrigen: 'México' } }),
    prisma.laboratorio.upsert({ where: { id: 5 }, update: {}, create: { nombre: 'Genomma Lab', paisOrigen: 'México' } }),
  ]);
  console.log('✅ Laboratorios creados');

  // ── Categorías ──────────────────────────────────────────────
  const cats = await Promise.all([
    prisma.categoria.upsert({ where: { id: 1 }, update: {}, create: { nombre: 'Analgésicos', descripcion: 'Medicamentos para el dolor' } }),
    prisma.categoria.upsert({ where: { id: 2 }, update: {}, create: { nombre: 'Antibióticos', descripcion: 'Medicamentos para infecciones' } }),
    prisma.categoria.upsert({ where: { id: 3 }, update: {}, create: { nombre: 'Antiinflamatorios', descripcion: 'Medicamentos para inflamación' } }),
    prisma.categoria.upsert({ where: { id: 4 }, update: {}, create: { nombre: 'Vitaminas', descripcion: 'Suplementos vitamínicos' } }),
    prisma.categoria.upsert({ where: { id: 5 }, update: {}, create: { nombre: 'Antigripales', descripcion: 'Medicamentos para gripe y resfriado' } }),
  ]);
  console.log('✅ Categorías creadas');

  // ── Productos ───────────────────────────────────────────────
  const productosData = [
    { codigoBarras: '7501001160272', nombre: 'Aspirina 500mg',    principioActivo: 'Ácido Acetilsalicílico',    laboratorioId: labs[0].id, categoriaId: cats[0].id, precioCompra: 25, precioVenta: 45, requiereReceta: false },
    { codigoBarras: '7501001160289', nombre: 'Paracetamol 500mg', principioActivo: 'Paracetamol',               laboratorioId: labs[3].id, categoriaId: cats[0].id, precioCompra: 15, precioVenta: 28, requiereReceta: false },
    { codigoBarras: '7501001160296', nombre: 'Ibuprofeno 400mg',  principioActivo: 'Ibuprofeno',                laboratorioId: labs[0].id, categoriaId: cats[2].id, precioCompra: 30, precioVenta: 55, requiereReceta: false },
    { codigoBarras: '7501001160302', nombre: 'Amoxicilina 500mg', principioActivo: 'Amoxicilina',               laboratorioId: labs[1].id, categoriaId: cats[1].id, precioCompra: 45, precioVenta: 85, requiereReceta: true  },
    { codigoBarras: '7501001160319', nombre: 'Vitamina C 1000mg', principioActivo: 'Ácido Ascórbico',           laboratorioId: labs[4].id, categoriaId: cats[3].id, precioCompra: 50, precioVenta: 95, requiereReceta: false },
    { codigoBarras: '7501001160326', nombre: 'Desenfriol-D',      principioActivo: 'Paracetamol/Pseudoefedrina',laboratorioId: labs[3].id, categoriaId: cats[4].id, precioCompra: 35, precioVenta: 65, requiereReceta: false },
    { codigoBarras: '7501001160333', nombre: 'Omeprazol 20mg',    principioActivo: 'Omeprazol',                 laboratorioId: labs[2].id, categoriaId: cats[0].id, precioCompra: 40, precioVenta: 75, requiereReceta: false },
    { codigoBarras: '7501001160340', nombre: 'Loratadina 10mg',   principioActivo: 'Loratadina',                laboratorioId: labs[4].id, categoriaId: cats[0].id, precioCompra: 20, precioVenta: 38, requiereReceta: false },
  ];

  const productos = await Promise.all(
    productosData.map(p =>
      prisma.producto.upsert({
        where: { codigoBarras: p.codigoBarras },
        update: {},
        create: p,
      })
    )
  );
  console.log('✅ Productos creados');

  // ── Inventario y Lotes ──────────────────────────────────────
  const sucursales = [sucursal1, sucursal2, sucursal3];
  for (const sucursal of sucursales) {
    for (const producto of productos) {
      const cantidad = Math.floor(Math.random() * 50) + 10;

      await prisma.inventarioSucursal.upsert({
        where: { productoId_sucursalId: { productoId: producto.id, sucursalId: sucursal.id } },
        update: {},
        create: { productoId: producto.id, sucursalId: sucursal.id, stockActual: cantidad, stockMinimo: 10 },
      });

      const fechaVencimiento = new Date();
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + Math.floor(Math.random() * 18) + 3);

      const numeroLote = `LOTE-${producto.id}-${sucursal.id}-001`;
      const loteExiste = await prisma.lote.findUnique({
        where: { productoId_sucursalId_numeroLote: { productoId: producto.id, sucursalId: sucursal.id, numeroLote } },
      });
      if (!loteExiste) {
        await prisma.lote.create({
          data: { productoId: producto.id, sucursalId: sucursal.id, numeroLote, fechaVencimiento, cantidad, precioCompraLote: producto.precioCompra },
        });
      }
    }
  }
  console.log('✅ Inventario y lotes creados');

  // ── Ventas de ejemplo ───────────────────────────────────────
  const folioV1 = 'V-SEED-000001';
  const ventaExiste = await prisma.venta.findUnique({ where: { folio: folioV1 } });
  if (!ventaExiste) {
    await prisma.venta.create({
      data: {
        folio: folioV1, sucursalId: 1, usuarioId: cajeroUser.id,
        subtotal: 73, descuento: 0, impuestos: 0, total: 73,
        metodoPago: 'EFECTIVO', montoRecibido: 100, cambio: 27,
        detalles: {
          create: [
            { productoId: productos[1].id, cantidad: 1, precioUnitario: 28, subtotal: 28 },
            { productoId: productos[2].id, cantidad: 1, precioUnitario: 55, subtotal: 55 },
          ],
        },
      },
    });
  }

  const folioV2 = 'V-SEED-000002';
  const venta2Existe = await prisma.venta.findUnique({ where: { folio: folioV2 } });
  if (!venta2Existe) {
    await prisma.venta.create({
      data: {
        folio: folioV2, sucursalId: 1, usuarioId: cajeroUser.id,
        subtotal: 95, descuento: 0, impuestos: 0, total: 95,
        metodoPago: 'TARJETA_CREDITO',
        detalles: { create: [{ productoId: productos[4].id, cantidad: 1, precioUnitario: 95, subtotal: 95 }] },
      },
    });
  }
  console.log('✅ Ventas de ejemplo creadas');

  // ── Transferencia de ejemplo ────────────────────────────────
  const folioT1 = 'T-SEED-000001';
  const transExiste = await prisma.transferencia.findUnique({ where: { folio: folioT1 } });
  if (!transExiste) {
    await prisma.transferencia.create({
      data: {
        folio: folioT1, sucursalOrigenId: 1, sucursalDestinoId: 2,
        usuarioSolicitaId: gerente2.id, estado: 'PENDIENTE',
        notas: 'Solicitud de stock para sucursal norte',
        detalles: {
          create: [
            { productoId: productos[0].id, cantidadSolicitada: 20 },
            { productoId: productos[1].id, cantidadSolicitada: 30 },
          ],
        },
      },
    });
  }
  console.log('✅ Transferencia de ejemplo creada');

  console.log('\n🎉 Seed completado exitosamente!\n');
  console.log('📋 Credenciales:');
  console.log('   admin@farmacia.com    / 123456  (ADMIN)');
  console.log('   gerente@farmacia.com  / 123456  (GERENTE_SUCURSAL)');
  console.log('   cajero@farmacia.com   / 123456  (CAJERO)');
  console.log('   gerente2@farmacia.com / 123456  (GERENTE_SUCURSAL - Sucursal Norte)');
}

main()
  .catch(e => { console.error('Error en seed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
