import React, { useState } from "react";
import "./recovery.scss";
import { Link } from "react-router-dom";
import API_BASE_URL from '../../../config/api';

const BASE_URL = API_BASE_URL;
const Recovery = () => {
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');
    try {
      const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al enviar el correo de recuperación, valida que sea un correo registrado');
      }

      setMensaje('Correo de recuperación enviado con éxito. Revisa tu bandeja de entrada y sigue las instrucciones.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="recovery-section">
      <div className="recovery-background">
        <div className="floating-shapes">
          <div className="floating-shape" style={{ '--size': '120px', '--x': '18%', '--y': '22%', '--duration': '16s', '--delay': '0s' }} />
          <div className="floating-shape" style={{ '--size': '80px', '--x': '82%', '--y': '18%', '--duration': '18s', '--delay': '0.8s' }} />
          <div className="floating-shape" style={{ '--size': '60px', '--x': '70%', '--y': '68%', '--duration': '14s', '--delay': '0.4s' }} />
          <div className="floating-shape" style={{ '--size': '100px', '--x': '28%', '--y': '75%', '--duration': '20s', '--delay': '1.2s' }} />
          <div className="floating-shape" style={{ '--size': '42px', '--x': '55%', '--y': '42%', '--duration': '12s', '--delay': '0.6s' }} />
        </div>
      </div>
      <div className="recovery-card">
        <h2 className="recovery-title">Recuperar contraseña</h2>
        <p className="recovery-subtitle">Ingresa tu correo para enviarte el enlace de restablecimiento.</p>

        <form className="recovery-form" onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Correo electrónico</label>
            <input
              type="email"
              className="form-control"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tuemail@ejemplo.com"
              value={email}
            />
          </div>

          <div className="d-grid">
            <button type="submit" className="btn btn-cta w-100">
              Enviar enlace
            </button>
          </div>

          {mensaje && (
            <div className="alert alert-success mt-3" role="alert">{mensaje}</div>
          )}

          {error && (
            <div className="alert alert-danger mt-3" role="alert">{error}</div>
          )}
        </form>
        <div className="recovery-footer">Te enviaremos un enlace válido por 15 minutos.</div>
        <div className="btn-row" style={{ marginTop: '12px' }}>
          <Link to="/dashboard-login" className="btn-back">← Volver al login</Link>
        </div>
      </div>
    </section>
  );
};

export default Recovery;