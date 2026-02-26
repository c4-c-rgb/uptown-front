
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderComponent from '../../../../components/headerClient/Header';
import Footer from '../../../../components/footerClient/Footer';
import FloatingBackground from '../../../../components/shared/FloatingBackground';
import './MisReservas.scss';
import { listarReservasCliente, cancelarReserva, actualizarEstadoReserva } from '../api/reservasApi';
import { listarEstilistas } from '../../../admin/dashboardSchedules/api';

const MisReservas = () => {
  const navigate = useNavigate();
  const [reservas, setReservas] = useState([]);
  const [view, setView] = useState('upcoming'); // 'upcoming' | 'history'
  const [loading, setLoading] = useState(true);
  const [estilistas, setEstilistas] = useState([]);

  // Datos de ejemplo del cliente - en una aplicación real vendrían de un contexto o props
  const clientName = "Juan Pérez";
  const clientEmail = "juan.perez@ejemplo.com";

  useEffect(() => {
    const fetchReservas = async () => {
      try {
        setLoading(true);
        // cargar estilistas para mostrar nombre en la tabla
        try {
          const lista = await listarEstilistas();
          const mapped = (Array.isArray(lista) ? lista : []).map(u => ({ id: String(u.id), name: `${u.first_name || ''} ${u.last_name || ''} `.trim() }));
          setEstilistas(mapped);
        } catch (_) { }
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        const email = user?.email || undefined;
        const clienteId = user?.id ? String(user.id) : undefined;
        const data = await listarReservasCliente({ email, clienteId });
        const list = Array.isArray(data) ? data : [];

        // Filtro por cliente en frontend si el backend devolvió todo
        const belongsToUser = (r) => {
          const rEmail = r.email || r.cliente_email || r.correo || r.cliente?.email;
          const rId = String(r.clienteId || r.idCliente || r.cliente_id || r.cliente?.id || '');
          if (email && rEmail && String(rEmail).toLowerCase() === String(email).toLowerCase()) return true;
          if (clienteId && rId && rId === String(clienteId)) return true;
          // si no hay campos identificables, no filtramos
          return !email && !clienteId;
        };

        let filtered = list.filter(belongsToUser);
        // Si el filtrado por usuario deja 0 pero el backend devolvió elementos, usar lista completa como fallback
        if (filtered.length === 0 && list.length > 0) {
          filtered = list;
        }

        // Normalizar campos comunes con tolerancia a nombres alternativos
        const pick = (obj, keys) => keys.find(k => obj[k] !== undefined);
        const toYMD = (d) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y} -${m} -${day} `;
        };
        const normalizeYMD = (val) => {
          if (!val) return '';
          const s = String(val);
          if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
          try {
            const d = new Date(s);
            return toYMD(d);
          } catch {
            return s;
          }
        };

        const mapped = filtered.map((r) => {
          const fechaKey = pick(r, ['fecha', 'date', 'dia']);
          const hiKey = pick(r, ['hora_inicio', 'horaInicio', 'start', 'start_time', 'hora']);
          const hfKey = pick(r, ['hora_fin', 'horaFin', 'end', 'end_time']);
          // incluir 'state' (backend) además de alias
          const estadoKey = pick(r, ['estado', 'status', 'state']);
          const estilistaKey = pick(r, ['id_estilista', 'estilistaId', 'idEstilista', 'stylist_id']);
          const servicioKey = pick(r, ['id_servicio', 'servicioId', 'idServicio']);
          const idVal = r.id ?? r.reservaId ?? r.uuid ?? `${(fechaKey && r[fechaKey]) || 'res'} -${Math.random().toString(36).slice(2, 8)} `;
          const hiVal = String(r[hiKey] ?? '').slice(0, 5);
          const hfVal = String(r[hfKey] ?? hiVal).slice(0, 5);
          // Auto-estado en frontend: si hay fecha/hora futura => confirmada; si ya pasó => no disponible
          const rawFecha = normalizeYMD(r[fechaKey] ?? r.dateReservation ?? '');
          let estadoVal = (r[estadoKey] || 'pendiente');
          const estadoLc = String(estadoVal).toLowerCase();
          // Si backend dice 'cancelada', respetar y no sobreescribir
          if (estadoLc !== 'cancelada') {
            if (rawFecha && hiVal) {
              const dt = new Date(`${rawFecha}T${hiVal}:00`);
              const now = new Date();
              if (dt.getTime && dt.getTime() > now.getTime()) {
                estadoVal = 'confirmada';
              } else if (dt.getTime && dt.getTime() <= now.getTime()) {
                estadoVal = 'no disponible';
              }
            }
          } else {
            estadoVal = 'cancelada';
          }
          return {
            id: idVal,
            fecha: rawFecha,
            hora_inicio: hiVal,
            hora_fin: hfVal,
            estado: estadoVal,
            id_estilista: r[estilistaKey] ?? '—',
            id_servicio: r[servicioKey] ?? null,
          };
        });

        setReservas(mapped);

        // Persistir estados en backend de forma asíncrona (no bloqueante)
        try {
          const ops = mapped.map(async (res) => {
            if (!res?.id || !res?.fecha || !res?.hora_inicio) return;
            const dt = new Date(`${res.fecha}T${res.hora_inicio}:00`);
            const now = new Date();
            const desired = dt > now ? 'confirmada' : 'no disponible';
            const current = String(res.estado || '').toLowerCase();
            if ((desired === 'confirmada' && current !== 'confirmada') || (desired === 'no disponible' && current !== 'no disponible')) {
              try {
                await actualizarEstadoReserva({ reservaId: res.id, estado: desired });
              } catch (_) {
                // silencioso: si falla, no bloquea la UI
              }
            }
          });
          // Ejecutar en background sin await global
          Promise.allSettled(ops);
        } catch (_) { }
      } catch (e) {
        console.error('Error listando reservas del cliente', e);
        setReservas([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReservas();
  }, []);

  const obtenerNombreEstilista = (id) => {
    const s = estilistas.find(x => String(x.id) === String(id));
    return s ? s.name : id;
  };

  const handleCancelarReserva = async (id) => {
    if (!window.confirm('¿Estás seguro que deseas cancelar esta reserva?')) return;
    try {
      await cancelarReserva(id);
      setReservas(prev => prev.filter(r => r.id !== id));
      alert('La reserva ha sido cancelada con éxito.');
    } catch (e) {
      console.error('Error cancelando reserva', e);
      alert('No se pudo cancelar la reserva. Intenta nuevamente.');
    }
  };

  const handleVolverDashboard = () => {
    navigate('/dashboard-client');
  };

  // Función para formatear la fecha
  const formatearFecha = (fechaStr) => {
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    const [y, m, d] = String(fechaStr || '').split('-').map(Number);
    const dt = new Date(y || 1970, (m || 1) - 1, d || 1);
    return dt.toLocaleDateString('es-ES', opciones);
  };

  // Split into upcoming and history
  const upcoming = reservas.filter(r => String(r.estado).toLowerCase() !== 'no disponible' && String(r.estado).toLowerCase() !== 'cancelada');
  const history = reservas.filter(r => String(r.estado).toLowerCase() === 'no disponible' || String(r.estado).toLowerCase() === 'cancelada');

  return (
    <div className="mis-reservas-page">
      <FloatingBackground />
      <HeaderComponent clientName={clientName} clientEmail={clientEmail} />
      <section className='content-wrap'>
        <div className='container'>
          <div className="header-bar">
            <div className="hb-spacer"></div>
            <h1>Mis Reservas</h1>
            <button
              className="back-to-dashboard-emp"
              onClick={handleVolverDashboard}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Volver
            </button>
          </div>
          <div className="reservas-tabs mb-3">
            <button className={`tab - btn ${view === 'upcoming' ? 'active' : ''} `} onClick={() => setView('upcoming')}>
              Próximas <span className="badge bg-primary ms-2">{upcoming.length}</span>
            </button>
            <button className={`tab - btn ${view === 'history' ? 'active' : ''} `} onClick={() => setView('history')}>
              Historial <span className="badge bg-secondary ms-2">{history.length}</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-2">Cargando tus reservas...</p>
            </div>
          ) : (view === 'upcoming' ? upcoming.length > 0 : history.length > 0) ? (
            <div className="table-responsive">
              <table className="table table-hover reservation-table">
                <thead>
                  <tr>
                    <th>Estilista</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {(view === 'upcoming' ? upcoming : history).map(reserva => (
                    <tr key={reserva.id}>
                      <td>{obtenerNombreEstilista(reserva.id_estilista)}</td>
                      <td>{formatearFecha(reserva.fecha)}</td>
                      <td>{reserva.hora_inicio} - {reserva.hora_fin}</td>
                      <td>
                        <span className={`status-badge ${String(reserva.estado).toLowerCase() === 'confirmada' ? 'status-confirmed' :
                          String(reserva.estado).toLowerCase() === 'no disponible' ? 'status-unavailable' :
                            String(reserva.estado).toLowerCase() === 'cancelada' ? 'status-cancelled' :
                              'status-pending'
                          }`}>
                          {reserva.estado}
                        </span>
                      </td>
                      <td>
                        {String(reserva.estado).toLowerCase() === 'no disponible' ? (
                          <span className="text-muted">Sin acciones</span>
                        ) : (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleCancelarReserva(reserva.id)}
                          >
                            <i className="bi bi-x-circle me-1"></i>
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : view === 'upcoming' ? (
            <div className="no-reservas text-center py-5">
              <i className="bi bi-calendar-x mb-3" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
              <h3>No tienes reservas activas</h3>
              <p>Realiza una reserva para comenzar a disfrutar de nuestros servicios.</p>
              <button
                className="btn btn-primary mt-3"
                onClick={() => navigate('/crear-reserva-cliente')}
              >
                <i className="bi bi-calendar-plus me-2"></i>
                Hacer una Reserva
              </button>
            </div>
          ) : (
            <div className="no-reservas text-center py-5">
              <i className="bi bi-archive mb-3" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
              <h3>No hay historial</h3>
              <p>Las reservas pasadas o canceladas aparecerán aquí.</p>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default MisReservas;
