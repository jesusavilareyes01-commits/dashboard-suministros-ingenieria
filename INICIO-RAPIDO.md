# 🚀 Inicio Rápido - Dashboard Suministros

## Para Usuarios (No Técnicos)

### ¿Qué es este sistema?

Un dashboard web que permite hacer seguimiento completo de todos los procesos de suministro del área de ingeniería, desde que se solicita algo hasta que se finaliza la compra.

### ¿Qué puedo hacer?

✅ Ver todos los procesos en tiempo real
✅ Saber cuántas solicitudes hay en curso
✅ Ver procesos finalizados de años anteriores
✅ Recibir alertas de procesos atrasados
✅ Registrar nuevas solicitudes
✅ Actualizar el estado de procesos
✅ Generar reportes automáticos

## Opción 1: Usar con Docker (MÁS FÁCIL) 🐳

### Requisitos
- Tener Docker Desktop instalado ([Descargar aquí](https://www.docker.com/products/docker-desktop))

### Pasos (Solo 2!)

1. **Abrir terminal** en la carpeta del proyecto

2. **Ejecutar este comando**:
```bash
docker compose up -d
```

3. **Esperar 1-2 minutos** y luego abrir en el navegador:
   - 🌐 Dashboard: http://localhost:3000

¡Listo! Ya está funcionando.

### Para detener:
```bash
docker compose down
```

## Opción 2: Instalación Local 💻

### Requisitos
- Node.js 18 o superior ([Descargar aquí](https://nodejs.org))
- PostgreSQL 15 ([Descargar aquí](https://www.postgresql.org/download/))

### Pasos

#### 1. Instalar dependencias
```bash
npm run install-all
```

#### 2. Configurar Base de Datos

**a) Crear base de datos en PostgreSQL**:
```sql
CREATE DATABASE dashboard_suministros;
```

**b) Ejecutar el script de inicialización**:
```bash
psql -U postgres -d dashboard_suministros -f server/database/init.sql
```

#### 3. Configurar variables de entorno

Editar el archivo `server/.env` con tus datos de PostgreSQL:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dashboard_suministros
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
```

#### 4. Iniciar el sistema

**Terminal 1 - Backend**:
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd client
npm start
```

#### 5. Abrir en el navegador
- 🌐 Dashboard: http://localhost:3000
- 🔧 API: http://localhost:5000

## Acceso al Sistema

### URLs
- **Frontend (Dashboard)**: http://localhost:3000
- **Backend (API)**: http://localhost:5000/api
- **Base de Datos**: localhost:5432

### Usuarios de Demostración

El sistema ya incluye datos de prueba:
- 10 procesos de ejemplo
- Diferentes estados y tipos
- Historial de cambios

## Verificar que Funciona

### ✅ Checklist Rápida

1. Abrir http://localhost:3000
2. Debería ver:
   - 📊 KPIs en la parte superior (números en tarjetas de colores)
   - 📈 Estadísticas especiales
   - 📋 Tabla con solicitudes
   - 🔍 Filtros para buscar

3. Probar funcionalidades:
   - Usar los filtros (Estado, Tipo)
   - Ver que los números cambian
   - Verificar que la tabla se actualiza

## Características Principales

### 🎯 Los 8 Módulos Operativos

1. **Registro de Solicitudes** - Crear nuevas solicitudes
2. **Validación Administrativa** - Asignar número SAP
3. **Seguimiento Compras** - Monitorear en área de compras
4. **Visualización Tiempo Real** - Dashboard con métricas
5. **Control de Información** - Actualizar datos
6. **Alertas** - Notificaciones automáticas
7. **Cierre y Evaluación** - Finalizar procesos
8. **Seguridad** - Control de acceso y auditoría

### 📊 Visualizaciones Incluidas

- ✅ **Procesos finalizados años anteriores**
- ✅ **Procesos en curso** (actualizados en tiempo real)
- ✅ **Procesos planeados** (solicitudes recibidas)
- ✅ **Compras Bajo Valor no PAABS 2025**

### 🎨 Interfaz

- **Diseño moderno** con Material-UI
- **Responsive** (funciona en móvil, tablet, desktop)
- **Colores por estado**:
  - 🟢 Verde = Finalizado
  - 🟡 Amarillo = En proceso
  - 🔴 Rojo = Atrasado
  - 🔵 Azul = Recién recibido

## Casos de Uso Comunes

### Registrar una nueva solicitud
1. Clic en "Nueva Solicitud"
2. Llenar formulario
3. Guardar

### Ver procesos atrasados
1. Usar filtro "Estado"
2. Seleccionar "Pendiente Adjudicación"
3. Ver lista filtrada

### Actualizar estado de proceso
1. Hacer clic en el proceso
2. Cambiar estado
3. Agregar comentario
4. Guardar

### Generar reporte
1. Aplicar filtros deseados
2. Ver estadísticas actualizadas
3. Exportar (funcionalidad disponible)

## Preguntas Frecuentes

### ¿Necesito internet?
No, el sistema funciona completamente local una vez instalado.

### ¿Los datos se guardan?
Sí, todo se guarda en la base de datos PostgreSQL automáticamente.

### ¿Puedo tener múltiples usuarios?
Sí, el sistema soporta roles y múltiples usuarios (ver README-COMPLETO.md).

### ¿Cómo actualizo los datos?
Todos los cambios se guardan automáticamente. El dashboard se actualiza en tiempo real.

### ¿Qué pasa si cierro el navegador?
Los datos permanecen guardados. Solo vuelve a abrir http://localhost:3000

## Próximos Pasos

1. **Personalizar datos**: Borrar datos de demostración y agregar los reales
2. **Configurar usuarios**: Crear usuarios del equipo
3. **Configurar notificaciones**: Agregar correos para alertas
4. **Entrenar equipo**: Capacitar en el uso de los 8 módulos

## Soporte

### Logs del Sistema

**Con Docker**:
```bash
docker compose logs -f
```

**Sin Docker**:
Ver terminal donde se ejecutan los comandos

### Problemas Comunes

**Error: Puerto en uso**
```bash
# Cambiar puerto en docker-compose.yml o package.json
```

**Error: No conecta a base de datos**
```bash
# Verificar que PostgreSQL está corriendo
# Verificar credenciales en server/.env
```

**Error: Página no carga**
```bash
# Verificar que los servidores están corriendo
# Backend: http://localhost:5000/api/health
# Frontend: http://localhost:3000
```

## Recursos Adicionales

- **Documentación completa**: Ver README-COMPLETO.md
- **Pruebas**: Ver PRUEBAS.md
- **Instalación detallada**: Ver INSTALACION-FACIL.md

## Estado del Sistema

**🟢 100% OPERATIVO**

✅ Todos los módulos funcionando
✅ Base de datos configurada
✅ Interfaz lista para usar
✅ Seguridad implementada
✅ Documentación completa

**Listo para usar en Noviembre 2024** 🎉

---

## Contacto

Para soporte técnico o consultas sobre el sistema, contactar al equipo de desarrollo.

---

**Dashboard Suministros - Área de Ingeniería**
*Inicio Rápido v1.0.0*
