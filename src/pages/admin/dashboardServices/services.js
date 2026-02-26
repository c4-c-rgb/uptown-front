// src/.../services.js
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import HeaderComponent from '../../../components/headerAdmin/header';
import { formatCOP } from '../../../utils/formatCOP';
import FooterComponent from '../../../components/footerAdmin/adminFooter';
import FloatingBackground from '../../../components/shared/FloatingBackground';
import "./services.scss";
import API_BASE_URL from '../../../config/api';

const BASE_URL = API_BASE_URL;

function FloatingInput({ id, label, name, type = "text", value, onChange, className = "" }) {
  const [isActive, setIsActive] = useState(false);
  const [hasError, setHasError] = useState(false);
  const filled = value !== undefined && value !== null && value.toString().trim() !== "";

  return (
    <div className={`input-group ${className}`}>
      <input
        id={id}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => { setIsActive(true); setHasError(false); }}
        onBlur={() => { if (!filled) { setIsActive(false); setHasError(true); } }}
        className={`form-control mb-2 ${hasError ? "error" : ""}`}
        autoComplete="off"
      />
      <label htmlFor={id} className={`label ${isActive || filled ? "active" : ""}`}>{label}</label>
    </div>
  );
}

const Services = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', minutes_duration: '', image: '' });
  const [mostrarModal, setMostrarModal] = useState(false);
  const [img, setImg] = useState(null);
  const [imgError, setImgError] = useState('');

  const loadServices = useCallback(() => {
    fetch(`${BASE_URL}/services`)
      .then(res => res.json())
      .then(data => setServices(data))
      .catch(err => console.error("Error cargando servicios:", err));
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setImg(null);
      setImgError('Solo se permiten PNG/JPG');
      return;
    }
    setImg(file);
    setImgError('');
  };

  const handleEdit = (servicio) => {
    setEditandoId(servicio.id);
    setForm({
      name: servicio.name || '',
      description: servicio.description || '',
      price: servicio.price || '',
      minutes_duration: servicio.minutes_duration || '',
      image: servicio.image || ''
    });
    setImg(null);
    setMostrarModal(true);
  };

  const handleCreateClick = () => {
    setEditandoId(null);
    setForm({ name: '', description: '', price: '', minutes_duration: '', image: '' });
    setImg(null); setImgError(''); setMostrarModal(true);
  };

  const handleSave = async () => {
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      fd.append('price', form.price);
      fd.append('minutes_duration', form.minutes_duration);
      fd.append('active', 1);

      if (img) fd.append('imagen', img);

      let url = `${BASE_URL}/services`;
      let method = 'POST';
      if (editandoId) {
        url = `${BASE_URL}/services/${editandoId}`;
        method = 'PUT';
      }

      const res = await fetch(url, { method, body: fd });
      const data = await res.json();

      if (!res.ok) {
        alert(`Error al guardar: ${data.message || 'Revisa los campos'}`);
        console.error('Error en respuesta del servidor', data);
        return;
      }

      await loadServices();

      setMostrarModal(false);
      setForm({ name: '', description: '', price: '', minutes_duration: '', image: '' });
      setImg(null); setImgError('');
    } catch (err) {
      console.error('Error guardando servicio:', err);
      alert('Error al conectar con el servidor');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar servicio?')) return;
    try {
      const res = await fetch(`${BASE_URL}/services/${id}`, { method: 'DELETE' });
      if (res.ok) loadServices();
    } catch (err) {
      console.error('Error eliminando', err);
    }
  };

  return (
    <div className="admin-services-page">
      <FloatingBackground />
      <HeaderComponent />
      <section className="edit-services container">
        <div className='dataCards'>
          <div className='row'>
            <div className='mb-4'>
              <h2 className="page-title">Servicios</h2>
              <div className="d-flex justify-content-end gap-2">
                <button className="btn btn-primary" onClick={handleCreateClick}>
                  <i className="fa-solid fa-plus me-2"></i> Crear servicio
                </button>
                <button
                  className='btn btn-back'
                  title="Volver"
                  onClick={(e) => { e.preventDefault(); navigate('/dashboard-admin'); }}>
                  <i className="fas fa-arrow-left me-2" ></i>Volver
                </button>
              </div>
            </div>


            <div className="service-grid">
              {services.map(s => (
                <div className="" key={s.id}>
                  <div className="card-service">
                    {s.image && (
                      <img
                        src={
                          (s.image?.startsWith && s.image.startsWith('http'))
                            ? s.image
                            : `${BASE_URL}${s.image?.startsWith('/') ? '' : '/'}${s.image}`
                        }
                        alt={s.name}
                        className="card-img-top"
                      />
                    )}
                    <div className="card-body">
                      <p className="card-text">{s.description}</p>
                      <p><strong>Precio:</strong> {formatCOP(s.price)}</p>
                      <p><strong>Duración:</strong> {s.minutes_duration} minutos</p>
                      <div className="actions">
                        <button className="btn-edit" onClick={() => handleEdit(s)}>
                          <i className="fa-solid fa-pen-to-square"></i> Editar
                        </button>
                        <button className="btn-delete" onClick={() => handleDelete(s.id)}>
                          <i className="fa-solid fa-trash"></i> Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {mostrarModal && (
        <div className="modal show d-block modal-overlay" tabIndex={-1}>
          <div className="modal-dialog"><div className="modal-content">
            <div className="header-modal">
              <div className='close-modal'><button className="btn-close" onClick={() => setMostrarModal(false)} /></div>
              <div className='title-modal'><h5 className="modal-title">{editandoId ? 'Editar servicio' : 'Crear nuevo servicio'}</h5></div>
            </div>

            <div className="modal-body row">
              <div className='col-12 mb-3'><FloatingInput id="name" label="Nombre:" name="name" value={form.name} onChange={handleChange} /></div>
              <div className='col-6 mb-3'><FloatingInput id="price" label="Precio:" name="price" type="number" value={form.price} onChange={handleChange} /></div>
              <div className='col-6 mb-3'><FloatingInput id="minutes_duration" label="Tiempo:" name="minutes_duration" type="number" value={form.minutes_duration} onChange={handleChange} /></div>
              <div className='col-12 mb-3'><FloatingInput id="description" label="Descripción:" name="description" value={form.description} onChange={handleChange} /></div>

              <div className='col-12 mb-3'>
                <label htmlFor="img" className="form-label">Imagen del Servicio:</label>
                <input type="file" className="form-control" id="img" accept=".jpg,.jpeg,.png" onChange={handleImageChange} />
                {imgError && <div className="text-danger mt-1">{imgError}</div>}
                {(img || form.image) && (
                  <div className="mt-3 text-center">
                    <img
                      src={
                        img
                          ? URL.createObjectURL(img)
                          : (form.image?.startsWith && form.image.startsWith('http'))
                            ? form.image
                            : `${BASE_URL}${form.image?.startsWith('/') ? '' : '/'}${form.image}`
                      }
                      alt="preview"
                      style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary btn-cancel" onClick={() => setMostrarModal(false)}>Cancelar</button>
              <button className="btn btn-primary btn-create-service" onClick={handleSave}>{editandoId ? 'Guardar cambios' : 'Crear'}</button>
            </div>
          </div></div>
        </div>
      )}
      <FooterComponent />
    </div>
  );
};

export default Services;
