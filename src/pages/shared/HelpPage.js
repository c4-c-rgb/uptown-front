import React from 'react';
import './legalPages.scss';

const HelpPage = () => {
  return (
    <div className="legal-page-wrapper">
      <div className="legal-page-card">
        <h1 className="legal-page-title">Centro de ayuda</h1>
        <p className="legal-page-subtitle">
          Esta sección está dirigida al personal autorizado de Uptown Hair para el uso adecuado del panel
          administrativo y las herramientas asociadas.
        </p>

        <h2 className="legal-section-title">Soporte y asistencia</h2>
        <p className="legal-text">
          Si presentas inconvenientes con el ingreso al sistema, recuperación de contraseña, gestión de reservas,
          clientes, empleados o reportes, debes comunicarte con el responsable interno de sistemas o con el
          administrador del establecimiento.
        </p>

        <ul className="legal-list">
          <li>Reporta cualquier error o comportamiento inusual al administrador del sistema.</li>
          <li>No intentes modificar configuraciones avanzadas sin autorización previa.</li>
          <li>Verifica siempre la información antes de confirmar o eliminar una reserva.</li>
        </ul>

        <h2 className="legal-section-title">Buenas prácticas de seguridad</h2>
        <ul className="legal-list">
          <li>Usa el sistema únicamente desde equipos confiables.</li>
          <li>No compartas tu usuario ni contraseña con terceros.</li>
          <li>Cierra sesión al finalizar tu turno o cuando dejes de usar el sistema.</li>
        </ul>

        <h2 className="legal-section-title">Contacto de soporte</h2>
        <p className="legal-text">
          Para soporte técnico o consultas relacionadas con el funcionamiento del sistema, puedes comunicarte a
          través de los siguientes canales oficiales:
        </p>
        <ul className="legal-list">
          <li>Teléfono: 3057173986</li>
          <li>Correo electrónico: soporteuptwonhairdev@gmail.com</li>
        </ul>

        <p className="legal-note">
          Esta información tiene carácter orientativo y forma parte de las políticas internas de uso del sistema
          de gestión de Uptown Hair.
        </p>
      </div>
    </div>
  );
};

export default HelpPage;
