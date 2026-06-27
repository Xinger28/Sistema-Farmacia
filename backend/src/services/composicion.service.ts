import prisma from '../config/database';
import { CustomError } from '../middleware/errorHandler';

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface IngredienteDto {
  ingrediente: string;
  concentracion?: string;
  tipo: 'ACTIVO' | 'EXCIPIENTE';
  orden?: number;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class ComposicionService {

  /**
   * Devuelve la composición completa de un producto.
   * Activos primero, luego excipientes, ambos ordenados por `orden`.
   */
  async getByProducto(productoId: number) {
    const producto = await prisma.producto.findUnique({ where: { id: productoId } });
    if (!producto) throw new CustomError('Producto no encontrado', 404, 'NOT_FOUND');

    return prisma.composicionProducto.findMany({
      where: { productoId },
      orderBy: [{ tipo: 'asc' }, { orden: 'asc' }, { id: 'asc' }],
    });
  }

  /**
   * Reemplaza toda la composición de un producto en una sola transacción.
   * El frontend envía el array completo; nosotros borramos y volvemos a insertar.
   */
  async upsertComposicion(productoId: number, ingredientes: IngredienteDto[]) {
    const producto = await prisma.producto.findUnique({ where: { id: productoId } });
    if (!producto) throw new CustomError('Producto no encontrado', 404, 'NOT_FOUND');

    // Validaciones básicas
    for (const ing of ingredientes) {
      if (!ing.ingrediente?.trim()) {
        throw new CustomError('Cada ingrediente debe tener un nombre', 400, 'INVALID_DATA');
      }
      if (!['ACTIVO', 'EXCIPIENTE'].includes(ing.tipo)) {
        throw new CustomError(`Tipo inválido: ${ing.tipo}. Use ACTIVO o EXCIPIENTE`, 400, 'INVALID_DATA');
      }
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // Eliminar composición anterior
      await tx.composicionProducto.deleteMany({ where: { productoId } });

      // Insertar nueva composición
      if (ingredientes.length > 0) {
        await tx.composicionProducto.createMany({
          data: ingredientes.map((ing, idx) => ({
            productoId,
            ingrediente:   ing.ingrediente.trim(),
            concentracion: ing.concentracion?.trim() || null,
            tipo:          ing.tipo,
            orden:         ing.orden ?? idx,
          })),
        });
      }

      // Actualizar principio_activo en productos con el primer activo registrado
      const primerActivo = ingredientes.find(i => i.tipo === 'ACTIVO');
      if (primerActivo) {
        await tx.producto.update({
          where: { id: productoId },
          data: {
            principioActivo: primerActivo.ingrediente.trim(),
          },
        });
      }

      return tx.composicionProducto.findMany({
        where: { productoId },
        orderBy: [{ tipo: 'asc' }, { orden: 'asc' }],
      });
    });

    return result;
  }

  /**
   * Busca todos los productos que contienen un ingrediente activo determinado.
   * Incluye stock disponible, precio de venta y laboratorio para que el
   * vendedor pueda comparar y elegir.
   */
  async buscarPorIngrediente(ingrediente: string, sucursalId?: number) {
    if (!ingrediente?.trim()) {
      throw new CustomError('Ingresa un ingrediente para buscar', 400, 'INVALID_DATA');
    }

    // Encontrar todos los ingredientes que coincidan (búsqueda parcial, sin distinción may/min)
    const composiciones = await prisma.composicionProducto.findMany({
      where: {
        ingrediente: { contains: ingrediente.trim(), mode: 'insensitive' },
        tipo: 'ACTIVO',
      },
      select: { productoId: true, ingrediente: true, concentracion: true },
      distinct: ['productoId'],
    });

    if (composiciones.length === 0) return [];

    const productoIds = composiciones.map(c => c.productoId);

    // Traer los productos con su composición completa, inventario y laboratorio
    const productos = await prisma.producto.findMany({
      where: { id: { in: productoIds }, activo: true },
      include: {
        laboratorio: { select: { id: true, nombre: true, paisOrigen: true } },
        categoria:   { select: { id: true, nombre: true } },
        composicion: {
          orderBy: [{ tipo: 'asc' }, { orden: 'asc' }],
        },
        inventario: sucursalId
          ? { where: { sucursalId } }
          : {
              include: {
                sucursal: { select: { id: true, nombre: true } },
              },
            },
        lotes: {
          where: { cantidad: { gt: 0 }, fechaVencimiento: { gt: new Date() } },
          orderBy: { fechaVencimiento: 'asc' },
          take: 3,
        },
      },
      orderBy: { precioVenta: 'asc' }, // más barato primero por defecto
    });

    return productos;
  }

  /**
   * Devuelve los ingredientes activos más usados para el autocomplete
   * del buscador del vendedor.
   */
  async getIngredientesActivos(query?: string) {
    const where: any = { tipo: 'ACTIVO' };
    if (query?.trim()) {
      where.ingrediente = { contains: query.trim(), mode: 'insensitive' };
    }

    const resultados = await prisma.composicionProducto.findMany({
      where,
      select: { ingrediente: true },
      distinct: ['ingrediente'],
      orderBy: { ingrediente: 'asc' },
      take: 20,
    });

    return resultados.map(r => r.ingrediente);
  }
}

export const composicionService = new ComposicionService();
