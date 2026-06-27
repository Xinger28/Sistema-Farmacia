-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'GERENTE_SUCURSAL', 'CAJERO');

-- CreateEnum
CREATE TYPE "EstadoTransferencia" AS ENUM ('PENDIENTE', 'APROBADA', 'EN_TRANSITO', 'RECIBIDA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TARJETA_CREDITO', 'TARJETA_DEBITO', 'TRANSFERENCIA');

-- CreateTable
CREATE TABLE "sucursales" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "direccion" VARCHAR(255) NOT NULL,
    "telefono" VARCHAR(20),
    "email" VARCHAR(100),
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sucursales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rol" "RolUsuario" NOT NULL,
    "sucursal_id" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laboratorios" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "pais_origen" VARCHAR(100),
    "telefono" VARCHAR(20),
    "email" VARCHAR(100),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "laboratorios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" SERIAL NOT NULL,
    "codigo_barras" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "principio_activo" VARCHAR(200),
    "descripcion" TEXT,
    "laboratorio_id" INTEGER,
    "categoria_id" INTEGER,
    "precio_compra" DECIMAL(10,2) NOT NULL,
    "precio_venta" DECIMAL(10,2) NOT NULL,
    "requiere_receta" BOOLEAN NOT NULL DEFAULT false,
    "imagen_url" VARCHAR(500),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventario_sucursal" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "sucursal_id" INTEGER NOT NULL,
    "stock_actual" INTEGER NOT NULL DEFAULT 0,
    "stock_minimo" INTEGER NOT NULL DEFAULT 5,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventario_sucursal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "sucursal_id" INTEGER NOT NULL,
    "numero_lote" VARCHAR(50) NOT NULL,
    "fecha_vencimiento" DATE NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_compra_lote" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" SERIAL NOT NULL,
    "folio" VARCHAR(20) NOT NULL,
    "sucursal_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "descuento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "impuestos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "metodo_pago" "MetodoPago" NOT NULL,
    "monto_recibido" DECIMAL(12,2),
    "cambio" DECIMAL(10,2),
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_ventas" (
    "id" SERIAL NOT NULL,
    "venta_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "lote_id" INTEGER,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "descuento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "detalle_ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transferencias" (
    "id" SERIAL NOT NULL,
    "folio" VARCHAR(20) NOT NULL,
    "sucursal_origen_id" INTEGER NOT NULL,
    "sucursal_destino_id" INTEGER NOT NULL,
    "usuario_solicita_id" INTEGER NOT NULL,
    "usuario_aprueba_id" INTEGER,
    "estado" "EstadoTransferencia" NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "fecha_solicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_aprobacion" TIMESTAMP(3),
    "fecha_envio" TIMESTAMP(3),
    "fecha_recepcion" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transferencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_transferencias" (
    "id" SERIAL NOT NULL,
    "transferencia_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "lote_id" INTEGER,
    "cantidad_solicitada" INTEGER NOT NULL,
    "cantidad_enviada" INTEGER NOT NULL DEFAULT 0,
    "cantidad_recibida" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "detalle_transferencias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_sucursal_id_idx" ON "usuarios"("sucursal_id");

-- CreateIndex
CREATE INDEX "usuarios_rol_idx" ON "usuarios"("rol");

-- CreateIndex
CREATE UNIQUE INDEX "productos_codigo_barras_key" ON "productos"("codigo_barras");

-- CreateIndex
CREATE INDEX "productos_codigo_barras_idx" ON "productos"("codigo_barras");

-- CreateIndex
CREATE INDEX "productos_nombre_idx" ON "productos"("nombre");

-- CreateIndex
CREATE INDEX "productos_principio_activo_idx" ON "productos"("principio_activo");

-- CreateIndex
CREATE INDEX "inventario_sucursal_sucursal_id_idx" ON "inventario_sucursal"("sucursal_id");

-- CreateIndex
CREATE INDEX "inventario_sucursal_producto_id_idx" ON "inventario_sucursal"("producto_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventario_sucursal_producto_id_sucursal_id_key" ON "inventario_sucursal"("producto_id", "sucursal_id");

-- CreateIndex
CREATE INDEX "lotes_fecha_vencimiento_idx" ON "lotes"("fecha_vencimiento");

-- CreateIndex
CREATE INDEX "lotes_producto_id_sucursal_id_idx" ON "lotes"("producto_id", "sucursal_id");

-- CreateIndex
CREATE UNIQUE INDEX "lotes_producto_id_sucursal_id_numero_lote_key" ON "lotes"("producto_id", "sucursal_id", "numero_lote");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_folio_key" ON "ventas"("folio");

-- CreateIndex
CREATE INDEX "ventas_sucursal_id_idx" ON "ventas"("sucursal_id");

-- CreateIndex
CREATE INDEX "ventas_created_at_idx" ON "ventas"("created_at");

-- CreateIndex
CREATE INDEX "ventas_usuario_id_idx" ON "ventas"("usuario_id");

-- CreateIndex
CREATE INDEX "detalle_ventas_venta_id_idx" ON "detalle_ventas"("venta_id");

-- CreateIndex
CREATE INDEX "detalle_ventas_producto_id_idx" ON "detalle_ventas"("producto_id");

-- CreateIndex
CREATE UNIQUE INDEX "transferencias_folio_key" ON "transferencias"("folio");

-- CreateIndex
CREATE INDEX "transferencias_sucursal_origen_id_idx" ON "transferencias"("sucursal_origen_id");

-- CreateIndex
CREATE INDEX "transferencias_sucursal_destino_id_idx" ON "transferencias"("sucursal_destino_id");

-- CreateIndex
CREATE INDEX "transferencias_estado_idx" ON "transferencias"("estado");

-- CreateIndex
CREATE INDEX "detalle_transferencias_transferencia_id_idx" ON "detalle_transferencias"("transferencia_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_laboratorio_id_fkey" FOREIGN KEY ("laboratorio_id") REFERENCES "laboratorios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_sucursal" ADD CONSTRAINT "inventario_sucursal_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_sucursal" ADD CONSTRAINT "inventario_sucursal_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_ventas" ADD CONSTRAINT "detalle_ventas_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_ventas" ADD CONSTRAINT "detalle_ventas_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_ventas" ADD CONSTRAINT "detalle_ventas_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias" ADD CONSTRAINT "transferencias_sucursal_origen_id_fkey" FOREIGN KEY ("sucursal_origen_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias" ADD CONSTRAINT "transferencias_sucursal_destino_id_fkey" FOREIGN KEY ("sucursal_destino_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias" ADD CONSTRAINT "transferencias_usuario_solicita_id_fkey" FOREIGN KEY ("usuario_solicita_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias" ADD CONSTRAINT "transferencias_usuario_aprueba_id_fkey" FOREIGN KEY ("usuario_aprueba_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_transferencias" ADD CONSTRAINT "detalle_transferencias_transferencia_id_fkey" FOREIGN KEY ("transferencia_id") REFERENCES "transferencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_transferencias" ADD CONSTRAINT "detalle_transferencias_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_transferencias" ADD CONSTRAINT "detalle_transferencias_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum: TipoIngrediente (IF NOT EXISTS para no fallar si ya existe)
DO $$ BEGIN
  CREATE TYPE "TipoIngrediente" AS ENUM ('ACTIVO', 'EXCIPIENTE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable: composicion_producto
CREATE TABLE IF NOT EXISTS "composicion_producto" (
    "id"            SERIAL              NOT NULL,
    "producto_id"   INTEGER             NOT NULL,
    "ingrediente"   VARCHAR(200)        NOT NULL,
    "concentracion" VARCHAR(100),
    "tipo"          "TipoIngrediente"   NOT NULL DEFAULT 'ACTIVO',
    "orden"         INTEGER             NOT NULL DEFAULT 0,
    "created_at"    TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "composicion_producto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "composicion_producto_producto_id_idx" ON "composicion_producto"("producto_id");
CREATE INDEX IF NOT EXISTS "composicion_producto_ingrediente_idx" ON "composicion_producto"("ingrediente");

ALTER TABLE "composicion_producto"
    DROP CONSTRAINT IF EXISTS "composicion_producto_producto_id_fkey";

ALTER TABLE "composicion_producto"
    ADD CONSTRAINT "composicion_producto_producto_id_fkey"
    FOREIGN KEY ("producto_id") REFERENCES "productos"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
