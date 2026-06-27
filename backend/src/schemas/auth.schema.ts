import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    nombre: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres'),
    apellido: z
      .string()
      .min(2, 'El apellido debe tener al menos 2 caracteres')
      .max(100, 'El apellido no puede exceder 100 caracteres'),
    email: z
      .string()
      .email('Email inválido')
      .max(100, 'El email no puede exceder 100 caracteres'),
    password: z
      .string()
      .min(6, 'La contraseña debe tener al menos 6 caracteres')
      .max(50, 'La contraseña no puede exceder 50 caracteres'),
    rol: z.enum(['ADMIN', 'GERENTE_SUCURSAL', 'CAJERO'], {
      message: 'Rol inválido. Debe ser ADMIN, GERENTE_SUCURSAL o CAJERO',
    }),
    sucursalId: z
      .number()
      .int('El ID de sucursal debe ser un número entero')
      .positive('El ID de sucursal debe ser positivo'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Email inválido'),
    password: z
      .string()
      .min(1, 'La contraseña es requerida'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string()
      .min(1, 'El token de refresco es requerido'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string()
      .min(1, 'La contraseña actual es requerida'),
    newPassword: z
      .string()
      .min(6, 'La nueva contraseña debe tener al menos 6 caracteres')
      .max(50, 'La nueva contraseña no puede exceder 50 caracteres'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
