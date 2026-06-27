import prisma from '../config/database';
import { CustomError } from '../middleware/errorHandler';

interface UpdateStockMinimoDto {
  stockMinimo: number;
}

interface PaginationParams {
  page: number;
  limit: number;
  sucursalId: number;
  search?: string;
  soloStockBajo?: boolean;
  sinStock?: boolean;
}

export class InventarioService {
  async getBySucursal({ page, limit, sucursalId, search, soloStockBajo, sinStock }: PaginationParams) {
    const skip = (page - 1) * limit;

    const where: any = { sucursalId };

    if (search) {
      where.producto = {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { codigoBarras: { contains: search, mode: 'insensitive' } },
          { principioActivo: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    if (sinStock) {
      where.stockActual = 0;
    }

    const [inventario, total] = await Promise.all([
      prisma.inventarioSucursal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { producto: { nombre: 'asc' } },
        include: {
          producto: {
            include: {
              laboratorio: { select: { id: true, nombre: true } },
              categoria: { select: { id: true, nombre: true } },
            },
          },
        },
      }),
      prisma.inventarioSucursal.count({ where }),
    ]);

    const filteredData = soloStockBajo
      ? inventario.filter((item) => item.stockActual <= item.stockMinimo)
      : inventario;

    return {
      data: filteredData,
      pagination: {
        page,
        limit,
        total: soloStockBajo ? filteredData.length : total,
        totalPages: Math.ceil((soloStockBajo ? filteredData.length : total) / limit),
      },
    };
  }

  async getStockBajo(sucursalId: number) {
    const inventario = await prisma.inventarioSucursal.findMany({
      where: {
        sucursalId,
      },
      include: {
        producto: {
          include: {
            laboratorio: { select: { id: true, nombre: true } },
          },
        },
      },
      orderBy: { stockActual: 'asc' },
    });

    return inventario.filter((item) => item.stockActual <= item.stockMinimo);
  }

  async getSinStock(sucursalId: number) {
    const inventario = await prisma.inventarioSucursal.findMany({
      where: {
        sucursalId,
        stockActual: 0,
      },
      include: {
        producto: true,
      },
    });

    return inventario;
  }

  async updateStockMinimo(id: number, data: UpdateStockMinimoDto) {
    const inventario = await prisma.inventarioSucursal.findUnique({ where: { id } });

    if (!inventario) {
      throw new CustomError('Registro de inventario no encontrado', 404, 'NOT_FOUND');
    }

    return prisma.inventarioSucursal.update({
      where: { id },
      data: { stockMinimo: data.stockMinimo },
    });
  }

  async getDisponibilidadEnOtrasSucursales(productoId: number, sucursalActualId: number) {
    const disponibilidad = await prisma.inventarioSucursal.findMany({
      where: {
        productoId,
        sucursalId: { not: sucursalActualId },
        stockActual: { gt: 0 },
      },
      include: {
        sucursal: { select: { id: true, nombre: true, direccion: true, telefono: true } },
      },
    });

    return disponibilidad;
  }

  async getResumenSucursal(sucursalId: number) {
    const [
      totalProductos,
      sinStock,
      stockBajo,
    ] = await Promise.all([
      prisma.inventarioSucursal.count({
        where: { sucursalId, stockActual: { gt: 0 } },
      }),
      prisma.inventarioSucursal.count({
        where: { sucursalId, stockActual: 0 },
      }),
      prisma.inventarioSucursal.findMany({
        where: { sucursalId },
        select: { stockActual: true, stockMinimo: true },
      }),
    ]);

    const productosStockBajo = stockBajo.filter((item) => item.stockActual <= item.stockMinimo).length;

    return {
      totalProductos,
      sinStock,
      stockBajo: productosStockBajo,
      productosConStock: totalProductos,
    };
  }

  async ajustarStock(inventarioId: number, cantidad: number, motivo: string) {
    const inventario = await prisma.inventarioSucursal.findUnique({
      where: { id: inventarioId },
    });

    if (!inventario) {
      throw new CustomError('Registro de inventario no encontrado', 404, 'NOT_FOUND');
    }

    const nuevoStock = inventario.stockActual + cantidad;

    if (nuevoStock < 0) {
      throw new CustomError('El stock no puede ser negativo', 400, 'INVALID_STOCK');
    }

    return prisma.inventarioSucursal.update({
      where: { id: inventarioId },
      data: {
        stockActual: nuevoStock,
        version: { increment: 1 },
      },
    });
  }
}

export const inventarioService = new InventarioService();
