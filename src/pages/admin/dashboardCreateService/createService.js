// createServices.js
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import HeaderComponent from '../../../components/headerAdmin/header';
import FooterComponent from '../../../components/footerAdmin/adminFooter';
import "./createService.scss";
import API_BASE_URL from '../../../config/api';

const CreateServices = () => {
    const navigate = useNavigate();
    const BASE_URL = API_BASE_URL;
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [minutes_duration, setMinutesDuration] = useState('');
    const [img, setImg] = useState(null);
    const [imgError, setImgError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
            if (allowedTypes.includes(file.type)) {
                setImg(file);
                setImgError('');
            } else {
                setImg(null);
                setImgError('Solo se permiten archivos PNG o JPG.');
            }
        } else {
            setImg(null);
            setImgError('Debes seleccionar una imagen.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 🚨 Validación de imagen
        if (!img) {
            setImgError("Debes subir una imagen para crear el servicio.");
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('price', price);
        formData.append('minutes_duration', minutes_duration);
        formData.append('active', 1);
        formData.append('imagen', img);
    }


    try {
        const res = await fetch(BASE_URL, {
            method: 'POST',
            body: formData,
        });

        if (res.ok) {
            setLoading(false);
            navigate('/dashboard-admin');
        } else {
            setLoading(false);
            setImgError('Error al crear el servicio');
        }
    } catch (err) {
        setLoading(false);
        setImgError('Error de conexión con el servidor');
    }
};

return (
    <>
        <HeaderComponent />
        <section className="creser">
            <div className="container mt-5 creser-two">
                <i className="fas fa-arrow-left iconClose" onClick={(e) => { e.preventDefault(); navigate('/dashboard-admin'); }}></i>
                <div className='formCard'>
                    <div className="card mb-4">
                        <div className="card-body">
                            <h2 className="card-title d-flex justify-content-center">Crear Servicio</h2>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3 row">
                            <div className='col-6'>
                                <label htmlFor="service" className="form-label">Nombre del Servicio:</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="service"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className='col-6'>
                                <label htmlFor="price" className="form-label">Precio del Servicio:</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="price"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    required
                                />
                            </div>
                            <div className='col-6'>
                                <label htmlFor="minutes_duration" className="form-label">Duración del Servicio:</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="minutes_duration"
                                    value={minutes_duration}
                                    onChange={(e) => setMinutesDuration(e.target.value)}
                                    required
                                />
                            </div>
                            <div className='col-6'>
                                <label htmlFor="img" className="form-label">Imagen del Servicio:</label>
                                <input
                                    type="file"
                                    className="form-control"
                                    id="img"
                                    accept=".jpg, .jpeg, .png"
                                    onChange={handleImageChange}
                                    required
                                />
                                {imgError && <div className="text-danger mt-1">{imgError}</div>}
                            </div>
                            <div className='col-12'>
                                <label htmlFor="description" className="form-label">Descripción:</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </form>
                </div>
            </div>
        </section>
        <FooterComponent />
    </>
);
};

export default CreateServices;
