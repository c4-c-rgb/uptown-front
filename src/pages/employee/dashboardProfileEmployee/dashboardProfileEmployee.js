import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import Header from '../../../components/headerEmployee/header';
import Footer from '../../../components/footerEmployee';
import FloatingBackground from '../../../components/shared/FloatingBackground';
import './dashboardProfileEmployee.scss';
import API_BASE_URL from '../../../config/api';


const DashboardProfileEmployee = () => {
    const navigate = useNavigate();
    const API_BASE = API_BASE_URL;

    // Usuario logueado (sesión)
    const sessionUser = useMemo(() => {
        try { return JSON.parse(sessionStorage.getItem('user') || '{}'); } catch { return {}; }
    }, []);

    // Datos del empleado (desde backend)
    const [empleado, setEmpleado] = useState({
        id: null,
        nombre: '',
        email: '',
        telefono: '',
        especialidades: [],
        horario: {},
        bio: '',
    });

    const [editMode, setEditMode] = useState(false);
    const [editedEmpleado, setEditedEmpleado] = useState({ ...empleado });

    const getInitials = (name) => {
        if (!name) return '';
        const parts = String(name).trim().split(/\s+/).filter(Boolean);
        const initials = parts.slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('');
        return initials || (name[0]?.toUpperCase() || '');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedEmpleado({
            ...editedEmpleado,
            [name]: value
        });
    };

    // Cargar datos del empleado
    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                // id puede venir como sessionUser.id o sessionUser.user?.id según tu backend
                const id = sessionUser?.id || sessionUser?.user?.id;
                if (!id) return;
                const res = await fetch(`${API_BASE}/api/users/estilistas/${id}`);
                if (!res.ok) throw new Error('No se pudo cargar el perfil');
                const data = await res.json();
                const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ').trim();
                const especialidades = Array.isArray(data.services) ? data.services.map(s => s.name) : [];
                const perfil = {
                    id: data.id,
                    nombre: fullName || (sessionUser?.name || ''),
                    email: data.email || sessionUser?.email || '',
                    telefono: data.phone || '',
                    especialidades,
                    horario: {},
                    bio: data.bio || '',
                };
                setEmpleado(perfil);
                setEditedEmpleado(perfil);
            } catch (e) {
                console.error(e);
                alert('No se pudo cargar tu perfil.');
            }
        };
        fetchEmployee();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleHorarioChange = (day, value) => {
        // Mantener UI, pero no persistimos horarios por ahora (no solicitado)
        setEditedEmpleado(prev => ({
            ...prev,
            horario: {
                ...prev.horario,
                [day]: value,
            },
        }));
    };

    const handleSave = async () => {
        try {
            if (!empleado.id) return;
            const payload = {
                email: editedEmpleado.email,
                phone: editedEmpleado.telefono,
                bio: editedEmpleado.bio || '',
            };
            const res = await fetch(`${API_BASE}/api/users/estilistas/${empleado.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const ct = res.headers.get('content-type') || '';
                let msg = 'No se pudo guardar tus cambios';
                if (ct.includes('application/json')) {
                    const j = await res.json();
                    msg = j.message || msg;
                } else {
                    msg = await res.text() || msg;
                }
                throw new Error(msg);
            }
            // Reconsultar el estilista actualizado
            const resGet = await fetch(`${API_BASE}/api/users/estilistas/${empleado.id}`);
            if (!resGet.ok) throw new Error('No se pudo recargar el perfil actualizado');
            const updated = await resGet.json();
            const especialidades = Array.isArray(updated.services) ? updated.services.map(s => s.name) : empleado.especialidades;
            const perfil = {
                id: updated.id,
                nombre: [updated.first_name, updated.last_name].filter(Boolean).join(' ').trim() || empleado.nombre,
                email: updated.email,
                telefono: updated.phone,
                especialidades,
                horario: empleado.horario,
                bio: updated.bio || editedEmpleado.bio || '',
            };
            setEmpleado(perfil);
            setEditedEmpleado(perfil);
            setEditMode(false);
        } catch (e) {
            console.error(e);
            alert(e.message);
        }
    };

    const handleCancel = () => {
        setEditedEmpleado({ ...empleado });
        setEditMode(false);
    };

    return (
        <div className="employee-layout">
            <FloatingBackground />
            <Header />
            <section className="profile-section employee-page">
                <div className="container-fluid px-lg-5">
                    <div className="header-bar">
                        <div className="hb-spacer" aria-hidden="true"></div>
                        <h1 className="profile-title">Mi Perfil</h1>
                        <button
                            className="back-to-dashboard-emp"
                            onClick={(e) => { e.preventDefault(); navigate('/dashboard-employee'); }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><path fill="none" d="M0 0h24v24H0z" /><path d="M7.828 11H20v2H7.828l5.364 5.364-1.414 1.414L4 12l7.778-7.778 1.414 1.414L7.828 11z" fill="currentColor" /></svg>
                            <span>Volver</span>
                        </button>
                    </div>

                    <div className="profile-actions">
                        {editMode ? (
                            <div>
                                <button className="btn btn-save me-2" onClick={handleSave}>
                                    <i className="fas fa-save me-2"></i>Guardar
                                </button>
                                <button className="btn btn-cancel" onClick={handleCancel}>
                                    <i className="fas fa-times me-2"></i>Cancelar
                                </button>
                            </div>
                        ) : (
                            <button className="btn btn-edit" onClick={() => setEditMode(true)}>
                                <i className="fas fa-edit me-2"></i>Editar Perfil
                            </button>
                        )}
                    </div>

                    <div className="card profile-card-wide mb-4 col-12">
                        <div className="row g-0">
                            <div className="col-xl-3 col-lg-4 profile-sidebar-wide">
                                <div className="profile-info-sidebar w-100">
                                    <h5 className="mb-3">Biografía</h5>
                                    {editMode ? (
                                        <textarea
                                            className="form-control bio-textarea-wide"
                                            name="bio"
                                            rows="10"
                                            placeholder="Escribe una breve biografía..."
                                            value={editedEmpleado.bio}
                                            onChange={handleInputChange}
                                        />
                                    ) : (
                                        <p className="bio-text-wide">{empleado.bio || 'Sin biografía.'}</p>
                                    )}
                                </div>
                            </div>
                            <div className="col-xl-9 col-lg-8">
                                <div className="profile-content-wide">
                                    <div className="profile-summary">
                                        <div className="avatar-lg" aria-hidden>
                                            {getInitials(empleado.nombre)}
                                        </div>
                                        <div className="summary-main">
                                            <div className="summary-name">{empleado.nombre || '—'}</div>
                                            <div className="chips">
                                                {empleado.email && <span className="chip"><i className="fa-solid fa-envelope"></i>{empleado.email}</span>}
                                                {empleado.telefono && <span className="chip"><i className="fa-solid fa-phone"></i>{empleado.telefono}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    {editMode && (
                                        <>
                                            <div className="section-title-wide">
                                                <h4>Información Personal</h4>
                                                <div className="divider-wide"></div>
                                            </div>
                                            <div className="row gy-4">
                                                <div className="col-md-6">
                                                    <div className="info-field-wide mb-4">
                                                        <label>Email</label>
                                                        <input
                                                            type="email"
                                                            className="form-control"
                                                            name="email"
                                                            value={editedEmpleado.email}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="info-field-wide mb-4">
                                                        <label>Teléfono</label>
                                                        <input
                                                            type="tel"
                                                            className="form-control"
                                                            name="telefono"
                                                            value={editedEmpleado.telefono}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div className="info-field-wide mb-4">
                                        <label className="fw-bold">Servicios</label>
                                        {empleado.especialidades.length === 0 ? (
                                            <span className="text-muted">Aún no tienes servicios asignados.</span>
                                        ) : (
                                            <div className="badges">
                                                {empleado.especialidades.map((especialidad, index) => (
                                                    <span key={index} className="badge-pill">{especialidad}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </section>
            <Footer />
        </div>
    );
};

export default DashboardProfileEmployee;