import app from './app';
import { ENV } from './config/env';

const PORT = ENV.PORT;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`API disponible en http://localhost:${PORT}/api`);
});
