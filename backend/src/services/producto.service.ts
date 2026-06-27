import prisma from '../config/database';
import { CustomError } from '../middleware/errorHandler';

interface CreateProductoDto {
  codigoBarras: string;
  nombre: string;
  principioActivo?: string;
  descripcion?: string;
  laboratorioId?: number;
  categoriaId?: number;
  precioCompra: number;
  precioVenta: number;
  requiereReceta?: boolean;
  imagenUrl?: string;
}

interface UpdateProductoDto {
  codigoBarras?: string;
  nombre?: string;
  principioActivo?: string;
  descripcion?: string;
  laboratorioId?: number;
  categoriaId?: number;
  precioCompra?: number;
  precioVenta?: number;
  requiereReceta?: boolean;
  imagenUrl?: string;
  activo?: boolean;
}

interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  laboratorioId?: number;
  categoriaId?: number;
  activo?: boolean;
}

export class ProductoService {
  async getAll({ page, limit, search, laboratorioId, categoriaId, activo }: PaginationParams) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { codigoBarras: { contains: search, mode: 'insensitive' } },
        { principioActivo: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (laboratorioId) where.laboratorioId = laboratorioId;
    if (categoriaId) where.categoriaId = categoriaId;
    if (activo !== undefined) where.activo = activo;

    const [productos, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nombre: 'asc' },
        include: {
          laboratorio: { select: { id: true, nombre: true } },
          categoria: { select: { id: true, nombre: true } },
        },
      }),
      prisma.producto.count({ where }),
    ]);

    return {
      data: productos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: number) {
    const producto = await prisma.producto.findUnique({
      where: { id },
      include: {
        laboratorio: true,
        categoria: true,
        inventario: {
          include: {
            sucursal: { select: { id: true, nombre: true } },
          },
        },
        lotes: {
          where: { cantidad: { gt: 0 } },
          orderBy: { fechaVencimiento: 'asc' },
        },
      },
    });

    if (!producto) {
      throw new CustomError('Producto no encontrado', 404, 'NOT_FOUND');
    }

    return producto;
  }

  async getByCodigoBarras(codigoBarras: string) {
    const producto = await prisma.producto.findUnique({
      where: { codigoBarras },
      include: {
        laboratorio: true,
        categoria: true,
        inventario: {
          include: {
            sucursal: { select: { id: true, nombre: true } },
          },
        },
      },
    });

    if (!producto) {
      throw new CustomError('Producto no encontrado', 404, 'NOT_FOUND');
    }

    return producto;
  }

  async create(data: CreateProductoDto) {
    const existingByCodigo = await prisma.producto.findUnique({
      where: { codigoBarras: data.codigoBarras },
    });

    if (existingByCodigo) {
      throw new CustomError('Ya existe un producto con ese código de barras', 409, 'CONFLICT');
    }

    if (data.laboratorioId) {
      const laboratorio = await prisma.laboratorio.findUnique({ where: { id: data.laboratorioId } });
      if (!laboratorio) {
        throw new CustomError('Laboratorio no encontrado', 404, 'NOT_FOUND');
      }
    }

    if (data.categoriaId) {
      const categoria = await prisma.categoria.findUnique({ where: { id: data.categoriaId } });
      if (!categoria) {
        throw new CustomError('Categoría no encontrada', 404, 'NOT_FOUND');
      }
    }

    if (data.precioVenta < data.precioCompra) {
      throw new CustomError('El precio de venta no puede ser menor al precio de compra', 400, 'INVALID_PRICE');
    }

    return prisma.producto.create({
      data,
      include: {
        laboratorio: true,
        categoria: true,
      },
    });
  }

  async update(id: number, data: UpdateProductoDto) {
    const producto = await prisma.producto.findUnique({ where: { id } });

    if (!producto) {
      throw new CustomError('Producto no encontrado', 404, 'NOT_FOUND');
    }

    if (data.codigoBarras && data.codigoBarras !== producto.codigoBarras) {
      const existing = await prisma.producto.findUnique({
        where: { codigoBarras: data.codigoBarras },
      });
      if (existing) {
        throw new CustomError('Ya existe un producto con ese código de barras', 409, 'CONFLICT');
      }
    }

    if (data.laboratorioId) {
      const laboratorio = await prisma.laboratorio.findUnique({ where: { id: data.laboratorioId } });
      if (!laboratorio) {
        throw new CustomError('Laboratorio no encontrado', 404, 'NOT_FOUND');
      }
    }

    if (data.categoriaId) {
      const categoria = await prisma.categoria.findUnique({ where: { id: data.categoriaId } });
      if (!categoria) {
        throw new CustomError('Categoría no encontrada', 404, 'NOT_FOUND');
      }
    }

    const precioCompra = data.precioCompra ?? Number(producto.precioCompra);
    const precioVenta = data.precioVenta ?? Number(producto.precioVenta);

    if (precioVenta < precioCompra) {
      throw new CustomError('El precio de venta no puede ser menor al precio de compra', 400, 'INVALID_PRICE');
    }

    return prisma.producto.update({
      where: { id },
      data,
      include: {
        laboratorio: true,
        categoria: true,
      },
    });
  }

  async delete(id: number) {
    const producto = await prisma.producto.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            detalleVentas: true,
            inventario: true,
          },
        },
      },
    });

    if (!producto) {
      throw new CustomError('Producto no encontrado', 404, 'NOT_FOUND');
    }

    if (producto._count.detalleVentas > 0) {
      throw new CustomError(
        'No se puede eliminar el producto porque tiene ventas asociadas. Puede desactivarlo.',
        400,
        'HAS_DEPENDENCIES'
      );
    }

    await prisma.producto.delete({ where: { id } });
    return { message: 'Producto eliminado correctamente' };
  }

  async getStockBySucursal(productoId: number) {
    return prisma.inventarioSucursal.findMany({
      where: { productoId },
      include: {
        sucursal: { select: { id: true, nombre: true, direccion: true } },
      },
    });
  }

  async searchByCodigoBarras(codigoBarras: string, sucursalId?: number) {
    const producto = await prisma.producto.findUnique({
      where: { codigoBarras, activo: true },
      include: {
        laboratorio: { select: { id: true, nombre: true } },
        categoria: { select: { id: true, nombre: true } },
        inventario: sucursalId
          ? { where: { sucursalId } }
          : { include: { sucursal: { select: { id: true, nombre: true } } } },
        lotes: {
          where: { cantidad: { gt: 0 }, fechaVencimiento: { gt: new Date() } },
          orderBy: { fechaVencimiento: 'asc' },
        },
      },
    });

    if (!producto) {
      throw new CustomError('Producto no encontrado', 404, 'NOT_FOUND');
    }

    return producto;
  }
}

export const productoService = new ProductoService();
