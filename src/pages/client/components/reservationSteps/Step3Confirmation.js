import React from 'react';

const Step3Confirmation = ({ mode, service, stylist, date, time, handlePrevStep, setStep }) => {
  const handleConfirm = (e) => {
    e.preventDefault();
    setStep(4);
  };
  

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [y, m, d] = String(dateString).split('-').map(Number);
    const dt = new Date(y || 1970, (m || 1) - 1, d || 1);
    return dt.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const isCancel = mode === 'cancel';

  return (
    <div>
      <h2 className={`reservation-header ${isCancel ? 'text-danger' : ''}`}>{isCancel ? 'Cancelar reserva' : 'Confirmar reserva'}</h2>

      <div className={`confirmation-card ${isCancel ? 'danger' : ''}`}>
        <div className="confirm-header">
          <div className={`confirm-icon ${isCancel ? 'danger' : 'success'}`}>
            <i className={`fas ${isCancel ? 'fa-times' : 'fa-check'}`}></i>
          </div>
          <div className="confirm-title">
            <h3>{isCancel ? '¿Deseas cancelar tu cita?' : 'Factura de cita'}</h3>
            <p>{isCancel ? 'Esta acción no se puede deshacer.' : 'Se enviará una factura y confirmación a tu correo.'}</p>
          </div>
        </div>

        <div className="confirm-body">
          <div className="confirm-row">
            <div className="confirm-item">
              <div className="ci-icon"><i className="fas fa-spa"></i></div>
              <div className="ci-content">
                <span className="ci-label">Servicio</span>
                <span className="ci-value">{service}</span>
              </div>
            </div>
            <div className="confirm-item">
              <div className="ci-icon"><i className="fas fa-user"></i></div>
              <div className="ci-content">
                <span className="ci-label">Estilista</span>
                <span className="ci-value">{stylist}</span>
              </div>
            </div>
          </div>

          <div className="confirm-row">
            <div className="confirm-item">
              <div className="ci-icon"><i className="fas fa-calendar-day"></i></div>
              <div className="ci-content">
                <span className="ci-label">Fecha</span>
                <span className="ci-value">{formatDate(date)}</span>
              </div>
            </div>
            <div className="confirm-item">
              <div className="ci-icon"><i className="fas fa-clock"></i></div>
              <div className="ci-content">
                <span className="ci-label">Hora</span>
                <span className="ci-value">{time}</span>
              </div>
            </div>
          </div>

          <div className="confirm-note">
            <i className="fas fa-info-circle me-2"></i>
            <span>{isCancel ? 'Se liberará el horario seleccionado y puede quedar disponible para otros usuarios.' : 'Recibirás por correo la factura y los detalles de la cita. Presenta este resumen al llegar.'}</span>
          </div>
        </div>

        <div className="confirm-actions">
          <button type="button" className="btn btn-prev" onClick={handlePrevStep}>
            <i className="fas fa-arrow-left me-2"></i>Atrás
          </button>
          <button
            type="button"
            className={`btn ${isCancel ? 'btn-danger' : 'btn-confirm'}`}
            onClick={handleConfirm}
            // onClick={handleSendEmail}
          >
            <i className={`fas ${isCancel ? 'fa-times' : 'fa-check'} me-2`}></i>
            {isCancel ? 'Confirmar cancelación' : 'Confirmar reserva'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step3Confirmation;
