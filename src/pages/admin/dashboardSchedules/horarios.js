import React from 'react';
import DatePicker from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { Link } from 'react-router-dom';
import { listarHorarios, crearHorario, actualizarHorario, eliminarHorario, listarEstilistas } from './api';
import HeaderComponent from '../../../components/headerAdmin/header';
import FooterComponent from '../../../components/footerAdmin/adminFooter';
import FloatingBackground from '../../../components/shared/FloatingBackground';
import "./horarios.scss";

// Días de la semana en español (claves en inglés para compatibilidad)
const DIAS_ES = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
];

// La lista de estilistas ahora se carga desde backend

// Plantilla de semana por defecto
const semanaVacia = () => ({
    monday: { rest: false, start: '09:00', end: '18:00' },
    tuesday: { rest: false, start: '09:00', end: '18:00' },
    wednesday: { rest: false, start: '09:00', end: '18:00' },
    thursday: { rest: false, start: '09:00', end: '18:00' },
    friday: { rest: false, start: '09:00', end: '18:00' },
    saturday: { rest: true, start: '09:00', end: '14:00' },
    sunday: { rest: true, start: '09:00', end: '14:00' },
});

// Estado inicial del formulario
const formularioInicial = {
    stylistId: '',
    type: 'weekly',
    weekStart: '',
    month: '',
    startTime: '09:00', // Default start time for monthly
    endTime: '18:00',   // Default end time for monthly
    weekTemplate: semanaVacia(),
    extraRestDays: '',
};

// Helper: obtener fecha local en formato YYYY-MM-DD
const aYMDLocal = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper: parsear YYYY-MM-DD a Date (tiempo local) para react-datepicker
const deYMD = (s) => {
    if (!s) return null;
    const [y, m, d] = s.split('-').map(Number);
    const date = new Date(y, (m || 1) - 1, d || 1);
    // guard against invalid inputs
    return isNaN(date.getTime()) ? null : date;
};

// (Option B) No Monday alignment; the selected date is used as-is, constrained to today or later.

// Mapeadores entre Frontend (EN) y Backend (ES)
const mapFEtoBE = (item) => ({
    idEstilista: item.stylistId != null ? String(item.stylistId) : '',
    tipo: item.type || 'weekly',
    inicioSemana: item.weekStart,
    plantillaSemana: item.weekTemplate,
});

const mapBEtoFE = (item) => ({
    id: item.id,
    stylistId: item.idEstilista != null ? String(item.idEstilista) : '',
    type: item.tipo,
    weekStart: item.inicioSemana,
    weekTemplate: item.plantillaSemana,
});

