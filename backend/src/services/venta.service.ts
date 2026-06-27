import prisma from '../config/database';
import { CustomError } from '../middleware/errorHandler';
import { MetodoPago } from '../generated/prisma/client';

interface DetalleVentaDto {
  productoId: number;
  cantidad: number;
  precioUnitario?: number;
  descuento?: number;
}

interface CreateVentaDto {
  sucursalId: number;
  usuarioId: number;
  metodoPago: MetodoPago;
  montoRecibido?: number;
  descuento?: number;
  notas?: string;
  detalles: DetalleVentaDto[];
}

interface VentaDelDia {
  totalVentas: number;
  montoTotal: number;
  ventasPorMetodo: { metodo: string; cantidad: number; monto: number }[];
  productosMasVendidos: { productoId: number; nombre: string; cantidad: number }[];
}

export class VentaService {
  async procesarVenta(data: CreateVentaDto) {
    if (data.detalles.length === 0) {
      throw new CustomError('La venta debe tener al menos un producto', 400, 'INVALID_DATA');
    }

    for (const detalle of data.detalles) {
      if (detalle.cantidad <= 0) {
        throw new CustomError('La cantidad debe ser mayor a 0', 400, 'INVALID_QUANTITY');
      }
    }

    const result = await prisma.$transaction(async (tx: any) => {
      let subtotal = 0;
      const detallesProcesados: any[] = [];

      for (const detalle of data.detalles) {
        const producto = await tx.producto.findUnique({
          where: { id: detalle.productoId, activo: true },
        });

        if (!producto) {
          throw new CustomError(`Producto con ID ${detalle.productoId} no encontrado`, 404, 'NOT_FOUND');
        }

        const inventario = await tx.inventarioSucursal.findFirst({
          where: {
            productoId: detalle.productoId,
            sucursalId: data.sucursalId,
          },
        });

        if (!inventario) {
          throw new CustomError(`Producto ${producto.nombre} no disponible en esta sucursal`, 400, 'NOT_IN_INVENTORY');
        }

        if (inventario.stockActual < detalle.cantidad) {
          throw new CustomError(
            `Stock insuficiente para ${producto.nombre}. Disponible: ${inventario.stockActual}`,
            400,
            'INSUFFICIENT_STOCK'
          );
        }

        const lotes = await tx.lote.findMany({
          where: {
            productoId: detalle.productoId,
            sucursalId: data.sucursalId,
            cantidad: { gt: 0 },
            fechaVencimiento: { gt: new Date() },
          },
          orderBy: { fechaVencimiento: 'asc' },
        });

        let cantidadRestante = detalle.cantidad;
        const lotesSeleccionados: { loteId: number; cantidad: number }[] = [];

        for (const lote of lotes) {
          if (cantidadRestante <= 0) break;

          const cantidadDelLote = Math.min(cantidadRestante, lote.cantidad);
          lotesSeleccionados.push({
            loteId: lote.id,
            cantidad: cantidadDelLote,
          });
          cantidadRestante -= cantidadDelLote;
        }

        if (cantidadRestante > 0) {
          throw new CustomError(
            `Stock insuficiente en lotes para ${producto.nombre}`,
            400,
            'INSUFFICIENT_LOT_STOCK'
          );
        }

        const precioUnitario = detalle.precioUnitario || Number(producto.precioVenta);
        const descuentoProducto = detalle.descuento || 0;
        const subtotalLinea = precioUnitario * detalle.cantidad - descuentoProducto;

        subtotal += subtotalLinea;

        for (const loteSeleccionado of lotesSeleccionados) {
          await tx.lote.update({
            where: { id: loteSeleccionado.loteId },
            data: {
              cantidad: { decrement: loteSeleccionado.cantidad },
            },
          });
        }

        await tx.inventarioSucursal.update({
          where: { id: inventario.id },
          data: {
            stockActual: { decrement: detalle.cantidad },
            version: { increment: 1 },
          },
        });

        detallesProcesados.push({
          productoId: detalle.productoId,
          loteId: lotesSeleccionados[0]?.loteId,
          cantidad: detalle.cantidad,
          precioUnitario,
          descuento: descuentoProducto,
          subtotal: subtotalLinea,
        });
      }

      const descuentoGeneral = data.descuento || 0;
      const impuestos = 0;
      const total = subtotal - descuentoGeneral + impuestos;

      if (data.metodoPago === MetodoPago.EFECTIVO) {
        if (!data.montoRecibido || data.montoRecibido < total) {
          throw new CustomError('El monto recibido es insuficiente', 400, 'INSUFFICIENT_PAYMENT');
        }
      }

      const count = await tx.venta.count();
      const fecha = new Date();
      const fechaStr = fecha.toISOString().slice(0, 10).replace(/-/g, '');
      const folio = `V-${fechaStr}-${String(count + 1).padStart(6, '0')}`;

      const cambio = data.metodoPago === MetodoPago.EFECTIVO
        ? (data.montoRecibido || 0) - total
        : 0;

      const venta = await tx.venta.create({
        data: {
          folio,
          sucursalId: data.sucursalId,
          usuarioId: data.usuarioId,
          subtotal,
          descuento: descuentoGeneral,
          impuestos,
          total,
          metodoPago: data.metodoPago,
          montoRecibido: data.montoRecibido,
          cambio,
          notas: data.notas,
          detalles: {
            create: detallesProcesados,
          },
        },
        include: {
          sucursal: { select: { id: true, nombre: true } },
          usuario: { select: { id: true, nombre: true, apellido: true } },
          detalles: {
            include: {
              producto: { select: { id: true, nombre: true, codigoBarras: true } },
              lote: { select: { id: true, numeroLote: true, fechaVencimiento: true } },
            },
          },
        },
      });

      return venta;
    });

    return result;
  }

