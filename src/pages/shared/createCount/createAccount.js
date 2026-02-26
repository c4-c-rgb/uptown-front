import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import './createAccount.scss';
import API_BASE_URL from '../../../config/api';

// Base URL para API
const BASE_URL = API_BASE_URL;
const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '';

const CreateAccount = () => {
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
  const navigate = useNavigate();
  const [nuevoUsuario, setNuevoUsuario] = useState(initialUserState);
  const [captchaToken, setCaptchaToken] = useState(null);
  const handleNewChange = (e) => {
    setNuevoUsuario({ ...nuevoUsuario, [e.target.name]: e.target.value });
  };

  const createUserFetch = async (newUser) => {
    try {
      const res = await fetch(`${BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newUser,
          recaptchaToken: captchaToken,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error en la petición");
      } else {
        setNuevoUsuario(initialUserState);
        alert('Se ha registrado exitosamente')
        navigate("/dashboard-login");
      }
    } catch (error) {
      alert(`Hubo un error: ${error.message}`);
    }
  };
  const handleCreate = (e) => {
    e.preventDefault();

    if (!RECAPTCHA_SITE_KEY) {
      alert('El reCAPTCHA no está configurado. Falta REACT_APP_RECAPTCHA_SITE_KEY.');
      return;
    }

    if (!captchaToken) {
      alert('Por favor completa el reCAPTCHA antes de registrarte.');
      return;
    }

    if (nuevoUsuario.password === nuevoUsuario.confirmPassword) {
      createUserFetch({
        "type_doc": nuevoUsuario?.type_doc || '',
        "document": nuevoUsuario?.document || '',
        "first_name": nuevoUsuario?.first_name || '',
        "last_name": nuevoUsuario?.last_name || '',
        "email": nuevoUsuario?.email || '',
        "phone": nuevoUsuario?.phone || '',
        "gender": nuevoUsuario?.gender || '',
        // Mantener formato ISO (YYYY-MM-DD)
        "birthdate": nuevoUsuario?.birthdate || '',
        // Enviar booleano real
        "is_active": Boolean(nuevoUsuario?.active),
        "password": nuevoUsuario?.password || '',
        // Rol por defecto usuario final
        "id_rol": 3
      })
      console.log(nuevoUsuario);
      console.log("Se envio correctamente el formulario");
    } else {
      alert("Las contraseñas no coinciden");
    }

  };

  return (
    <section id='background' className="" style={{ minHeight: '100vh' }}>
      <div className="registration-background">
        <div className="floating-shapes">
          <div className="floating-shape" style={{ '--size': '140px', '--x': '15%', '--y': '20%', '--duration': '16s', '--delay': '0s' }} />
          <div className="floating-shape" style={{ '--size': '90px', '--x': '80%', '--y': '18%', '--duration': '18s', '--delay': '0.8s' }} />
          <div className="floating-shape" style={{ '--size': '60px', '--x': '70%', '--y': '70%', '--duration': '14s', '--delay': '0.4s' }} />
          <div className="floating-shape" style={{ '--size': '110px', '--x': '30%', '--y': '75%', '--duration': '20s', '--delay': '1.2s' }} />
          <div className="floating-shape" style={{ '--size': '40px', '--x': '55%', '--y': '40%', '--duration': '12s', '--delay': '0.6s' }} />
          <div className="floating-shape" style={{ '--size': '75px', '--x': '10%', '--y': '60%', '--duration': '17s', '--delay': '0.3s' }} />
          <div className="floating-shape" style={{ '--size': '50px', '--x': '88%', '--y': '50%', '--duration': '13s', '--delay': '1.1s' }} />
          <div className="floating-shape" style={{ '--size': '35px', '--x': '42%', '--y': '22%', '--duration': '11s', '--delay': '0.9s' }} />
          <div className="floating-shape" style={{ '--size': '95px', '--x': '65%', '--y': '28%', '--duration': '19s', '--delay': '0.2s' }} />
          <div className="floating-shape" style={{ '--size': '55px', '--x': '25%', '--y': '45%', '--duration': '15s', '--delay': '1.4s' }} />
        </div>
      </div>
      <div className="registration-card">
        <aside className="registration-aside">
          <div>
            <div className="brand-top">
              <span className="brand-badge">U</span>
              <span>Uptownhair</span>
            </div>
            <h3 className="aside-title">Crea tu cuenta</h3>
            <p className="aside-text">Reserva más rápido, guarda tus preferencias y recibe recordatorios.</p>
            <div className="aside-points">
              <div className="aside-point"><span>•</span><span>Acceso a historial y próximas reservas</span></div>
              <div className="aside-point"><span>•</span><span>Notificaciones de confirmación y recordatorio</span></div>
              <div className="aside-point"><span>•</span><span>Atajos para tus servicios favoritos</span></div>
            </div>
          </div>
          <div>
            <button type="button" className="link-like" onClick={(e) => { e.preventDefault(); navigate('/dashboard-login'); }}>¿Ya tienes cuenta? Inicia sesión</button>
          </div>
        </aside>

        <div className="registration-body">
          <h3 className="registration-title">Registro de Usuario</h3>
          <p className="registration-subtitle">Completa tus datos para empezar a reservar.</p>

          <form onSubmit={handleCreate}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <input type="text" className="form-control" name="first_name" placeholder="Nombre" value={nuevoUsuario.first_name} onChange={handleNewChange} required />
              </div>
              <div className="col-md-6 mb-3">
                <input type="text" className="form-control" name="last_name" placeholder="Apellido" value={nuevoUsuario.last_name} onChange={handleNewChange} required />
              </div>
              <div className='col-md-6 mb-3'>
                <select id="type_doc" name="type_doc" className="form-select" value={nuevoUsuario.type_doc} onChange={handleNewChange} required >
                  <option value="" >Tipo de documento</option>
                  <option value="CC">Cédula</option>
                  <option value="TI">Tarjeta de identidad</option>
                  <option value="PP">Pasaporte</option>
                </select>
              </div>
              <div className="mb-3 col-md-6">
                <input type="number" className="form-control" name="document" placeholder="Documento" value={nuevoUsuario.document} onChange={handleNewChange} required />
              </div>
              <div className="mb-3 col-md-12">
                <input type="email" className="form-control" name='email' placeholder="Correo electrónico" value={nuevoUsuario.email} onChange={handleNewChange} required />
              </div>
              <div className="mb-3 col-md-6">
                <input type="tel" className="form-control" name='phone' placeholder="Teléfono" value={nuevoUsuario.phone} onChange={handleNewChange} required />
              </div>
              <div className="mb-3 col-md-6">
                <input type="date" className="form-control" name='birthdate' value={nuevoUsuario.birthdate} onChange={handleNewChange} required />
              </div>
              <div className="col-md-12 mb-3">
                <select id="gender" name="gender" className="form-select" value={nuevoUsuario.gender} onChange={handleNewChange} required>
                  <option value="">Género</option>
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div className="mb-3 col-md-6">
                <input
                  type="password"
                  className="form-control"
                  name="password"
                  placeholder="Contraseña"
                  value={nuevoUsuario.password}
                  onChange={handleNewChange}
                  required
                  minLength={7}
                  maxLength={8}
                />
              </div>
              <div className="mb-3 col-md-6">
                <input type="password" className="form-control" name='confirmPassword' placeholder="Confirmar contraseña" value={nuevoUsuario.confirmPassword} onChange={handleNewChange} required />
              </div>
              <div className='col-md-12 mb-2'>
                <span>Contraseña debe tener entre 7 y 8 caracteres.</span>
              </div>
              <div className="col-md-12 mb-3 d-flex justify-content-center">
                {RECAPTCHA_SITE_KEY && (
                  <ReCAPTCHA
                    sitekey={RECAPTCHA_SITE_KEY}
                    onChange={(token) => setCaptchaToken(token)}
                  />
                )}
              </div>
            </div>
            <button type="submit" className="register btn btn-primary w-100">Registrarse</button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default CreateAccount;
