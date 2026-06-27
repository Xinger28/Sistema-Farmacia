import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../types';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Usuario registrado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);

      res.json({
        success: true,
        data: result,
        message: 'Inicio de sesión exitoso',
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: result,
        message: 'Token refrescado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const profile = await authService.getProfile(userId);

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(userId, currentPassword, newPassword);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
