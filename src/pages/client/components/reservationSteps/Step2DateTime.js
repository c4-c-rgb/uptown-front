import React, { useState, useEffect } from 'react';
import { listarHorariosEstilista, listarReservasPorEstilistaFecha } from '../api/reservasApi';

const Step2DateTime = ({ date, setDate, time, setTime, stylist, stylistId, handlePrevStep, handleNextStep }) => {
  const [localDate, setLocalDate] = useState(date || null);
  const [localTime, setLocalTime] = useState(time || '');
  const [availableDates, setAvailableDates] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState('');

  // Formatear fecha para mostrar en formato legible
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const [y, m, d] = String(dateString).split('-').map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    return dt.toLocaleDateString('es-ES', options);
  };

  const todayISO = () => {
    const t = new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, '0');
    const d = String(t.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Formatear hora para mostrar en formato 12 horas
  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Helpers de fecha
  const getStartOfWeekMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay(); // 0..6 (domingo..sábado)
    const diff = (day === 0 ? -6 : 1) - day; // queremos lunes
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };
  const dayKeyFromDate = (d) => {
    const [y, m, dd] = String(d).split('-').map(Number);
    const dateObj = new Date(y, (m || 1) - 1, dd || 1);
    const day = dateObj.getDay();
    return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][day];
  };

  // Normaliza claves de días en plantillaSemana (es->en), tolerante a acentos/variantes
  const normalizeWeekTemplate = (src) => {
    if (!src || typeof src !== 'object') return src;
    const toBase = (s) => {
      const lower = String(s).toLowerCase();
      return lower.normalize ? lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : lower;
    };
    const map = {
      lunes: 'monday',
      martes: 'tuesday',
      miercoles: 'wednesday',
      jueves: 'thursday',
      viernes: 'friday',
      sabado: 'saturday',
      domingo: 'sunday',
    };
    const dst = { ...src };
    Object.keys(src).forEach((k) => {
      const base = toBase(k);
      const en = map[base] || k;
      if (en !== k) {
        dst[en] = src[k];
        delete dst[k];
      }
    });
    return dst;
  };

  // Cuando cambie el estilista seleccionado, calcular disponibilidad (próximos 7 días) desde /horarios y restar reservas
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!stylistId) {
        setAvailableDates([]);
        setLocalDate(null);
        setLocalTime('');
        return;
      }
      try {
        setLoading(true);
        // 1) Traer horarios (semanas) del estilista
        const schedules = await listarHorariosEstilista(String(stylistId));
        const list = Array.isArray(schedules) ? schedules : [];
        // eslint-disable-next-line no-console
        console.debug('[Step2DateTime] horarios estilista', stylistId, list.length, list);

        // DEBUG: Log full structure of first schedule's weekTemplate
        if (list.length > 0 && list[0].plantillaSemana) {
          console.debug('[Step2DateTime] DEBUG plantillaSemana keys:', Object.keys(list[0].plantillaSemana));
          console.debug('[Step2DateTime] DEBUG plantillaSemana full:', JSON.stringify(list[0].plantillaSemana, null, 2));
          Object.entries(list[0].plantillaSemana).forEach(([dayKey, dayValue]) => {
            console.debug(`[Step2DateTime] Day: ${dayKey}, rest: ${dayValue?.rest}, start: ${dayValue?.start}, end: ${dayValue?.end}`);
          });
        }

        if (list.length === 0) {
          setAvailableDates([]);
          setLocalDate(null);
          setLocalTime('');
          setLoading(false);
          return;
        }

        // 2) Construir fechas a revisar (21 días para cubrir al menos 3 semanas)
        const today = new Date();
        const daysToCheck = Array.from({ length: 21 }, (_, i) => {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const da = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${da}`;
        });

        // Helper para elegir plantilla semana aplicable a una fecha
        // ESTRICTO: Solo devuelve plantilla si la fecha cae DENTRO de una semana asignada (7 días desde inicioSemana)
        const pickWeekTemplate = (dateISO) => {
          const target = new Date(String(dateISO) + 'T00:00:00');
          const candidates = (list || [])
            .filter(h => !!h?.inicioSemana)
            .sort((a, b) => new Date(String(b.inicioSemana) + 'T00:00:00') - new Date(String(a.inicioSemana) + 'T00:00:00'));

          // Buscar un horario cuya semana de 7 días incluya la fecha objetivo
          const match = candidates.find(h => {
            const start = new Date(String(h.inicioSemana) + 'T00:00:00');
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            return target >= start && target <= end;
          });

          const tpl = match?.plantillaSemana || null;
          // eslint-disable-next-line no-console
          console.debug('[Step2DateTime] pickWeekTemplate (Strict)', { dateISO, matchStart: match?.inicioSemana || null, found: !!tpl });
          return tpl;
        };

        const pad2 = (n) => String(n).padStart(2, '0');
        const toMinutes = (hhmm) => { const [h, m] = String(hhmm).split(':').map(x => parseInt(x, 10) || 0); return h * 60 + m; };
        const parseTimeFlexible = (val) => {
          if (!val) return null;
          const s = String(val).trim().toUpperCase();
          // formatos: "HH:mm", "H:mm", "HH:mm AM/PM"
          const ampm = s.endsWith('AM') || s.endsWith('PM') ? s.slice(-2) : '';
          const core = ampm ? s.slice(0, -2).trim() : s;
          const parts = core.split(':');
          const h = parseInt(parts[0], 10);
          const m = parseInt(parts[1] || '0', 10) || 0;
          if (!Number.isFinite(h)) return null;
          let hour24 = h;
          if (ampm === 'AM') {
            hour24 = h % 12;
          } else if (ampm === 'PM') {
            hour24 = (h % 12) + 12;
          }
          return `${pad2(hour24)}:${pad2(m)}`;
        };
        const toHHMM = (mins) => `${pad2(Math.floor(mins / 60))}:${pad2(mins % 60)}`;

        const normalizeDia = (raw) => {
          if (!raw || typeof raw !== 'object') return null;
          const val = (kList) => {
            for (const k of kList) {
              if (raw[k] !== undefined) return raw[k];
            }
            return undefined;
          };
          const startRaw = val(['start', 'inicio', 'start_time', 'startTime']);
          const endRaw = val(['end', 'fin', 'end_time', 'endTime']);
          const intervalRaw = val(['interval', 'intervalo', 'intervalMinutes', 'interval_minutes']);
          const rest = Boolean(val(['rest', 'is_rest', 'descanso']));
          const start = parseTimeFlexible(startRaw) || (typeof startRaw === 'string' ? startRaw : null);
          const end = parseTimeFlexible(endRaw) || (typeof endRaw === 'string' ? endRaw : null);
          const intervalNum = parseInt(intervalRaw, 10);
          const interval = Number.isFinite(intervalNum) && intervalNum > 0 ? intervalNum : 60;
          if (!start || !end) return { rest: true };
          return { start, end, interval, rest };
        };

        const results = [];
        const todayStr = todayISO();
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        for (const fecha of daysToCheck) {
          const plantillaSemana = normalizeWeekTemplate(pickWeekTemplate(fecha));
          if (!plantillaSemana || typeof plantillaSemana !== 'object') {
            results.push({ date: fecha, slots: [] });
            // eslint-disable-next-line no-console
            console.debug('[Step2DateTime] no plantilla para fecha', fecha);
            continue;
          }

          // Día de la semana
          const key = dayKeyFromDate(fecha);
          const dia = plantillaSemana[key];
          if (!dia || dia.rest) {
            results.push({ date: fecha, slots: [] });
            // eslint-disable-next-line no-console
            console.debug('[Step2DateTime] dia sin servicio o rest', { fecha, key, dia });
            continue;
          }
          const dspec = normalizeDia(dia);
          // Si el día no tiene horario válido, no ofrecer slots
          if (!dspec || dspec.rest) { results.push({ date: fecha, slots: [] }); continue; }
          const start = toMinutes(dspec.start || '09:00');
          const end = toMinutes(dspec.end || '18:00');
          const interval = dspec.interval || 60; // minutos

          // 3) Traer reservas del día para bloquear
          let reservas = [];
          try {
            const r = await listarReservasPorEstilistaFecha({ estilistaId: String(stylistId), fecha });
            reservas = Array.isArray(r) ? r : [];
          } catch { }
          // Ignorar reservas canceladas para el bloqueo de horarios
          const busy = reservas
            .filter(rv => String(rv.estado || '').toLowerCase() !== 'cancelada')
            .map(rv => ({
              s: toMinutes(rv.hora_inicio || '00:00'),
              e: toMinutes(rv.hora_fin || rv.hora_inicio || '00:00')
            }));

          // 4) Generar slots y filtrar los que colisionen con reservas
          const slots = [];
          for (let t = start; t + interval <= end; t += interval) {
            const slotStart = t;
            const slotEnd = t + interval;
            const overlaps = busy.some(b => !(slotEnd <= b.s || slotStart >= b.e));
            // Filtrar horas pasadas para el día actual
            const isPastToday = (fecha === todayStr) && (slotStart <= nowMinutes);
            if (!overlaps && !isPastToday) {
              slots.push({ time: toHHMM(slotStart), available: true });
            }
          }
          // eslint-disable-next-line no-console
          console.debug('[Step2DateTime] slots generados', { fecha, key, dspec, busy: busy.length, slots: slots.length });
          results.push({ date: fecha, slots });
        }

        setAvailableDates(results.filter(r => Array.isArray(r.slots) && r.slots.length > 0));
        setLocalDate(null);
        setLocalTime('');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [stylistId]);

  // Actualizar slots disponibles cuando se selecciona una fecha
  useEffect(() => {
    if (localDate) {
      const dateData = availableDates.find(d => d.date === localDate);
      if (dateData) {
        const availableTimeSlots = (dateData.slots || [])
          .filter(slot => slot.available)
          .map(slot => slot.time);
        setAvailableSlots(availableTimeSlots);
      } else {
        setAvailableSlots([]);
      }
    }
  }, [localDate, availableDates]);

  // Manejar selección de fecha
  const handleDateSelect = (selectedDate) => {
    // Bloquear fechas pasadas
    if (selectedDate < todayISO()) {
      setDateError('Fecha no disponible. Por favor selecciona una fecha futura.');
      setLocalDate(null);
      setLocalTime('');
      setDate('');
      return;
    }
    setDateError('');
    setLocalDate(selectedDate);
    setLocalTime('');
    setDate(selectedDate);
  };

  // Manejar selección de hora
  const handleTimeSelect = (selectedTime) => {
    setLocalTime(selectedTime);
    setTimeout(() => setTime(selectedTime), 0);
  };

  // Función para obtener el día de la semana, día y mes de una fecha
  const getDateParts = (dateString) => {
    const [y, m, d] = String(dateString).split('-').map(Number);
    const dateObj = new Date(y, (m || 1) - 1, d || 1);
    return {
      day: dateObj.getDate(),
      month: dateObj.toLocaleString('es-ES', { month: 'short' }),
      weekday: dateObj.toLocaleString('es-ES', { weekday: 'short' })
    };
  };

  return (
    <div>
      <h2 className="reservation-header">Selección de fecha y hora</h2>
      <form>
        {!stylistId ? (
          <div className="alert alert-info" role="alert">
            Por favor, selecciona un estilista en el paso anterior.
          </div>
        ) : (
          <>
            <div className="date-selection">
              <h4 className="mb-3">Fechas disponibles:</h4>
              {dateError && (
                <div className="alert alert-warning" role="alert">{dateError}</div>
              )}

              <div className="date-buttons d-flex flex-wrap gap-3">
                {availableDates.map((dateInfo) => {
                  const hasAvailableSlots = dateInfo.slots.some(slot => slot.available);
                  if (!hasAvailableSlots) return null;

                  const { day, month, weekday } = getDateParts(dateInfo.date);

                  return (
                    <button
                      key={dateInfo.date}
                      type="button"
                      className={`date-button ${localDate === dateInfo.date ? 'selected' : ''}`}
                      onClick={() => handleDateSelect(dateInfo.date)}
                    >
                      <span className="date-day">{day}</span>
                      <span className="date-month">{month}</span>
                      <span className="date-weekday">{weekday}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {localDate && (
              <div className="time-selection mt-3">
                <h4 className="mb-3">Horarios disponibles:</h4>

                <div className="time-slots d-flex flex-wrap gap-3">
                  {availableSlots.length > 0 ? (
                    availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`time-slot ${localTime === slot ? 'selected' : ''}`}
                        onClick={() => handleTimeSelect(slot)}
                      >
                        {formatTime(slot)}
                      </button>
                    ))
                  ) : (
                    <div className="alert alert-warning w-100" role="alert">
                      No hay horarios disponibles para la fecha seleccionada.
                    </div>
                  )}
                </div>
              </div>
            )}

            {localDate && localTime && (
              <div className="selection-summary mt-4 p-3">
                <p className="mb-1">
                  <strong>Cita seleccionada:</strong> {formatDate(localDate)} a las {formatTime(localTime)}
                </p>
              </div>
            )}
          </>
        )}

        <div className="d-flex justify-content-between mt-4 btn-navigation">
          <button
            type="button"
            className="btn btn-prev"
            onClick={handlePrevStep}
          >
            Atrás
          </button>

          <button
            type="button"
            className="btn btn-next"
            disabled={!localDate || !localTime}
            onClick={() => {
              setDate(localDate);
              setTime(localTime);
              setTimeout(() => handleNextStep(), 100);
            }}
          >
            Siguiente
          </button>
        </div>
      </form>
    </div>
  );
};

export default Step2DateTime;
