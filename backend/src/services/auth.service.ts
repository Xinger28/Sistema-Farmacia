import prisma from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { CustomError } from '../middleware/errorHandler';
import { JwtPayload } from '../types';
import { RolUsuario } from '../generated/prisma/client';

interface RegisterDto {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol: RolUsuario;
  sucursalId: number;
}

interface LoginDto {
  email: string;
  password: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    rol: RolUsuario;
    sucursalId: number;
    sucursal: {
      id: number;
      nombre: string;
    };
  };
}

export class AuthService {
  async register(data: RegisterDto): Promise<TokenResponse> {
    const existingUser = await prisma.usuario.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new CustomError('Ya existe un usuario con ese email', 409, 'CONFLICT');
    }

    const sucursal = await prisma.sucursal.findUnique({
      where: { id: data.sucursalId },
    });

    if (!sucursal) {
      throw new CustomError('Sucursal no encontrada', 404, 'NOT_FOUND');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const usuario = await prisma.usuario.create({
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        passwordHash,
        rol: data.rol,
        sucursalId: data.sucursalId,
      },
      include: {
        sucursal: {
          select: { id: true, nombre: true },
        },
      },
    });

    const tokens = this.generateTokens({
      userId: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      sucursalId: usuario.sucursalId,
    });

    return {
      ...tokens,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol,
        sucursalId: usuario.sucursalId,
        sucursal: usuario.sucursal,
      },
    };
  }

  async login(data: LoginDto): Promise<TokenResponse> {
    const usuario = await prisma.usuario.findUnique({
      where: { email: data.email },
      include: {
        sucursal: {
          select: { id: true, nombre: true },
        },
      },
    });

    if (!usuario) {
      throw new CustomError('Credenciales inválidas', 401, 'INVALID_CREDENTIALS');
    }

    if (!usuario.activo) {
      throw new CustomError('Usuario desactivado. Contacte al administrador.', 403, 'USER_DISABLED');
    }

    const isPasswordValid = await bcrypt.compare(data.password, usuario.passwordHash);

    if (!isPasswordValid) {
      throw new CustomError('Credenciales inválidas', 401, 'INVALID_CREDENTIALS');
    }

    const tokens = this.generateTokens({
      userId: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      sucursalId: usuario.sucursalId,
    });

    return {
      ...tokens,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol,
        sucursalId: usuario.sucursalId,
        sucursal: usuario.sucursal,
      },
    };
  }

  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;

      const usuario = await prisma.usuario.findUnique({
        where: { id: decoded.userId },
      });

      if (!usuario || !usuario.activo) {
        throw new CustomError('Usuario no encontrado o desactivado', 401, 'INVALID_TOKEN');
      }

      const tokens = this.generateTokens({
        userId: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        sucursalId: usuario.sucursalId,
      });

      return tokens;
    } catch (error) {
      throw new CustomError('Token de refresco inválido o expirado', 401, 'INVALID_REFRESH_TOKEN');
    }
  }

  async getProfile(userId: number) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        sucursal: {
          select: { id: true, nombre: true, direccion: true },
        },
      },
    });

    if (!usuario) {
      throw new CustomError('Usuario no encontrado', 404, 'NOT_FOUND');
    }

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: usuario.rol,
      sucursalId: usuario.sucursalId,
      sucursal: usuario.sucursal,
      activo: usuario.activo,
      createdAt: usuario.createdAt,
    };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      throw new CustomError('Usuario no encontrado', 404, 'NOT_FOUND');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, usuario.passwordHash);

    if (!isPasswordValid) {
      throw new CustomError('La contraseña actual es incorrecta', 400, 'INVALID_PASSWORD');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.usuario.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Contraseña actualizada correctamente' };
  }

  private generateTokens(payload: JwtPayload): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(payload as object, ENV.JWT_SECRET, {
      expiresIn: Number(ENV.JWT_EXPIRES_IN) || 28800,
    });

    const refreshToken = jwt.sign(payload as object, ENV.JWT_SECRET, {
      expiresIn: 604800,
    });

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
