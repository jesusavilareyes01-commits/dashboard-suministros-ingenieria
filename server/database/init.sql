-- Database initialization for Dashboard Suministros Ingeniería
-- Los 8 Módulos del Sistema

-- Drop tables if exist (for clean setup)
DROP TABLE IF EXISTS historial_cambios CASCADE;
DROP TABLE IF EXISTS solicitudes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Tabla de usuarios (Módulo 8: Administración y Seguridad)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('SOLICITANTE', 'ASISTENTE_ADMINISTRATIVA', 'ANALISTA_COMPRAS', 'ADMINISTRADOR')),
    area VARCHAR(255),
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    ultimo_acceso TIMESTAMP,
    creado_por VARCHAR(100),
    actualizado_por VARCHAR(100),
    fecha_actualizacion TIMESTAMP
);

-- Tabla principal de solicitudes (Módulos 1-7)
CREATE TABLE solicitudes (
    id SERIAL PRIMARY KEY,
    
    -- Módulo 1: Registro de Solicitudes
    nombre_proceso VARCHAR(500) NOT NULL,
    area_solicitante VARCHAR(255) NOT NULL,
    tipo_proceso VARCHAR(100) NOT NULL CHECK (tipo_proceso IN ('COMPRA_DIRECTA', 'LICITACION', 'CONVENIO', 'BAJO_VALOR', 'OTRO')),
    franja_presupuestal VARCHAR(100) NOT NULL,
    fecha_solicitud TIMESTAMP DEFAULT NOW(),
    solicitante VARCHAR(255) NOT NULL,
    soportes JSONB DEFAULT '[]',
    
    -- Módulo 2: Validación y Revisión Administrativa
    numero_sap VARCHAR(100),
    clasificacion_compra VARCHAR(100),
    fecha_validacion TIMESTAMP,
    dias_en_revision INTEGER,
    validado_por VARCHAR(100),
    
    -- Módulo 3: Seguimiento a Compras y Contratación
    fecha_liberacion_sap TIMESTAMP,
    analista_responsable VARCHAR(255),
    etapa_compras VARCHAR(100),
    documentos_compras JSONB DEFAULT '[]',
    fecha_adjudicacion TIMESTAMP,
    
    -- Módulo 4, 5: Estado y Control
    estado_actual VARCHAR(100) NOT NULL DEFAULT 'SOLICITUD_RECIBIDA' 
        CHECK (estado_actual IN (
            'SOLICITUD_RECIBIDA',
            'EN_VALIDACION',
            'VALIDADA_ENVIADA_COMPRAS',
            'EN_PROCESO_COMPRAS',
            'PENDIENTE_ADJUDICACION',
            'ADJUDICADO',
            'FINALIZADO',
            'CANCELADO'
        )),
    observaciones TEXT,
    
    -- Módulo 7: Cierre y Evaluación
    fecha_cierre TIMESTAMP,
    documento_cierre VARCHAR(500),
    calificacion_proceso INTEGER CHECK (calificacion_proceso >= 1 AND calificacion_proceso <= 5),
    desviacion_dias INTEGER,
    cerrado_por VARCHAR(100),
    
    -- Auditoría (Módulo 8)
    creado_por VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    actualizado_por VARCHAR(100),
    fecha_actualizacion TIMESTAMP,
    
    -- Índices y constraints
    CONSTRAINT uk_solicitud_proceso UNIQUE (nombre_proceso, area_solicitante, fecha_solicitud)
);

-- Tabla de historial de cambios (Módulo 5 y 8: Trazabilidad)
CREATE TABLE historial_cambios (
    id SERIAL PRIMARY KEY,
    solicitud_id INTEGER NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
    estado_anterior VARCHAR(100),
    estado_nuevo VARCHAR(100),
    campo_modificado VARCHAR(100),
    valor_anterior TEXT,
    valor_nuevo TEXT,
    usuario VARCHAR(100) NOT NULL,
    comentario TEXT,
    fecha_cambio TIMESTAMP DEFAULT NOW(),
    ip_address VARCHAR(50),
    user_agent TEXT
);

-- Índices para optimizar consultas
CREATE INDEX idx_solicitudes_estado ON solicitudes(estado_actual);
CREATE INDEX idx_solicitudes_tipo ON solicitudes(tipo_proceso);
CREATE INDEX idx_solicitudes_area ON solicitudes(area_solicitante);
CREATE INDEX idx_solicitudes_fecha ON solicitudes(fecha_solicitud);
CREATE INDEX idx_solicitudes_sap ON solicitudes(numero_sap);
CREATE INDEX idx_solicitudes_analista ON solicitudes(analista_responsable);
CREATE INDEX idx_historial_solicitud ON historial_cambios(solicitud_id);
CREATE INDEX idx_historial_fecha ON historial_cambios(fecha_cambio);
CREATE INDEX idx_historial_usuario ON historial_cambios(usuario);

