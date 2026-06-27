import { Router } from 'express';
import { transferenciaController } from '../controllers/transferencia.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createTransferenciaSchema,
  aprobarTransferenciaSchema,
  rechazarTransferenciaSchema,
  enviarTransferenciaSchema,
  recibirTransferenciaSchema,
} from '../schemas/transferencia.schema';
import { RolUsuario } from '../generated/prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', transferenciaController.getAll);
router.get('/resumen', transferenciaController.getResumen);
router.get('/:id', transferenciaController.getById);

router.post(
  '/',
  authorize(RolUsuario.ADMIN, RolUsuario.GERENTE_SUCURSAL),
  validate(createTransferenciaSchema),
  transferenciaController.create
);

router.put(
  '/:id/aprobar',
  authorize(RolUsuario.ADMIN, RolUsuario.GERENTE_SUCURSAL),
  validate(aprobarTransferenciaSchema),
  transferenciaController.aprobar
);

router.put(
  '/:id/rechazar',
  authorize(RolUsuario.ADMIN, RolUsuario.GERENTE_SUCURSAL),
  validate(rechazarTransferenciaSchema),
  transferenciaController.rechazar
);

router.put(
  '/:id/enviar',
  authorize(RolUsuario.ADMIN, RolUsuario.GERENTE_SUCURSAL),
  validate(enviarTransferenciaSchema),
  transferenciaController.enviar
);

router.put(
  '/:id/recibir',
  authorize(RolUsuario.ADMIN, RolUsuario.GERENTE_SUCURSAL),
  validate(recibirTransferenciaSchema),
  transferenciaController.recibir
);

export default router;
