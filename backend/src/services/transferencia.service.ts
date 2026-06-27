import prisma from '../config/database';
import { CustomError } from '../middleware/errorHandler';
import { EstadoTransferencia } from '../generated/prisma/client';

interface DetalleTransferenciaDto {
  productoId: number;
  loteId?: number;
  cantidadSolicitada: number;
}

interface CreateTransferenciaDto {
  sucursalOrigenId: number;
  sucursalDestinoId: number;
  notas?: string;
  detalles: DetalleTransferenciaDto[];
}

interface AprobarTransferenciaDto {
  usuarioApruebaId: number;
  notas?: string;
}

interface EnviarTransferenciaDto {
  detalles: {
    detalleId: number;
    cantidadEnviada: number;
    loteId?: number;
  }[];
}

interface RecibirTransferenciaDto {
  detalles: {
    detalleId: number;
    cantidadRecibida: number;
  }[];
}

interface PaginationParams {
  page: number;
  limit: number;
  estado?: EstadoTransferencia;
  sucursalId?: number;
  tipo?: 'enviadas' | 'recibidas';
}

export class TransferenciaService {
  async getAll({ page, limit, estado, sucursalId, tipo }: PaginationParams) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (estado) where.estado = estado;

    if (sucursalId) {
      if (tipo === 'enviadas') {
        where.sucursalOrigenId = sucursalId;
      } else if (tipo === 'recibidas') {
        where.sucursalDestinoId = sucursalId;
      } else {
        where.OR = [
          { sucursalOrigenId: sucursalId },
          { sucursalDestinoId: sucursalId },
        ];
      }
    }

