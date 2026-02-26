import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { formatCOP } from '../../../utils/formatCOP';
import HeaderComponent from '../../../components/headerAdmin/header';
import FooterComponent from '../../../components/footerAdmin/adminFooter';
import FloatingBackground from '../../../components/shared/FloatingBackground';
import Select from 'react-select';
import "./users.scss";
import API_BASE_URL from '../../../config/api';

// Base URL para API
const BASE_URL = API_BASE_URL;

// Componente Input flotante separado
function FloatingInput({ id, label, name, type = "text", value, onChange, className = "", required }) {
  const [isActive, setIsActive] = useState(false);
  const [hasError, setHasError] = useState(false);


  const filled = value !== undefined && value !== null && value.toString().trim() !== "";

  const handleFocus = () => {
    setIsActive(true);
    setHasError(false);
  };

  const handleBlur = () => {
    if (!filled) {
      setIsActive(false);
      setHasError(true);
    }
  };

  return (
    <div className={`input-group ${className}`}>
      <input
        id={id}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`form-control mb-2 ${hasError ? "error" : ""}`}
        autoComplete="off"
        required
      />
      <label htmlFor={id} className={`label ${isActive || filled ? "active" : ""}`}>
        {label}
      </label>
    </div>
  );
}

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState(""); // 
  const initialUserState = {
    type_doc: "",
    document: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    gender: "",
    birthdate: "",
    active: true,
    password: "",
    rol: "",
    confirmPassword: "",
  };
  const [selectedUser, setSelectedUser] = useState(initialUserState);
  const [nuevoUsuario, setNuevoUsuario] = useState(initialUserState);
  const [modalEditar, setModalEditar] = useState(false);
  const [originalUser, setOriginalUser] = useState(null);
  const [modalCrear, setModalCrear] = useState(false);
  const [allServices, setAllServices] = useState([]);
  // const [servicesVisible, setServicesVisible] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  // const [serviceFilter, setServiceFilter] = useState("");
  // const [selectedService, setSelectedService] = useState(null); // Estado para el servicio seleccionado


  const createUserFetch = async (newUser) => {
    try {
      const res = await fetch(`${BASE_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error en la petición");
      } else {
        fetchUsers();
        setNuevoUsuario(initialUserState);
        setModalCrear(false);
        alert('Usuario registrado exitosamente');
      }
    } catch (error) {
      alert(`Hubo un error: ${error.message}`);
    }
  };

  const updateUserFetch = async (newUser, id, flag = true) => {
    if (!id) { alert('Falta el ID del usuario a actualizar'); return; }
    try {
      console.debug('Usuarios: PUT payload', { id, newUser });
      const res = await fetch(`${BASE_URL}/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (!res.ok) {
        const txt = await res.text();
        let msg = txt;
        try { const j = JSON.parse(txt); msg = j.message || txt; } catch { }
        console.error('Usuarios: PUT error', res.status, msg);
        throw new Error(msg || `Error en la petición (${res.status})`);
      } else {
        fetchUsers();
        setNuevoUsuario(initialUserState);
        setModalEditar(false);
        if (flag) {
          alert('Usuario actualizado exitosamente');
        }
      }
    } catch (error) {
      alert(`Hubo un error: ${error.message}`);
    }
  };

  const updateStylistFetch = async (newUser, id) => {
    if (!id) { alert('Falta el ID del estilista a actualizar'); return; }
    try {
      // Asegurar que solo se envíen campos permitidos al endpoint de estilistas
      const allowedKeys = new Set([
        'type_doc', 'document', 'first_name', 'last_name', 'email', 'phone',
        'gender', 'birthdate', 'is_active', 'password', 'bio', 'service_ids'
      ]);
      const payload = {};
      Object.entries(newUser || {}).forEach(([k, v]) => {
        if (!allowedKeys.has(k)) return;
        if (k === 'birthdate' && typeof v === 'string') {
          payload[k] = v.replaceAll('/', '-').slice(0, 10);
          return;
        }
        if (k === 'service_ids' && Array.isArray(v)) {
          payload[k] = v.map(n => Number(n)).filter(Number.isFinite);
          return;
        }
        payload[k] = v;
      });
      // No dejar pasar 'services' ni 'rol' ni otros
      console.debug('Estilista: PUT payload (final)', { id, payload });
      const res = await fetch(`${BASE_URL}/api/users/estilistas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        let msg = txt;
        try { const j = JSON.parse(txt); msg = j.message || txt; } catch { }
        console.error('Estilista: PUT error', res.status, msg);
        throw new Error(msg || `Error en la petición (${res.status})`);
      } else {
        fetchUsers();
        setNuevoUsuario(initialUserState);
        setModalEditar(false);
        setSelectedServiceIds([]);
        alert('Estilista actualizado exitosamente');
      }
    } catch (error) {
      alert(`Hubo un error: ${error.message}`);
    }
  };

  const deleteUserFetch = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/api/users/${id || ''}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar usuario");
      fetchUsers();
      alert('Usuario eliminado exitosamente');
    } catch (error) {
      alert(`Hubo un error: ${error}`);
    }
  };

  const fetchUsers = async () => {
    try {
      // Obtener usuarios generales
      const resUsers = await fetch(`${BASE_URL}/api/users`);
      if (!resUsers.ok) throw new Error("Error al obtener usuarios");
      const users = await resUsers.json();

      // Obtener estilistas con servicios
      const resStylists = await fetch(`${BASE_URL}/api/users/estilistas`);
      if (resStylists.ok) {
        const stylists = await resStylists.json();

        // Combinar datos: reemplazar usuarios que son estilistas con datos completos
        const combinedUsers = users.map(user => {
          if (user.rol && user.rol.id === 2) {
            const stylistData = stylists.find(s => s.id === user.id);
            return stylistData || user;
          }
          return user;
        });

        setUsers(combinedUsers);
      } else {
        // Si falla la carga de estilistas, usar solo usuarios generales
        setUsers(users);
      }
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    }
  };

  // Cargar usuarios de API
  useEffect(() => {
    fetchUsers();
    fetchServices();

  }, []);


  // Abrir modal editar
  const abrirModalEditar = (user) => {
    setSelectedUser(user);
    setOriginalUser(user);
    setModalEditar(true);

    // Inicializar servicios seleccionados si es estilista (rol id = 2)
    if (user.rol && user.rol.id === 2) {
      if (Array.isArray(user.services) && user.services.length > 0) {
        const ids = user.services
          .map(s => (typeof s === 'object' ? s.id : Number(s)))
          .filter(Boolean);
        setSelectedServiceIds(ids);
      } else {
        setSelectedServiceIds([]);
      }
    } else {
      setSelectedServiceIds([]);
    }
  };

  const handleEditChange = (e) => {
    setSelectedUser({ ...selectedUser, [e.target.name]: e.target.value });
  };

  const guardarCambios = () => {
    if (!selectedUser.password && !selectedUser.confirmPassword) {
      putEditUser(true);
    } else {
      if (selectedUser.password === selectedUser.confirmPassword) {
        putEditUser(false);
      } else {
        alert("Las contraseñas no coinciden");
      }
    }
  };

  const putEditUser = (skipPassword) => {
    // Construir payload solo con campos cambiados respecto al original
    const norm = (v) => (typeof v === 'string' ? v.trim() : v);
    const orig = originalUser || {};
    const cur = selectedUser || {};

    const base = {
      type_doc: cur?.type_doc,
      document: cur?.document,
      first_name: cur?.first_name,
      last_name: cur?.last_name,
      email: cur?.email,
      phone: cur?.phone,
      gender: cur?.gender,
      birthdate: cur?.birthdate ? cur.birthdate.replaceAll('/', '-').slice(0, 10) : undefined,
      is_active: Boolean(cur?.is_active),
      // alias común 'active'
      active: Boolean(cur?.is_active),
    };

    // Rol puede venir como objeto o id plano
    const rolId = cur?.rol?.id ? Number(cur.rol.id) : (cur?.rol ? Number(cur.rol) : undefined);
    if (!Number.isNaN(rolId) && rolId !== undefined) {
      base.id_rol = rolId;
      // alias común en algunos backends
      base.role_id = rolId;
    }

    // password sólo si se está cambiando
    if (!skipPassword && cur?.password) base.password = cur.password;

    // Dif con original y limpiar vacíos
    const payload = {};
    Object.entries(base).forEach(([k, v]) => {
      const ovBase = orig?.[k];
      const ovRole = (k === 'id_rol' || k === 'role_id') ? (orig?.rol?.id ?? orig?.rol) : undefined;
      const ovActive = (k === 'is_active' || k === 'active') ? (orig?.is_active ?? orig?.active) : undefined;
      const ov = ovBase !== undefined ? ovBase : (ovRole !== undefined ? ovRole : (ovActive !== undefined ? ovActive : orig?.[k]));
      const nv = norm(v);
      if (typeof nv === 'boolean') {
        if (nv !== Boolean(ov)) payload[k] = nv;
      } else if (nv !== '' && nv !== undefined && nv !== null) {
        // Comparar contra valor original normalizado si es string/number
        const ovn = norm(ov);
        if (String(nv) !== String(ovn ?? '')) payload[k] = nv;
      }
    });

    // Agregar servicios si es estilista (rol id = 2)
    const isEstilista = rolId === 2;
    if (isEstilista && selectedServiceIds) {
      // Filtrar solo IDs de servicios válidos que existen en el catálogo
      const validSet = new Set((allServices || []).map(s => s.id));
      const filtered = (selectedServiceIds || []).map(Number).filter((id) => Number.isFinite(id) && validSet.has(id));
      payload.service_ids = filtered;
      // Si había IDs inválidos, avisar suavemente
      if (filtered.length !== (selectedServiceIds || []).length) {
        console.warn('Algunos service_ids no existen y no se enviarán', { selectedServiceIds, filtered });
      }
    }

    if (Object.keys(payload).length === 0 && (!isEstilista || !selectedServiceIds)) {
      alert('No hay cambios para guardar');
      return;
    }

    // Si es estilista, usar endpoint específico de estilistas
    if (isEstilista) {
      console.log('--->', payload);
      //Actualizar un usuario desde admin a estilista
      if (payload.id_rol) {
        updateUserFetch({ id_rol: payload.id_rol }, cur.id, false);
      }

      // Filtrar solo campos permitidos por UpdateStylistDto + service_ids
      const allowedKeys = new Set([
        'type_doc', 'document', 'first_name', 'last_name', 'email', 'phone',
        'gender', 'birthdate', 'is_active', 'password', 'bio', 'service_ids'
      ]);
      const stylistPayload = {};
      Object.entries(payload).forEach(([k, v]) => {
        if (!allowedKeys.has(k)) return; // ignorar campos no permitidos (p.ej. id_rol, role_id, active)
        if (k === 'birthdate' && typeof v === 'string') {
          stylistPayload[k] = v.replaceAll('/', '-').slice(0, 10);
          return;
        }
        if (k === 'service_ids' && Array.isArray(v)) {
          stylistPayload[k] = v.map(n => Number(n)).filter(n => Number.isFinite(n));
          return;
        }
        stylistPayload[k] = v;
      });
      // Asegurar que enviamos service_ids aunque sea [] cuando procede
      if (!('service_ids' in stylistPayload) && Array.isArray(selectedServiceIds)) {
        stylistPayload.service_ids = selectedServiceIds.map(n => Number(n)).filter(n => Number.isFinite(n));
      }
      updateStylistFetch(stylistPayload, cur.id);
    } else {
      updateUserFetch(payload, cur.id);
    }
  };

  // Crear usuario
  const handleNewChange = (e) => {
    setNuevoUsuario({ ...nuevoUsuario, [e.target.name]: e.target.value });
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (nuevoUsuario.password === nuevoUsuario.confirmPassword) {
      createUserFetch({
        type_doc: nuevoUsuario?.type_doc || '',
        document: nuevoUsuario?.document || '',
        first_name: nuevoUsuario?.first_name || '',
        last_name: nuevoUsuario?.last_name || '',
        email: nuevoUsuario?.email || '',
        phone: nuevoUsuario?.phone || '',
        gender: nuevoUsuario?.gender || '',
        birthdate: nuevoUsuario?.birthdate || '',
        is_active: Boolean(nuevoUsuario?.active),
        password: nuevoUsuario?.password || '',
        id_rol: nuevoUsuario?.rol ? Number(nuevoUsuario.rol) : undefined
      });
    } else {
      alert("Las contraseñas no coinciden");
    }
  };

  // Eliminar usuario
  const eliminarUsuario = (id) => { if (id) deleteUserFetch(id); };

  const filteredUsers = users.filter((u) => {
    if (!roleFilter) return true;
    if (roleFilter === "1") return u.rol?.id === 1;
    if (roleFilter === "2") return u.rol?.id === 2;
    if (roleFilter === "3") return u.rol?.id === 3;
    return true;
  });

  const fetchServices = async () => {
    try {
      const res = await fetch(`${BASE_URL}/services`);
      if (!res.ok) throw new Error('Error al cargar servicios');
      const data = await res.json();
      setAllServices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  // Opciones para el Select usando allServices
  const serviceOptions = allServices.map(s => ({
    value: s.id,
    label: s.name
  }));

  return (
    <div className="admin-users-page">
      <FloatingBackground />
      <style>{`
        @media (max-width: 768px) {
          .dataTable .actions-cell .btn { width: 32px; height: 32px; }
          .dataTable table thead th:nth-child(3),
          .dataTable table thead th:nth-child(4),
          .dataTable table tbody td:nth-child(3),
          .dataTable table tbody td:nth-child(4) { display: none; }
          .dataTable .btnCreate { padding: 6px 10px; font-size: 0.85rem; border-radius: 10px; }
          .dataTable .btn.regresar { padding: 6px 10px; font-size: 0.85rem; border-radius: 8px; }
        }
        @media (max-width: 576px) {
          .dataTable table thead th:nth-child(2),
          .dataTable table tbody td:nth-child(2) { display: none; }
          .dataTable .btnCreate { padding: 5px 8px; font-size: 0.8rem; }
          .dataTable .btn.regresar { padding: 5px 8px; font-size: 0.8rem; }
        }
      `}</style>
      <HeaderComponent />
      <section className='d-flex justify-content-center'>
        <div className="container mt-3 row">
          <div className='col-12 dataTable'>
            <div className='mb-4'>
              <h2 className="page-title">Usuarios Registrados</h2>
              <div className="d-flex justify-content-end gap-2">
                <button className='btnCreate' onClick={() => setModalCrear(true)}>
                  <i className="fa-solid fa-plus me-2"></i>Crear
                </button>
                <button
                  className='btn btn-back'
                  title="Volver"
                  onClick={(e) => { e.preventDefault(); navigate('/dashboard-admin'); }}>
                  <i className="fas fa-arrow-left me-2"></i>Volver
                </button>
              </div>
            </div>
            <select
              className="form-select w-auto"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="1">Admin</option>
              <option value="2">Empleado</option>
              <option value="3">Cliente</option>
            </select>

            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-dark text-center">
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Documento</th>
                    <th>Teléfono</th>
                    <th>Rol</th>
                    <th>Activo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td>{u.first_name} {u.last_name}</td>
                        <td>{u.email}</td>
                        <td>{u.document}</td>
                        <td>{u.phone}</td>
                        <td>{u.rol.name}</td>
                        <td className="text-center">
                          {u.is_active ? (
                            <span className="badge bg-success">Activo</span>
                          ) : (
                            <span className="badge bg-secondary">Inactivo</span>
                          )}
                        </td>
                        <td className="actions-cell text-center">
                          <button className="btn btn-primary me-2" onClick={() => abrirModalEditar(u)} title="Editar">
                            <i className="fa-solid fa-pen-to-square text-white"></i>
                          </button>
                          <button className="btn btn-outline-danger me-2" onClick={() => eliminarUsuario(u.id)} title="Eliminar">
                            <i className="fa-solid fa-trash"></i>
                          </button>
                          <button
                            className={`btn ${u.is_active ? "btn-warning" : "btn-success"}`}
                            onClick={() => updateUserFetch({ is_active: !u.is_active }, u.id)}
                            title={u.is_active ? "Desactivar" : "Activar"}
                          >
                            {u.is_active ? (
                              <i className="fa-solid fa-user-slash"></i>
                            ) : (
                              <i className="fa-solid fa-user-check"></i>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center">No hay usuarios</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Crear Usuario */}
        {modalCrear && (
          <div className="modal show d-block modal-overlay" tabIndex={-1}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="header-modal">
                  <div className='close-modal'>
                    <button type="button" className="btn-close" onClick={() => setModalCrear(false)}></button>
                  </div>
                  <div className='title-modal'>
                    <h5 className="modal-title">Crear nuevo usuario</h5>
                  </div>
                </div>

                <form onSubmit={handleCreate}>
                  <div className="modal-body row">
                    <div className='col-6 mb-3'>
                      <select id="type_doc" name="type_doc" className="form-select" value={nuevoUsuario.type_doc} onChange={handleNewChange} required >
                        <option value="">Tipo de documento</option>
                        <option value="CC">Cédula de ciudadania</option>
                        <option value="TI">Tarjeta de identidad</option>
                        <option value="PP">Pasaporte</option>
                      </select>
                    </div>
                    <div className='col-6 mb-3'>
                      <FloatingInput label="Documento" name="document" value={nuevoUsuario.document} onChange={handleNewChange} required />
                    </div>
                    <div className='col-6 mb-3'>
                      <FloatingInput label="Primer nombre" name="first_name" value={nuevoUsuario.first_name} onChange={handleNewChange} required />
                    </div>
                    <div className='col-6 mb-3'>
                      <FloatingInput label="Apellido" name="last_name" value={nuevoUsuario.last_name} onChange={handleNewChange} required />
                    </div>
                    <div className='col-12 mb-3'>
                      <FloatingInput type="email" label="Correo electronico" name="email" value={nuevoUsuario.email} onChange={handleNewChange} required />
                    </div>
                    <div className='col-6 mb-3'>
                      <FloatingInput label="Teléfono" name="phone" value={nuevoUsuario.phone} onChange={handleNewChange} required />
                    </div>
                    <div className='col-6 mb-3'>
                      <FloatingInput type="date" label="Fecha de nacimiento" name="birthdate" value={nuevoUsuario.birthdate} onChange={handleNewChange} required />
                    </div>
                    <div className="col-6 mb-3">
                      <select id="gender" name="gender" className="form-select" value={nuevoUsuario.gender} onChange={handleNewChange} required>
                        <option value="">Genero</option>
                        <option value="male">Masculino</option>
                        <option value="female">Femenino</option>
                        <option value="other">Otro</option>
                      </select>
                    </div>
                    <div className="col-6 mb-3">
                      <select
                        id="rol"
                        name="rol"
                        className="form-select"
                        value={nuevoUsuario.rol}
                        onChange={handleNewChange}
                        required
                      >
                        <option value="">Rol</option>
                        <option value="1">Admin</option>
                        <option value="2">Empleado</option>
                        <option value="3">Usuario</option>
                      </select>

                      {/* Mostrar servicios SOLO si es empleado, usando React Select múltiple */}
                      {nuevoUsuario.rol === "2" && (
                        <div className='servicios-section mt-4'>
                          <label className="mb-2">Selecciona los servicios que presta:</label>
                          <Select
                            isMulti
                            options={allServices.map(s => ({ value: s.id, label: s.name }))}
                            value={allServices.filter(s => selectedServiceIds.includes(s.id)).map(s => ({ value: s.id, label: s.name }))}
                            onChange={opts => setSelectedServiceIds(opts ? opts.map(o => o.value) : [])}
                            placeholder="Selecciona uno o varios servicios..."
                          />
                          {selectedServiceIds.length > 0 && (
                            <div className="selected-summary mt-2">
                              {allServices
                                .filter(s => selectedServiceIds.includes(s.id))
                                .map(s => (
                                  <span key={s.id} className="selected-chip">
                                    <i className="fa-solid fa-check me-1"></i>{s.name}
                                  </span>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className='col-6 mb-3'>
                      <FloatingInput type="password" label="Contraseña" name="password" value={nuevoUsuario.password} onChange={handleNewChange} required />
                    </div>
                    <div className='col-6 mb-3'>
                      <FloatingInput type="password" label="Confirmar contraseña" name="confirmPassword" value={nuevoUsuario.confirmPassword} onChange={handleNewChange} required />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setModalCrear(false)}>Cancelar</button>
                    <button type="submit" className="btn btn-primary">
                      <i className="fas fa-plus me-2"></i>Crear
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar Usuario */}
        {modalEditar && selectedUser && (
          <div className="modal-overlay" onClick={() => setModalEditar(false)}>
            <div className="modal-contenido row" onClick={(e) => e.stopPropagation()}>
              <h2>Editar usuario</h2>
              <div className='editValues col-md-6'>
                <label>Nombre</label>
                <input type="text" name="first_name" value={selectedUser.first_name} onChange={handleEditChange} />
              </div>
              <div className='editValues col-md-6'>
                <label>Apellido</label>
                <input type="text" name="last_name" value={selectedUser.last_name} onChange={handleEditChange} />
              </div>
              <div className='editValues col-md-6 mb-3'>
                <label>Tipo de documento</label>
                <select id="type_doc" name="type_doc" className="form-select" value={selectedUser.type_doc} onChange={handleEditChange} >
                  <option value="CC">Cédula de ciudadania</option>
                  <option value="TI">Tarjeta de identidad</option>
                  <option value="PP">Pasaporte</option>
                </select>
              </div>
              <div className='editValues col-md-6'>
                <label>Documento</label>
                <input type="text" name="document" value={selectedUser.document} onChange={handleEditChange} />
              </div>
              <div className='editValues col-md-12'>
                <label>Correo electronico</label>
                <input type="email" name="email" value={selectedUser.email} onChange={handleEditChange} />
              </div>
              <div className='editValues'>
                <label>Teléfono</label>
                <input type="tel" name="phone" value={selectedUser.phone} onChange={handleEditChange} />
              </div>
              <div className='editValues'>
                <label>Fecha de nacimiento</label>
                <input type="date" name="birthdate"
                  value={selectedUser.birthdate ? selectedUser.birthdate.replaceAll("/", "-") : ""}
                  onChange={handleEditChange} />
              </div>
              <div className="col-12 mb-3">
                <select id="rol" name="rol" className="form-select" value={selectedUser.rol.id} onChange={handleEditChange}>
                  <option value="1">Admin</option>
                  <option value="2">Empleado</option>
                  <option value="3">Usuario</option>
                </select>
              </div>
              <div className="mb-3 col-md-6">
                <input type="password" className="form-control" name='password' placeholder="Contraseña" onChange={handleEditChange} />
              </div>
              <div className="mb-3 col-md-6">
                <input type="password" className="form-control" name='confirmPassword' placeholder="Confirmar contraseña" onChange={handleEditChange} />
              </div>
              <div className="editValues col-md-12">
                <div className="row">
                  <input
                    className="form-check-input col-md-2 w-auto"
                    type="checkbox"
                    id="isActiveCheck"
                    checked={selectedUser.is_active}
                    onChange={(e) => setSelectedUser({ ...selectedUser, is_active: e.target.checked })}
                  />
                  <label className="form-check-label col-md-10" htmlFor="isActiveCheck">
                    ¿Usuario Activo?
                  </label>
                </div>
              </div>

              {/* Mostrar servicios SOLO si es empleado/estilista (rol id = 2) */}
              {selectedUser.rol && selectedUser.rol.id === 2 && (
                <div className='servicios-section mt-4 col-md-12'>
                  <h5 className="mb-3">Servicios que presta:</h5>

                  {/* Resumen de servicios seleccionados */}
                  {selectedServiceIds.length > 0 && (
                    <div className="selected-summary mb-3">
                      <p className="text-muted mb-2">Servicios asignados:</p>
                      {allServices.filter(s => selectedServiceIds.includes(s.id)).map(s => (
                        <span key={s.id} className="badge bg-primary me-2 mb-1">
                          <i className="fa-solid fa-check me-1"></i>{s.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Lista de servicios disponibles */}
                  <div className="services-checklist" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
                    {allServices.length > 0 ? (
                      allServices.map(s => {
                        const checked = selectedServiceIds.includes(s.id);
                        return (
                          <div key={s.id} className="form-check mb-2">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`service-${s.id}`}
                              checked={checked}
                              onChange={(e) => {
                                setSelectedServiceIds(prev => (
                                  e.target.checked
                                    ? [...prev, s.id]
                                    : prev.filter(id => id !== s.id)
                                ));
                              }}
                            />
                            <label className="form-check-label" htmlFor={`service-${s.id}`}>
                              <strong>{s.name}</strong>
                              {(s.minutes_duration || s.price) && (
                                <small className="text-muted ms-2">
                                  {s.minutes_duration ? `${s.minutes_duration} min` : ''}
                                  {s.minutes_duration && s.price ? ' · ' : ''}
                                  {s.price ? formatCOP(s.price) : ''}
                                </small>
                              )}
                            </label>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-muted">No hay servicios disponibles</p>
                    )}
                  </div>

                  {selectedServiceIds.length > 0 && (
                    <small className="text-muted mt-2 d-block">
                      Servicios seleccionados: {selectedServiceIds.length}
                    </small>
                  )}
                </div>
              )}

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setModalEditar(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={guardarCambios}>
                  <i className="fas fa-save me-2"></i>Guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
      <FooterComponent />
    </div>
  );
};

export default Users;
