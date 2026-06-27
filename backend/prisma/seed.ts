import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear sucursales
  const sucursal1 = await prisma.sucursal.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nombre: 'Sucursal Centro',
      direccion: 'Av. Principal #123, Centro',
      telefono: '555-0101',
      email: 'centro@farmacia.com',
    },
  });

  const sucursal2 = await prisma.sucursal.upsert({
    where: { id: 2 },
    update: {},
    create: {
      nombre: 'Sucursal Norte',
      direccion: 'Blvd. Norte #456, Col. Industrial',
      telefono: '555-0102',
      email: 'norte@farmacia.com',
    },
  });

  const sucursal3 = await prisma.sucursal.upsert({
    where: { id: 3 },
    update: {},
    create: {
      nombre: 'Sucursal Sur',
      direccion: 'Calle Sur #789, Col. Reforma',
      telefono: '555-0103',
      email: 'sur@farmacia.com',
    },
  });

  console.log('✅ Sucursales creadas');

  // Crear usuarios
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('123456', salt);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@farmacia.com' },
    update: {},
    create: {
      nombre: 'Admin',
      apellido: 'Sistema',
      email: 'admin@farmacia.com',
      passwordHash,
      rol: 'ADMIN',
      sucursalId: 1,
    },
  });

  const gerente1 = await prisma.usuario.upsert({
    where: { email: 'gerente@farmacia.com' },
    update: {},
    create: {
      nombre: 'María',
      apellido: 'García',
      email: 'gerente@farmacia.com',
      passwordHash,
      rol: 'GERENTE_SUCURSAL',
      sucursalId: 1,
    },
  });

  const cajero1 = await prisma.usuario.upsert({
    where: { email: 'cajero@farmacia.com' },
    update: {},
    create: {
      nombre: 'Juan',
      apellido: 'López',
      email: 'cajero@farmacia.com',
      passwordHash,
      rol: 'CAJERO',
      sucursalId: 1,
    },
  });

  const gerente2 = await prisma.usuario.upsert({
    where: { email: 'gerente2@farmacia.com' },
    update: {},
    create: {
      nombre: 'Ana',
      apellido: 'Martínez',
      email: 'gerente2@farmacia.com',
      passwordHash,
      rol: 'GERENTE_SUCURSAL',
      sucursalId: 2,
    },
  });

  console.log('✅ Usuarios creados');

  // Crear laboratorios
  const laboratorios = await Promise.all([
    prisma.laboratorio.create({
      data: { nombre: 'Bayer', paisOrigen: 'Alemania' },
    }),
    prisma.laboratorio.create({
      data: { nombre: 'Pfizer', paisOrigen: 'Estados Unidos' },
    }),
    prisma.laboratorio.create({
      data: { nombre: 'Roche', paisOrigen: 'Suiza' },
    }),
    prisma.laboratorio.create({
      data: { nombre: 'Laboratorios Silanes', paisOrigen: 'México' },
    }),
    prisma.laboratorio.create({
      data: { nombre: 'Genomma Lab', paisOrigen: 'México' },
    }),
  ]);

  console.log('✅ Laboratorios creados');

  // Crear categorías
  const categorias = await Promise.all([
    prisma.categoria.create({
      data: { nombre: 'Analgésicos', descripcion: 'Medicamentos para el dolor' },
    }),
    prisma.categoria.create({
      data: { nombre: 'Antibióticos', descripcion: 'Medicamentos para infecciones' },
    }),
    prisma.categoria.create({
      data: { nombre: 'Antiinflamatorios', descripcion: 'Medicamentos para inflamación' },
    }),
    prisma.categoria.create({
      data: { nombre: 'Vitaminas', descripcion: 'Suplementos vitamínicos' },
    }),
    prisma.categoria.create({
      data: { nombre: 'Antigripales', descripcion: 'Medicamentos para gripe y resfriado' },
    }),
  ]);

  console.log('✅ Categorías creadas');

  // Crear productos
  const productos = await Promise.all([
    prisma.producto.create({
      data: {
        codigoBarras: '7501001160272',
        nombre: 'Aspirina 500mg',
        principioActivo: 'Ácido Acetilsalicílico',
        laboratorioId: laboratorios[0].id,
        categoriaId: categorias[0].id,
        precioCompra: 25.00,
        precioVenta: 45.00,
      },
    }),
    prisma.producto.create({
      data: {
        codigoBarras: '7501001160289',
        nombre: 'Paracetamol 500mg',
        principioActivo: 'Paracetamol',
        laboratorioId: laboratorios[3].id,
        categoriaId: categorias[0].id,
        precioCompra: 15.00,
        precioVenta: 28.00,
      },
    }),
    prisma.producto.create({
      data: {
        codigoBarras: '7501001160296',
        nombre: 'Ibuprofeno 400mg',
        principioActivo: 'Ibuprofeno',
        laboratorioId: laboratorios[0].id,
        categoriaId: categorias[2].id,
        precioCompra: 30.00,
        precioVenta: 55.00,
      },
    }),
    prisma.producto.create({
      data: {
        codigoBarras: '7501001160302',
        nombre: 'Amoxicilina 500mg',
        principioActivo: 'Amoxicilina',
        laboratorioId: laboratorios[1].id,
        categoriaId: categorias[1].id,
        precioCompra: 45.00,
        precioVenta: 85.00,
        requiereReceta: true,
      },
    }),
    prisma.producto.create({
      data: {
        codigoBarras: '7501001160319',
        nombre: 'Vitamina C 1000mg',
        principioActivo: 'Ácido Ascórbico',
        laboratorioId: laboratorios[4].id,
        categoriaId: categorias[3].id,
        precioCompra: 50.00,
        precioVenta: 95.00,
      },
    }),
    prisma.producto.create({
      data: {
        codigoBarras: '7501001160326',
        nombre: 'Desenfriol-D',
        principioActivo: 'Paracetamol/Pseudoefedrina',
        laboratorioId: laboratorios[3].id,
        categoriaId: categorias[4].id,
        precioCompra: 35.00,
        precioVenta: 65.00,
      },
    }),
    prisma.producto.create({
      data: {
        codigoBarras: '7501001160333',
        nombre: 'Omeprazol 20mg',
        principioActivo: 'Omeprazol',
        laboratorioId: laboratorios[2].id,
        categoriaId: categorias[0].id,
        precioCompra: 40.00,
        precioVenta: 75.00,
      },
    }),
    prisma.producto.create({
      data: {
        codigoBarras: '7501001160340',
        nombre: 'Loratadina 10mg',
        principioActivo: 'Loratadina',
        laboratorioId: laboratorios[4].id,
        categoriaId: categorias[0].id,
        precioCompra: 20.00,
        precioVenta: 38.00,
      },
    }),
  ]);

  console.log('✅ Productos creados');

  // Crear lotes e inventario para cada sucursal
  const sucursales = [sucursal1, sucursal2, sucursal3];

  for (const sucursal of sucursales) {
    for (const producto of productos) {
      const cantidadBase = Math.floor(Math.random() * 50) + 10;

      await prisma.inventarioSucursal.create({
        data: {
          productoId: producto.id,
          sucursalId: sucursal.id,
          stockActual: cantidadBase,
          stockMinimo: 10,
        },
      });

      const fechaVencimiento = new Date();
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + Math.floor(Math.random() * 18) + 3);

      await prisma.lote.create({
        data: {
          productoId: producto.id,
          sucursalId: sucursal.id,
          numeroLote: `LOTE-${producto.id}-${sucursal.id}-001`,
          fechaVencimiento,
          cantidad: cantidadBase,
          precioCompraLote: producto.precioCompra,
        },
      });
    }
  }

  console.log('✅ Inventario y lotes creados');

  // Crear algunas ventas de ejemplo
  const hoy = new Date();
  const venta1 = await prisma.venta.create({
    data: {
      folio: `V-${hoy.toISOString().slice(0, 10).replace(/-/g, '')}-000001`,
      sucursalId: 1,
      usuarioId: cajero1.id,
      subtotal: 73.00,
      descuento: 0,
      impuestos: 0,
      total: 73.00,
      metodoPago: 'EFECTIVO',
      montoRecibido: 100.00,
      cambio: 27.00,
      detalles: {
        create: [
          {
            productoId: productos[1].id,
            cantidad: 1,
            precioUnitario: 28.00,
            subtotal: 28.00,
          },
          {
            productoId: productos[2].id,
            cantidad: 1,
            precioUnitario: 55.00,
            subtotal: 55.00,
          },
        ],
      },
    },
  });

  const venta2 = await prisma.venta.create({
    data: {
      folio: `V-${hoy.toISOString().slice(0, 10).replace(/-/g, '')}-000002`,
      sucursalId: 1,
      usuarioId: cajero1.id,
      subtotal: 95.00,
      descuento: 0,
      impuestos: 0,
      total: 95.00,
      metodoPago: 'TARJETA_CREDITO',
      detalles: {
        create: [
          {
            productoId: productos[4].id,
            cantidad: 1,
            precioUnitario: 95.00,
            subtotal: 95.00,
          },
        ],
      },
    },
  });

  console.log('✅ Ventas de ejemplo creadas');

  // Crear una transferencia de ejemplo
  const transferencia1 = await prisma.transferencia.create({
    data: {
      folio: `T-${hoy.toISOString().slice(0, 10).replace(/-/g, '')}-000001`,
      sucursalOrigenId: 1,
      sucursalDestinoId: 2,
      usuarioSolicitaId: gerente2.id,
      estado: 'PENDIENTE',
      notas: 'Solicitud de stock para sucursal norte',
      detalles: {
        create: [
          {
            productoId: productos[0].id,
            cantidadSolicitada: 20,
          },
          {
            productoId: productos[1].id,
            cantidadSolicitada: 30,
          },
        ],
      },
    },
  });

  console.log('✅ Transferencia de ejemplo creada');

  console.log('\n🎉 Seed completado exitosamente!\n');
  console.log('📋 Usuarios creados:');
  console.log('   - admin@farmacia.com / 123456 (ADMIN)');
  console.log('   - gerente@farmacia.com / 123456 (GERENTE_SUCURSAL)');
  console.log('   - cajero@farmacia.com / 123456 (CAJERO)');
  console.log('   - gerente2@farmacia.com / 123456 (GERENTE_SUCURSAL - Sucursal Norte)');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
