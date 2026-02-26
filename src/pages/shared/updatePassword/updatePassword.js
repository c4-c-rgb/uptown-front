import React from "react";
import "./updatePassword.scss";
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../../config/api';

const BASE_URL = API_BASE_URL;
const UpdatePassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    if (!token) {
      setError('Token no encontrado en la URL.');
      return;
    }

    if (password !== repeatPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al restablecer la contraseña');
      }

      const data = await response.json();
      setMensaje(data.message || 'Contraseña restablecida con éxito. Ahora puedes iniciar sesión.');
      // Opcional: redirigir al usuario a la página de inicio de sesión después de unos segundos
      setTimeout(() => {
        navigate('/dashboard-login');
      }, 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="d-flex justify-content-center align-items-center vh-100">
      <div className="card shadow p-4" style={{ maxWidth: "400px", width: "100%" }}>
        <h4 className="text-center mb-4 text-primary">Restablecer Contraseña</h4>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="newPassword" className="form-label">
              Nueva Contraseña
            </label>
            <input
              type="password"
              className="form-control"
              id="newPassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=""
              minLength={5}

              title="Debe tener mínimo 8 caracteres, incluir mayúscula, minúscula, número y un caracter especial (@$!%*?&)."
            />
          </div>

          <div className="mb-3">
            <label htmlFor="repeatPassword" className="form-label">
              Repetir Contraseña
            </label>
            <input
              type="password"
              className="form-control"
              id="repeatPassword"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              placeholder=""
            />
          </div>

          <div className="d-grid">
            <button type="submit" className="btn btn-primary">
              Enviar
            </button>
          </div>
          {mensaje && (
            <div className="alert alert-success mt-3" role="alert">
              {mensaje}
            </div>
          )}

          {error && (
            <div className="alert alert-danger mt-3" role="alert">
              {error}
            </div>
          )}
        </form>
      </div>
    </section>
  );
};

export default UpdatePassword;

