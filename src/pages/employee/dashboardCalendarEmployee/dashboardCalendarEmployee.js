import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../../components/headerEmployee/header';
import Footer from '../../../components/footerEmployee';
import FloatingBackground from '../../../components/shared/FloatingBackground';
import './dashboardCalendarEmployee.scss';
import './calendar.mobile.scss';
import { listarHorarios, listarEstilistas } from '../../admin/dashboardSchedules/api';
import { listarReservasPorEstilistaFecha } from '../../client/components/api/reservasApi';

const CalendarEmployee = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [plantilla, setPlantilla] = useState(null);
    const [inicioSemanaHorario, setInicioSemanaHorario] = useState(null);
    const [horarios, setHorarios] = useState([]);
    const [mostrarDetalles, setMostrarDetalles] = useState(null);
    const [selectedDate, setSelectedDate] = useState(getValidDateString(new Date()));
    const [periodos, setPeriodos] = useState([]);
    const [resolvedStylistId, setResolvedStylistId] = useState(null);

    // Vista mensual
    const [monthAnchorDate, setMonthAnchorDate] = useState(
        () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    );
    const [reservasMonthMap, setReservasMonthMap] = useState({}); // { 'YYYY-MM-DD': count }

    // ---- Read date from URL params (from notifications) ----
    useEffect(() => {
        const dateParam = searchParams.get('date');
        if (dateParam) {
            // Parse the date from URL (format: YYYY-MM-DD)
            const parsedDate = new Date(dateParam + 'T00:00:00');
            if (!isNaN(parsedDate.getTime())) {
                // Set the selected date
                setSelectedDate(dateParam);
                setCurrentDate(parsedDate);
                // Set the month to navigate to the correct month
                setMonthAnchorDate(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1));
            }
        }
    }, [searchParams]);

    // ---- helpers de fecha ----
    function getValidDateString(date) {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        }
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function getValidMonthString(date) {
        const d = new Date(date);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
    }

    function createValidDate(dateString, timeString = '00:00') {
        try {
            const [year, month, day] = dateString.split('-');
            const [hours, minutes] = timeString.split(':').map(n => parseInt(n, 10) || 0);
            const date = new Date(year, month - 1, day, hours, minutes);
            return isNaN(date.getTime()) ? new Date() : date;
        } catch {
            return new Date();
        }
    }

    function normalizeWeekTemplate(src) {
        if (!src || typeof src !== 'object') return src;
        const map = {
            lunes: 'monday',
            martes: 'tuesday',
            miércoles: 'wednesday',
            miercoles: 'wednesday',
            jueves: 'thursday',
            viernes: 'friday',
            sábado: 'saturday',
            sabado: 'saturday',
            domingo: 'sunday',
        };
        const dst = { ...src };
        Object.keys(src).forEach((k) => {
            const key = typeof k === 'string' ? k : String(k);
            const en = map[key.toLowerCase?.() || key] || key;
            if (en !== key) {
                dst[en] = src[key];
                delete dst[key];
            }
        });
        return dst;
    }

    // ---- cargar horarios / periodos ----
    useEffect(() => {
        const cargarHorario = async () => {
            try {
                const userInfo = JSON.parse(sessionStorage.getItem('user')) || {};
                let estilistaId = userInfo?.id ? String(userInfo.id) : null;

                if (!estilistaId && userInfo?.email) {
                    try {
                        const estilistas = await listarEstilistas();
                        const match = (Array.isArray(estilistas) ? estilistas : []).find(e => {
                            const email = (e.email || e.mail || '').toLowerCase();
                            return email && email === String(userInfo.email).toLowerCase();
                        });
                        if (match?.id != null) estilistaId = String(match.id);
                    } catch {
                        // ignore
                    }
                }

                if (!estilistaId && userInfo?.name) {
                    try {
                        const estilistas = await listarEstilistas();
                        const targetName = String(userInfo.name).trim().toLowerCase();
                        const norm = (str) => String(str || '').trim().toLowerCase();
                        const match = (Array.isArray(estilistas) ? estilistas : []).find(e => {
                            const full = `${norm(e.first_name)} ${norm(e.last_name)}`.trim();
                            return full && full === targetName;
                        });
                        if (match?.id != null) estilistaId = String(match.id);
                    } catch {
                        // ignore
                    }
                }

                if (estilistaId) {
                    setResolvedStylistId(estilistaId);
                    const data = await listarHorarios(estilistaId);
                    if (Array.isArray(data) && data.length > 0) {
                        const ordenados = [...data].sort((a, b) => {
                            const da = new Date(a.inicioSemana + 'T00:00:00');
                            const db = new Date(b.inicioSemana + 'T00:00:00');
                            return da.getTime() - db.getTime();
                        });
                        setHorarios(ordenados);
                        const mapped = ordenados.map(h => ({
                            inicioSemana: String(h.inicioSemana),
                            plantillaSemana: normalizeWeekTemplate(h.plantillaSemana || null),
                        }));
                        const vistos = new Set();
                        const lista = mapped.filter(p => {
                            const k = p.inicioSemana;
                            if (vistos.has(k)) return false;
                            vistos.add(k);
                            return true;
                        });
                        setPeriodos(lista);
                    } else {
                        setPeriodos([]);
                    }
                } else {
                    setPlantilla(null);
                    setHorarios([]);
                }
            } catch {
                setPlantilla(null);
            }
        };

        cargarHorario();
    }, []);

    function getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay(); // 0 domingo .. 6 sábado
        const diff = (day + 6) % 7; // lunes = 0
        d.setDate(d.getDate() - diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    // ---- generar eventos de trabajo ----
    const generateWorkScheduleEvents = useCallback(() => {
        const pad2 = (n) => String(n).padStart(2, '0');
        const startOfWeek = getStartOfWeek(currentDate);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        if (Array.isArray(horarios) && horarios.length > 0) {
            const semanaActual = horarios.find((h) => {
                if (!h?.inicioSemana) return false;
                const d = createValidDate(h.inicioSemana);
                return d >= startOfWeek && d <= endOfWeek;
            });
            if (!semanaActual) return [];
            const plantillaSemana = normalizeWeekTemplate(semanaActual.plantillaSemana || null);
            if (plantillaSemana && typeof plantillaSemana === 'object') {
                const order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                const label = {
                    sunday: 'Domingo', monday: 'Lunes', tuesday: 'Martes',
                    wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado'
                };
                const evs = [];
                order.forEach((key, idx) => {
                    const dia = plantillaSemana[key];
                    if (!dia || dia.rest) return;
                    const [sh, sm] = String(dia.start || '09:00').split(':').map(n => parseInt(n, 10) || 0);
                    const [eh, em] = String(dia.end || '18:00').split(':').map(n => parseInt(n, 10) || 0);
                    const date = new Date(startOfWeek);
                    date.setDate(startOfWeek.getDate() + idx);
                    const startDate = new Date(date); startDate.setHours(sh, sm, 0, 0);
                    const endDate = new Date(date); endDate.setHours(eh, em, 0, 0);
                    evs.push({
                        id: `work-${key}`,
                        title: `Horario laboral (${label[key]})`,
                        timeLabel: `${pad2(sh)}:${pad2(sm)} - ${pad2(eh)}:${pad2(em)}`,
                        date: startDate,
                        endDate,
                        type: 'work',
                        allDay: false
                    });
                });
                return evs;
            }
            return [];
        }

        if (plantilla && typeof plantilla === 'object') {
            return [];
        }

        return [];
    }, [horarios, plantilla, currentDate]);

    // ---- combinar horarios + reservas ----
    useEffect(() => {
        const loadAppointments = async () => {
            const work = generateWorkScheduleEvents();

            if (!resolvedStylistId || !selectedDate) {
                setEvents([...work]);
                return;
            }
            try {
                const reservas = await listarReservasPorEstilistaFecha({
                    estilistaId: String(resolvedStylistId),
                    fecha: selectedDate
                });
                const list = Array.isArray(reservas) ? reservas : [];
                const appointments = list.map((r, idx) => {
                    const raw = String(r.estado || 'confirmada').toLowerCase();
                    const estado = raw === 'cancelada' ? 'cancelada' : 'confirmada';
                    return {
                        id: `apt-${idx}`,
                        title: 'Reserva',
                        date: createValidDate(selectedDate, r.hora_inicio || '00:00'),
                        endDate: createValidDate(selectedDate, r.hora_fin || r.hora_inicio || '00:00'),
                        type: 'appointment',
                        estado,
                        reservaData: {
                            hora: (r.hora_inicio || '00:00').slice(0, 5),
                            nombre: r.cliente_nombre || 'Cliente',
                            servicio: r.servicio_nombre || '—',
                        },
                    };
                });
                setEvents([...work, ...appointments]);
            } catch {
                setEvents([...work]);
            }
        };
        loadAppointments();
    }, [resolvedStylistId, selectedDate, generateWorkScheduleEvents]);

    // ---- prefetch de reservas del mes ----
    useEffect(() => {
        const fetchMonthReservations = async () => {
            try {
                if (!resolvedStylistId || !monthAnchorDate) {
                    setReservasMonthMap({});
                    return;
                }
                const start = new Date(monthAnchorDate.getFullYear(), monthAnchorDate.getMonth(), 1);
                const end = new Date(monthAnchorDate.getFullYear(), monthAnchorDate.getMonth() + 1, 0);
                const tmpMap = {};
                const toISO = (d) => {
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${y}-${m}-${day}`;
                };
                const tasks = [];
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const iso = toISO(d);
                    tasks.push(
                        listarReservasPorEstilistaFecha({ estilistaId: String(resolvedStylistId), fecha: iso })
                            .then((arr) => { tmpMap[iso] = Array.isArray(arr) ? arr.length : 0; })
                            .catch(() => { tmpMap[iso] = 0; })
                    );
                }
                await Promise.all(tasks);
                setReservasMonthMap(tmpMap);
            } catch {
                // ignore
            }
        };
        fetchMonthReservations();
    }, [resolvedStylistId, monthAnchorDate]);

    // ---- navegación de periodos (no se usa en el JSX, pero no molesta) ----
    const getWeekRangeLabel = (baseDate) => {
        const start = getStartOfWeek(baseDate);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        const fmt = (d) => d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        const fmtYear = (d) => d.toLocaleDateString('es-ES', { year: 'numeric' });
        const sameYear = start.getFullYear() === end.getFullYear();
        return sameYear
            ? `${fmt(start)} - ${fmt(end)} ${fmtYear(end)}`
            : `${fmt(start)} ${fmtYear(start)} - ${fmt(end)} ${fmtYear(end)}`;
    };

    function getCurrentPeriodIndex() {
        if (!Array.isArray(periodos) || periodos.length === 0) return -1;
        const start = getStartOfWeek(currentDate);
        const end = new Date(start); end.setDate(start.getDate() + 6);
        const idxByRange = periodos.findIndex(p => {
            if (!p?.inicioSemana) return false;
            const d = createValidDate(p.inicioSemana);
            return d >= start && d <= end;
        });
        if (idxByRange !== -1) return idxByRange;
        if (inicioSemanaHorario) {
            const idxByISO = periodos.findIndex(p => String(p.inicioSemana) === String(inicioSemanaHorario));
            if (idxByISO !== -1) return idxByISO;
        }
        return -1;
    }

    function gotoPeriodByIndex(index) {
        if (!Array.isArray(periodos) || index < 0 || index >= periodos.length) return;
        const p = periodos[index];
        const d = createValidDate(p.inicioSemana);
        const weekStart = getStartOfWeek(d);
        setInicioSemanaHorario(p.inicioSemana);
        setPlantilla(p.plantillaSemana || null);
        setCurrentDate(weekStart);
        setSelectedDate(getValidDateString(weekStart));
    }

    function goToPreviousPeriod() {
        const idx = getCurrentPeriodIndex();
        if (idx > 0) gotoPeriodByIndex(idx - 1);
    }

    function goToNextPeriod() {
        const idx = getCurrentPeriodIndex();
        if (idx >= 0 && idx < periodos.length - 1) gotoPeriodByIndex(idx + 1);
    }

    // ---- UI helpers ----
    const verDetalles = (reserva) => {
        setMostrarDetalles({
            ...reserva,
            fecha: getValidDateString(reserva.fecha),
        });
    };

    const cerrarDetalles = () => setMostrarDetalles(null);

    const formatearFecha = (fechaStr) => {
        const fecha = createValidDate(fechaStr);
        return fecha.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const cambiarFecha = (dias) => {
        const fecha = createValidDate(selectedDate);
        fecha.setDate(fecha.getDate() + dias);
        setSelectedDate(getValidDateString(fecha));
    };

    const reservasDelDia = events.filter((event) => {
        if (event.type !== 'appointment') return false;
        const eventDateISO = getValidDateString(event.date);
        return eventDateISO === selectedDate;
    });

    const isSelectedDayRest = !events.some(
        (e) => e.type === 'work' && getValidDateString(e.date) === selectedDate
    );

    const startOfMonth = new Date(monthAnchorDate.getFullYear(), monthAnchorDate.getMonth(), 1);
    const endOfMonth = new Date(monthAnchorDate.getFullYear(), monthAnchorDate.getMonth() + 1, 0);
    const startWeekday = (() => { const wd = startOfMonth.getDay(); return (wd + 6) % 7; })(); // 0=Lun
    const daysInMonth = endOfMonth.getDate();

    const handlePrevMonth = () =>
        setMonthAnchorDate(new Date(monthAnchorDate.getFullYear(), monthAnchorDate.getMonth() - 1, 1));
    const handleNextMonth = () =>
        setMonthAnchorDate(new Date(monthAnchorDate.getFullYear(), monthAnchorDate.getMonth() + 1, 1));

    const getWorkInfoForDate = (dateStr) => {
        if (!Array.isArray(horarios) || horarios.length === 0) return null;
        const date = createValidDate(dateStr);
        const weekStart = getStartOfWeek(date);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const semana = horarios.find((h) => {
            if (!h?.inicioSemana) return false;
            const d = createValidDate(h.inicioSemana);
            return d >= weekStart && d <= weekEnd;
        });
        if (!semana) return null;
        const plantillaSemana = normalizeWeekTemplate(semana.plantillaSemana || null);
        if (!plantillaSemana || typeof plantillaSemana !== 'object') return null;
        const order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const jsDay = date.getDay(); // 0=Dom..6=Sab
        const idx = (jsDay + 6) % 7; // 0=Lun..6=Dom
        const key = order[idx];
        const dia = plantillaSemana[key];
        if (!dia) return { rest: true };
        return { rest: !!dia.rest, start: dia.start || '09:00', end: dia.end || '18:00' };
    };

    const workInfoSelected = getWorkInfoForDate(selectedDate);

    // ---- RENDER ----
    return (
        <div className="employee-layout">
            <FloatingBackground />
            <Header />
            <section className="calendar-section employee-page">
                <div className="container-fluid px-lg-5">
                    <div className="header-bar">
                        <div className="hb-spacer" aria-hidden="true"></div>
                        <h1 className="page-title">Mi Calendario Laboral</h1>
                        <button
                            className="back-to-dashboard-emp"
                            onClick={(e) => {
                                e.preventDefault();
                                navigate('/dashboard-employee');
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                                <path fill="none" d="M0 0h24v24H0z" />
                                <path
                                    d="M7.828 11H20v2H7.828l5.364 5.364-1.414 1.414L4 12l7.778-7.778 1.414 1.414L7.828 11z"
                                    fill="currentColor"
                                />
                            </svg>
                            <span>Volver</span>
                        </button>
                    </div>

                    {/* Calendario mensual */}
                    <div className="row">
                        <div className="card h-100 col-12 mb-4">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary btn-sm btn-week-nav"
                                            onClick={handlePrevMonth}
                                        >
                                            <i className="fas fa-chevron-left"></i>
                                            <span className="btn-label">Mes anterior</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary btn-sm btn-week-nav"
                                            onClick={handleNextMonth}
                                        >
                                            <span className="btn-label">Mes siguiente</span>
                                            <i className="fas fa-chevron-right"></i>
                                        </button>
                                    </div>
                                    <h4 className="mb-0 week-range-title">
                                        {monthAnchorDate.toLocaleDateString('es-ES', {
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </h4>
                                    <div className="d-flex align-items-center gap-2">
                                        <label className="me-2 mb-0">Ir a mes:</label>
                                        <input
                                            type="month"
                                            className="form-control"
                                            value={getValidMonthString(monthAnchorDate)}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val) {
                                                    const [y, m] = val
                                                        .split('-')
                                                        .map((n) => parseInt(n, 10));
                                                    setMonthAnchorDate(
                                                        new Date(y, (m || 1) - 1, 1)
                                                    );
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Legend / Indicativo */}
                                <div className="d-flex justify-content-center align-items-center gap-4 mb-4 p-2 bg-light rounded-3" style={{ border: '1px solid #f0f0f0' }}>
                                    <div className="d-flex align-items-center gap-2">
                                        <div style={{ width: 16, height: 16, background: '#10b981', borderRadius: '4px', border: '1px solid #059669' }}></div>
                                        <span className="small fw-semibold text-secondary">Días Laborales</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <div style={{ width: 16, height: 16, background: '#ffedd5', borderRadius: '4px', border: '2px solid #ea580c' }}></div>
                                        <span className="small fw-semibold text-secondary">Días de Descanso</span>
                                    </div>
                                </div>

                                <div className="month-grid">
                                    <div className="month-grid-header">
                                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                                            <div key={d} className="month-col-header">
                                                {d}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="month-grid-body">
                                        {(() => {
                                            const cells = [];
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);

                                            for (let i = 0; i < startWeekday; i++) {
                                                cells.push(
                                                    <div
                                                        key={`empty-${i}`}
                                                        className="month-col empty"
                                                    />
                                                );
                                            }

                                            for (let day = 1; day <= daysInMonth; day++) {
                                                const d = new Date(
                                                    monthAnchorDate.getFullYear(),
                                                    monthAnchorDate.getMonth(),
                                                    day
                                                );
                                                const iso = getValidDateString(d);
                                                const isPast = d < today;
                                                const count = reservasMonthMap[iso] || 0;
                                                const hasReserva = count > 0;

                                                // Get work info for the day
                                                const workInfo = getWorkInfoForDate(iso);
                                                const isWorkDay = workInfo && !workInfo.rest;
                                                const isRestDay = workInfo && workInfo.rest;

                                                const cls = ['month-col'];
                                                if (isPast) cls.push('past');
                                                if (hasReserva) cls.push('reserved');
                                                if (iso === selectedDate) cls.push('selected');
                                                if (isWorkDay) cls.push('work-day');
                                                if (isRestDay) cls.push('rest-day');

                                                cells.push(
                                                    <div
                                                        key={`day-${iso}`}
                                                        className={cls.join(' ')}
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={() => {
                                                            setSelectedDate(iso);
                                                            setCurrentDate(d);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                setSelectedDate(iso);
                                                                setCurrentDate(d);
                                                            }
                                                        }}
                                                    >
                                                        <div className="month-date small">
                                                            {day}
                                                        </div>
                                                        <div className="month-indicator" />
                                                        {/* Work/Rest indicator badge */}
                                                        {isWorkDay && (
                                                            <div className="day-type-badge work-badge">
                                                                <i className="fas fa-briefcase"></i>
                                                            </div>
                                                        )}
                                                        {isRestDay && (
                                                            <div className="day-type-badge rest-badge">
                                                                <i className="fas fa-bed"></i>
                                                            </div>
                                                        )}
                                                        {hasReserva && (
                                                            <div className="reserva-count-badge">
                                                                {count}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }

                                            const rem = cells.length % 7;
                                            if (rem !== 0) {
                                                for (let k = 0; k < 7 - rem; k++) {
                                                    cells.push(
                                                        <div
                                                            key={`empty-tail-${k}`}
                                                            className="month-col empty"
                                                        />
                                                    );
                                                }
                                            }

                                            return (
                                                <div className="month-row">
                                                    {cells}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lista de reservas del día seleccionado */}
                    <div className="row">
                        <div className="card h-100 col-12 mb-4">
                            <div className="card-body">
                                <div className="selector-fecha mb-3">
                                    <button
                                        className="btn btn-outline-secondary"
                                        onClick={() => cambiarFecha(-1)}
                                    >
                                        <i className="fa-solid fa-chevron-left"></i>
                                    </button>
                                    <h4 className="fecha-actual">
                                        {formatearFecha(selectedDate)}
                                    </h4>
                                    <button
                                        className="btn btn-outline-secondary"
                                        onClick={() => cambiarFecha(1)}
                                    >
                                        <i className="fa-solid fa-chevron-right"></i>
                                    </button>
                                </div>

                                {/* Horario del día seleccionado (franja, no celdas) */}
                                <div className="day-work-info-mobile">
                                    {workInfoSelected && (
                                        workInfoSelected.rest ? (
                                            <span className="dwi-item">
                                                <i
                                                    className="fa-regular fa-calendar-xmark"
                                                    aria-hidden="true"
                                                ></i>
                                                <span>Día de descanso</span>
                                            </span>
                                        ) : (
                                            <span className="dwi-item">
                                                <i
                                                    className="fa-regular fa-clock"
                                                    aria-hidden="true"
                                                ></i>
                                                <span>
                                                    Horario: {workInfoSelected.start} -{' '}
                                                    {workInfoSelected.end}
                                                </span>
                                            </span>
                                        )
                                    )}
                                </div>

                                {reservasDelDia.length === 0 ? (
                                    <div className="no-reservas text-center py-4">
                                        <i className="far fa-calendar-times fa-3x mb-3 text-muted"></i>
                                        {isSelectedDayRest ? (
                                            <p>
                                                Día de descanso, no se admiten reservas
                                            </p>
                                        ) : (
                                            <p>No hay reservas para este día</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="reservas-list">
                                        {reservasDelDia.map((event) => (
                                            <div
                                                key={event.id}
                                                className={`reserva-item ${event.estado.toLowerCase()}`}
                                                onClick={() =>
                                                    verDetalles({
                                                        ...event.reservaData,
                                                        estado: event.estado,
                                                    })
                                                }
                                            >
                                                <div className="reserva-hora">
                                                    {event.reservaData.hora}
                                                </div>
                                                <div className="reserva-info">
                                                    <div className="reserva-cliente">
                                                        {event.reservaData.nombre}
                                                    </div>
                                                    <div className="reserva-servicio">
                                                        {event.reservaData.servicio}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {mostrarDetalles && (
                        <div
                            className="modal-backdrop"
                            style={{
                                position: 'fixed',
                                inset: 0,
                                background: 'rgba(0,0,0,0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1050,
                            }}
                            onClick={cerrarDetalles}
                        >
                            <div
                                className="card"
                                style={{ minWidth: 320, maxWidth: 420 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <strong>Detalle de reserva</strong>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={cerrarDetalles}
                                    >
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </div>
                                <div className="card-body">
                                    <div className="mb-2">
                                        <span className="text-muted">Servicio:</span>{' '}
                                        <span className="fw-semibold">
                                            {mostrarDetalles.servicio}
                                        </span>
                                    </div>
                                    <div className="mb-2">
                                        <span className="text-muted">Cliente:</span>{' '}
                                        <span className="fw-semibold">
                                            {mostrarDetalles.nombre}
                                        </span>
                                    </div>
                                    <div className="mb-2">
                                        <span className="text-muted">Hora:</span>{' '}
                                        <span className="fw-semibold">
                                            {mostrarDetalles.hora}
                                        </span>
                                    </div>
                                    {mostrarDetalles.estado && (
                                        <div className="mb-2">
                                            <span className="text-muted">Estado:</span>{' '}
                                            <span className={`badge text-uppercase ${mostrarDetalles.estado.toLowerCase() === 'confirmada'
                                                ? 'bg-success'
                                                : mostrarDetalles.estado.toLowerCase() === 'cancelada'
                                                    ? 'bg-danger'
                                                    : 'bg-warning text-dark'
                                                }`}>
                                                {mostrarDetalles.estado}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="card-footer text-end">
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={cerrarDetalles}
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section >
            <Footer />
        </div >
    );
};

export default CalendarEmployee;