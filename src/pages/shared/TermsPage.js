import React from 'react';
import './legalPages.scss';

const TermsPage = () => {
  return (
    <div className="legal-page-wrapper">
      <div className="legal-page-card">
        <h1 className="legal-page-title">Términos y condiciones de uso</h1>
        <p className="legal-page-subtitle">
          El acceso y utilización del sistema de gestión de Uptown Hair implica la aceptación de las siguientes
          condiciones por parte del usuario autorizado.
        </p>

        <h2 className="legal-section-title">Uso autorizado</h2>
        <p className="legal-text">
          El sistema está destinado exclusivamente para la gestión interna de clientes, reservas, servicios y
          operaciones del establecimiento. Cualquier uso distinto a los fines operativos del negocio se
          considera no autorizado.
        </p>

        <h2 className="legal-section-title">Confidencialidad y protección de datos</h2>
        <p className="legal-text">
          Los datos de clientes, empleados y operaciones comerciales son información confidencial. El usuario se
          compromete a:
        </p>
        <ul className="legal-list">
          <li>No divulgar información obtenida del sistema a terceros no autorizados.</li>
          <li>Utilizar los datos únicamente para la prestación de servicios del establecimiento.</li>
          <li>Respetar las políticas internas de protección de datos definidas por la empresa.</li>
        </ul>

        <h2 className="legal-section-title">Credenciales y responsabilidad</h2>
        <ul className="legal-list">
          <li>El usuario es responsable de la custodia de su nombre de usuario y contraseña.</li>
          <li>Está prohibido compartir credenciales o permitir el acceso a personas no autorizadas.</li>
          <li>Cualquier acción realizada con las credenciales asignadas se presumirá efectuada por el usuario.</li>
        </ul>

        <h2 className="legal-section-title">Incumplimientos</h2>
        <p className="legal-text">
          El uso indebido del sistema, el acceso no autorizado o la manipulación inadecuada de la información
          podrá dar lugar a medidas disciplinarias internas y, en caso de corresponder, a acciones legales
          conforme a la normativa aplicable.
        </p>

        <p className="legal-note">
          Estos términos forman parte de las políticas internas de Uptown Hair y pueden ser actualizados por la
          administración cuando se considere necesario.
        </p>
      </div>
    </div>
  );
};

export default TermsPage;
