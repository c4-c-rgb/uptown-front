import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './initial.scss';

const PageInital = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Solo mostrar la animación de entrada del hero
    setIsVisible(true);
  }, []);

  return (
    <>
      {/* Hero Section con animación de entrada */}
      <header className={`hero-section ${isVisible ? 'visible' : ''}`}>
        <div className="overlay" style={{ backgroundImage: "url('/img/fondo_app.jpg')" }}></div>
        <div className="container position-relative">
          <div className="hero-content">
            <div className="logo-container">
              <img 
                src="/img/logo.png" 
                alt="Uptown Hair Logo" 
                className="hero-logo" 
                loading="lazy"
                width="200"
                height="200"
                style={{
                  width: '100%',
                  height: 'auto',
                  maxWidth: '200px'
                }}
              />
            </div>
            <h1 className="hero-title">Uptown Hair</h1>
            <div className="title-line"></div>
            <p className="hero-subtitle">Reserva tu cita de belleza de forma rápida y sencilla</p>
            <div className="hero-buttons">
              <button className="btn btn-primary-custom me-3 shine-effect" onClick={(e) => {e.preventDefault(); navigate('/dashboard-login');}}>
                <i className="fas fa-sign-in-alt me-2"></i>Iniciar sesión
              </button>
              <button className="btn btn-outline-custom glow-effect" onClick={(e) => {e.preventDefault(); navigate('/dashboard-createAccount');}}>
                <i className="fas fa-user-plus me-2"></i>Crear cuenta
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default PageInital;