-- Datos de demostración
INSERT INTO solicitudes (
    nombre_proceso, area_solicitante, tipo_proceso, franja_presupuestal,
    solicitante, numero_sap, estado_actual, fecha_solicitud, observaciones,
    creado_por, fecha_adjudicacion
) VALUES 
(
    'Compra de Equipos de Medición Digital',
    'Ingeniería Eléctrica',
    'COMPRA_DIRECTA',
    '50M - 100M',
    'Juan Pérez',
    'SAP001-2024',
    'FINALIZADO',
    '2024-01-15',
    'Proceso completado satisfactoriamente',
    'Juan Pérez',
    '2024-03-20'
),
(
    'Licitación Software CAD Avanzado',
    'Ingeniería Mecánica',
    'LICITACION',
    '100M - 500M',
    'María García',
    'SAP002-2024',
    'EN_PROCESO_COMPRAS',
    '2024-02-01',
    'En evaluación de propuestas',
    'María García',
    NULL
),
(
    'Materiales de Laboratorio Químico',
    'Ingeniería Química',
    'BAJO_VALOR',
    '10M - 50M',
    'Carlos López',
    'SAP003-2024',
    'PENDIENTE_ADJUDICACION',
    '2024-10-15',
    'Esperando aprobación final',
    'Carlos López',
    NULL
),
(
    'Convenio Servicios Técnicos Especializados',
    'Ingeniería Civil',
    'CONVENIO',
    '500M+',
    'Ana Rodríguez',
    'SAP004-2025',
    'SOLICITUD_RECIBIDA',
    '2024-11-01',
    'Solicitud en revisión inicial',
    'Ana Rodríguez',
    NULL
),
(
    'Equipos de Protección Personal',
    'Seguridad Industrial',
    'BAJO_VALOR',
    '5M - 10M',
    'Pedro Martínez',
    'SAP005-2025',
    'FINALIZADO',
    '2023-12-10',
    'Entrega completada año anterior',
    'Pedro Martínez',
    '2024-01-15'
),
(
    'Software de Gestión de Proyectos',
    'Ingeniería de Sistemas',
    'COMPRA_DIRECTA',
    '50M - 100M',
    'Laura Hernández',
    'SAP006-2025',
    'VALIDADA_ENVIADA_COMPRAS',
    '2024-11-05',
    'Documentación completa',
    'Laura Hernández',
    NULL
),
(
    'Herramientas Especializadas para Mantenimiento',
    'Ingeniería Mecánica',
    'BAJO_VALOR',
    '10M - 50M',
    'Roberto Silva',
    'SAP007-2025',
    'FINALIZADO',
    '2024-08-20',
    'Proceso cerrado exitosamente',
    'Roberto Silva',
    '2024-10-01'
),
(
    'Licencias de Software de Diseño',
    'Ingeniería de Diseño',
    'LICITACION',
    '100M - 500M',
    'Diana Castro',
    'SAP008-2025',
    'EN_PROCESO_COMPRAS',
    '2024-09-15',
    'En proceso de evaluación técnica',
    'Diana Castro',
    NULL
),
(
    'Equipamiento de Laboratorio de Física',
    'Laboratorio de Física',
    'COMPRA_DIRECTA',
    '50M - 100M',
    'Miguel Torres',
    'SAP009-2024',
    'FINALIZADO',
    '2023-11-10',
    'Equipamiento recibido e instalado',
    'Miguel Torres',
    '2024-02-15'
),
(
    'Servicios de Calibración de Equipos',
    'Control de Calidad',
    'BAJO_VALOR',
    '5M - 10M',
    'Sofia Ramírez',
    'SAP010-2025',
    'ADJUDICADO',
    '2024-10-28',
    'Adjudicado, pendiente inicio',
    'Sofia Ramírez',
    NULL
);

-- Insertar historial de cambios para algunas solicitudes
INSERT INTO historial_cambios (solicitud_id, estado_anterior, estado_nuevo, usuario, comentario) VALUES
(1, 'SOLICITUD_RECIBIDA', 'VALIDADA_ENVIADA_COMPRAS', 'Asistente Admin', 'Solicitud validada'),
(1, 'VALIDADA_ENVIADA_COMPRAS', 'EN_PROCESO_COMPRAS', 'Analista Compras', 'Iniciado proceso de compra'),
(1, 'EN_PROCESO_COMPRAS', 'FINALIZADO', 'Analista Compras', 'Proceso finalizado exitosamente'),
(2, 'SOLICITUD_RECIBIDA', 'VALIDADA_ENVIADA_COMPRAS', 'Asistente Admin', 'Documentación completa'),
(2, 'VALIDADA_ENVIADA_COMPRAS', 'EN_PROCESO_COMPRAS', 'Analista Compras', 'En evaluación de ofertas'),
(3, 'SOLICITUD_RECIBIDA', 'VALIDADA_ENVIADA_COMPRAS', 'Asistente Admin', 'Validado y enviado'),
(3, 'VALIDADA_ENVIADA_COMPRAS', 'PENDIENTE_ADJUDICACION', 'Analista Compras', 'Esperando aprobación');

