import { Router } from 'express';
import { laboratorioController } from '../controllers/laboratorio.controller';
import { authenticate, authorize } from '../middleware/auth';
import { RolUsuario } from '../generated/prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', laboratorioController.getAll);
router.get('/:id', laboratorioController.getById);

router.post(
  '/',
  authorize(RolUsuario.ADMIN, RolUsuario.GERENTE_SUCURSAL),
  laboratorioController.create
);

router.put(
  '/:id',
  authorize(RolUsuario.ADMIN, RolUsuario.GERENTE_SUCURSAL),
  laboratorioController.update
);

router.delete(
  '/:id',
  authorize(RolUsuario.ADMIN),
  laboratorioController.delete
);

export default router;
