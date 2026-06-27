import prisma from '../config/database';
import { CustomError } from '../middleware/errorHandler';
import { PrismaClient } from '@prisma/client';

interface CreateLoteDto {
  productoId: number;
  sucursalId: number;
  numeroLote: string;
  fechaVencimiento: string;
  cantidad: number;
  precioCompraLote?: number;
}

interface UpdateLoteDto {
  cantidad?: number;
  precioCompraLote?: number;
}

interface PaginationParams {
  page: number;
  limit: number;
  productoId?: number;
  sucursalId?: number;
  proximosVencer?: boolean;
}

export class LoteService {
  async getAll({ page, limit, productoId, sucursalId, proximosVencer }: PaginationParams) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (productoId) where.productoId = productoId;
    if (sucursalId) where.sucursalId = sucursalId;

    if (proximosVencer) {
      const tresMeses = new Date();
      tresMeses.setMonth(tresMeses.getMonth() + 3);
      where.fechaVencimiento = { lte: tresMeses, gt: new Date() };
      where.cantidad = { gt: 0 };
    }

    const [lotes, total] = await Promise.all([
      prisma.lote.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaVencimiento: 'asc' },
        include: {
          producto: { select: { id: true, nombre: true, codigoBarras: true } },
          sucursal: { select: { id: true, nombre: true } },
        },
      }),
      prisma.lote.count({ where }),
    ]);

    return {
      data: lotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: number) {
    const lote = await prisma.lote.findUnique({
      where: { id },
      include: {
        producto: true,
        sucursal: true,
      },
    });

    if (!lote) {
      throw new CustomError('Lote no encontrado', 404, 'NOT_FOUND');
    }

    return lote;
  }

  async create(data: CreateLoteDto) {
    const producto = await prisma.producto.findUnique({ where: { id: data.productoId } });
    if (!producto) {
      throw new CustomError('Producto no encontrado', 404, 'NOT_FOUND');
    }

    const sucursal = await prisma.sucursal.findUnique({ where: { id: data.sucursalId } });
    if (!sucursal) {
      throw new CustomError('Sucursal no encontrada', 404, 'NOT_FOUND');
    }

    const existingLote = await prisma.lote.findFirst({
      where: {
        productoId: data.productoId,
        sucursalId: data.sucursalId,
        numeroLote: data.numeroLote,
      },
    });

    if (existingLote) {
      throw new CustomError('Ya existe un lote con ese número para este producto en esta sucursal', 409, 'CONFLICT');
    }

    const fechaVencimiento = new Date(data.fechaVencimiento);
    if (fechaVencimiento <= new Date()) {
      throw new CustomError('La fecha de vencimiento debe ser futura', 400, 'INVALID_DATE');
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const lote = await tx.lote.create({
        data: {
          ...data,
          fechaVencimiento: fechaVencimiento,
        },
      });

      const inventario = await tx.inventarioSucursal.findFirst({
        where: {
          productoId: data.productoId,
          sucursalId: data.sucursalId,
        },
      });

      if (inventario) {
        await tx.inventarioSucursal.update({
          where: { id: inventario.id },
          data: {
            stockActual: { increment: data.cantidad },
            version: { increment: 1 },
          },
        });
      } else {
        await tx.inventarioSucursal.create({
          data: {
            productoId: data.productoId,
            sucursalId: data.sucursalId,
            stockActual: data.cantidad,
          },
        });
      }

      return lote;
    });

    return result;
  }

  async update(id: number, data: UpdateLoteDto) {
    const lote = await prisma.lote.findUnique({ where: { id } });

    if (!lote) {
      throw new CustomError('Lote no encontrado', 404, 'NOT_FOUND');
    }

    if (data.cantidad !== undefined && data.cantidad !== lote.cantidad) {
      const diferencia = data.cantidad - lote.cantidad;

      const result = await prisma.$transaction(async (tx: any) => {
        const updatedLote = await tx.lote.update({
          where: { id },
          data,
        });

        await tx.inventarioSucursal.updateMany({
          where: {
            productoId: lote.productoId,
            sucursalId: lote.sucursalId,
          },
          data: {
            stockActual: { increment: diferencia },
            version: { increment: 1 },
          },
        });

        return updatedLote;
      });

      return result;
    }

    return prisma.lote.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    const lote = await prisma.lote.findUnique({ where: { id } });

    if (!lote) {
      throw new CustomError('Lote no encontrado', 404, 'NOT_FOUND');
    }

    if (lote.cantidad > 0) {
      throw new CustomError(
        'No se puede eliminar un lote con cantidad disponible. Actualice la cantidad a 0 primero.',
        400,
        'HAS_STOCK'
      );
    }

    await prisma.lote.delete({ where: { id } });
    return { message: 'Lote eliminado correctamente' };
  }

  async getProximosVencer(sucursalId?: number, dias: number = 90) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + dias);

    const where: any = {
      fechaVencimiento: { lte: fechaLimite, gt: new Date() },
      cantidad: { gt: 0 },
    };

    if (sucursalId) where.sucursalId = sucursalId;

    const lotes = await prisma.lote.findMany({
      where,
      orderBy: { fechaVencimiento: 'asc' },
      include: {
        producto: { select: { id: true, nombre: true, codigoBarras: true } },
        sucursal: { select: { id: true, nombre: true } },
      },
    });

    return lotes;
  }
}

export const loteService = new LoteService();
