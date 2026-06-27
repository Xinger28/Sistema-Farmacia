import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import laboratorioRoutes from './routes/laboratorio.routes';
import categoriaRoutes from './routes/categoria.routes';
import productoRoutes from './routes/producto.routes';
import loteRoutes from './routes/lote.routes';
import inventarioRoutes from './routes/inventario.routes';
import transferenciaRoutes from './routes/transferencia.routes';
import ventaRoutes from './routes/venta.routes';
import composicionRoutes from './routes/composicion.routes';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Farmacia API funcionando' });
});

app.use('/api/auth', authRoutes);
app.use('/api/laboratorios', laboratorioRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/lotes', loteRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/transferencias', transferenciaRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/composicion', composicionRoutes);

app.use(errorHandler);

export default app;
