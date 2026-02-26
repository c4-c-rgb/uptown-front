import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import HeaderComponent from '../../../components/headerAdmin/header';
import FooterComponent from '../../../components/footerAdmin/adminFooter';
import FloatingBackground from '../../../components/shared/FloatingBackground';
import { cancelarReserva } from '../../client/components/api/reservasApi';
import "./reservas.scss";
import API_BASE_URL from '../../../config/api';

// Base URL para API

const BASE_URL = API_BASE_URL;

const Reservas = () => {
    const navigate = useNavigate();
    const [mostrarModal, setMostrarModal] = useState(false);
    const [cerrandoModal, setCerrandoModal] = useState(false);
    const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
    const [reservas, setReservas] = useState([]);
    const [rawReservas, setRawReservas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [servicesMap, setServicesMap] = useState({});
    const [stylistsMap, setStylistsMap] = useState({});
    const [usersMap, setUsersMap] = useState({});
    const [canceladasCount, setCanceladasCount] = useState(0);

    // Abrir modal con datos de la reserva
    const abrirModal = (reserva) => {
        setReservaSeleccionada(reserva);
        setMostrarModal(true);
    };

    // Función para cerrar el modal
    const cerrarModal = () => {
        // Animación de salida antes de desmontar
        setCerrandoModal(true);
        setTimeout(() => {
            setMostrarModal(false);
            setReservaSeleccionada(null);
            setCerrandoModal(false);
        }, 250); // Tiempo debe coincidir con CSS
    };

    // Nota: Por ahora el modal es solo de visualización; se puede extender para editar/actualizar.

    // Cancelar (eliminar) reserva si backend lo permite
    const eliminarReserva = async (id) => {
        if (!id) return;
        if (!window.confirm('¿Está seguro que desea cancelar esta reserva?')) return;
        try {
            await cancelarReserva(id);
            await cargarReservas();
            alert('Reserva cancelada correctamente');
        } catch (e) {
            alert('No se pudo cancelar la reserva');
        }
    };

    // Helpers de mapeo seguros
    const safeStr = (v) => (v === null || v === undefined) ? '' : String(v);
    const joinName = (obj) => {
        if (!obj || typeof obj !== 'object') return '';
        const f = safeStr(obj.first_name || obj.nombre || obj.name);
        const l = safeStr(obj.last_name || obj.apellido || obj.surname || obj.lastName);
        return (f || l) ? `${f} ${l}`.trim() : (safeStr(obj.full_name || obj.displayName || ''));
    };
    const pickServicio = (r) => {
        if (!r) return '';
        if (typeof r.servicio === 'string') return r.servicio;
        if (r.servicio && typeof r.servicio === 'object') return r.servicio.name || r.servicio.nombre || '';
        return r.servicio_nombre || r.service_name || r.name || '';
    };
    const pickCliente = (r) => {
        if (!r) return '';
        if (typeof r.cliente === 'string') return r.cliente;
        if (r.cliente && typeof r.cliente === 'object') return joinName(r.cliente) || r.cliente.email || '';
        return r.cliente_nombre || r.nombre_cliente || r.nombre || '';
    };
    const pickEstilista = (r) => {
        if (!r) return '';
        const k = r.estilista || r.stylist || r.empleado || r.employee;
        if (typeof k === 'string') return k;
        if (k && typeof k === 'object') return joinName(k) || k.email || '';
        return r.estilista_nombre || r.stylist_name || '';
    };
    const splitDateTime = (val) => {
        if (!val) return { date: '', time: '' };
        // soporta "YYYY-MM-DD", "YYYY-MM-DDTHH:mm" y "HH:mm"
        const s = String(val);
        if (s.includes('T')) {
            const [d, t] = s.split('T');
            return { date: d, time: (t || '').slice(0, 5) };
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
            return { date: s, time: '' };
        }
        if (/^\d{2}:\d{2}/.test(s)) {
            return { date: '', time: s.slice(0, 5) };
        }
        return { date: s, time: '' };
    };

    // Carga de reservas desde backend (todos los estilistas)
    const cargarReservas = async () => {
        setLoading(true);
        setError('');
        try {
            // Probar rutas comunes en backend
            const candidates = ['/reservas/admin', '/reservas', '/api/reservas'];
            let data = null;
            for (const path of candidates) {
                try {
                    const res = await fetch(`${BASE_URL}${path}`, { credentials: 'include' });
                    if (res.status === 404) continue;
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const json = await res.json();
                    if (Array.isArray(json)) { data = json; break; }
                    if (Array.isArray(json?.data)) { data = json.data; break; }
                } catch (_) { continue; }
            }
            const list = Array.isArray(data) ? data : [];
            setRawReservas(list);
        } catch (e) {
            setError('No se pudieron cargar las reservas');
            setRawReservas([]);
        } finally {
            setLoading(false);
        }
    };

    // Cargar catálogos para mapear nombres y luego reservas
    useEffect(() => {
        const cargarCatalogos = async () => {
            try {
                // servicios
                try {
                    const res = await fetch(`${BASE_URL}/services`);
                    if (res.ok) {
                        const data = await res.json();
                        const map = {};
                        (Array.isArray(data) ? data : []).forEach(s => { map[s.id] = s.name || s.nombre || `Servicio ${s.id}`; });
                        setServicesMap(map);
                    }
                } catch { }
                // estilistas
                try {
                    const res = await fetch(`${BASE_URL}/api/users/estilistas`);
                    if (res.ok) {
                        const data = await res.json();
                        const map = {};
                        (Array.isArray(data) ? data : []).forEach(u => { map[u.id] = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || `Empleado ${u.id}`; });
                        setStylistsMap(map);
                    }
                } catch { }
                // usuarios/clientes
                try {
                    const res = await fetch(`${BASE_URL}/api/users`);
                    if (res.ok) {
                        const data = await res.json();
                        const map = {};
                        (Array.isArray(data) ? data : []).forEach(u => { map[u.id] = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || `Usuario ${u.id}`; });
                        setUsersMap(map);
                    }
                } catch { }
            } catch { }
            // una vez cargados los catálogos, cargar reservas (se mapearán al llegar mapas)
            await cargarReservas();
        };
        cargarCatalogos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Derivar reservas ya mapeadas cuando existan rawReservas y mapas
    useEffect(() => {
        const rawList = Array.isArray(rawReservas) ? rawReservas : [];
        // Contar canceladas para mostrar en un badge informativo en Admin
        const canc = rawList.filter((r) => String(r.state || r.estado || r.statusReservation || r.status || '').toLowerCase() === 'cancelada').length;
        setCanceladasCount(canc);
        const mapped = rawList
            .map((r, i) => {
                const id = r.id ?? r.reserva_id ?? `res-${i}`;
                // nombres por mapa o por campos alternos
                const servicio = (r.idService && servicesMap[r.idService])
                    ? servicesMap[r.idService]
                    : (pickServicio(r) || '—');
                const estilista = (r.idEmployee && stylistsMap[r.idEmployee])
                    ? stylistsMap[r.idEmployee]
                    : (pickEstilista(r) || '—');
                const cliente = (r.idUser && usersMap[r.idUser])
                    ? usersMap[r.idUser]
                    : (pickCliente(r) || `Usuario ${r.idUser || ''}`.trim());
                // fecha/hora desde dateReservation o campos clásicos
                const { date: fechaRes, time: horaRes } = splitDateTime(r.dateReservation);
                const { date: fechaFromInicio, time: horaInicioFromInicio } = splitDateTime(r.hora_inicio || r.inicio || r.start);
                const { date: fechaCampo } = splitDateTime(r.fecha || r.dia);
                const { time: horaFinFromFin } = splitDateTime(r.hora_fin || r.fin || r.end);
                const fecha = fechaCampo || fechaRes || fechaFromInicio || '';
                const hora_inicio = horaRes || (r.hora && splitDateTime(r.hora).time) || horaInicioFromInicio || '';
                const hora_fin = horaFinFromFin || '';
                // En Admin: mostrar solo 'Cancelada' o 'Confirmada' para evitar confusión
                const rawState = String(r.state || r.estado || r.statusReservation || r.status || '').toLowerCase();
                const estado = rawState === 'cancelada' ? 'Cancelada' : 'Confirmada';
                return { id, cliente, fecha, hora_inicio, hora_fin, servicio, estilista, estado };
            });
        setReservas(mapped);
    }, [rawReservas, servicesMap, stylistsMap, usersMap]);

    // Estados para filtrar reservas en Admin
    const estados = ['Todas', 'Confirmada', 'Cancelada'];
    const [filtroEstado, setFiltroEstado] = useState('Todas');

    // Evitar carga doble: la carga inicial de reservas se hace al terminar los catálogos

    // Filtrar por estado
    const reservasFiltradas = filtroEstado === 'Todas'
        ? reservas
        : reservas.filter(r => (r.estado || '').toLowerCase() === filtroEstado.toLowerCase());

    // Cerrar con tecla ESC y bloquear scroll del body
    useEffect(() => {
        if (mostrarModal) {
            const onKeyDown = (e) => {
                if (e.key === 'Escape') {
                    cerrarModal();
                }
            };
            document.addEventListener('keydown', onKeyDown);
            const prevOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.removeEventListener('keydown', onKeyDown);
                document.body.style.overflow = prevOverflow;
            };
        }
    }, [mostrarModal]);

    return (
        <div className="admin-reservas-page">
            <FloatingBackground />
            <style>{`
                @media (max-width: 768px) {
                  .reservas-management .table-container .actions-cell .btn { width: 32px; height: 32px; }
                  .reservas-management .table-container table thead th:nth-child(1) { display: none; }
                  .reservas-management .table-container table tbody td:nth-child(1) { display: none; }
                  .reservas-management .btn.regresar { padding: 6px 10px; font-size: 0.85rem; border-radius: 8px; }
                  .reservas-management .actions-container .btn { padding: 6px; font-size: 0.85rem; }
                }
                @media (max-width: 576px) {
                  .reservas-management .btn.regresar { padding: 5px 8px; font-size: 0.8rem; }
                  .reservas-management .actions-container .btn { padding: 5px; font-size: 0.8rem; }
                }
            `}</style>
            <HeaderComponent />
            <section className="reservas-management">
                <div className="center-wrap">

                    <div className="card header-card mb-3" style={{ padding: '1rem 1.5rem' }}>
                        <div className="d-flex justify-content-between align-items-center flex-nowrap">
                            <h1 className="page-title m-0" style={{ width: 'auto', flexShrink: 1 }}>Gestión de Reservas</h1>
                            <button
                                className="btn btn-back"
                                title="Volver"
                                style={{ whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '1rem' }}
                                onClick={() => navigate('/dashboard-admin')}
                            >
                                Volver
                            </button>
                        </div>
                    </div>

                    <div className="filters-container">
                        <div className="d-flex align-items-center gap-3 mb-2">
                            <span className="badge bg-secondary" title="Reservas canceladas (ocultas en admin)">Canceladas: {canceladasCount}</span>
                        </div>
                        <div className="form-group">
                            <label htmlFor="estado">Filtrar por estado</label>
                            <select
                                id="estado"
                                className="form-select w-auto"
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                            >
                                {estados.map((estado) => (
                                    <option key={estado} value={estado}>{estado}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading && <div className="alert alert-info">Cargando reservas...</div>}
                    {error && <div className="alert alert-danger">{error}</div>}

                    <div className="table-container">
                        <div className="table-responsive">
                            <table className="table align-middle">
                                <thead className="table-dark text-center">
                                    <tr>
                                        <th>ID</th>
                                        <th>Cliente</th>
                                        <th>Fecha</th>
                                        <th>Hora</th>
                                        <th>Servicio</th>
                                        <th>Estilista</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reservasFiltradas.map((reserva) => (
                                        <tr key={reserva.id} className={
                                            reserva.estado === 'Confirmada' ? 'table-success' :
                                                reserva.estado === 'Pendiente' ? 'table-warning' :
                                                    (reserva.estado === 'Cancelada' ? 'table-danger' : '')
                                        }>
                                            <td className="text-center">{reserva.id}</td>
                                            <td>{reserva.cliente}</td>
                                            <td>{reserva.fecha}</td>
                                            <td>{reserva.hora_inicio}{reserva.hora_fin ? ` - ${reserva.hora_fin}` : ''}</td>
                                            <td>{reserva.servicio}</td>
                                            <td>{reserva.estilista}</td>
                                            <td className="text-center">
                                                <span className={
                                                    `badge ${reserva.estado === 'Confirmada' ? 'bg-success' :
                                                        reserva.estado === 'Pendiente' ? 'bg-warning text-dark' :
                                                            'bg-danger'
                                                    }`
                                                }>
                                                    {reserva.estado}
                                                </span>
                                            </td>
                                            <td className="actions-cell">
                                                <div className="actions-container">
                                                    <button
                                                        className="btn btn-primary"
                                                        onClick={() => abrirModal(reserva)}
                                                        title="Ver"
                                                    >
                                                        <i className="fa-solid fa-eye"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-danger"
                                                        onClick={() => eliminarReserva(reserva.id)}
                                                        title="Cancelar"
                                                    >
                                                        <i className="fa-solid fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            {/* Modal para ver reserva - USAMOS PORTAL PARA SACARLO DEL STACKING CONTEXT */}
            {mostrarModal && reservaSeleccionada && createPortal(
                <div className={`modal-overlay ${cerrandoModal ? 'closing' : ''}`} onClick={cerrarModal}>
                    <div className={`modal-contenido ${cerrandoModal ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <button onClick={cerrarModal} className="icon-close">
                            <i className="fas fa-times"></i>
                        </button>
                        <h2>Detalle de Reserva</h2>
                        <div className='editValues'>
                            <label>Cliente</label>
                            <input type="text" value={reservaSeleccionada.cliente || ''} readOnly />
                        </div>
                        <div className='editValues'>
                            <label>Servicio</label>
                            <input type="text" value={reservaSeleccionada.servicio || ''} readOnly />
                        </div>
                        <div className='editValues'>
                            <label>Estilista</label>
                            <input type="text" value={reservaSeleccionada.estilista || ''} readOnly />
                        </div>
                        <div className='editValues'>
                            <label>Fecha</label>
                            <input type="date" value={reservaSeleccionada.fecha || ''} readOnly />
                        </div>
                        <div className='editValues'>
                            <label>Hora</label>
                            <input type="text" value={`${reservaSeleccionada.hora_inicio || ''}${reservaSeleccionada.hora_fin ? ` - ${reservaSeleccionada.hora_fin}` : ''}`} readOnly />
                        </div>
                        <div className='editValues'>
                            <label>Estado</label>
                            <input type="text" value={reservaSeleccionada.estado || ''} readOnly />
                        </div>
                        <div className="modal-buttons">
                            <button onClick={cerrarModal} className="btn-cancelar">Cerrar</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <FooterComponent />
        </div>
    );
};

export default Reservas;
