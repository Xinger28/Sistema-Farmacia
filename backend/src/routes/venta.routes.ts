import { Router } from 'express';
import { ventaController } from '../controllers/venta.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createVentaSchema, cancelarVentaSchema } from '../schemas/venta.schema';
import { RolUsuario } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize(RolUsuario.CAJERO, RolUsuario.GERENTE_SUCURSAL, RolUsuario.ADMIN),
  validate(createVentaSchema),
  ventaController.procesarVenta
);

router.get('/del-dia', ventaController.getVentasDelDia);
router.get('/por-rango', ventaController.getVentasPorRango);
router.get('/folio/:folio', ventaController.getByFolio);
router.get('/:id', ventaController.getById);

router.put(
  '/:id/cancelar',
  authorize(RolUsuario.GERENTE_SUCURSAL, RolUsuario.ADMIN),
  validate(cancelarVentaSchema),
  ventaController.cancelarVenta
);

export default router;
