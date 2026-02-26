import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import Header from '../../../components/headerClient/Header';
import Footer from '../../../components/footerClient/Footer';
import FloatingBackground from '../../../components/shared/FloatingBackground';
import "./dashboardPerfilCliente.scss";
import "../../employee/dashboardProfileEmployee/dashboardProfileEmployee.scss";
import API_BASE_URL from '../../../config/api';

const DashboardPerfilCliente = () => {
    const navigate = useNavigate();
    const API_BASE = API_BASE_URL;
    const sessionUser = useMemo(() => {
        try { return JSON.parse(sessionStorage.getItem('user') || '{}'); } catch { return {}; }
    }, []);

    // Datos del cliente
    const [cliente, setCliente] = useState({
        id: null,
        nombre: "",
        email: "",
        telefono: "",
        direccion: "",
        preferencias: [],
        foto: "",
        historial: ""
    });

    const [editMode, setEditMode] = useState(false);
    const [editedCliente, setEditedCliente] = useState({ ...cliente });

    const getInitials = (name) => {
        if (!name) return '';
        const parts = String(name).trim().split(/\s+/).filter(Boolean);
        const initials = parts.slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('');
        return initials || (name[0]?.toUpperCase() || '');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedCliente({
            ...editedCliente,
            [name]: value
        });
    };

    useEffect(() => {
        const fetchClient = async () => {
            try {
                const id = sessionUser?.id || sessionUser?.user?.id;
                if (!id) return;
                const res = await fetch(`${API_BASE}/api/users/${id}`);
                if (!res.ok) throw new Error('No se pudo cargar el perfil');
                const data = await res.json();
                const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ').trim();
                const perfil = {
                    id: data.id,
                    nombre: fullName || (sessionUser?.name || ''),
                    email: data.email || sessionUser?.email || '',
                    telefono: data.phone || '',
                    direccion: "",
                    preferencias: Array.isArray(cliente.preferencias) ? cliente.preferencias : [],
                    foto: cliente.foto || "",
                    historial: data.bio || ''
                };
                setCliente(perfil);
                setEditedCliente(perfil);
            } catch (e) {
                console.error(e);
                alert('No se pudo cargar tu perfil.');
            }
        };
        fetchClient();
    }, []);

    const handleSave = async () => {
        try {
            if (!cliente.id) return;
            const payload = {
                email: editedCliente.email,
                phone: editedCliente.telefono,
                bio: editedCliente.historial || '',
            };
            const res = await fetch(`${API_BASE}/api/users/${cliente.id}`, {
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
            // Realizar un GET para obtener la entidad actualizada (el PUT puede devolver UpdateResult)
            const resGet = await fetch(`${API_BASE}/api/users/${cliente.id}`);
            if (!resGet.ok) throw new Error('No se pudo recargar el perfil actualizado');
            const updated = await resGet.json();
            const perfil = {
                id: updated.id,
                nombre: [updated.first_name, updated.last_name].filter(Boolean).join(' ').trim() || editedCliente.nombre,
                email: updated.email,
                telefono: updated.phone,
                direccion: editedCliente.direccion,
                preferencias: editedCliente.preferencias,
                foto: editedCliente.foto,
                historial: updated.bio || editedCliente.historial || '',
            };
            setCliente(perfil);
            setEditedCliente(perfil);
            setEditMode(false);
        } catch (e) {
            console.error(e);
            alert(e.message);
        }
    };

    const handleCancel = () => {
        setEditedCliente({ ...cliente });
        setEditMode(false);
    };

    return (
        <div className="employee-layout dashboard-perfil-cliente">
            <FloatingBackground />
            <Header />
            <section className="profile-section employee-page">
                <div className="container-fluid px-lg-5">
                    <div className="header-bar">
                        <div className="hb-spacer"></div>
                        <h1 className="profile-title">Mi Perfil</h1>
                        <button
                            className="back-to-dashboard-emp"
                            onClick={(e) => { e.preventDefault(); navigate('/dashboard-client'); }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><path fill="none" d="M0 0h24v24H0z" /><path d="M7.828 11H20v2H7.828l5.364 5.364-1.414 1.414L4 12l7.778-7.778 1.414 1.414L7.828 11z" fill="currentColor" /></svg>
                            <span>Volver</span>
                        </button>
                    </div>


                    <div className="card profile-card-wide mb-4 col-12">
                        <div className="">
                            <div className="w-100">
                                <div className="profile-content-wide d-flex justify-content-center flex-column">
                                    <div className="profile-summary">
                                        <div className="avatar-lg" aria-hidden>
                                            {getInitials(cliente.nombre)}
                                        </div>
                                        <div className="summary-main">
                                            <div className="summary-name">{cliente.nombre || '—'}</div>
                                            <div className="chips">
                                                {cliente.email && <span className="chip"><i className="fa-solid fa-envelope"></i>{cliente.email}</span>}
                                                {cliente.telefono && <span className="chip"><i className="fa-solid fa-phone"></i>{cliente.telefono}</span>}
                                            </div>
                                        </div>

                                        {/* Desktop Edit Button - Inline */}
                                        {!editMode && (
                                            <div className="ms-auto d-none d-md-block">
                                                <button className="btn btn-primary btn-edit" onClick={() => setEditMode(true)}>
                                                    <i className="fas fa-edit me-2"></i>Editar Perfil
                                                </button>
                                            </div>
                                        )}
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
                                                            value={editedCliente.email}
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
                                                            value={editedCliente.telefono}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    <div className="profile-actions d-flex justify-content-end mb-0 mt-4">
                                        {editMode ? (
                                            <div>
                                                <button className="btn btn-primary btn-save me-2" onClick={handleSave}>
                                                    <i className="fas fa-save me-2"></i>Guardar
                                                </button>
                                                <button className="btn btn-secondary btn-cancel" onClick={handleCancel}>
                                                    <i className="fas fa-times me-2"></i>Cancelar
                                                </button>
                                            </div>
                                        ) : (
                                            // Mobile Edit Button - Only visible on small screens
                                            <div className="d-md-none w-100">
                                                <button className="btn btn-primary btn-edit w-100" onClick={() => setEditMode(true)}>
                                                    <i className="fas fa-edit me-2"></i>Editar Perfil
                                                </button>
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

export default DashboardPerfilCliente;