import { Request, Response, NextFunction } from 'express';
import { laboratorioService } from '../services/laboratorio.service';
import { parseQueryString } from '../utils/query';

export class LaboratorioController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(parseQueryString(req.query.page) || '1');
      const limit = parseInt(parseQueryString(req.query.limit) || '10');
      const search = parseQueryString(req.query.search);

      const result = await laboratorioService.getAll({ page, limit, search });

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
      const laboratorio = await laboratorioService.getById(id);

      res.json({
        success: true,
        data: laboratorio,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const laboratorio = await laboratorioService.create(req.body);

      res.status(201).json({
        success: true,
        data: laboratorio,
        message: 'Laboratorio creado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id));
      const laboratorio = await laboratorioService.update(id, req.body);

      res.json({
        success: true,
        data: laboratorio,
        message: 'Laboratorio actualizado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id));
      const result = await laboratorioService.delete(id);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const laboratorioController = new LaboratorioController();