    const [transferencias, total] = await Promise.all([
      prisma.transferencia.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sucursalOrigen: { select: { id: true, nombre: true } },
          sucursalDestino: { select: { id: true, nombre: true } },
          usuarioSolicita: { select: { id: true, nombre: true, apellido: true } },
          usuarioAprueba: { select: { id: true, nombre: true, apellido: true } },
          detalles: {
            include: {
              producto: { select: { id: true, nombre: true, codigoBarras: true } },
            },
          },
        },
      }),
      prisma.transferencia.count({ where }),
    ]);

    return {
      data: transferencias,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: number) {
    const transferencia = await prisma.transferencia.findUnique({
      where: { id },
      include: {
        sucursalOrigen: true,
        sucursalDestino: true,
        usuarioSolicita: { select: { id: true, nombre: true, apellido: true, email: true } },
        usuarioAprueba: { select: { id: true, nombre: true, apellido: true, email: true } },
        detalles: {
          include: {
            producto: {
              include: {
                laboratorio: { select: { id: true, nombre: true } },
              },
            },
            lote: true,
          },
        },
      },
    });

    if (!transferencia) {
      throw new CustomError('Transferencia no encontrada', 404, 'NOT_FOUND');
    }

    return transferencia;
  }

  async create(data: CreateTransferenciaDto, usuarioSolicitaId: number) {
    if (data.sucursalOrigenId === data.sucursalDestinoId) {
      throw new CustomError('La sucursal de origen y destino no pueden ser la misma', 400, 'INVALID_DATA');
    }

    const sucursalOrigen = await prisma.sucursal.findUnique({ where: { id: data.sucursalOrigenId } });
    if (!sucursalOrigen) {
      throw new CustomError('Sucursal de origen no encontrada', 404, 'NOT_FOUND');
    }

    const sucursalDestino = await prisma.sucursal.findUnique({ where: { id: data.sucursalDestinoId } });
    if (!sucursalDestino) {
      throw new CustomError('Sucursal de destino no encontrada', 404, 'NOT_FOUND');
    }

    if (data.detalles.length === 0) {
      throw new CustomError('Debe incluir al menos un producto en la transferencia', 400, 'INVALID_DATA');
    }

    for (const detalle of data.detalles) {
      const producto = await prisma.producto.findUnique({ where: { id: detalle.productoId } });
      if (!producto) {
        throw new CustomError(`Producto con ID ${detalle.productoId} no encontrado`, 404, 'NOT_FOUND');
      }

      const inventario = await prisma.inventarioSucursal.findFirst({
        where: {
          productoId: detalle.productoId,
          sucursalId: data.sucursalOrigenId,
        },
      });

      if (!inventario || inventario.stockActual < detalle.cantidadSolicitada) {
        throw new CustomError(
          `Stock insuficiente en sucursal origen para el producto ${producto.nombre}`,
          400,
          'INSUFFICIENT_STOCK'
        );
      }
    }

    const count = await prisma.transferencia.count();
    const fecha = new Date();
    const fechaStr = fecha.toISOString().slice(0, 10).replace(/-/g, '');
    const folio = `T-${fechaStr}-${String(count + 1).padStart(6, '0')}`;

    const transferencia = await prisma.transferencia.create({
      data: {
        folio,
        sucursalOrigenId: data.sucursalOrigenId,
        sucursalDestinoId: data.sucursalDestinoId,
        usuarioSolicitaId,
        notas: data.notas,
        estado: EstadoTransferencia.PENDIENTE,
        detalles: {
          create: data.detalles.map((d) => ({
            productoId: d.productoId,
            loteId: d.loteId,
            cantidadSolicitada: d.cantidadSolicitada,
          })),
        },
      },
      include: {
        sucursalOrigen: { select: { id: true, nombre: true } },
        sucursalDestino: { select: { id: true, nombre: true } },
        detalles: {
          include: {
            producto: { select: { id: true, nombre: true, codigoBarras: true } },
          },
        },
      },
    });

    return transferencia;
  }

  async aprobar(id: number, data: AprobarTransferenciaDto) {
    const transferencia = await prisma.transferencia.findUnique({
      where: { id },
      include: { detalles: true },
    });

    if (!transferencia) {
      throw new CustomError('Transferencia no encontrada', 404, 'NOT_FOUND');
    }

    if (transferencia.estado !== EstadoTransferencia.PENDIENTE) {
      throw new CustomError('Solo se pueden aprobar transferencias pendientes', 400, 'INVALID_STATE');
    }

    const updated = await prisma.transferencia.update({
      where: { id },
      data: {
        estado: EstadoTransferencia.APROBADA,
        usuarioApruebaId: data.usuarioApruebaId,
        fechaAprobacion: new Date(),
        notas: data.notas ? `${transferencia.notas || ''}\n[Aprobación] ${data.notas}` : transferencia.notas,
      },
      include: {
        sucursalOrigen: { select: { id: true, nombre: true } },
        sucursalDestino: { select: { id: true, nombre: true } },
        detalles: {
          include: {
            producto: { select: { id: true, nombre: true } },
          },
        },
      },
    });

    return updated;
  }

  async rechazar(id: number, usuarioApruebaId: number, motivo?: string) {
    const transferencia = await prisma.transferencia.findUnique({
      where: { id },
    });

    if (!transferencia) {
      throw new CustomError('Transferencia no encontrada', 404, 'NOT_FOUND');
    }

    if (transferencia.estado !== EstadoTransferencia.PENDIENTE) {
      throw new CustomError('Solo se pueden rechazar transferencias pendientes', 400, 'INVALID_STATE');
    }

    const updated = await prisma.transferencia.update({
      where: { id },
      data: {
        estado: EstadoTransferencia.RECHAZADA,
        usuarioApruebaId,
        notas: motivo ? `${transferencia.notas || ''}\n[Rechazo] ${motivo}` : transferencia.notas,
      },
    });

    return updated;
  }

  async enviar(id: number, data: EnviarTransferenciaDto) {
    const transferencia = await prisma.transferencia.findUnique({
      where: { id },
      include: { detalles: true },
    });

    if (!transferencia) {
      throw new CustomError('Transferencia no encontrada', 404, 'NOT_FOUND');
    }

    if (transferencia.estado !== EstadoTransferencia.APROBADA) {
      throw new CustomError('Solo se pueden enviar transferencias aprobadas', 400, 'INVALID_STATE');
    }

    for (const envio of data.detalles) {
      const detalle = transferencia.detalles.find((d) => d.id === envio.detalleId);
      if (!detalle) {
        throw new CustomError(`Detalle con ID ${envio.detalleId} no encontrado`, 404, 'NOT_FOUND');
      }

      if (envio.cantidadEnviada > detalle.cantidadSolicitada) {
        throw new CustomError(
          `La cantidad enviada no puede ser mayor a la solicitada para el detalle ${envio.detalleId}`,
          400,
          'INVALID_QUANTITY'
        );
      }
    }

    const result = await prisma.$transaction(async (tx: any) => {
      for (const envio of data.detalles) {
        await tx.detalleTransferencia.update({
          where: { id: envio.detalleId },
          data: {
            cantidadEnviada: envio.cantidadEnviada,
            loteId: envio.loteId,
          },
        });

        const detalle = transferencia.detalles.find((d) => d.id === envio.detalleId)!;

        const inventario = await tx.inventarioSucursal.findFirst({
          where: {
            productoId: detalle.productoId,
            sucursalId: transferencia.sucursalOrigenId,
          },
        });

        if (!inventario || inventario.stockActual < envio.cantidadEnviada) {
          throw new CustomError(
            `Stock insuficiente en sucursal origen para el producto ID ${detalle.productoId}`,
            400,
            'INSUFFICIENT_STOCK'
          );
        }

        await tx.inventarioSucursal.update({
          where: { id: inventario.id },
          data: {
            stockActual: { decrement: envio.cantidadEnviada },
            version: { increment: 1 },
          },
        });

        if (envio.loteId) {
          await tx.lote.update({
            where: { id: envio.loteId },
            data: {
              cantidad: { decrement: envio.cantidadEnviada },
            },
          });
        }
      }

      const updated = await tx.transferencia.update({
        where: { id },
        data: {
          estado: EstadoTransferencia.EN_TRANSITO,
          fechaEnvio: new Date(),
        },
        include: {
          detalles: {
            include: {
              producto: { select: { id: true, nombre: true } },
            },
          },
        },
      });

      return updated;
    });

    return result;
  }

  async recibir(id: number, data: RecibirTransferenciaDto) {
    const transferencia = await prisma.transferencia.findUnique({
      where: { id },
      include: { detalles: true },
    });

    if (!transferencia) {
      throw new CustomError('Transferencia no encontrada', 404, 'NOT_FOUND');
    }

    if (transferencia.estado !== EstadoTransferencia.EN_TRANSITO) {
      throw new CustomError('Solo se pueden recibir transferencias en tránsito', 400, 'INVALID_STATE');
    }

    for (const recepcion of data.detalles) {
      const detalle = transferencia.detalles.find((d) => d.id === recepcion.detalleId);
      if (!detalle) {
        throw new CustomError(`Detalle con ID ${recepcion.detalleId} no encontrado`, 404, 'NOT_FOUND');
      }

      if (recepcion.cantidadRecibida > (detalle.cantidadEnviada || 0)) {
        throw new CustomError(
          `La cantidad recibida no puede ser mayor a la enviada para el detalle ${recepcion.detalleId}`,
          400,
          'INVALID_QUANTITY'
        );
      }
    }

    const result = await prisma.$transaction(async (tx: any) => {
      for (const recepcion of data.detalles) {
        const detalle = transferencia.detalles.find((d) => d.id === recepcion.detalleId)!;

        await tx.detalleTransferencia.update({
          where: { id: recepcion.detalleId },
          data: {
            cantidadRecibida: recepcion.cantidadRecibida,
          },
        });

        const inventarioDestino = await tx.inventarioSucursal.findFirst({
          where: {
            productoId: detalle.productoId,
            sucursalId: transferencia.sucursalDestinoId,
          },
        });

        if (inventarioDestino) {
          await tx.inventarioSucursal.update({
            where: { id: inventarioDestino.id },
            data: {
              stockActual: { increment: recepcion.cantidadRecibida },
              version: { increment: 1 },
            },
          });
        } else {
          await tx.inventarioSucursal.create({
            data: {
              productoId: detalle.productoId,
              sucursalId: transferencia.sucursalDestinoId,
              stockActual: recepcion.cantidadRecibida,
            },
          });
        }

        if (detalle.loteId && detalle.cantidadEnviada) {
          const loteOrigen = await tx.lote.findUnique({
            where: { id: detalle.loteId },
          });

          if (loteOrigen) {
            const loteDestino = await tx.lote.findFirst({
              where: {
                productoId: detalle.productoId,
                sucursalId: transferencia.sucursalDestinoId,
                numeroLote: loteOrigen.numeroLote,
              },
            });

            if (loteDestino) {
              await tx.lote.update({
                where: { id: loteDestino.id },
                data: {
                  cantidad: { increment: recepcion.cantidadRecibida },
                },
              });
            } else {
              await tx.lote.create({
                data: {
                  productoId: detalle.productoId,
                  sucursalId: transferencia.sucursalDestinoId,
                  numeroLote: loteOrigen.numeroLote,
                  fechaVencimiento: loteOrigen.fechaVencimiento,
                  cantidad: recepcion.cantidadRecibida,
                  precioCompraLote: loteOrigen.precioCompraLote,
                },
              });
            }
          }
        }

        if (recepcion.cantidadRecibida < (detalle.cantidadEnviada || 0)) {
          const diferencia = (detalle.cantidadEnviada || 0) - recepcion.cantidadRecibida;

          const inventarioOrigen = await tx.inventarioSucursal.findFirst({
            where: {
              productoId: detalle.productoId,
              sucursalId: transferencia.sucursalOrigenId,
            },
          });

          if (inventarioOrigen) {
            await tx.inventarioSucursal.update({
              where: { id: inventarioOrigen.id },
              data: {
                stockActual: { increment: diferencia },
                version: { increment: 1 },
              },
            });
          }
        }
      }

      const updated = await tx.transferencia.update({
        where: { id },
        data: {
          estado: EstadoTransferencia.RECIBIDA,
          fechaRecepcion: new Date(),
        },
        include: {
          detalles: {
            include: {
              producto: { select: { id: true, nombre: true } },
            },
          },
        },
      });

      return updated;
    });

    return result;
  }

  async getResumen(sucursalId: number) {
    const [pendientesEnviadas, pendientesRecibidas, enTransito, completadas] = await Promise.all([
      prisma.transferencia.count({
        where: {
          sucursalOrigenId: sucursalId,
          estado: EstadoTransferencia.PENDIENTE,
        },
      }),
      prisma.transferencia.count({
        where: {
          sucursalDestinoId: sucursalId,
          estado: EstadoTransferencia.PENDIENTE,
        },
      }),
      prisma.transferencia.count({
        where: {
          OR: [
            { sucursalOrigenId: sucursalId },
            { sucursalDestinoId: sucursalId },
          ],
          estado: EstadoTransferencia.EN_TRANSITO,
        },
      }),
      prisma.transferencia.count({
        where: {
          OR: [
            { sucursalOrigenId: sucursalId },
            { sucursalDestinoId: sucursalId },
          ],
          estado: EstadoTransferencia.RECIBIDA,
        },
      }),
    ]);

    return {
      pendientesEnviadas,
      pendientesRecibidas,
      enTransito,
      completadas,
    };
  }
}

export const transferenciaService = new TransferenciaService();