-- Crear usuario administrador de ejemplo
INSERT INTO usuarios (username, email, password_hash, nombre_completo, rol, area, creado_por) VALUES
('admin', 'admin@ingenieria.com', '$2a$10$YourHashedPasswordHere', 'Administrador Sistema', 'ADMINISTRADOR', 'TI', 'SYSTEM'),
('asistente1', 'asistente@ingenieria.com', '$2a$10$YourHashedPasswordHere', 'Asistente Administrativa', 'ASISTENTE_ADMINISTRATIVA', 'Administración', 'admin'),
('analista1', 'analista@compras.com', '$2a$10$YourHashedPasswordHere', 'Analista de Compras', 'ANALISTA_COMPRAS', 'Compras', 'admin');

-- Vistas útiles para reportes

-- Vista de procesos finalizados años anteriores
CREATE VIEW procesos_anos_anteriores AS
SELECT * FROM solicitudes
WHERE estado_actual = 'FINALIZADO'
AND EXTRACT(YEAR FROM fecha_solicitud) < EXTRACT(YEAR FROM CURRENT_DATE);

-- Vista de procesos en curso
CREATE VIEW procesos_en_curso AS
SELECT * FROM solicitudes
WHERE estado_actual NOT IN ('FINALIZADO', 'CANCELADO');

-- Vista de procesos planeados (solicitudes recibidas)
CREATE VIEW procesos_planeados AS
SELECT * FROM solicitudes
WHERE estado_actual = 'SOLICITUD_RECIBIDA';

-- Vista de compras bajo valor 2025
CREATE VIEW compras_bajo_valor_2025 AS
SELECT * FROM solicitudes
WHERE tipo_proceso = 'BAJO_VALOR'
AND EXTRACT(YEAR FROM fecha_solicitud) >= 2024;

-- Función para calcular días transcurridos
CREATE OR REPLACE FUNCTION calcular_dias_proceso(solicitud_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    fecha_inicio DATE;
    fecha_fin DATE;
    dias INTEGER;
BEGIN
    SELECT fecha_solicitud, COALESCE(fecha_adjudicacion, CURRENT_DATE)
    INTO fecha_inicio, fecha_fin
    FROM solicitudes
    WHERE id = solicitud_id;
    
    dias := fecha_fin - fecha_inicio;
    RETURN dias;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auditoría automática
CREATE OR REPLACE FUNCTION audit_solicitud_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Registrar cambio de estado
        IF OLD.estado_actual IS DISTINCT FROM NEW.estado_actual THEN
            INSERT INTO historial_cambios (
                solicitud_id, estado_anterior, estado_nuevo, 
                usuario, comentario, fecha_cambio
            ) VALUES (
                NEW.id, OLD.estado_actual, NEW.estado_actual,
                NEW.actualizado_por, 'Cambio de estado automático',
                NOW()
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_solicitud
AFTER UPDATE ON solicitudes
FOR EACH ROW
EXECUTE FUNCTION audit_solicitud_changes();

-- Comentarios sobre las tablas
COMMENT ON TABLE solicitudes IS 'Tabla principal de seguimiento de procesos de suministro - Módulos 1-7';
COMMENT ON TABLE historial_cambios IS 'Trazabilidad completa de cambios - Módulos 5 y 8';
COMMENT ON TABLE usuarios IS 'Gestión de usuarios y roles - Módulo 8';

COMMENT ON COLUMN solicitudes.estado_actual IS 'Estado actual del proceso de suministro';
COMMENT ON COLUMN solicitudes.numero_sap IS 'Número interno asignado por SAP';
COMMENT ON COLUMN solicitudes.dias_en_revision IS 'Días que tomó la validación administrativa';
COMMENT ON COLUMN solicitudes.desviacion_dias IS 'Desviación en días respecto al tiempo esperado';
COMMENT ON COLUMN solicitudes.calificacion_proceso IS 'Calificación del proceso del 1 al 5';

-- Grants (ajustar según necesidades de seguridad)
-- GRANT SELECT, INSERT, UPDATE ON solicitudes TO role_solicitante;
-- GRANT SELECT, INSERT, UPDATE ON solicitudes TO role_asistente;
-- GRANT ALL PRIVILEGES ON solicitudes TO role_administrador;

-- Información del sistema
CREATE TABLE sistema_info (
    clave VARCHAR(100) PRIMARY KEY,
    valor TEXT,
    descripcion TEXT,
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

INSERT INTO sistema_info (clave, valor, descripcion) VALUES
('VERSION', '1.0.0', 'Versión del sistema Dashboard Suministros'),
('MODULOS_ACTIVOS', '8', 'Número de módulos operativos'),
('FECHA_IMPLEMENTACION', '2024-11-12', 'Fecha de puesta en marcha'),
('ESTADO_SISTEMA', 'OPERATIVO', 'Estado general del sistema');

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Base de datos inicializada correctamente';
    RAISE NOTICE '📊 Todos los 8 módulos configurados';
    RAISE NOTICE '🔒 Auditoría y trazabilidad activadas';
    RAISE NOTICE '📈 Dashboard Suministros Ingeniería listo para uso';
END $$;
