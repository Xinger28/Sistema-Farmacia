import { Router } from 'express';
import { composicionController } from '../controllers/composicion.controller';
import { authenticate, authorize } from '../middleware/auth';
import { RolUsuario } from '@prisma/client';

const router = Router();

router.use(authenticate);

// ── Lectura (todos los roles) ──────────────────────────────────────────────

// GET /api/composicion/buscar?ingrediente=amoxicilina&sucursalId=1
router.get('/buscar', composicionController.buscarPorIngrediente);

// GET /api/composicion/ingredientes?q=amox
router.get('/ingredientes', composicionController.getIngredientesActivos);

// GET /api/composicion/producto/:productoId
router.get('/producto/:productoId', composicionController.getByProducto);

// ── Escritura (admin y gerente) ────────────────────────────────────────────

// PUT /api/composicion/producto/:productoId
router.put(
  '/producto/:productoId',
  authorize(RolUsuario.ADMIN, RolUsuario.GERENTE_SUCURSAL),
  composicionController.upsertComposicion,
);

export default router;
