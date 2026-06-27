import { Request, Response, NextFunction } from 'express';
import { productoService } from '../services/producto.service';
import { parseQueryString, parseIntQuery } from '../utils/query';

export class ProductoController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(parseQueryString(req.query.page) || '1');
      const limit = parseInt(parseQueryString(req.query.limit) || '10');
      const search = parseQueryString(req.query.search);
      const laboratorioId = parseIntQuery(req.query.laboratorioId);
      const categoriaId = parseIntQuery(req.query.categoriaId);
      const activo = req.query.activo !== undefined ? parseQueryString(req.query.activo) === 'true' : undefined;

      const result = await productoService.getAll({
        page,
        limit,
        search,
        laboratorioId,
        categoriaId,
        activo,
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
      const producto = await productoService.getById(id);

      res.json({
        success: true,
        data: producto,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByCodigoBarras(req: Request, res: Response, next: NextFunction) {
    try {
      const codigo = String(req.params.codigo);
      const producto = await productoService.getByCodigoBarras(codigo);

      res.json({
        success: true,
        data: producto,
      });
    } catch (error) {
      next(error);
    }
  }

  async searchByCodigoBarras(req: Request, res: Response, next: NextFunction) {
    try {
      const codigo = String(req.params.codigo);
      const sucursalId = parseIntQuery(req.query.sucursalId);
      const producto = await productoService.searchByCodigoBarras(codigo, sucursalId);

      res.json({
        success: true,
        data: producto,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStockBySucursal(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id));
      const stock = await productoService.getStockBySucursal(id);

      res.json({
        success: true,
        data: stock,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const producto = await productoService.create(req.body);

      res.status(201).json({
        success: true,
        data: producto,
        message: 'Producto creado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id));
      const producto = await productoService.update(id, req.body);

      res.json({
        success: true,
        data: producto,
        message: 'Producto actualizado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id));
      const result = await productoService.delete(id);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const productoController = new ProductoController();
