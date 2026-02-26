// Cliente sencillo para el módulo de horarios
import API_BASE_URL from '../../../config/api';
const BASE_URL = API_BASE_URL;
const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function listarHorarios(idEstilista) {
  const qs = idEstilista ? `?idEstilista=${encodeURIComponent(idEstilista)}` : '';
  const res = await fetch(`${BASE_URL}/horarios${qs}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Error al listar horarios');
  return res.json();
}

export async function crearHorario(payload) {
  const res = await fetch(`${BASE_URL}/horarios`, {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Error al crear horario');
  return res.json();
}

export async function actualizarHorario(id, payload) {
  const res = await fetch(`${BASE_URL}/horarios/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Error al actualizar horario');
  return res.json();
}

export async function eliminarHorario(id) {
  const res = await fetch(`${BASE_URL}/horarios/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Error al eliminar horario');
}

// Listar estilistas reales (usuarios con rol 'estilista')
export async function listarEstilistas() {
  const roleId = process.env.REACT_APP_STYLIST_ROLE_ID;
  const qs = roleId ? `?rolId=${encodeURIComponent(roleId)}` : '';
  const res = await fetch(`${BASE_URL}/api/users/estilistas${qs}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Error al listar estilistas');
  return res.json();
}
