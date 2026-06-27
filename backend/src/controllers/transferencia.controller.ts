import { Request, Response, NextFunction } from 'express';
import { transferenciaService } from '../services/transferencia.service';
import { AuthRequest } from '../types';
import { parseQueryString, parseIntQuery } from '../utils/query';
import { EstadoTransferencia } from '@prisma/client';

export class TransferenciaController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(parseQueryString(req.query.page) || '1');
      const limit = parseInt(parseQueryString(req.query.limit) || '10');
      const estado = parseQueryString(req.query.estado) as EstadoTransferencia | undefined;
      const sucursalId = parseIntQuery(req.query.sucursalId) || req.user!.sucursalId;
      const tipo = parseQueryString(req.query.tipo) as 'enviadas' | 'recibidas' | undefined;

      const result = await transferenciaService.getAll({
        page,
        limit,
        estado,
        sucursalId,
        tipo,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id));
      const transferencia = await transferenciaService.getById(id);

      res.json({
        success: true,
        data: transferencia,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuarioSolicitaId = req.user!.userId;
      const transferencia = await transferenciaService.create(req.body, usuarioSolicitaId);

      res.status(201).json({
        success: true,
        data: transferencia,
        message: 'Transferencia creada correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async aprobar(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id));
      const usuarioApruebaId = req.user!.userId;
      const transferencia = await transferenciaService.aprobar(id, {
        usuarioApruebaId,
        notas: req.body.notas,
      });

      res.json({
        success: true,
        data: transferencia,
        message: 'Transferencia aprobada correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async rechazar(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id));
      const usuarioApruebaId = req.user!.userId;
      const transferencia = await transferenciaService.rechazar(
        id,
        usuarioApruebaId,
        req.body.motivo
      );

      res.json({
        success: true,
        data: transferencia,
        message: 'Transferencia rechazada',
      });
    } catch (error) {
      next(error);
    }
  }

  async enviar(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id));
      const transferencia = await transferenciaService.enviar(id, req.body);

      res.json({
        success: true,
        data: transferencia,
        message: 'Transferencia enviada correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async recibir(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id));
      const transferencia = await transferenciaService.recibir(id, req.body);

      res.json({
        success: true,
        data: transferencia,
        message: 'Transferencia recibida correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async getResumen(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sucursalId = req.user!.sucursalId;
      const resumen = await transferenciaService.getResumen(sucursalId);

      res.json({
        success: true,
        data: resumen,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const transferenciaController = new TransferenciaController();
