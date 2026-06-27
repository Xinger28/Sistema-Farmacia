import { Request, Response, NextFunction } from 'express';
import { composicionService } from '../services/composicion.service';

export const composicionController = {

  /**
   * GET /api/composicion/buscar?ingrediente=amoxicilina&sucursalId=1
   * Para el vendedor: busca productos por principio activo
   */
  async buscarPorIngrediente(req: Request, res: Response, next: NextFunction) {
    try {
      const { ingrediente, sucursalId } = req.query;
      const resultado = await composicionService.buscarPorIngrediente(
        String(ingrediente || ''),
        sucursalId ? Number(sucursalId) : undefined,
      );
      res.json({ data: resultado });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/composicion/ingredientes?q=amox
   * Autocomplete de ingredientes activos registrados
   */
  async getIngredientesActivos(req: Request, res: Response, next: NextFunction) {
    try {
      const { q } = req.query;
      const lista = await composicionService.getIngredientesActivos(String(q || ''));
      res.json({ data: lista });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/composicion/producto/:productoId
   * Composición completa de un producto específico
   */
  async getByProducto(req: Request, res: Response, next: NextFunction) {
    try {
      const productoId = Number(req.params.productoId);
      const composicion = await composicionService.getByProducto(productoId);
      res.json({ data: composicion });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/composicion/producto/:productoId
   * Reemplaza la composición completa de un producto (admin/gerente)
   * Body: { ingredientes: IngredienteDto[] }
   */
  async upsertComposicion(req: Request, res: Response, next: NextFunction) {
    try {
      const productoId = Number(req.params.productoId);
      const { ingredientes } = req.body;

      if (!Array.isArray(ingredientes)) {
        res.status(400).json({ error: 'Se esperaba un array de ingredientes' });
        return;
      }

      const result = await composicionService.upsertComposicion(productoId, ingredientes);
      res.json({ data: result, message: 'Composición actualizada correctamente' });
    } catch (err) {
      next(err);
    }
  },
};
