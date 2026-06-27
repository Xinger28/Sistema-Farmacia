import { Router } from 'express';
import { inventarioController } from '../controllers/inventario.controller';
import { authenticate, authorize } from '../middleware/auth';
import { RolUsuario } from '../generated/prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', inventarioController.getBySucursal);
router.get('/stock-bajo', inventarioController.getStockBajo);
router.get('/sin-stock', inventarioController.getSinStock);
router.get('/resumen', inventarioController.getResumenSucursal);
router.get('/disponibilidad/:productoId', inventarioController.getDisponibilidadEnOtrasSucursales);

router.put(
  '/:id/stock-minimo',
  authorize(RolUsuario.ADMIN, RolUsuario.GERENTE_SUCURSAL),
  inventarioController.updateStockMinimo
);

router.post(
  '/:id/ajustar',
  authorize(RolUsuario.ADMIN, RolUsuario.GERENTE_SUCURSAL),
  inventarioController.ajustarStock
);

export default router;
