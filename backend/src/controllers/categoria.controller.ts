import { Request, Response, NextFunction } from 'express';
import { categoriaService } from '../services/categoria.service';
import { parseQueryString } from '../utils/query';

export class CategoriaController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(parseQueryString(req.query.page) || '1');
      const limit = parseInt(parseQueryString(req.query.limit) || '10');
      const search = parseQueryString(req.query.search);

      const result = await categoriaService.getAll({ page, limit, search });

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
      const categoria = await categoriaService.getById(id);

      res.json({
        success: true,
        data: categoria,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const categoria = await categoriaService.create(req.body);

      res.status(201).json({
        success: true,
        data: categoria,
        message: 'Categoría creada correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id));
      const categoria = await categoriaService.update(id, req.body);

      res.json({
        success: true,
        data: categoria,
        message: 'Categoría actualizada correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id));
      const result = await categoriaService.delete(id);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const categoriaController = new CategoriaController();
