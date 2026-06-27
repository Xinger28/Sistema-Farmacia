import { z } from 'zod';

const detalleVentaSchema = z.object({
  productoId: z
    .number()
    .int('El ID del producto debe ser un número entero')
    .positive('El ID del producto debe ser positivo'),
  cantidad: z
    .number()
    .int('La cantidad debe ser un número entero')
    .positive('La cantidad debe ser positiva'),
  precioUnitario: z
    .number()
    .min(0, 'El precio no puede ser negativo')
    .optional(),
  descuento: z
    .number()
    .min(0, 'El descuento no puede ser negativo')
    .optional(),
});

export const createVentaSchema = z.object({
  body: z.object({
    metodoPago: z.enum(['EFECTIVO', 'TARJETA_CREDITO', 'TARJETA_DEBITO', 'TRANSFERENCIA'], {
      message: 'Método de pago inválido',
    }),
    montoRecibido: z
      .number()
      .min(0, 'El monto recibido no puede ser negativo')
      .optional(),
    descuento: z
      .number()
      .min(0, 'El descuento no puede ser negativo')
      .optional(),
    notas: z
      .string()
      .max(500, 'Las notas no pueden exceder 500 caracteres')
      .optional(),
    detalles: z
      .array(detalleVentaSchema)
      .min(1, 'La venta debe tener al menos un producto')
      .max(100, 'No se pueden vender más de 100 productos por transacción'),
  }),
});

export const cancelarVentaSchema = z.object({
  body: z.object({
    motivo: z
      .string()
      .min(1, 'El motivo de cancelación es requerido')
      .max(500, 'El motivo no puede exceder 500 caracteres'),
  }),
});

export const ventasPorRangoSchema = z.object({
  query: z.object({
    fechaInicio: z
      .string()
      .min(1, 'La fecha de inicio es requerida')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
    fechaFin: z
      .string()
      .min(1, 'La fecha de fin es requerida')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  }),
});

export type CreateVentaInput = z.infer<typeof createVentaSchema>['body'];
export type CancelarVentaInput = z.infer<typeof cancelarVentaSchema>['body'];
