import prisma from '../config/database';
import { CustomError } from '../middleware/errorHandler';

interface CreateLaboratorioDto {
  nombre: string;
  paisOrigen?: string;
  telefono?: string;
  email?: string;
}

interface UpdateLaboratorioDto {
  nombre?: string;
  paisOrigen?: string;
  telefono?: string;
  email?: string;
  activo?: boolean;
}

interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
}

export class LaboratorioService {
  async getAll({ page, limit, search }: PaginationParams) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { nombre: { contains: search, mode: 'insensitive' as any } },
            { paisOrigen: { contains: search, mode: 'insensitive' as any } },
          ],
        }
      : {};

    const [laboratorios, total] = await Promise.all([
      prisma.laboratorio.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nombre: 'asc' },
        include: { _count: { select: { productos: true } } },
      }),
      prisma.laboratorio.count({ where }),
    ]);

    return {
      data: laboratorios,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: number) {
    const laboratorio = await prisma.laboratorio.findUnique({
      where: { id },
      include: { productos: { where: { activo: true }, select: { id: true, nombre: true, codigoBarras: true } } },
    });

    if (!laboratorio) {
      throw new CustomError('Laboratorio no encontrado', 404, 'NOT_FOUND');
    }

    return laboratorio;
  }

  async create(data: CreateLaboratorioDto) {
    const existing = await prisma.laboratorio.findFirst({
      where: { nombre: data.nombre },
    });

    if (existing) {
      throw new CustomError('Ya existe un laboratorio con ese nombre', 409, 'CONFLICT');
    }

    return prisma.laboratorio.create({ data });
  }

  async update(id: number, data: UpdateLaboratorioDto) {
    const laboratorio = await prisma.laboratorio.findUnique({ where: { id } });

    if (!laboratorio) {
      throw new CustomError('Laboratorio no encontrado', 404, 'NOT_FOUND');
    }

    if (data.nombre && data.nombre !== laboratorio.nombre) {
      const existing = await prisma.laboratorio.findFirst({
        where: { nombre: data.nombre, id: { not: id } },
      });
      if (existing) {
        throw new CustomError('Ya existe un laboratorio con ese nombre', 409, 'CONFLICT');
      }
    }

    return prisma.laboratorio.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    const laboratorio = await prisma.laboratorio.findUnique({
      where: { id },
      include: { _count: { select: { productos: true } } },
    });

    if (!laboratorio) {
      throw new CustomError('Laboratorio no encontrado', 404, 'NOT_FOUND');
    }

    if (laboratorio._count.productos > 0) {
      throw new CustomError(
        'No se puede eliminar el laboratorio porque tiene productos asociados',
        400,
        'HAS_DEPENDENCIES'
      );
    }

    await prisma.laboratorio.delete({ where: { id } });
    return { message: 'Laboratorio eliminado correctamente' };
  }
}

export const laboratorioService = new LaboratorioService();
