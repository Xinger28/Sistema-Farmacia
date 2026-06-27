import { z } from 'zod';

const detalleTransferenciaSchema = z.object({
  productoId: z
    .number()
    .int('El ID del producto debe ser un número entero')
    .positive('El ID del producto debe ser positivo'),
  loteId: z
    .number()
    .int('El ID del lote debe ser un número entero')
    .positive('El ID del lote debe ser positivo')
    .optional(),
  cantidadSolicitada: z
    .number()
    .int('La cantidad debe ser un número entero')
    .positive('La cantidad debe ser positiva'),
});

export const createTransferenciaSchema = z.object({
  body: z.object({
    sucursalOrigenId: z
      .number()
      .int('El ID de sucursal origen debe ser un número entero')
      .positive('El ID de sucursal origen debe ser positivo'),
    sucursalDestinoId: z
      .number()
      .int('El ID de sucursal destino debe ser un número entero')
      .positive('El ID de sucursal destino debe ser positivo'),
    notas: z
      .string()
      .max(500, 'Las notas no pueden exceder 500 caracteres')
      .optional(),
    detalles: z
      .array(detalleTransferenciaSchema)
      .min(1, 'Debe incluir al menos un producto')
      .max(50, 'No se pueden incluir más de 50 productos'),
  }),
});

export const aprobarTransferenciaSchema = z.object({
  body: z.object({
    notas: z
      .string()
      .max(500, 'Las notas no pueden exceder 500 caracteres')
      .optional(),
  }),
});

export const rechazarTransferenciaSchema = z.object({
  body: z.object({
    motivo: z
      .string()
      .min(1, 'El motivo de rechazo es requerido')
      .max(500, 'El motivo no puede exceder 500 caracteres'),
  }),
});

const envioDetalleSchema = z.object({
  detalleId: z
    .number()
    .int('El ID del detalle debe ser un número entero')
    .positive('El ID del detalle debe ser positivo'),
  cantidadEnviada: z
    .number()
    .int('La cantidad debe ser un número entero')
    .positive('La cantidad debe ser positiva'),
  loteId: z
    .number()
    .int('El ID del lote debe ser un número entero')
    .positive('El ID del lote debe ser positivo')
    .optional(),
});

export const enviarTransferenciaSchema = z.object({
  body: z.object({
    detalles: z
      .array(envioDetalleSchema)
      .min(1, 'Debe incluir al menos un detalle'),
  }),
});

const recepcionDetalleSchema = z.object({
  detalleId: z
    .number()
    .int('El ID del detalle debe ser un número entero')
    .positive('El ID del detalle debe ser positivo'),
  cantidadRecibida: z
    .number()
    .int('La cantidad debe ser un número entero')
    .min(0, 'La cantidad no puede ser negativa'),
});

export const recibirTransferenciaSchema = z.object({
  body: z.object({
    detalles: z
      .array(recepcionDetalleSchema)
      .min(1, 'Debe incluir al menos un detalle'),
  }),
});

export type CreateTransferenciaInput = z.infer<typeof createTransferenciaSchema>['body'];
export type AprobarTransferenciaInput = z.infer<typeof aprobarTransferenciaSchema>['body'];
export type RechazarTransferenciaInput = z.infer<typeof rechazarTransferenciaSchema>['body'];
export type EnviarTransferenciaInput = z.infer<typeof enviarTransferenciaSchema>['body'];
export type RecibirTransferenciaInput = z.infer<typeof recibirTransferenciaSchema>['body'];
