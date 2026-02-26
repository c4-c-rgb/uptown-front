// API de reservas para módulo cliente
import API_BASE_URL from '../../../../config/api';
const BASE_URL = API_BASE_URL;
const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function listarReservasCliente({ email, clienteId }) {
  // Intentar con múltiples combinaciones de parámetros y rutas comunes
  // Orden: endpoint dedicado por cliente (nuevo), luego admin y genéricos
  const routeCandidates = ['/reservas/cliente', '/reservas/admin', '/reservas', '/api/reservas'];
  const paramCandidates = [
    () => ({ clienteId }),
    () => ({ email, clienteId }),
    () => ({ email }),
    () => ({ idCliente: clienteId }),
    () => ({ cliente: clienteId }),
  ];

  for (const path of routeCandidates) {
    for (const build of paramCandidates) {
      const params = build();
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v) qs.append(k, v);
      });
      try {
        const url = `${BASE_URL}${path}${qs.toString() ? `?${qs.toString()}` : ''}`;
        // eslint-disable-next-line no-console
        console.debug('[listarReservasCliente] GET', url);
        const res = await fetch(url, { credentials: 'include' });
        if (res.status === 404) continue; // probar siguiente
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        const data = await res.json();
        // eslint-disable-next-line no-console
        console.debug('[listarReservasCliente] respuesta', Array.isArray(data) ? data.length : typeof data);
        if (Array.isArray(data) && data.length > 0) return data;
        // si devuelve vacío, probar siguiente combinación
      } catch (_) {
        // probar siguiente combinación
        continue;
      }
    }
  }

  // Último recurso: traer sin filtros y dejar que el consumidor filtre en frontend
  try {
    const url = `${BASE_URL}/reservas`;
    // eslint-disable-next-line no-console
    console.debug('[listarReservasCliente] fallback GET', url);
    const res = await fetch(url, { credentials: 'include' });
    if (res.ok) return res.json();
  } catch (_) { }
  return [];
}

export async function listarReservasPorEstilistaFecha({ estilistaId, fecha }) {
  const qs = new URLSearchParams();
  if (estilistaId) qs.append('estilistaId', estilistaId);
  if (fecha) qs.append('fecha', fecha);
  const res = await fetch(`${BASE_URL}/reservas?${qs.toString()}`, {
    credentials: 'include',
  });
  // Si el backend aún no tiene /reservas, devolver [] para no romper la UI
  if (res.status === 404) {
    // eslint-disable-next-line no-console
    console.warn('listarReservasPorEstilistaFecha: endpoint /reservas no encontrado, devolviendo []');
    return [];
  }
  if (!res.ok) throw new Error('Error al listar reservas del día para el estilista');
  return res.json(); // esperado: array de reservas con hora_inicio/hora_fin
}

// Listar horarios (plantilla semanal) del estilista
export async function listarHorariosEstilista(estilistaId) {
  const qs = estilistaId ? `?idEstilista=${encodeURIComponent(estilistaId)}` : '';
  const res = await fetch(`${BASE_URL}/horarios${qs}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Error al listar horarios del estilista');
  return res.json();
}

export async function listarDisponibilidad({ estilistaId, fecha }) {
  // fecha ISO YYYY-MM-DD
  const qs = new URLSearchParams();
  if (estilistaId) {
    // Enviar ambos nombres de parámetro por compatibilidad con el backend
    qs.append('estilistaId', estilistaId);
    qs.append('idEstilista', estilistaId);
  }
  if (fecha) qs.append('fecha', fecha);

  // Probar rutas alternativas comunes en el backend
  const candidates = [
    '/reservas/disponibilidad',
    '/reservas/availability',
    '/api/reservas/disponibilidad',
    '/api/reservas/availability',
  ];

  let lastError;
  for (const path of candidates) {
    try {
      const url = `${BASE_URL}${path}?${qs.toString()}`;
      const res = await fetch(url, { credentials: 'include' });
      if (res.status === 404) {
        // probar siguiente ruta
        // eslint-disable-next-line no-console
        console.warn('listarDisponibilidad 404 en', url);
        continue;
      }
      if (!res.ok) {
        throw new Error(`Error HTTP ${res.status} en ${url}`);
      }
      const data = await res.json();
      // Normalizar: aceptar { slots: [...] } o array directo
      const slots = Array.isArray(data?.slots) ? data.slots : Array.isArray(data) ? data : [];
      return { slots };
    } catch (e) {
      lastError = e;
      continue;
    }
  }
  throw lastError || new Error('No se pudo obtener disponibilidad');
}

export async function crearReserva(payload) {
  // payload esperado: { cliente: { nombre,email,telefono? }, estilistaId, servicioId|servicio, fecha: 'YYYY-MM-DD', hora: 'HH:mm' }
  const res = await fetch(`${BASE_URL}/reservas`, {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    // Intentar extraer mensaje del backend
    let detail = 'Error al crear la reserva';
    try {
      const data = await res.json();
      detail = data?.message || data?.error || detail;
    } catch (_) {
      try {
        const text = await res.text();
        if (text) detail = text;
      } catch (_) { }
    }
    throw new Error(detail);
  }
  return res.json();
}

export async function cancelarReserva(reservaId) {
  // Soft cancel: marca como 'cancelada' sin eliminar el registro
  const res = await fetch(`${BASE_URL}/reservas/${encodeURIComponent(reservaId)}/cancelar`, {
    method: 'PATCH',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Error al cancelar la reserva');
  return true;
}

// Actualizar estado de una reserva en el backend
export async function actualizarEstadoReserva({ reservaId, estado }) {
  // No existe endpoint general para actualizar estados arbitrarios.
  // Solo soportamos cancelación vía PATCH /reservas/:id/cancelar.
  if (String(estado).toLowerCase() === 'cancelada') {
    return cancelarReserva(reservaId);
  }
  // Para estados como 'confirmada' o 'no disponible', devolvemos ok sin llamar backend
  return true;
}
