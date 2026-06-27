import { Request, Response, NextFunction } from 'express';
import { loteService } from '../services/lote.service';
import { parseQueryString, parseIntQuery } from '../utils/query';

export class LoteController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(parseQueryString(req.query.page) || '1');
      const limit = parseInt(parseQueryString(req.query.limit) || '10');
      const productoId = parseIntQuery(req.query.productoId);
      const sucursalId = parseIntQuery(req.query.sucursalId);
      const proximosVencer = parseQueryString(req.query.proximosVencer) === 'true';

      const result = await loteService.getAll({
        page,
        limit,
        productoId,
        sucursalId,
        proximosVencer,
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
      const lote = await loteService.getById(id);

      res.json({
        success: true,
        data: lote,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProximosVencer(req: Request, res: Response, next: NextFunction) {
    try {
      const sucursalId = parseIntQuery(req.query.sucursalId);
      const dias = parseInt(parseQueryString(req.query.dias) || '90');
      const lotes = await loteService.getProximosVencer(sucursalId, dias);

      res.json({
        success: true,
        data: lotes,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const lote = await loteService.create(req.body);

      res.status(201).json({
        success: true,
        data: lote,
        message: 'Lote creado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id));
      const lote = await loteService.update(id, req.body);

      res.json({
        success: true,
        data: lote,
        message: 'Lote actualizado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id));
      const result = await loteService.delete(id);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const loteController = new LoteController();
