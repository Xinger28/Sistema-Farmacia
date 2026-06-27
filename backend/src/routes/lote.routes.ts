import { Router } from 'express';
import { loteController } from '../controllers/lote.controller';
import { authenticate, authorize } from '../middleware/auth';
import { RolUsuario } from '../generated/prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', loteController.getAll);
router.get('/proximos-vencer', loteController.getProximosVencer);
router.get('/:id', loteController.getById);

router.post(
  '/',
  authorize(RolUsuario.ADMIN, RolUsuario.GERENTE_SUCURSAL),
  loteController.create
);

router.put(
  '/:id',
  authorize(RolUsuario.ADMIN, RolUsuario.GERENTE_SUCURSAL),
  loteController.update
);

router.delete(
  '/:id',
  authorize(RolUsuario.ADMIN),
  loteController.delete
);

export default router;
