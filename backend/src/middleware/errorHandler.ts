import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction): void => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export class CustomError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'CustomError';
  }
}
