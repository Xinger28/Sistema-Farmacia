import { Request } from 'express';
import { RolUsuario } from '../generated/prisma/client';

export interface JwtPayload {
  userId: number;
  email: string;
  rol: RolUsuario;
  sucursalId: number;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
