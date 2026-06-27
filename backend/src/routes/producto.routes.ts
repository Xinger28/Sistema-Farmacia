import { Router } from 'express';
import { productoController } from '../controllers/producto.controller';
import { authenticate, authorize } from '../middleware/auth';
import { RolUsuario } from '../generated/prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', productoController.getAll);
router.get('/barcode/:codigo', productoController.searchByCodigoBarras);
router.get('/:id', productoController.getById);
router.get('/:id/stock', productoController.getStockBySucursal);

router.post(
  '/',
  authorize(RolUsuario.ADMIN, RolUsuario.GERENTE_SUCURSAL),
  productoController.create
);

router.put(
  '/:id',
  authorize(RolUsuario.ADMIN, RolUsuario.GERENTE_SUCURSAL),
  productoController.update
);

router.delete(
  '/:id',
  authorize(RolUsuario.ADMIN),
  productoController.delete
);

export default router;
