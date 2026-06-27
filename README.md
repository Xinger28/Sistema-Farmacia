# Sistema de Gestión de Farmacias

Sistema web de gestión de inventario y ventas (POS) para cadena de farmacias con múltiples sucursales.

## Requisitos Previos

- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

## Instrucciones de Instalación

### 1. Configurar la Base de Datos

Crear una base de datos PostgreSQL llamada `farmacia_db`:

```sql
CREATE DATABASE farmacia_db;
```

### 2. Configurar el Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
# Editar .env con tu configuración de base de datos
# DATABASE_URL="postgresql://usuario:password@localhost:5432/farmacia_db"

# Generar cliente Prisma
npx prisma generate

# Crear tablas en la base de datos
npx prisma migrate dev --name init

# Cargar datos de ejemplo
npm run seed

# Iniciar servidor en modo desarrollo
npm run dev
```

El backend se ejecutará en `http://localhost:3000`

### 3. Configurar el Frontend

```bash
cd frontend

# Instalar dependencias (solo Vite como servidor)
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El frontend se ejecutará en `http://localhost:5173`

> **Sin React, sin Tailwind, sin compilación.** Solo Vite hace de servidor de desarrollo
> y redirige las peticiones `/api` al backend en `localhost:3000`.

## Usuarios de Prueba

| Email | Contraseña | Rol | Sucursal |
|-------|------------|-----|----------|
| admin@farmacia.com | 123456 | ADMIN | Centro |
| gerente@farmacia.com | 123456 | GERENTE_SUCURSAL | Centro |
| cajero@farmacia.com | 123456 | CAJERO | Centro |
| gerente2@farmacia.com | 123456 | GERENTE_SUCURSAL | Norte |

## Estructura del Proyecto

```
Sistema de farmacia/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Esquema de base de datos
│   │   └── seed.ts            # Datos de ejemplo
│   └── src/
│       ├── config/            # Configuración
│       ├── controllers/       # Controladores de rutas
│       ├── middleware/        # Auth, validación, errores
│       ├── routes/            # Definición de rutas
│       ├── schemas/           # Validación Zod
│       ├── services/          # Lógica de negocio
│       └── types/             # Tipos TypeScript
│
└── frontend/
    ├── css/                   # Estilos estructurados (tokens, componentes, layout)
    ├── js/                    # Lógica de la SPA (Vanilla JavaScript)
    │   ├── pages/             # Páginas (dashboard, inventario, login, pos, transferencias)
    │   ├── api.js             # Fetch wrapper para peticiones
    │   ├── auth.js            # Autenticación y manejo de sesión
    │   ├── router.js          # Router SPA hash-based
    │   └── sidebar.js         # Sidebar dinámico con utilidades comunes
    ├── index.html             # Shell SPA del frontend
    ├── package.json           # Configuración de Vite dev-server
    └── vite.config.js         # Configuración del proxy para el backend
```

## Módulos del Sistema

### 1. Autenticación y Roles
- Login con JWT
- Roles: Admin, Gerente de Sucursal, Cajero
- Control de acceso por permisos

### 2. Gestión de Inventario
- CRUD de productos con código de barras
- Control de lotes y fechas de vencimiento
- Stock por sucursal
- Alertas de stock bajo y productos próximos a vencer

### 3. Punto de Venta (POS)
- Búsqueda por código de barras (compatible con lector)
- Selección automática de lotes (FEFO)
- Métodos de pago: Efectivo, Tarjeta
- Cálculo de cambio
- Generación de folio único

### 4. Transferencias entre Sucursales
- Solicitar mercancía
- Aprobar/Rechazar solicitudes
- Enviar mercancía (descuenta stock origen)
- Recibir mercancía (incrementa stock destino)
- Control transaccional de inventario

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `GET /api/auth/profile` - Obtener perfil

### Productos
- `GET /api/productos` - Listar productos
- `GET /api/productos/barcode/:codigo` - Buscar por código
- `POST /api/productos` - Crear producto
- `PUT /api/productos/:id` - Actualizar producto

### Inventario
- `GET /api/inventario` - Stock de la sucursal
- `GET /api/inventario/stock-bajo` - Productos con stock bajo
- `GET /api/inventario/resumen` - Resumen general

### Ventas
- `POST /api/ventas` - Procesar venta
- `GET /api/ventas/del-dia` - Ventas del día
- `GET /api/ventas/:id` - Detalle de venta
- `PUT /api/ventas/:id/cancelar` - Cancelar venta

### Transferencias
- `GET /api/transferencias` - Listar transferencias
- `POST /api/transferencias` - Crear solicitud
- `PUT /api/transferencias/:id/aprobar` - Aprobar
- `PUT /api/transferencias/:id/enviar` - Enviar
- `PUT /api/transferencias/:id/recibir` - Recibir

## Tecnologías Utilizadas

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT para autenticación
- Zod para validación

### Frontend
- Vanilla HTML5 y CSS3 moderno (Custom Properties / CSS Variables)
- JavaScript puro (ES6 Modules, Dynamic Imports)
- SPA Router (Hash-based) libre de dependencias
- Vite (Servidor de desarrollo ultraligero y proxy de API)
- Lucide Icons (SVG dinámicos integrados en código)