const ManageSchedules = () => {
    const [estilistas, setEstilistas] = React.useState([]);
    const [elementos, setElementos] = React.useState([]);
    const [formulario, setFormulario] = React.useState({ ...formularioInicial, weekStart: aYMDLocal(new Date()), type: 'weekly' });
    const [idEditando, setIdEditando] = React.useState(null);
    const [filtroEstilista, setFiltroEstilista] = React.useState('');
    const [view, setView] = React.useState('upcoming'); // 'upcoming' | 'history'
    // Fecha visual seleccionada por el usuario en el calendario (no normalizada)
    const [fechaVisual, setFechaVisual] = React.useState(null);

    React.useEffect(() => {
        // Cargar horarios desde el backend
        (async () => {
            try {
                const data = await listarHorarios();
                setElementos((data || []).map(mapBEtoFE));
            } catch (error) {
                console.error('Error al cargar horarios desde el servidor', error);
            }
        })();
    }, []);

    React.useEffect(() => {
        // Cargar estilistas reales desde backend
        (async () => {
            try {
                const data = await listarEstilistas();
                const mapped = (data || []).map(u => ({
                    id: String(u.id),
                    name: `${u.first_name} ${u.last_name}`.trim(),
                    service: u.specialty || u.bio || 'Estilista General'
                }));
                setEstilistas(mapped);
            } catch (error) {
                console.error('Error al cargar estilistas', error);
            }
        })();
    }, []);

    // Asegurar que al montar se precargue la fecha de hoy
    React.useEffect(() => {
        const hoy = aYMDLocal(new Date());
        setFormulario(prev => {
            if (!prev.weekStart || prev.weekStart < hoy) {
                return { ...prev, weekStart: hoy };
            }
            return prev;
        });
    }, []);

    const hoyCadena = aYMDLocal(new Date());

    const manejarCambioFormulario = (e) => {
        const { name, value } = e.target;
        const nuevoEstado = { ...formulario, [name]: value };

        if (name === 'type' && value === 'weekly' && !nuevoEstado.weekTemplate) {
            nuevoEstado.weekTemplate = formularioInicial.weekTemplate;
        }

        // Evitar seleccionar una fecha anterior a hoy
        if (name === 'weekStart') {
            const hoy = aYMDLocal(new Date());
            if (value && value < hoy) {
                nuevoEstado.weekStart = hoy;
            }
        }

        setFormulario(nuevoEstado);
    };

    const manejarCambioPlantillaSemanal = (dia, campo, valor) => {
        setFormulario(prev => ({
            ...prev,
            weekTemplate: {
                ...prev.weekTemplate,
                [dia]: { ...prev.weekTemplate[dia], [campo]: valor },
            },
        }));
    };

    const manejarEnviar = async (e) => {
        e.preventDefault();
        if (!formulario.stylistId) {
            alert('Por favor, selecciona un estilista.');
            return;
        }

        // Validar fecha
        if (!formulario.weekStart) {
            alert('Por favor, selecciona la fecha de inicio de la semana.');
            return;
        }
        const hoy = aYMDLocal(new Date());
        if (formulario.weekStart < hoy) {
            alert('La fecha de inicio de la semana no puede ser anterior a hoy.');
            return;
        }

        // Normalizamos internamente a lunes; el usuario puede elegir cualquier día libre

        // Persistir siempre como semanal (en backend 'tipo')
        const payloadFE = { ...formulario, type: 'weekly' };
        try {
            if (idEditando) {
                await actualizarHorario(idEditando, mapFEtoBE(payloadFE));
            } else {
                const creado = await crearHorario(mapFEtoBE(payloadFE));
                // opcional: usar respuesta
                alert('Horario creado con éxito');
            }
            // Recargar lista desde backend para asegurar consistencia
            const data = await listarHorarios();
            setElementos((data || []).map(mapBEtoFE));
            setFormulario({ ...formularioInicial, weekStart: aYMDLocal(new Date()), type: 'weekly' });
            setIdEditando(null);
        } catch (error) {
            console.error('Error al guardar horario', error);
            alert('Ocurrió un error al guardar el horario. Intenta nuevamente.');
        }
    };

    const manejarEditar = (id) => {
        const elementoAEditar = elementos.find(item => item.id === id);
        if (elementoAEditar) {
            if (elementoAEditar.type && elementoAEditar.type !== 'weekly') {
                alert('Solo se pueden editar horarios semanales.');
                return;
            }
            const estadoFormulario = {
                ...formularioInicial,
                ...elementoAEditar,
                weekTemplate: elementoAEditar.weekTemplate || formularioInicial.weekTemplate,
            };
            setFormulario(estadoFormulario);
            setIdEditando(id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const manejarEliminar = async (id) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este horario?')) return;
        try {
            await eliminarHorario(id);
            // refrescar lista
            const data = await listarHorarios();
            setElementos((data || []).map(mapBEtoFE));
        } catch (error) {
            console.error('Error al eliminar horario', error);
            alert('No se pudo eliminar el horario.');
        }
    };

    const manejarCancelarEdicion = () => {
        setFormulario({ ...formularioInicial, weekStart: aYMDLocal(new Date()), type: 'weekly' });
        setIdEditando(null);
    };

    const obtenerNombreEstilista = (id) => estilistas.find(s => s.id === id)?.name || 'N/A';
    const obtenerServicioEstilista = (id) => estilistas.find(s => s.id === id)?.service || '';

    // Solo mostrar elementos semanales y ordenar por fecha
    const elementosSemanales = elementos.filter(item => item.type === 'weekly');
    const elementosFiltrados = filtroEstilista
        ? elementosSemanales.filter(item => item.stylistId === filtroEstilista)
        : elementosSemanales;
    const elementosOrdenados = [...elementosFiltrados].sort((a, b) => {
        const av = a.weekStart || '9999-12-31';
        const bv = b.weekStart || '9999-12-31';
        return av.localeCompare(bv);
    });

    // Split into upcoming and history based on week range
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const isPastWeek = (item) => {
        if (!item.weekStart) return false;
        const start = new Date(`${item.weekStart}T00:00:00`);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return end < hoy;
    };
    const upcoming = elementosOrdenados.filter(i => !isPastWeek(i));
    const history = elementosOrdenados.filter(i => isPastWeek(i));

    const obtenerDiasDescanso = (item) => {
        if (item.type === 'weekly') {
            const restDays = Object.entries(item.weekTemplate || {})
                .filter(([, day]) => day.rest)
                .map(([dayKey]) => DIAS_ES.find(d => d.key === dayKey)?.label)
                .filter(Boolean)
                .join(', ');
            return restDays || 'Ninguno';
        } else if (item.type === 'monthly') {
            return item.extraRestDays || 'Ninguno';
        }
        return 'N/A';
    };

    const formularioSeguro = {
        ...formulario,
        weekTemplate: formulario.weekTemplate || formularioInicial.weekTemplate,
    };

    // Inicializar fecha visual a partir de weekStart o hoy
    React.useEffect(() => {
        if (!fechaVisual) {
            setFechaVisual(deYMD(formularioSeguro.weekStart) || new Date());
        }
    }, [formularioSeguro.weekStart, fechaVisual]);

    // Ya no bloqueamos toda la semana por existencia; se bloquearán solo los días ya asignados.

    // Helpers para normalizar a lunes y sumar días
    const toMonday = (d) => {
        const date = new Date(d);
        date.setHours(12, 0, 0, 0);
        const day = date.getDay();
        const diff = (day + 6) % 7; // 0->6, 1->0 ... convierte lunes=1 a 0
        const monday = new Date(date);
        monday.setDate(date.getDate() - diff);
        monday.setHours(0, 0, 0, 0);
        return monday;
    };
    const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

    // Conjunto de días (YYYY-MM-DD) ya asignados para el estilista (solo días con horario activo)
    const assignedDaySet = React.useMemo(() => {
        if (!formularioSeguro.stylistId) return new Set();
        const set = new Set();
        (elementos || []).forEach(item => {
            if (item.type !== 'weekly') return;
            if (item.stylistId !== formularioSeguro.stylistId) return;
            const start = item.weekStart ? toMonday(new Date(`${item.weekStart}T00:00:00`)) : null;
            if (!start) return;
            const tpl = item.weekTemplate || {};
            const keys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            keys.forEach((k, idx) => {
                const d = tpl[k];
                if (d && !d.rest && d.start && d.end && d.start < d.end) {
                    const dayDate = addDays(start, idx);
                    set.add(aYMDLocal(dayDate));
                }
            });
        });
        return set;
    }, [elementos, formularioSeguro.stylistId]);

    // Conjunto de días (YYYY-MM-DD) marcados como descanso para el estilista (según plantilla de semanas existentes)
    const restDaySet = React.useMemo(() => {
        if (!formularioSeguro.stylistId) return new Set();
        const set = new Set();
        (elementos || []).forEach(item => {
            if (item.type !== 'weekly') return;
            if (item.stylistId !== formularioSeguro.stylistId) return;
            const start = item.weekStart ? toMonday(new Date(`${item.weekStart}T00:00:00`)) : null;
            if (!start) return;
            const tpl = item.weekTemplate || {};
            const keys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            keys.forEach((k, idx) => {
                const d = tpl[k];
                if (d && d.rest) {
                    const dayDate = addDays(start, idx);
                    set.add(aYMDLocal(dayDate));
                }
            });
        });
        return set;
    }, [elementos, formularioSeguro.stylistId]);

    const handleWeekStartChange = (date) => {
        const picked = date || new Date();
        setFechaVisual(picked);
        // Normalizar a lunes para backend, pero manteniendo la selección efectiva de un día libre
        const monday = toMonday(picked);
        const ymdMonday = aYMDLocal(monday);
        setFormulario(prev => ({ ...prev, weekStart: ymdMonday }));
    };

    return (
        <div className="admin-horarios-page">
            <FloatingBackground />
            <style>{`
                @media (max-width: 768px) {
                  .manage-schedules .table-container .actions .btn-icon { width: 32px; height: 32px; }
                  .manage-schedules .table-container table thead th:nth-child(2),
                  .manage-schedules .table-container table tbody td:nth-child(2),
                  .manage-schedules .table-container table thead th:nth-child(4),
                  .manage-schedules .table-container table tbody td:nth-child(4) { display: none; }
                  .manage-schedules .btn.regresar { padding: 6px 10px; font-size: 0.85rem; border-radius: 8px; }
                }
                @media (max-width: 576px) {
                  .manage-schedules .btn.regresar { padding: 5px 8px; font-size: 0.8rem; }
                }
            `}</style>
            <HeaderComponent />
            <main className="manage-schedules">
                <div className="card header-card mb-4" style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem 1.5rem' }}>
                    <div className="d-flex justify-content-between align-items-center flex-nowrap">
                        <h1 className="page-title m-0" style={{ width: 'auto', flexShrink: 1 }}>Gestión de Horarios</h1>
                        <Link to="/dashboard-admin" className="btn btn-back" title="Volver" style={{ whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '1rem' }}>
                            Volver
                        </Link>
                    </div>
                </div>

                {formularioSeguro.stylistId && (
                    <div className="stylist-summary centered-summary">
                        <div className="avatar action-avatar">
                            {obtenerNombreEstilista(formularioSeguro.stylistId).split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                        </div>
                        <div className="info text-center">
                            <div className="name">{obtenerNombreEstilista(formularioSeguro.stylistId)}</div>
                            <div className="service-badge">{obtenerServicioEstilista(formularioSeguro.stylistId)}</div>
                            <div className="meta justify-content-center mt-2">
                                <span className="chip">
                                    <i className="fas fa-calendar-day"></i>
                                    Inicio: {formularioSeguro.weekStart || hoyCadena}
                                </span>
                                <span className="chip">
                                    <i className="fas fa-bed"></i>
                                    Descanso: {obtenerDiasDescanso({ type: 'weekly', weekTemplate: formularioSeguro.weekTemplate })}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="card">
                    <h2>{idEditando ? 'Editar Horario' : 'Crear Nuevo Horario'}</h2>
                    <form onSubmit={manejarEnviar} className="form">
                        <div className="form-group">
                            <label htmlFor="stylistId">Estilista</label>
                            <select name="stylistId" id="stylistId" value={formularioSeguro.stylistId} onChange={manejarCambioFormulario} required>
                                <option value="">Selecciona un Estilista</option>
                                {estilistas.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Tipo de Horario</label>
                            <div className="radio-group">
                                <span style={{ fontWeight: 600 }}>Semanal</span>
                                <input type="hidden" name="type" value="weekly" />
                            </div>
                        </div>

                        {formularioSeguro.type === 'weekly' && (
                            <div className="form-group">
                                <label htmlFor="weekStart">Inicio de la Semana</label>
                                <DatePicker
                                    id="weekStart"
                                    selected={fechaVisual || new Date()}
                                    onChange={handleWeekStartChange}
                                    minDate={new Date()}
                                    dateFormat="dd/MM/yyyy"
                                    locale={es}
                                    placeholderText="Selecciona una fecha"
                                    className="react-datepicker-input"
                                    calendarClassName="calendar--hide-past"
                                    filterDate={(d) => {
                                        const ymd = aYMDLocal(d);
                                        // Solo permitir LUNES que no estén asignados ni en descanso
                                        return d.getDay() === 1 && !assignedDaySet.has(ymd) && !restDaySet.has(ymd);
                                    }}
                                    dayClassName={(d) => {
                                        const ymd = aYMDLocal(d);
                                        if (assignedDaySet.has(ymd)) return 'blocked-day';
                                        if (restDaySet.has(ymd)) return 'rest-day';
                                        return undefined;
                                    }}
                                    renderDayContents={(dayOfMonth, date) => {
                                        const ymd = aYMDLocal(date);
                                        const blocked = assignedDaySet.has(ymd);
                                        const isRest = restDaySet.has(ymd);
                                        const notMonday = date.getDay() !== 1;
                                        return (
                                            <span title={blocked ? 'Día con horario asignado' : (isRest ? 'Día de descanso' : (notMonday ? 'Solo puedes seleccionar lunes' : undefined))}>
                                                {dayOfMonth}
                                            </span>
                                        );
                                    }}
                                />
                                <small className="field-help">Solo puedes seleccionar LUNES libres (por inicio de semana). Los días con horario asignado o de descanso aparecen en gris.</small>
                                <div className="calendar-legend" aria-hidden="false">
                                    <span className="legend-item">
                                        <span className="legend-dot legend-assigned" /> Asignado
                                    </span>
                                    <span className="legend-item">
                                        <span className="legend-dot legend-rest" /> Descanso
                                    </span>
                                    <span className="legend-item" style={{ color: '#6c757d' }}>
                                        Solo LUNES son seleccionables
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Monthly type removed to enforce weekly-only entry */}

                        {formularioSeguro.type === 'weekly' && (
                            <div className="form-group form-group--full-width">
                                <label>Plantilla Semanal</label>
                                <div className="week-template">
                                    <div className="week-header">
                                        <span>Día</span>
                                        <span>Inicio</span>
                                        <span>Fin</span>
                                        <span>Descanso</span>
                                    </div>
                                    {(() => {
                                        const monday = toMonday(deYMD(formularioSeguro.weekStart) || new Date());
                                        return DIAS_ES.map((infoDia, idx) => {
                                            const d = formularioSeguro.weekTemplate[infoDia.key] || { start: '', end: '', rest: false };
                                            const invalid = !d.rest && (!!d.start && !!d.end) ? d.start >= d.end : false;
                                            const dayDate = addDays(monday, idx);
                                            const ymd = aYMDLocal(dayDate);
                                            const assigned = assignedDaySet.has(ymd);
                                            const disabled = d.rest || assigned;
                                            return (
                                                <div key={infoDia.key} className={`day-row${invalid ? ' invalid' : ''}`} style={{ opacity: disabled ? 0.6 : 1 }}>
                                                    <span className="day-label">{infoDia.label}</span>
                                                    <input
                                                        type="time"
                                                        value={d.start}
                                                        onChange={e => manejarCambioPlantillaSemanal(infoDia.key, 'start', e.target.value)}
                                                        disabled={disabled}
                                                        aria-label={`Hora inicio ${infoDia.label}`}
                                                        className={invalid ? 'input-invalid' : ''}
                                                    />
                                                    <input
                                                        type="time"
                                                        value={d.end}
                                                        onChange={e => manejarCambioPlantillaSemanal(infoDia.key, 'end', e.target.value)}
                                                        disabled={disabled}
                                                        aria-label={`Hora fin ${infoDia.label}`}
                                                        className={invalid ? 'input-invalid' : ''}
                                                    />
                                                    <div className="rest-day">
                                                        <input
                                                            type="checkbox"
                                                            id={`rest-${infoDia.key}`}
                                                            checked={d.rest}
                                                            onChange={e => manejarCambioPlantillaSemanal(infoDia.key, 'rest', e.target.checked)}
                                                            disabled={assigned}
                                                        />
                                                        <label htmlFor={`rest-${infoDia.key}`}>Descanso</label>
                                                        {assigned && (
                                                            <span className="muted" style={{ marginLeft: 8 }}>Asignado</span>
                                                        )}
                                                    </div>
                                                    {invalid && (
                                                        <span className="error-hint">Hora inválida: inicio debe ser menor que fin</span>
                                                    )}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        )}

                        {(() => {
                            const monday = toMonday(deYMD(formularioSeguro.weekStart) || new Date());
                            const totalAssigned = DIAS_ES.reduce((acc, _d, idx) => acc + (assignedDaySet.has(aYMDLocal(addDays(monday, idx))) ? 1 : 0), 0);
                            const allAssigned = totalAssigned >= 7;
                            return (
                                <div className="form-actions">
                                    <button type="submit" className="btn btn--primary" disabled={allAssigned}>{idEditando ? 'Actualizar Horario' : 'Guardar Horario'}</button>
                                    {idEditando && <button type="button" className="btn btn--secondary" onClick={manejarCancelarEdicion}>Cancelar</button>}
                                </div>
                            );
                        })()}
                    </form>
                </div>

                <div className="card">
                    <h2>Horarios Existentes</h2>
                    <div className="form-group" style={{ maxWidth: '300px', marginBottom: '1.5rem' }}>
                        <label htmlFor="filterStylist">Filtrar por Estilista</label>
                        <select id="filterStylist" className="form-select w-auto" value={filtroEstilista} onChange={e => setFiltroEstilista(e.target.value)}>
                            <option value="">Todos</option>
                            {estilistas.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="schedules-tabs" style={{ marginBottom: '1rem' }}>
                        <button className={`tab-btn ${view === 'upcoming' ? 'active' : ''}`} onClick={() => setView('upcoming')}>
                            Próximos <span className="badge bg-primary ms-2">{upcoming.length}</span>
                        </button>
                        <button className={`tab-btn ${view === 'history' ? 'active' : ''}`} onClick={() => setView('history')}>
                            Historial <span className="badge bg-secondary ms-2">{history.length}</span>
                        </button>
                    </div>
                    <div className="table-container">
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Estilista</th>
                                        <th>Tipo</th>
                                        <th>Periodo</th>
                                        <th>Horario</th>
                                        <th>Días de Descanso</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(view === 'upcoming' ? upcoming : history).length > 0 ? (view === 'upcoming' ? upcoming : history).map(item => (
                                        <tr key={item.id}>
                                            <td>{obtenerNombreEstilista(item.stylistId)}</td>
                                            <td>{item.type === 'weekly' ? 'Semanal' : 'Mensual'}</td>
                                            <td>
                                                {(() => {
                                                    if (item.type === 'monthly' && item.month) {
                                                        const [year, month] = item.month.split('-');
                                                        const date = new Date(year, month - 1);
                                                        return <><span className="period-label">Mes: </span>{date.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</>;
                                                    }
                                                    if (item.type === 'weekly' && item.weekStart) {
                                                        const startDate = new Date(`${item.weekStart}T00:00:00`);
                                                        const endDate = new Date(startDate);
                                                        endDate.setDate(startDate.getDate() + 6);
                                                        const options = { day: 'numeric', month: 'long' };
                                                        return <><span className="period-label">Desde</span> {startDate.toLocaleDateString('es-ES', options)} <span className="period-label">hasta</span> {endDate.toLocaleDateString('es-ES', options)}</>;
                                                    }
                                                    return 'N/A';
                                                })()}
                                            </td>
                                            <td>
                                                {item.type === 'monthly'
                                                    ? `${item.startTime} - ${item.endTime}`
                                                    : 'Variable'
                                                }
                                            </td>
                                            <td>{obtenerDiasDescanso(item)}</td>
                                            <td className="actions">
                                                {view === 'history' ? (
                                                    <span className="muted">Sin acciones</span>
                                                ) : (
                                                    <>
                                                        <button className="btn-icon edit-btn" onClick={() => manejarEditar(item.id)} title="Editar" disabled={item.type !== 'weekly'}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                                                        </button>
                                                        <button className="btn-icon delete-btn" onClick={() => manejarEliminar(item.id)} title="Eliminar">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a 1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a 1 1 0 00-1 1v6a 1 1 0 102 0V8a 1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                                                {view === 'upcoming' ? 'No hay horarios próximos' : 'No hay historial'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
            <FooterComponent />
        </div>
    );
};

export default ManageSchedules;
