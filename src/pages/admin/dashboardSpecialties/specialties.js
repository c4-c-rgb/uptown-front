import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import HeaderComponent from '../../../components/headerAdmin/header';
import FooterComponent from '../../../components/footerAdmin/adminFooter';
import FloatingBackground from '../../../components/shared/FloatingBackground';
import "./specialties.scss";

const Specialties = () => {
    const navigate = useNavigate();
    const [nombre, setNombre] = useState('');
    const [mostrarModal, setMostrarModal] = useState(false);
    const abrirModal = () => setMostrarModal(true);
    const cerrarModal = () => setMostrarModal(false);
    const handleChange = (e) => {
        setNombre(e.target.value);
    };
    const specialties = [
        {
            id: 1,
            nombre: 'Corte y estilismo',
        },
        {
            id: 2,
            nombre: 'Coloración',
        },
        {
            id: 3,
            nombre: 'Tratamientos capilares',
        },
        {
            id: 4,
            nombre: 'Barberia',
        },
        {
            id: 5,
            nombre: 'Estetica adicional',
        },
    ];
    return (
        <div className="admin-specialties-page">
            <FloatingBackground />
            <HeaderComponent />
            <section>
                <div className="container mt-3 row">
                    <div className='col-12 dataTable'>
                        <div className='p-3 mb-3'>
                            <h2 className="page-title">Especialidades</h2>
                            <div className="d-flex justify-content-end gap-2 mb-2">
                                <button className="btn btn-outline-primary" onClick={abrirModal} title="Crear">
                                    <i className="fa-solid fa-plus me-2"></i>Crear
                                </button>
                                <button className="btn btn-back" onClick={(e) => { e.preventDefault(); navigate('/dashboard-admin'); }}>
                                    <i className="fas fa-arrow-left me-2"></i>Volver
                                </button>
                            </div>
                        </div>
                        <table className="table table-bordered table-hover align-middle">
                            <thead className="table-dark text-center">
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {specialties.map((u) => (
                                    <tr key={u.id}>
                                        <td className="text-center">{u.id}</td>
                                        <td>{u.nombre}</td>
                                        <td className="text-center">
                                            <button className="btn btn-sm btn-warning me-2" onClick={abrirModal} title="Editar">
                                                <i className="fa-solid fa-pen-to-square"></i>
                                                {mostrarModal && (
                                                    <div className="modal-overlay" onClick={cerrarModal}>
                                                        <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
                                                            <h2>Editar usuario</h2>
                                                            <div className='editValues'>
                                                                <label>Nombre</label>
                                                                <input type="text" id="name" name="name" value={u.nombre} onChange={handleChange}></input>
                                                            </div>
                                                            <button className="btn btn-primary" onClick={cerrarModal}>Guardar</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </button>
                                            <button className="btn btn-sm btn-danger" title="Eliminar">
                                                <i class="fa-solid fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
            <FooterComponent />
        </div>
    )
}


export default Specialties;