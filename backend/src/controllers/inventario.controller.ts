import { Request, Response, NextFunction } from 'express';
import { inventarioService } from '../services/inventario.service';
import { AuthRequest } from '../types';
import { parseQueryString } from '../utils/query';

export class InventarioController {
  async getBySucursal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(parseQueryString(req.query.page) || '1');
      const limit = parseInt(parseQueryString(req.query.limit) || '10');
      const search = parseQueryString(req.query.search);
      const soloStockBajo = parseQueryString(req.query.soloStockBajo) === 'true';
      const sinStock = parseQueryString(req.query.sinStock) === 'true';
      const sucursalId = req.user!.sucursalId;

      const result = await inventarioService.getBySucursal({
        page,
        limit,
        sucursalId,
        search,
        soloStockBajo,
        sinStock,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStockBajo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sucursalId = req.user!.sucursalId;
      const inventario = await inventarioService.getStockBajo(sucursalId);

      res.json({
        success: true,
        data: inventario,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSinStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sucursalId = req.user!.sucursalId;
      const inventario = await inventarioService.getSinStock(sucursalId);

      res.json({
        success: true,
        data: inventario,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDisponibilidadEnOtrasSucursales(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const productoId = parseInt(String(req.params.productoId));
      const sucursalActualId = req.user!.sucursalId;

      const disponibilidad = await inventarioService.getDisponibilidadEnOtrasSucursales(
        productoId,
        sucursalActualId
      );

      res.json({
        success: true,
        data: disponibilidad,
      });
    } catch (error) {
      next(error);
    }
  }

  async getResumenSucursal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sucursalId = req.user!.sucursalId;
      const resumen = await inventarioService.getResumenSucursal(sucursalId);

      res.json({
        success: true,
        data: resumen,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStockMinimo(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id));
      const { stockMinimo } = req.body;

      const inventario = await inventarioService.updateStockMinimo(id, { stockMinimo });

      res.json({
        success: true,
        data: inventario,
        message: 'Stock mínimo actualizado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async ajustarStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id));
      const { cantidad, motivo } = req.body;

      const inventario = await inventarioService.ajustarStock(id, cantidad, motivo);

      res.json({
        success: true,
        data: inventario,
        message: 'Stock ajustado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const inventarioController = new InventarioController();
