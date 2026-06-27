import { Router } from 'express';
import { categoriaController } from '../controllers/categoria.controller';
import { authenticate, authorize } from '../middleware/auth';
import { RolUsuario } from '../generated/prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', categoriaController.getAll);
router.get('/:id', categoriaController.getById);

router.post(
  '/',
  authorize(RolUsuario.ADMIN, RolUsuario.GERENTE_SUCURSAL),
  categoriaController.create
);

router.put(
  '/:id',
  authorize(RolUsuario.ADMIN, RolUsuario.GERENTE_SUCURSAL),
  categoriaController.update
);

router.delete(
  '/:id',
  authorize(RolUsuario.ADMIN),
  categoriaController.delete
);

export default router;
