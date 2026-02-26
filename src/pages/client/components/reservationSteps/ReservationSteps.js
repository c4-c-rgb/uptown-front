import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Step1ServiceStylist from './Step1ServiceStylist';
import Step2DateTime from './Step2DateTime';
import Step3Confirmation from './Step3Confirmation';
import Step4Result from './Step4Result';
import HeaderComponent from '../../../../components/headerClient/Header';
import Footer from '../../../../components/footerClient/Footer';
import FloatingBackground from '../../../../components/shared/FloatingBackground';
import './ReservationSteps.scss';
import { crearReserva } from '../api/reservasApi';

const ReservationSteps = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [reservationData, setReservationData] = useState({
    service: '',
    serviceId: '',
    stylist: '',
    stylistId: '',
    date: '',
    time: '',
    reservationId: '',
    status: 'pending'
  });

  const clientName = "Juan Pérez";
  const clientEmail = "juan.perez@ejemplo.com";

  const updateReservationData = (data) => {
    setReservationData(prevData => ({
      ...prevData,
      ...data
    }));
  };

  const setService = (service) => updateReservationData({ service });
  const setServiceId = (serviceId) => updateReservationData({ serviceId });
  const setStylist = (stylist) => updateReservationData({ stylist });
  const setStylistId = (stylistId) => updateReservationData({ stylistId });
  const setDate = (date) => updateReservationData({ date });
  const setTime = (time) => updateReservationData({ time });

  const handleNextStep = () => setCurrentStep(currentStep + 1);
  const handlePrevStep = () => setCurrentStep(currentStep - 1);

  const handleCompleteReservation = async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      const userId = Number(user?.id);
      const estilistaId = Number(reservationData.stylistId);
      const servicioId = Number(reservationData.serviceId);
      const fecha = reservationData.date?.trim();
      const hora = reservationData.time?.trim();

      if (!userId || Number.isNaN(userId)) {
        alert('No se encontró el usuario en sesión. Inicia sesión para continuar.');
        return;
      }
      if (!estilistaId || Number.isNaN(estilistaId)) {
        alert('Selecciona un estilista válido.');
        return;
      }
      if (!servicioId || Number.isNaN(servicioId)) {
        alert('Selecciona un servicio válido.');
        return;
      }
      if (!fecha) {
        alert('Selecciona una fecha.');
        return;
      }
      if (!hora || !/^\d{2}:\d{2}$/.test(hora)) {
        alert('Selecciona una hora válida (HH:mm).');
        return;
      }

      const payload = { userId, estilistaId, servicioId, fecha, hora, state: 'pendiente' };
      console.log('Creando reserva con payload:', payload);

      const resp = await crearReserva(payload);
      const newReservationId = resp?.id
        ? String(resp.id)
        : `RES-${Math.floor(100000 + Math.random() * 900000)}`;

      setReservationData(prev => ({
        ...prev,
        reservationId: newReservationId,
        status: 'confirmed',
        userId,
        serviceId: servicioId
      }));

      setCurrentStep(4);
    } catch (e) {
      console.error('Error al crear reserva', e);
      const msg = e?.message || 'No se pudo crear la reserva. Intenta de nuevo.';
      alert(msg);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1ServiceStylist
            service={reservationData.service}
            setServiceId={setServiceId}
            setService={setService}
            stylist={reservationData.stylist}
            stylistId={reservationData.stylistId}
            setStylistId={setStylistId}
            setStylist={setStylist}
            handleNextStep={handleNextStep}
          />
        );
      case 2:
        return (
          <Step2DateTime
            date={reservationData.date}
            setDate={setDate}
            time={reservationData.time}
            setTime={setTime}
            stylist={reservationData.stylist}
            stylistId={reservationData.stylistId}
            handleNextStep={handleNextStep}
            handlePrevStep={handlePrevStep}
          />
        );
      case 3:
        return (
          <Step3Confirmation
            mode="create"
            service={reservationData.service}
            stylist={reservationData.stylist}
            stylistId={reservationData.stylistId}
            date={reservationData.date}
            time={reservationData.time}
            handlePrevStep={handlePrevStep}
            setStep={handleCompleteReservation}
          />
        );
      case 4:
        return (
          <Step4Result
            mode="create"
            reservationId={reservationData.reservationId}   // 🔹 corregido
            userId={reservationData.userId}                // 🔹 agregado
            serviceId={reservationData.serviceId}          // 🔹 agregado
            service={reservationData.service}
            stylist={reservationData.stylist}
            date={reservationData.date}
            time={reservationData.time}
            status={reservationData.status}
            goToDashboard={() => navigate('/dashboard-client')}
          />
        );
      default:
        return <div>Error: Paso no válido</div>;
    }
  };

  return (
    <div className="reservation-page">
      <FloatingBackground />
      <HeaderComponent clientName={clientName} clientEmail={clientEmail} />
      <div className="container mt-5">
        <div className="reservation-container">
          <div className="header-bar">
            <div className="hb-spacer"></div>
            <h1>Realiza tu Reserva</h1>
            <button type="button" className="back-to-dashboard-emp" onClick={() => navigate('/dashboard-client')}>
              <i className="fas fa-arrow-left"></i>
              Volver
            </button>
          </div>
          <div className="progress-container">
            <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-title">Servicio</div>
            </div>
            <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-title">Fecha y Hora</div>
            </div>
            <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-title">Confirmación</div>
            </div>
            <div className={`progress-step ${currentStep >= 4 ? 'active' : ''}`}>
              <div className="step-number">4</div>
              <div className="step-title">Resultado</div>
            </div>
          </div>

          <div className="reservation-form">
            {renderStep()}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ReservationSteps;

