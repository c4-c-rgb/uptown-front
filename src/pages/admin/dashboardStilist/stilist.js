import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import HeaderComponent from '../../../components/headerAdmin/header';
import { formatCOP } from '../../../utils/formatCOP';
import FooterComponent from '../../../components/footerAdmin/adminFooter';
import FloatingBackground from '../../../components/shared/FloatingBackground';
import "./stilist.scss";
import API_BASE_URL from '../../../config/api';

const Stilist = () => {
    const navigate = useNavigate();
    const [mostrarModal, setMostrarModal] = useState(false);
    const [estilistas, setEstilistas] = useState([]);
    const [nuevoServicio, setNuevoServicio] = useState('');
    const [servicesVisible, setServicesVisible] = useState(false);
    const [form, setForm] = useState({
        id: null,
        type_doc: 'CC',
        document: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        gender: 'female',
        birthdate: '',
        is_active: true,
        password: '',
        servicios: [] // placeholder no persistente
    });
    const [errors, setErrors] = useState({});
    const [allServices, setAllServices] = useState([]);
    const [serviceFilter, setServiceFilter] = useState("");
    const [selectedServiceIds, setSelectedServiceIds] = useState([]);

    // refs para navegación con Enter
    const fieldOrder = [
        'type_doc',
        'document',
        'first_name',
        'last_name',
        'email',
        'phone',
        'gender',
        'birthdate',
        'is_active',
        'password',
    ];
    const inputRefs = useRef({});

    // URL base centralizada
    const API_BASE = API_BASE_URL;

    const resetForm = () => setForm({
        id: null,
        type_doc: 'CC',
        document: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        gender: 'female',
        birthdate: '',
        is_active: true,
        password: '',
        servicios: []
    });

    const abrirModalCrear = () => {
        resetForm();
        setServicesVisible(false);
        setMostrarModal(true);
        setSelectedServiceIds([]);
    };

    const abrirModalEditar = (estilista) => {
        setForm({
            id: estilista.id,
            type_doc: estilista.type_doc || 'CC',
            document: estilista.document || '',
            first_name: estilista.first_name || '',
            last_name: estilista.last_name || '',
            email: estilista.email || '',
            phone: estilista.phone || '',
            gender: estilista.gender || 'female',
            birthdate: estilista.birthdate || '',
            is_active: estilista.is_active ?? true,
            password: '',
            // Mostrar nombres como placeholder (solo visual). El backend usa 'services'.
            servicios: Array.isArray(estilista.services) ? estilista.services.map(s => s.name) : []
        });
        setServicesVisible(false);
        setMostrarModal(true);
        // Pre-cargar ids de servicios existentes desde backend ('services')
        if (Array.isArray(estilista.services) && estilista.services.length > 0) {
            const ids = estilista.services
                .map(s => (typeof s === 'object' ? s.id : Number(s)))
                .filter(Boolean);
            setSelectedServiceIds(ids);
        } else {
            setSelectedServiceIds([]);
        }
    };

    const cerrarModal = () => setMostrarModal(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        // Limpiar error al modificar el campo
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const validateForm = (isEdit) => {
        const v = {};
        const emailRegex = /^\S+@\S+\.\S+$/;
        const phoneRegex = /^\+?\d{7,15}$/;
        const typeDocs = ['CC', 'TI', 'PP'];
        const genders = ['male', 'female', 'other'];

        if (!form.document || form.document.length < 5 || form.document.length > 10) {
            v.document = 'Documento entre 5 y 10 caracteres';
        }
        if (!form.first_name || form.first_name.length < 2) {
            v.first_name = 'Nombre mínimo 2 caracteres';
        }
        if (!form.last_name || form.last_name.length < 2) {
            v.last_name = 'Apellido mínimo 2 caracteres';
        }
        if (!form.email || !emailRegex.test(form.email)) {
            v.email = 'Email inválido';
        }
        if (!form.phone || !phoneRegex.test(form.phone)) {
            v.phone = 'Teléfono inválido. Use 7 a 15 dígitos (opcional +)';
        }
        if (!typeDocs.includes(form.type_doc)) {
            v.type_doc = 'Tipo de documento inválido';
        }
        if (!genders.includes(form.gender)) {
            v.gender = 'Género inválido';
        }
        if (!form.birthdate) {
            v.birthdate = 'Fecha de nacimiento requerida';
        }
        if (!isEdit) {
            if (!form.password || form.password.length < 7 || form.password.length > 8) {
                v.password = 'Contraseña de 7 a 8 caracteres';
            }
        } else {
            if (form.password && (form.password.length < 7 || form.password.length > 8)) {
                v.password = 'Contraseña de 7 a 8 caracteres';
            }
        }
        return v;
    };

    const agregarServicio = () => {
        if (nuevoServicio.trim()) {
            setForm((prev) => ({ ...prev, servicios: [...prev.servicios, nuevoServicio.trim()] }));
            setNuevoServicio('');
        }
    };

    const eliminarServicio = (index) => {
        setForm((prev) => ({ ...prev, servicios: prev.servicios.filter((_, i) => i !== index) }));
    };

    const fetchStylists = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/users/estilistas`);
            if (!res.ok) throw new Error('Error al cargar estilistas');
            const data = await res.json();
            setEstilistas(data);
        } catch (err) {
            console.error(err);
            alert('No se pudieron cargar los estilistas. Verifique la API.');
        }
    };

    const fetchServices = async () => {
        try {
            const res = await fetch(`${API_BASE}/services`);
            if (!res.ok) throw new Error('Error al cargar servicios');
            const data = await res.json();
            setAllServices(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        console.debug('API_BASE:', API_BASE);
        fetchStylists();
        fetchServices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const guardarEstilista = async () => {
        try {
            // Validaciones por campo
            const isEdit = !!form.id;
            const v = validateForm(isEdit);
            setErrors(v);
            if (Object.keys(v).length > 0) return;
            const payload = { ...form };
            if (!payload.password) delete payload.password; // no enviar password vacío en edición
            delete payload.id; // el id solo en URL
            // incluir ids de servicios seleccionados (para futura persistencia backend)
            if (selectedServiceIds && selectedServiceIds.length) {
                payload.service_ids = selectedServiceIds;
            }
            delete payload.servicios; // mantener placeholder no persistente fuera del payload
            // Normalizar fecha a formato YYYY-MM-DD
            if (payload.birthdate) {
                try {
                    const d = new Date(payload.birthdate);
                    if (!isNaN(d.getTime())) {
                        const yyyy = d.getFullYear();
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const dd = String(d.getDate()).padStart(2, '0');
                        payload.birthdate = `${yyyy}-${mm}-${dd}`;
                    }
                } catch (_) { }
            }

            const url = isEdit
                ? `${API_BASE}/api/users/estilistas/${form.id}`
                : `${API_BASE}/api/users/estilistas`;
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                let msg = 'Error al guardar estilista';
                try {
                    const ct = res.headers.get('content-type') || '';
                    if (ct.includes('application/json')) {
                        const errJson = await res.json();
                        if (Array.isArray(errJson.message)) {
                            msg = errJson.message.join('\n');
                        } else if (typeof errJson.message === 'string') {
                            msg = errJson.message;
                        } else if (errJson.error) {
                            msg = errJson.error;
                        }
                    } else {
                        const errText = await res.text();
                        if (errText) msg = errText;
                    }
                } catch (e) { }
                throw new Error(msg);
            }
            await fetchStylists();
            cerrarModal();
            setErrors({});
        } catch (err) {
            console.error(err);
            alert(`No se pudo guardar el estilista.\n${err?.message || ''}`.trim());
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const name = e.target.name;
            const currentIdx = fieldOrder.indexOf(name);
            if (currentIdx >= 0 && currentIdx < fieldOrder.length - 1) {
                const nextName = fieldOrder[currentIdx + 1];
                const nextEl = inputRefs.current[nextName];
                if (nextEl && typeof nextEl.focus === 'function') {
                    nextEl.focus();
                }
            } else {
                // si es el último, enfocar botón Guardar
                const btn = document.getElementById('btn-guardar-estilista');
                if (btn) btn.focus();
            }
        }
    };

    const eliminarEstilista = async (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar este estilista?')) return;
        try {
            const res = await fetch(`${API_BASE}/api/users/estilistas/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Error al eliminar estilista');
            await fetchStylists();
        } catch (err) {
            console.error(err);
            alert('No se pudo eliminar el estilista.');
        }
    };

    return (
        <div className="admin-stilist-page">
            <FloatingBackground />
            <HeaderComponent />
            <section>
                <div className="container mt-3 row">
                    <div className='col-12 dataTable'>
                        <div className='p-3 mb-3'>
                            <h2 className="page-title">Estilistas</h2>
                            <div className="d-flex justify-content-end gap-2 mb-2">
                                <button
                                    className="btn btn-primary"
                                    onClick={abrirModalCrear}
                                >
                                    <i className="fa-solid fa-circle-plus me-2"></i>
                                    Añadir Estilista
                                </button>
                                <button className="btn btn-back" onClick={() => navigate('/dashboard-admin')}>
                                    <i className="fas fa-arrow-left me-2"></i>Volver
                                </button>
                            </div>
                        </div>
                        <table className="table table-bordered table-hover align-middle">
                            <thead className="table-dark text-center">
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre</th>
                                    <th>Email</th>
                                    <th>Teléfono</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {estilistas.map((estilista) => (
                                    <tr key={estilista.id}>
                                        <td className="text-center">{estilista.id}</td>
                                        <td>{`${estilista.first_name} ${estilista.last_name}`}</td>
                                        <td>{estilista.email}</td>
                                        <td>{estilista.phone}</td>
                                        <td className="text-center">
                                            <button
                                                className="btn btn-sm btn-warning me-2"
                                                onClick={() => abrirModalEditar(estilista)}
                                            >
                                                <i className="fa-solid fa-pen-to-square"></i>
                                            </button>
                                            <button className="btn btn-sm btn-danger" onClick={() => eliminarEstilista(estilista.id)}>
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Modal para crear/editar estilista y servicios (placeholder no persistente) */}
            {mostrarModal && (
                <div className="modal-overlay" onClick={cerrarModal}>
                    <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-stylist">
                            <h2 className="modal-title-center">{form.id ? 'Editar Estilista' : 'Crear nuevo estilista'}</h2>
                            <button className="btn-close" onClick={cerrarModal} aria-label="Cerrar"></button>
                        </div>
                        <div className='row g-3'>
                            <div className='col-md-3'>
                                <label>Tipo Doc</label>
                                <select
                                    ref={el => (inputRefs.current['type_doc'] = el)}
                                    name="type_doc"
                                    className={`form-select underlined ${errors.type_doc ? 'is-invalid' : ''}`}
                                    value={form.type_doc}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                >
                                    <option value="CC">CC</option>
                                    <option value="TI">TI</option>
                                    <option value="PP">PP</option>
                                </select>
                                {errors.type_doc && <div className="invalid-feedback">{errors.type_doc}</div>}
                            </div>
                            <div className='col-md-3'>
                                <label>Documento</label>
                                <input
                                    ref={el => (inputRefs.current['document'] = el)}
                                    name="document"
                                    className={`form-control underlined ${errors.document ? 'is-invalid' : ''}`}
                                    value={form.document}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    autoFocus
                                />
                                {errors.document && <div className="invalid-feedback">{errors.document}</div>}
                            </div>
                            <div className='col-md-3'>
                                <label>Nombre</label>
                                <input
                                    ref={el => (inputRefs.current['first_name'] = el)}
                                    name="first_name"
                                    className={`form-control underlined ${errors.first_name ? 'is-invalid' : ''}`}
                                    value={form.first_name}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                />
                                {errors.first_name && <div className="invalid-feedback">{errors.first_name}</div>}
                            </div>
                            <div className='col-md-3'>
                                <label>Apellido</label>
                                <input
                                    ref={el => (inputRefs.current['last_name'] = el)}
                                    name="last_name"
                                    className={`form-control underlined ${errors.last_name ? 'is-invalid' : ''}`}
                                    value={form.last_name}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                />
                                {errors.last_name && <div className="invalid-feedback">{errors.last_name}</div>}
                            </div>
                            <div className='col-md-4'>
                                <label>Email</label>
                                <input
                                    ref={el => (inputRefs.current['email'] = el)}
                                    type='email'
                                    name="email"
                                    className={`form-control underlined ${errors.email ? 'is-invalid' : ''}`}
                                    value={form.email}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                />
                                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                            </div>
                            <div className='col-md-4'>
                                <label>Teléfono</label>
                                <input
                                    ref={el => (inputRefs.current['phone'] = el)}
                                    name="phone"
                                    className={`form-control underlined ${errors.phone ? 'is-invalid' : ''}`}
                                    value={form.phone}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                />
                                {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                            </div>
                            <div className='col-md-4'>
                                <label>Género</label>
                                <select
                                    ref={el => (inputRefs.current['gender'] = el)}
                                    name="gender"
                                    className={`form-select underlined ${errors.gender ? 'is-invalid' : ''}`}
                                    value={form.gender}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                >
                                    <option value="male">Masculino</option>
                                    <option value="female">Femenino</option>
                                    <option value="other">Otro</option>
                                </select>
                                {errors.gender && <div className="invalid-feedback">{errors.gender}</div>}
                            </div>
                            <div className='col-md-4'>
                                <label>Fecha de nacimiento</label>
                                <input
                                    ref={el => (inputRefs.current['birthdate'] = el)}
                                    type='date'
                                    name="birthdate"
                                    className={`form-control underlined ${errors.birthdate ? 'is-invalid' : ''}`}
                                    value={form.birthdate}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                />
                                {errors.birthdate && <div className="invalid-feedback">{errors.birthdate}</div>}
                            </div>
                            <div className='col-md-4 d-flex align-items-end'>
                                <div className='form-check'>
                                    <input
                                        ref={el => (inputRefs.current['is_active'] = el)}
                                        id='is_active'
                                        type='checkbox'
                                        name='is_active'
                                        className='form-check-input'
                                        checked={form.is_active}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDown}
                                    />
                                    <label htmlFor='is_active' className='form-check-label ms-2'>Activo</label>
                                </div>
                            </div>
                            <div className='col-md-4'>
                                <label>Contraseña {form.id ? '(dejar en blanco para no cambiar)' : ''}</label>
                                <input
                                    ref={el => (inputRefs.current['password'] = el)}
                                    type='password'
                                    name='password'
                                    className={`form-control underlined ${errors.password ? 'is-invalid' : ''}`}
                                    value={form.password}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                />
                                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                            </div>
                        </div>

                        <div className='servicios-section mt-4'>
                            <button className='btn btn-outline-secondary mb-2' onClick={() => setServicesVisible(v => !v)}>
                                {servicesVisible ? 'Ocultar' : 'Selecciona los servicios que presta'}
                            </button>
                            {/* Resumen de seleccionados */}
                            {selectedServiceIds.length > 0 && (
                                <div className="selected-summary">
                                    {(allServices.filter(s => selectedServiceIds.includes(s.id))).map(s => (
                                        <span key={s.id} className="selected-chip">
                                            <i className="fa-solid fa-check me-1"></i>{s.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {servicesVisible && (
                                <>
                                    <p className="text-muted mb-2">Marca uno o varios servicios que este empleado ofrece.</p>
                                    <div className="mb-2">
                                        <input
                                            type="text"
                                            placeholder="Buscar servicio por nombre..."
                                            value={serviceFilter}
                                            onChange={(e) => setServiceFilter(e.target.value)}
                                            className="form-control"
                                        />
                                    </div>
                                    <div className="services-checklist">
                                        {allServices
                                            .filter(s => s.name?.toLowerCase().includes(serviceFilter.toLowerCase()))
                                            .map(s => {
                                                const checked = selectedServiceIds.includes(s.id);
                                                return (
                                                    <label key={s.id} className={`service-item ${checked ? 'checked' : ''}`}>
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={(e) => {
                                                                setSelectedServiceIds(prev => (
                                                                    e.target.checked
                                                                        ? [...prev, s.id]
                                                                        : prev.filter(id => id !== s.id)
                                                                ));
                                                            }}
                                                        />
                                                        <span className="checkbox-box" aria-hidden="true">
                                                            <i className="fa-solid fa-check"></i>
                                                        </span>
                                                        <span className="service-name">{s.name}</span>
                                                        {(s.minutes_duration || s.price) && (
                                                            <span className="service-meta">
                                                                {s.minutes_duration ? `${s.minutes_duration} min` : ''}
                                                                {s.minutes_duration && s.price ? ' · ' : ''}
                                                                {s.price ? formatCOP(s.price) : ''}
                                                            </span>
                                                        )}
                                                    </label>
                                                );
                                            })}
                                    </div>
                                    {selectedServiceIds.length > 0 && (
                                        <div className="mt-2">
                                            <small className="text-muted">
                                                Seleccionados: {selectedServiceIds.length}
                                            </small>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="modal-footer mt-3">
                            <button
                                className="btn btn-secondary btn-cancel"
                                onClick={cerrarModal}
                            >
                                Cancelar
                            </button>
                            <button
                                id="btn-guardar-estilista"
                                className="btn btn-primary btn-create"
                                onClick={guardarEstilista}
                            >
                                {form.id ? 'Guardar cambios' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <FooterComponent />
        </div>
    );
};

export default Stilist;