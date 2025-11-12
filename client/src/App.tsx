import React, { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, Container, Grid, Paper, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Box, CircularProgress, Alert, Button, TextField, MenuItem
} from '@mui/material';
import {
  Dashboard as DashboardIcon, TrendingUp, Assignment, CheckCircle, 
  Warning, Refresh, FilterList, Add
} from '@mui/icons-material';

// Tipos de datos
interface Solicitud {
  id: number;
  numeroSap?: string;
  nombreProceso: string;
  areaSolicitante: string;
  tipoProceso: string;
  estadoActual: string;
  fechaSolicitud: string;
  solicitante: string;
  observaciones?: string;
}

interface KPIs {
  totalSolicitudes: number;
  solicitudesEnCurso: number;
  solicitudesFinalizadas: number;
  porcentajeCumplimiento: number;
  tiempoPromedioCompletacion: number;
  procesosAtrasados: number;
}

const App: React.FC = () => {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  // Datos de demostración completos
  useEffect(() => {
    const datosDemostracion: Solicitud[] = [
      {
        id: 1,
        numeroSap: "SAP001-2024",
        nombreProceso: "Compra de Equipos de Medición Digital",
        areaSolicitante: "Ingeniería Eléctrica",
        tipoProceso: "COMPRA_DIRECTA",
        estadoActual: "FINALIZADO",
        fechaSolicitud: "2024-01-15",
        solicitante: "Juan Pérez",
        observaciones: "Proceso completado satisfactoriamente"
      },
      {
        id: 2,
        numeroSap: "SAP002-2024",
        nombreProceso: "Licitación Software CAD Avanzado",
        areaSolicitante: "Ingeniería Mecánica",
        tipoProceso: "LICITACION",
        estadoActual: "EN_PROCESO_COMPRAS",
        fechaSolicitud: "2024-02-01",
        solicitante: "María García",
        observaciones: "En evaluación de propuestas"
      },
      {
        id: 3,
        numeroSap: "SAP003-2024",
        nombreProceso: "Materiales de Laboratorio Químico",
        areaSolicitante: "Ingeniería Química",
        tipoProceso: "BAJO_VALOR",
        estadoActual: "PENDIENTE_ADJUDICACION",
        fechaSolicitud: "2024-10-15",
        solicitante: "Carlos López",
        observaciones: "Esperando aprobación final"
      },
      {
        id: 4,
        numeroSap: "SAP004-2025",
        nombreProceso: "Convenio Servicios Técnicos Especializados",
        areaSolicitante: "Ingeniería Civil",
        tipoProceso: "CONVENIO",
        estadoActual: "SOLICITUD_RECIBIDA",
        fechaSolicitud: "2024-11-01",
        solicitante: "Ana Rodríguez",
        observaciones: "Solicitud en revisión inicial"
      },
      {
        id: 5,
        numeroSap: "SAP005-2025",
        nombreProceso: "Equipos de Protección Personal",
        areaSolicitante: "Seguridad Industrial",
        tipoProceso: "BAJO_VALOR",
        estadoActual: "FINALIZADO",
        fechaSolicitud: "2023-12-10",
        solicitante: "Pedro Martínez",
        observaciones: "Entrega completada año anterior"
      },
      {
        id: 6,
        numeroSap: "SAP006-2025",
        nombreProceso: "Software de Gestión de Proyectos",
        areaSolicitante: "Ingeniería de Sistemas",
        tipoProceso: "COMPRA_DIRECTA",
        estadoActual: "VALIDADA_ENVIADA_COMPRAS",
        fechaSolicitud: "2024-11-05",
        solicitante: "Laura Hernández",
        observaciones: "Documentación completa"
      }
    ];

    const kpisCalculados: KPIs = {
      totalSolicitudes: datosDemostracion.length,
      solicitudesEnCurso: datosDemostracion.filter(s => 
        !['FINALIZADO', 'CANCELADO'].includes(s.estadoActual)
      ).length,
      solicitudesFinalizadas: datosDemostracion.filter(s => 
        s.estadoActual === 'FINALIZADO'
      ).length,
      porcentajeCumplimiento: Math.round(
        (datosDemostracion.filter(s => s.estadoActual === 'FINALIZADO').length / 
         datosDemostracion.length) * 100
      ),
      tiempoPromedioCompletacion: 42, // días promedio
      procesosAtrasados: datosDemostracion.filter(s => 
        s.estadoActual === 'PENDIENTE_ADJUDICACION'
      ).length
    };

    setTimeout(() => {
      setSolicitudes(datosDemostracion);
      setKpis(kpisCalculados);
      setLoading(false);
    }, 1500);
  }, []);

  const getColorEstado = (estado: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (estado) {
      case 'FINALIZADO': return 'success';
      case 'EN_PROCESO_COMPRAS':
      case 'VALIDADA_ENVIADA_COMPRAS': return 'warning';
      case 'PENDIENTE_ADJUDICACION': return 'error';
      case 'SOLICITUD_RECIBIDA': return 'info';
      default: return 'default';
    }
  };

  const formatearEstado = (estado: string): string => {
    const estados: { [key: string]: string } = {
      'SOLICITUD_RECIBIDA': 'Solicitud Recibida',
      'EN_VALIDACION': 'En Validación',
      'VALIDADA_ENVIADA_COMPRAS': 'Enviada a Compras',
      'EN_PROCESO_COMPRAS': 'En Proceso Compras',
      'PENDIENTE_ADJUDICACION': 'Pendiente Adjudicación',
      'ADJUDICADO': 'Adjudicado',
      'FINALIZADO': 'Finalizado',
      'CANCELADO': 'Cancelado'
    };
    return estados[estado] || estado;
  };

  const solicitudesFiltradas = solicitudes.filter(solicitud => {
    const cumpleFiltroEstado = !filtroEstado || solicitud.estadoActual === filtroEstado;
    const cumpleFiltroTipo = !filtroTipo || solicitud.tipoProceso === filtroTipo;
    return cumpleFiltroEstado && cumpleFiltroTipo;
  });

  // Estadísticas especiales
  const procesosAñosAnteriores = solicitudes.filter(s => 
    s.estadoActual === 'FINALIZADO' && 
    new Date(s.fechaSolicitud).getFullYear() < 2024
  ).length;

  const procesosPlaneados = solicitudes.filter(s => 
    s.estadoActual === 'SOLICITUD_RECIBIDA'
  ).length;

  const procesosBajoValor2025 = solicitudes.filter(s => 
    s.tipoProceso === 'BAJO_VALOR' && 
    new Date(s.fechaSolicitud).getFullYear() >= 2024
  ).length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Box textAlign="center">
          <CircularProgress size={80} thickness={4} />
          <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
            Cargando Dashboard de Suministros
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Iniciando los 8 módulos del sistema...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <div>
      {/* Header */}
      <AppBar position="static" sx={{ background: 'linear-gradient(45deg, #1976d2 30%, #21cbf3 90%)' }}>
        <Toolbar>
          <DashboardIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Dashboard de Suministros - Área de Ingeniería
          </Typography>
          <Button color="inherit" startIcon={<Refresh />} onClick={() => window.location.reload()}>
            Actualizar
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Mensaje de Estado */}
        <Alert severity="success" sx={{ mb: 3 }}>
          <strong>✅ Dashboard Operativo!</strong> Todos los módulos funcionando correctamente. 
          Última actualización: {new Date().toLocaleString('es-ES')}
        </Alert>

        {/* KPIs Principales */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)' }}>
              <CardContent>
                <Box display="flex" alignItems="center" color="white">
                  <Assignment sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography color="inherit" variant="h6" gutterBottom>
                      Total Solicitudes
                    </Typography>
                    <Typography variant="h3" fontWeight="bold">
                      {kpis?.totalSolicitudes || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)' }}>
              <CardContent>
                <Box display="flex" alignItems="center" color="white">
                  <TrendingUp sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography color="inherit" variant="h6" gutterBottom>
                      En Curso
                    </Typography>
                    <Typography variant="h3" fontWeight="bold">
                      {kpis?.solicitudesEnCurso || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', background: 'linear-gradient(45deg, #4caf50 30%, #81c784 90%)' }}>
              <CardContent>
                <Box display="flex" alignItems="center" color="white">
                  <CheckCircle sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography color="inherit" variant="h6" gutterBottom>
                      Finalizadas
                    </Typography>
                    <Typography variant="h3" fontWeight="bold">
                      {kpis?.solicitudesFinalizadas || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', background: kpis && kpis.porcentajeCumplimiento > 70 ? 
              'linear-gradient(45deg, #4caf50 30%, #81c784 90%)' : 
              'linear-gradient(45deg, #f44336 30%, #ef5350 90%)' 
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" color="white">
                  <Warning sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography color="inherit" variant="h6" gutterBottom>
                      % Cumplimiento
                    </Typography>
                    <Typography variant="h3" fontWeight="bold">
                      {kpis?.porcentajeCumplimiento || 0}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Estadísticas Especiales */}
        <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(45deg, #f5f5f5 0%, #e0e0e0 100%)' }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            📊 Visualizaciones Especiales Requeridas
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {procesosAñosAnteriores}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Procesos Finalizados<br/>Años Anteriores
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {kpis?.solicitudesEnCurso || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Procesos en Curso<br/>(Tiempo Real)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="info.main" fontWeight="bold">
                  {procesosPlaneados}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Procesos<br/>Planeados
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {procesosBajoValor2025}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Compra Bajo Valor<br/>no PAABS 2025
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <FilterList sx={{ mr: 1 }} />
            Filtros de Búsqueda
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Estado del Proceso"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                variant="outlined"
                size="small"
              >
                <MenuItem value="">Todos los Estados</MenuItem>
                <MenuItem value="SOLICITUD_RECIBIDA">Solicitud Recibida</MenuItem>
                <MenuItem value="VALIDADA_ENVIADA_COMPRAS">Enviada a Compras</MenuItem>
                <MenuItem value="EN_PROCESO_COMPRAS">En Proceso Compras</MenuItem>
                <MenuItem value="PENDIENTE_ADJUDICACION">Pendiente Adjudicación</MenuItem>
                <MenuItem value="FINALIZADO">Finalizado</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Tipo de Proceso"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                variant="outlined"
                size="small"
              >
                <MenuItem value="">Todos los Tipos</MenuItem>
                <MenuItem value="COMPRA_DIRECTA">Compra Directa</MenuItem>
                <MenuItem value="LICITACION">Licitación</MenuItem>
                <MenuItem value="CONVENIO">Convenio</MenuItem>
                <MenuItem value="BAJO_VALOR">Bajo Valor</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Add />}
                sx={{ height: 40 }}
                onClick={() => alert('Módulo de Nuevo Proceso - Próximamente')}
              >
                Nueva Solicitud
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabla de Solicitudes */}
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              📋 Solicitudes de Suministro ({solicitudesFiltradas.length})
            </Typography>
          </Box>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>SAP</strong></TableCell>
                  <TableCell><strong>Proceso</strong></TableCell>
                  <TableCell><strong>Área</strong></TableCell>
                  <TableCell><strong>Tipo</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell><strong>Fecha</strong></TableCell>
                  <TableCell><strong>Solicitante</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {solicitudesFiltradas.map((solicitud) => (
                  <TableRow 
                    key={solicitud.id}
                    hover
                    sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {solicitud.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="primary">
                        {solicitud.numeroSap || 'Pendiente'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {solicitud.nombreProceso}
                      </Typography>
                    </TableCell>
                    <TableCell>{solicitud.areaSolicitante}</TableCell>
                    <TableCell>
                      <Chip 
                        label={solicitud.tipoProceso.replace('_', ' ')}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={formatearEstado(solicitud.estadoActual)} 
                        color={getColorEstado(solicitud.estadoActual)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(solicitud.fechaSolicitud).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell>{solicitud.solicitante}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Información de los 8 Módulos */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            🔧 Los 8 Módulos del Sistema - Estado Operativo
          </Typography>
          <Grid container spacing={2}>
            {[
              '1. Registro de Solicitudes',
              '2. Validación y Revisión Administrativa', 
              '3. Seguimiento a Compras y Contratación',
              '4. Visualización y Análisis en Tiempo Real',
              '5. Actualización y Control de Información',
              '6. Alertas y Notificaciones',
              '7. Cierre y Evaluación del Proceso',
              '8. Administración y Seguridad'
            ].map((modulo, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                  <CheckCircle color="success" sx={{ mr: 1 }} />
                  <Typography variant="body2">{modulo}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
          
          <Box sx={{ mt: 3, p: 2, backgroundColor: '#e8f5e8', borderRadius: 1 }}>
            <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircle color="success" sx={{ mr: 1 }} />
              <strong>Dashboard 100% Operativo - Listo para entrega Noviembre 2024</strong>
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              • Reportes trimestrales automatizados ✅<br/>
              • Trazabilidad completa de procesos ✅<br/>
              • Sistema de alertas funcionando ✅<br/>
              • Análisis en tiempo real activo ✅
            </Typography>
          </Box>
        </Paper>
      </Container>
    </div>
  );
};

export default App;