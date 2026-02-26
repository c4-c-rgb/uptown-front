import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import './login.scss';
import API_BASE_URL from '../../../config/api';

// Base URL para API
const BASE_URL = API_BASE_URL;
const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '';

const Login = () => {
  const initialUserState = {
    email: "",
    password: "",
  };
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginUser, setLoginUser] = useState(initialUserState);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showRecaptcha, setShowRecaptcha] = useState(false); // mostrar captcha solo cuando sea obligatorio
  const [attempts, setAttempts] = useState(0);

  const loginUserFetch = async (loginUser) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...loginUser,
          recaptchaToken: captchaToken,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok) {
        if (contentType.includes('application/json')) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Error en la petición");
        } else {
          const errorText = await res.text();
          throw new Error(`Respuesta no válida del servidor: ${errorText.slice(0, 200)}`);
        }
      } else {
        if (!contentType.includes('application/json')) {
          const errorText = await res.text();
          throw new Error(`El servidor no retornó JSON válido. Detalle: ${errorText.slice(0, 200)}`);
        }
        const data = await res.json();
        if (data.active === true) {
          sessionStorage.setItem("user", JSON.stringify(data));
          // resetear captcha y reintentos al iniciar sesión correctamente
          setAttempts(0);
          setShowRecaptcha(false);
          setCaptchaToken(null);
          switch (data.rol.id) {
            case 1:
              navigate('/dashboard-admin')
              break;
            case 2:
              navigate('/dashboard-employee')
              break;
            case 3:
              navigate('/dashboard-client')
              break;
            default:
              navigate('/');
              break;
          }
        } else {
          alert(`Usuario inactivo`);
        }

      }

    } catch (error) {
      const msg = error.message || '';
      if (msg.includes('Cuenta bloqueada temporalmente')) {
        alert(msg);
      } else if (msg.includes('Usuario invalido')) {
        alert('Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.');
      } else if (msg.toLowerCase().includes('recaptcha')) {
        alert('Por seguridad, completa el reCAPTCHA e inténtalo de nuevo.');
        setShowRecaptcha(true);
      } else {
        alert(`Hubo un error al iniciar sesión. Detalle: ${msg}`);
      }
      // tras cualquier error aumentamos intentos y activamos captcha a partir del primer fallo
      setAttempts((prev) => {
        const next = prev + 1;
        if (next >= 1) setShowRecaptcha(true);
        return next;
      });
      // invalidar token anterior para obligar a resolver uno nuevo si aparece el captcha
      setCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }

  };
  useEffect(() => {
    document.body.classList.add('login-page');
    return () => document.body.classList.remove('login-page');
  }, []);

  const handleNewChange = (e) => {
    setLoginUser({ ...loginUser, [e.target.name]: e.target.value });
  };


  const handleLogin = (e) => {
    e.preventDefault();
    const email = (loginUser?.email || '').trim();
    const password = (loginUser?.password || '').trim();
    if (!email || !password) {
      alert('Por favor ingresa correo y contraseña');
      return;
    }
    // si el captcha es obligatorio y no está resuelto, bloquear envío
    if (RECAPTCHA_SITE_KEY && showRecaptcha && !captchaToken) {
      alert('Por seguridad, completa el reCAPTCHA para continuar.');
      return;
    }
    loginUserFetch({
      "email": email,
      "password": password,
    })
  };


  return (
    <div className="login-container">
      <div className="login-background">
        <div className="floating-shapes">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="floating-shape" style={{
              '--i': i,
              '--size': `${Math.random() * 30 + 10}px`,
              '--duration': `${Math.random() * 10 + 15}s`,
              '--delay': `${Math.random() * 5}s`,
              '--x': `${Math.random() * 100}%`,
              '--y': `${Math.random() * 100}%`
            }}></div>
          ))}
        </div>
      </div>

      <div className="login-content">
        <div className="login-branding">
          <button className="btn-back" onClick={() => navigate('/')}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <div className="logo-container">
            <img
              src="/img/logo.png"
              alt="Uptown Hair Logo"
              className="logo"
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/180';
              }}
              style={{
                width: '100%',
                height: 'auto'
              }}
            />
          </div>
          <h1>Bienvenido a <span>Uptown Hair</span></h1>
          <p>Tu estilo, nuestra pasión</p>
        </div>

        <div className="login-form-container">
          <div className="login-card">
            <h2>INICIO DE SESIÓN</h2>
            <p className="form-subtitle">¿Nuevo usuario? <button type="button" className="link-like" onClick={(e) => { e.preventDefault(); navigate('/dashboard-createAccount'); }}>Crear una cuenta</button></p>

            <form className="login-form" onSubmit={handleLogin}>
              <div className="form-group">
                <i className="fas fa-user"></i>
                <input
                  type="email"
                  name="email"
                  placeholder="Correo Electronico"
                  value={loginUser.email}
                  onChange={handleNewChange}
                  required
                />
              </div>

              <div className="form-group">
                <i className="fas fa-lock"></i>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Contraseña"
                  value={loginUser.password}
                  onChange={handleNewChange}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onMouseDown={() => setShowPassword(true)}
                  onMouseUp={() => setShowPassword(false)}
                  onMouseLeave={() => setShowPassword(false)}
                  aria-label="Mostrar contraseña temporalmente"
                >
                  <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                </button>
              </div>

              <div className="form-options">
                <label className="checkbox-container">
                  <input type="checkbox" id="rememberMe" />
                  <span className="checkmark"></span>
                  Recuérdame
                </label>
                <button type="button" className="link-like" onClick={(e) => { e.preventDefault(); navigate('/dashboard-recovery'); }}>¿Olvidaste tu contraseña?</button>
              </div>

              <div className="form-group recaptcha-wrapper">
                {RECAPTCHA_SITE_KEY && showRecaptcha && (
                  <ReCAPTCHA
                    sitekey={RECAPTCHA_SITE_KEY}
                    onChange={(token) => setCaptchaToken(token)}
                  />
                )}
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Cargando...' : 'Ingresar'}
                </button>

              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