  async getById(id: number) {
    const venta = await prisma.venta.findUnique({
      where: { id },
      include: {
        sucursal: { select: { id: true, nombre: true, direccion: true } },
        usuario: { select: { id: true, nombre: true, apellido: true } },
        detalles: {
          include: {
            producto: { select: { id: true, nombre: true, codigoBarras: true } },
            lote: { select: { id: true, numeroLote: true, fechaVencimiento: true } },
          },
        },
      },
    });

    if (!venta) {
      throw new CustomError('Venta no encontrada', 404, 'NOT_FOUND');
    }

    return venta;
  }

  async getByFolio(folio: string) {
    const venta = await prisma.venta.findUnique({
      where: { folio },
      include: {
        sucursal: { select: { id: true, nombre: true, direccion: true } },
        usuario: { select: { id: true, nombre: true, apellido: true } },
        detalles: {
          include: {
            producto: { select: { id: true, nombre: true, codigoBarras: true } },
            lote: { select: { id: true, numeroLote: true, fechaVencimiento: true } },
          },
        },
      },
    });

    if (!venta) {
      throw new CustomError('Venta no encontrada', 404, 'NOT_FOUND');
    }

    return venta;
  }

  async getVentasDelDia(sucursalId: number, fecha?: Date): Promise<VentaDelDia> {
    const inicioDia = fecha ? new Date(fecha) : new Date();
    inicioDia.setHours(0, 0, 0, 0);

    const finDia = new Date(inicioDia);
    finDia.setHours(23, 59, 59, 999);

    const [ventas, ventasPorMetodo, productosMasVendidos] = await Promise.all([
      prisma.venta.findMany({
        where: {
          sucursalId,
          createdAt: {
            gte: inicioDia,
            lte: finDia,
          },
        },
      }),
      prisma.venta.groupBy({
        by: ['metodoPago'],
        where: {
          sucursalId,
          createdAt: {
            gte: inicioDia,
            lte: finDia,
          },
        },
        _count: { id: true },
        _sum: { total: true },
      }),
      prisma.detalleVenta.groupBy({
        by: ['productoId'],
        where: {
          venta: {
            sucursalId,
            createdAt: {
              gte: inicioDia,
              lte: finDia,
            },
          },
        },
        _sum: { cantidad: true },
        orderBy: { _sum: { cantidad: 'desc' } },
        take: 10,
      }),
    ]);

    const totalVentas = ventas.length;
    const montoTotal = ventas.reduce((sum, v) => sum + Number(v.total), 0);

    const ventasPorMetodoFormatted = ventasPorMetodo.map((v) => ({
      metodo: v.metodoPago,
      cantidad: v._count.id,
      monto: Number(v._sum.total || 0),
    }));

    const productosConNombre = await Promise.all(
      productosMasVendidos.map(async (p) => {
        const producto = await prisma.producto.findUnique({
          where: { id: p.productoId },
          select: { nombre: true },
        });
        return {
          productoId: p.productoId,
          nombre: producto?.nombre || 'Desconocido',
          cantidad: p._sum.cantidad || 0,
        };
      })
    );

    return {
      totalVentas,
      montoTotal,
      ventasPorMetodo: ventasPorMetodoFormatted,
      productosMasVendidos: productosConNombre,
    };
  }

  async getVentasPorRango(
    sucursalId: number,
    fechaInicio: Date,
    fechaFin: Date
  ) {
    const ventas = await prisma.venta.findMany({
      where: {
        sucursalId,
        createdAt: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      include: {
        usuario: { select: { id: true, nombre: true, apellido: true } },
        detalles: {
          include: {
            producto: { select: { id: true, nombre: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const resumen = {
      totalVentas: ventas.length,
      montoTotal: ventas.reduce((sum, v) => sum + Number(v.total), 0),
      promedioVenta: ventas.length > 0
        ? ventas.reduce((sum, v) => sum + Number(v.total), 0) / ventas.length
        : 0,
    };

    return { ventas, resumen };
  }

  async cancelarVenta(id: number, usuarioId: number, motivo: string) {
    const venta = await prisma.venta.findUnique({
      where: { id },
      include: { detalles: true },
    });

    if (!venta) {
      throw new CustomError('Venta no encontrada', 404, 'NOT_FOUND');
    }

    const horasDesdeVenta = (Date.now() - venta.createdAt.getTime()) / (1000 * 60 * 60);
    if (horasDesdeVenta > 24) {
      throw new CustomError('No se pueden cancelar ventas de más de 24 horas', 400, 'TOO_OLD');
    }

    const result = await prisma.$transaction(async (tx: any) => {
      for (const detalle of venta.detalles) {
        const inventario = await tx.inventarioSucursal.findFirst({
          where: {
            productoId: detalle.productoId,
            sucursalId: venta.sucursalId,
          },
        });

        if (inventario) {
          await tx.inventarioSucursal.update({
            where: { id: inventario.id },
            data: {
              stockActual: { increment: detalle.cantidad },
              version: { increment: 1 },
            },
          });
        }

        if (detalle.loteId) {
          await tx.lote.update({
            where: { id: detalle.loteId },
            data: {
              cantidad: { increment: detalle.cantidad },
            },
          });
        }
      }

      const ventaCancelada = await tx.venta.update({
        where: { id },
        data: {
          notas: `[CANCELADA por usuario ${usuarioId}] ${motivo}\n${venta.notas || ''}`,
        },
      });

      return ventaCancelada;
    });

    return result;
  }
}

export const ventaService = new VentaService();
