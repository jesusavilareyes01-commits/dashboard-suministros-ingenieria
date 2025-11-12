import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'dashboard_suministros',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'password123',
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    message: 'Dashboard Suministros API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Módulo 1: Registro de Solicitudes
app.post('/api/solicitudes', async (req: Request, res: Response) => {
  const {
    nombreProceso,
    areaSolicitante,
    tipoProceso,
    franjaPresupuestal,
    solicitante,
    soportes,
    observaciones
  } = req.body;

  try {
    // Validar campos obligatorios
    if (!nombreProceso || !areaSolicitante || !tipoProceso || !franjaPresupuestal || !solicitante) {
      return res.status(400).json({ 
        error: 'Campos obligatorios faltantes',
        required: ['nombreProceso', 'areaSolicitante', 'tipoProceso', 'franjaPresupuestal', 'solicitante']
      });
    }

    // Verificar duplicados
    const duplicateCheck = await pool.query(
      'SELECT id FROM solicitudes WHERE nombre_proceso = $1 AND area_solicitante = $2 AND fecha_solicitud::date = CURRENT_DATE',
      [nombreProceso, areaSolicitante]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Solicitud duplicada',
        message: 'Ya existe una solicitud similar creada hoy'
      });
    }

    const result = await pool.query(
      `INSERT INTO solicitudes (
        nombre_proceso, area_solicitante, tipo_proceso, franja_presupuestal,
        solicitante, soportes, observaciones, estado_actual, fecha_solicitud,
        creado_por, fecha_creacion
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, NOW())
      RETURNING *`,
      [
        nombreProceso,
        areaSolicitante,
        tipoProceso,
        franjaPresupuestal,
        solicitante,
        JSON.stringify(soportes || []),
        observaciones,
        'SOLICITUD_RECIBIDA',
        solicitante
      ]
    );

    res.status(201).json({
      message: 'Solicitud registrada exitosamente',
      solicitud: result.rows[0]
    });
  } catch (error) {
    console.error('Error creando solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener todas las solicitudes
app.get('/api/solicitudes', async (req: Request, res: Response) => {
  const { estado, tipo, area, anio } = req.query;

  try {
    let query = 'SELECT * FROM solicitudes WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (estado) {
      query += ` AND estado_actual = $${paramCount++}`;
      params.push(estado);
    }

    if (tipo) {
      query += ` AND tipo_proceso = $${paramCount++}`;
      params.push(tipo);
    }

    if (area) {
      query += ` AND area_solicitante = $${paramCount++}`;
      params.push(area);
    }

    if (anio) {
      query += ` AND EXTRACT(YEAR FROM fecha_solicitud) = $${paramCount++}`;
      params.push(anio);
    }

    query += ' ORDER BY fecha_solicitud DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo solicitudes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener una solicitud específica
app.get('/api/solicitudes/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM solicitudes WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    // Obtener historial de cambios
    const historial = await pool.query(
      'SELECT * FROM historial_cambios WHERE solicitud_id = $1 ORDER BY fecha_cambio DESC',
      [id]
    );

    res.json({
      solicitud: result.rows[0],
      historial: historial.rows
    });
  } catch (error) {
    console.error('Error obteniendo solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Módulo 2: Validación y Revisión Administrativa
app.put('/api/solicitudes/:id/validar', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { numeroSap, clasificacionCompra, observaciones, validadoPor } = req.body;

  try {
    const fechaInicioValidacion = await pool.query(
      'SELECT fecha_solicitud FROM solicitudes WHERE id = $1',
      [id]
    );

    if (fechaInicioValidacion.rows.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    const diasEnRevision = Math.floor(
      (Date.now() - new Date(fechaInicioValidacion.rows[0].fecha_solicitud).getTime()) / 
      (1000 * 60 * 60 * 24)
    );

    const result = await pool.query(
      `UPDATE solicitudes 
       SET numero_sap = $1, 
           clasificacion_compra = $2, 
           observaciones = $3,
           estado_actual = 'VALIDADA_ENVIADA_COMPRAS',
           dias_en_revision = $4,
           fecha_validacion = NOW(),
           validado_por = $5,
           actualizado_por = $5,
           fecha_actualizacion = NOW()
       WHERE id = $6
       RETURNING *`,
      [numeroSap, clasificacionCompra, observaciones, diasEnRevision, validadoPor, id]
    );

    // Registrar en historial
    await pool.query(
      `INSERT INTO historial_cambios (solicitud_id, estado_anterior, estado_nuevo, usuario, comentario)
       VALUES ($1, 'SOLICITUD_RECIBIDA', 'VALIDADA_ENVIADA_COMPRAS', $2, $3)`,
      [id, validadoPor, 'Solicitud validada y enviada a Compras']
    );

    res.json({
      message: 'Solicitud validada exitosamente',
      solicitud: result.rows[0],
      diasEnRevision
    });
  } catch (error) {
    console.error('Error validando solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Módulo 3: Seguimiento a Compras y Contratación
app.put('/api/solicitudes/:id/compras', async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    fechaLiberacionSap,
    analistaResponsable,
    etapa,
    documentos,
    estadoCompras,
    fechaAdjudicacion,
    usuarioActualizacion
  } = req.body;

  try {
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (fechaLiberacionSap) {
      updateFields.push(`fecha_liberacion_sap = $${paramCount++}`);
      params.push(fechaLiberacionSap);
    }

    if (analistaResponsable) {
      updateFields.push(`analista_responsable = $${paramCount++}`);
      params.push(analistaResponsable);
    }

    if (etapa) {
      updateFields.push(`etapa_compras = $${paramCount++}`);
      params.push(etapa);
    }

    if (documentos) {
      updateFields.push(`documentos_compras = $${paramCount++}`);
      params.push(JSON.stringify(documentos));
    }

    if (estadoCompras) {
      updateFields.push(`estado_actual = $${paramCount++}`);
      params.push(estadoCompras);
    }

    if (fechaAdjudicacion) {
      updateFields.push(`fecha_adjudicacion = $${paramCount++}`);
      params.push(fechaAdjudicacion);
    }

    updateFields.push(`actualizado_por = $${paramCount++}`);
    updateFields.push(`fecha_actualizacion = NOW()`);
    params.push(usuarioActualizacion);
    params.push(id);

    const query = `UPDATE solicitudes SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    res.json({
      message: 'Información de compras actualizada',
      solicitud: result.rows[0]
    });
  } catch (error) {
    console.error('Error actualizando compras:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Módulo 4: KPIs y Análisis en Tiempo Real
app.get('/api/kpis', async (req: Request, res: Response) => {
  try {
    const totalSolicitudes = await pool.query('SELECT COUNT(*) as count FROM solicitudes');
    
    const enCurso = await pool.query(
      "SELECT COUNT(*) as count FROM solicitudes WHERE estado_actual NOT IN ('FINALIZADO', 'CANCELADO')"
    );
    
    const finalizadas = await pool.query(
      "SELECT COUNT(*) as count FROM solicitudes WHERE estado_actual = 'FINALIZADO'"
    );
    
    const atrasadas = await pool.query(
      `SELECT COUNT(*) as count FROM solicitudes 
       WHERE estado_actual NOT IN ('FINALIZADO', 'CANCELADO')
       AND (fecha_solicitud < NOW() - INTERVAL '60 days')`
    );

    const tiempoPromedio = await pool.query(
      `SELECT AVG(EXTRACT(DAY FROM (fecha_adjudicacion - fecha_solicitud))) as promedio
       FROM solicitudes WHERE estado_actual = 'FINALIZADO' AND fecha_adjudicacion IS NOT NULL`
    );

    // Estadísticas adicionales requeridas
    const procesosAñosAnteriores = await pool.query(
      `SELECT COUNT(*) as count FROM solicitudes 
       WHERE estado_actual = 'FINALIZADO' 
       AND EXTRACT(YEAR FROM fecha_solicitud) < EXTRACT(YEAR FROM CURRENT_DATE)`
    );

    const procesosPlaneados = await pool.query(
      "SELECT COUNT(*) as count FROM solicitudes WHERE estado_actual = 'SOLICITUD_RECIBIDA'"
    );

    const procesosBajoValor2025 = await pool.query(
      `SELECT COUNT(*) as count FROM solicitudes 
       WHERE tipo_proceso = 'BAJO_VALOR' 
       AND EXTRACT(YEAR FROM fecha_solicitud) >= 2024`
    );

    const total = parseInt(totalSolicitudes.rows[0].count);
    const finalizadasCount = parseInt(finalizadas.rows[0].count);

    res.json({
      totalSolicitudes: total,
      solicitudesEnCurso: parseInt(enCurso.rows[0].count),
      solicitudesFinalizadas: finalizadasCount,
      porcentajeCumplimiento: total > 0 ? Math.round((finalizadasCount / total) * 100) : 0,
      tiempoPromedioCompletacion: Math.round(parseFloat(tiempoPromedio.rows[0].promedio) || 0),
      procesosAtrasados: parseInt(atrasadas.rows[0].count),
      procesosAñosAnteriores: parseInt(procesosAñosAnteriores.rows[0].count),
      procesosPlaneados: parseInt(procesosPlaneados.rows[0].count),
      procesosBajoValor2025: parseInt(procesosBajoValor2025.rows[0].count)
    });
  } catch (error) {
    console.error('Error calculando KPIs:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Módulo 5: Actualización y Control de Información
app.put('/api/solicitudes/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { estadoActual, observaciones, usuario } = req.body;

  try {
    // Obtener estado anterior
    const estadoAnterior = await pool.query(
      'SELECT estado_actual FROM solicitudes WHERE id = $1',
      [id]
    );

    if (estadoAnterior.rows.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    // Actualizar solicitud
    const result = await pool.query(
      `UPDATE solicitudes 
       SET estado_actual = $1, 
           observaciones = $2,
           actualizado_por = $3,
           fecha_actualizacion = NOW()
       WHERE id = $4
       RETURNING *`,
      [estadoActual, observaciones, usuario, id]
    );

    // Registrar en historial
    await pool.query(
      `INSERT INTO historial_cambios (solicitud_id, estado_anterior, estado_nuevo, usuario, comentario, fecha_cambio)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [id, estadoAnterior.rows[0].estado_actual, estadoActual, usuario, observaciones]
    );

    res.json({
      message: 'Solicitud actualizada exitosamente',
      solicitud: result.rows[0]
    });
  } catch (error) {
    console.error('Error actualizando solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Módulo 6: Alertas y Notificaciones
app.get('/api/alertas', async (req: Request, res: Response) => {
  try {
    // Procesos atrasados (más de 60 días)
    const procesosAtrasados = await pool.query(
      `SELECT * FROM solicitudes 
       WHERE estado_actual NOT IN ('FINALIZADO', 'CANCELADO')
       AND fecha_solicitud < NOW() - INTERVAL '60 days'
       ORDER BY fecha_solicitud ASC`
    );

    // Documentos faltantes
    const documentosFaltantes = await pool.query(
      `SELECT * FROM solicitudes 
       WHERE (soportes IS NULL OR soportes = '[]')
       AND estado_actual NOT IN ('FINALIZADO', 'CANCELADO')`
    );

    // Próximos a vencer (más de 45 días)
    const proximosVencer = await pool.query(
      `SELECT * FROM solicitudes 
       WHERE estado_actual NOT IN ('FINALIZADO', 'CANCELADO')
       AND fecha_solicitud < NOW() - INTERVAL '45 days'
       AND fecha_solicitud >= NOW() - INTERVAL '60 days'`
    );

    res.json({
      procesosAtrasados: procesosAtrasados.rows,
      documentosFaltantes: documentosFaltantes.rows,
      proximosVencer: proximosVencer.rows,
      totalAlertas: procesosAtrasados.rows.length + documentosFaltantes.rows.length + proximosVencer.rows.length
    });
  } catch (error) {
    console.error('Error obteniendo alertas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Módulo 7: Cierre y Evaluación del Proceso
app.put('/api/solicitudes/:id/cerrar', async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    fechaAdjudicacion,
    observacionesFinales,
    documentoCierre,
    calificacionProceso,
    usuario
  } = req.body;

  try {
    // Obtener información de la solicitud
    const solicitud = await pool.query(
      'SELECT fecha_solicitud FROM solicitudes WHERE id = $1',
      [id]
    );

    if (solicitud.rows.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    // Calcular desviación en días
    const fechaSolicitud = new Date(solicitud.rows[0].fecha_solicitud);
    const fechaCierre = fechaAdjudicacion ? new Date(fechaAdjudicacion) : new Date();
    const desviacionDias = Math.floor(
      (fechaCierre.getTime() - fechaSolicitud.getTime()) / (1000 * 60 * 60 * 24)
    );

    const result = await pool.query(
      `UPDATE solicitudes 
       SET fecha_adjudicacion = $1,
           estado_actual = 'FINALIZADO',
           observaciones = $2,
           documento_cierre = $3,
           calificacion_proceso = $4,
           desviacion_dias = $5,
           fecha_cierre = NOW(),
           cerrado_por = $6,
           actualizado_por = $6,
           fecha_actualizacion = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        fechaAdjudicacion || new Date(),
        observacionesFinales,
        documentoCierre,
        calificacionProceso,
        desviacionDias,
        usuario,
        id
      ]
    );

    // Registrar en historial
    await pool.query(
      `INSERT INTO historial_cambios (solicitud_id, estado_anterior, estado_nuevo, usuario, comentario)
       VALUES ($1, $2, 'FINALIZADO', $3, $4)`,
      [id, 'EN_PROCESO', usuario, 'Proceso cerrado y evaluado']
    );

    res.json({
      message: 'Proceso cerrado exitosamente',
      solicitud: result.rows[0],
      desviacionDias
    });
  } catch (error) {
    console.error('Error cerrando proceso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Módulo 8: Administración y Seguridad - Auditoría
app.get('/api/auditoria', async (req: Request, res: Response) => {
  const { fechaInicio, fechaFin, usuario } = req.query;

  try {
    let query = 'SELECT * FROM historial_cambios WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (fechaInicio) {
      query += ` AND fecha_cambio >= $${paramCount++}`;
      params.push(fechaInicio);
    }

    if (fechaFin) {
      query += ` AND fecha_cambio <= $${paramCount++}`;
      params.push(fechaFin);
    }

    if (usuario) {
      query += ` AND usuario = $${paramCount++}`;
      params.push(usuario);
    }

    query += ' ORDER BY fecha_cambio DESC LIMIT 1000';

    const result = await pool.query(query, params);
    res.json({
      registros: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error obteniendo auditoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Estadísticas por tipo de proceso
app.get('/api/estadisticas/tipos', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT tipo_proceso, 
              COUNT(*) as total,
              COUNT(CASE WHEN estado_actual = 'FINALIZADO' THEN 1 END) as finalizados,
              COUNT(CASE WHEN estado_actual NOT IN ('FINALIZADO', 'CANCELADO') THEN 1 END) as en_curso
       FROM solicitudes
       GROUP BY tipo_proceso
       ORDER BY total DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Estadísticas por área
app.get('/api/estadisticas/areas', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT area_solicitante, 
              COUNT(*) as total,
              COUNT(CASE WHEN estado_actual = 'FINALIZADO' THEN 1 END) as finalizados,
              AVG(EXTRACT(DAY FROM (COALESCE(fecha_adjudicacion, NOW()) - fecha_solicitud))) as tiempo_promedio
       FROM solicitudes
       GROUP BY area_solicitante
       ORDER BY total DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo estadísticas por área:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Dashboard Suministros Server corriendo en puerto ${port}`);
  console.log(`📊 Todos los 8 módulos operativos`);
  console.log(`🔒 Seguridad y auditoría activadas`);
});

export default app;
