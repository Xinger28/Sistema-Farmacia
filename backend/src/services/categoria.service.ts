import prisma from '../config/database';
import { CustomError } from '../middleware/errorHandler';

interface CreateCategoriaDto {
  nombre: string;
  descripcion?: string;
}

interface UpdateCategoriaDto {
  nombre?: string;
  descripcion?: string;
}

interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
}

export class CategoriaService {
  async getAll({ page, limit, search }: PaginationParams) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { nombre: { contains: search, mode: 'insensitive' as any } },
            { descripcion: { contains: search, mode: 'insensitive' as any } },
          ],
        }
      : {};

    const [categorias, total] = await Promise.all([
      prisma.categoria.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nombre: 'asc' },
        include: { _count: { select: { productos: true } } },
      }),
      prisma.categoria.count({ where }),
    ]);

    return {
      data: categorias,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: number) {
    const categoria = await prisma.categoria.findUnique({
      where: { id },
      include: { productos: { where: { activo: true }, select: { id: true, nombre: true, codigoBarras: true } } },
    });

    if (!categoria) {
      throw new CustomError('Categoría no encontrada', 404, 'NOT_FOUND');
    }

    return categoria;
  }

  async create(data: CreateCategoriaDto) {
    const existing = await prisma.categoria.findFirst({
      where: { nombre: data.nombre },
    });

    if (existing) {
      throw new CustomError('Ya existe una categoría con ese nombre', 409, 'CONFLICT');
    }

    return prisma.categoria.create({ data });
  }

  async update(id: number, data: UpdateCategoriaDto) {
    const categoria = await prisma.categoria.findUnique({ where: { id } });

    if (!categoria) {
      throw new CustomError('Categoría no encontrada', 404, 'NOT_FOUND');
    }

    if (data.nombre && data.nombre !== categoria.nombre) {
      const existing = await prisma.categoria.findFirst({
        where: { nombre: data.nombre, id: { not: id } },
      });
      if (existing) {
        throw new CustomError('Ya existe una categoría con ese nombre', 409, 'CONFLICT');
      }
    }

    return prisma.categoria.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    const categoria = await prisma.categoria.findUnique({
      where: { id },
      include: { _count: { select: { productos: true } } },
    });

    if (!categoria) {
      throw new CustomError('Categoría no encontrada', 404, 'NOT_FOUND');
    }

    if (categoria._count.productos > 0) {
      throw new CustomError(
        'No se puede eliminar la categoría porque tiene productos asociados',
        400,
        'HAS_DEPENDENCIES'
      );
    }

    await prisma.categoria.delete({ where: { id } });
    return { message: 'Categoría eliminada correctamente' };
  }
}

export const categoriaService = new CategoriaService();
