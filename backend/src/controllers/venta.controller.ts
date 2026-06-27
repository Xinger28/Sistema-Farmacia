import { Request, Response, NextFunction } from 'express';
import { ventaService } from '../services/venta.service';
import { AuthRequest } from '../types';
import { parseQueryString } from '../utils/query';

export class VentaController {
  async procesarVenta(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sucursalId = req.user!.sucursalId;
      const usuarioId = req.user!.userId;

      const venta = await ventaService.procesarVenta({
        ...req.body,
        sucursalId,
        usuarioId,
      });

      res.status(201).json({
        success: true,
        data: venta,
        message: 'Venta procesada correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id));
      const venta = await ventaService.getById(id);

      res.json({
        success: true,
        data: venta,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByFolio(req: Request, res: Response, next: NextFunction) {
    try {
      const folio = String(req.params.folio);
      const venta = await ventaService.getByFolio(folio);

      res.json({
        success: true,
        data: venta,
      });
    } catch (error) {
      next(error);
    }
  }

  async getVentasDelDia(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sucursalId = req.user!.sucursalId;
      const fechaStr = parseQueryString(req.query.fecha);
      const fecha = fechaStr ? new Date(fechaStr) : undefined;

      const resultado = await ventaService.getVentasDelDia(sucursalId, fecha);

      res.json({
        success: true,
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  }

  async getVentasPorRango(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sucursalId = req.user!.sucursalId;
      const fechaInicio = new Date(parseQueryString(req.query.fechaInicio) || '');
      const fechaFin = new Date(parseQueryString(req.query.fechaFin) || '');
      fechaFin.setHours(23, 59, 59, 999);

      const resultado = await ventaService.getVentasPorRango(sucursalId, fechaInicio, fechaFin);

      res.json({
        success: true,
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelarVenta(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id));
      const usuarioId = req.user!.userId;
      const { motivo } = req.body;

      const venta = await ventaService.cancelarVenta(id, usuarioId, motivo);

      res.json({
        success: true,
        data: venta,
        message: 'Venta cancelada correctamente',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const ventaController = new VentaController();
