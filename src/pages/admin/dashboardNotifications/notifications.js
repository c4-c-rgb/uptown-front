import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderComponent from '../../../components/headerAdmin/header';
import FooterComponent from '../../../components/footerAdmin/adminFooter';
import FloatingBackground from '../../../components/shared/FloatingBackground';
import "./notifications.scss";

const Notifications = () => {
  const navigate = useNavigate();
  const [activa, setActiva] = useState(null);

  const toggleDetalle = (i) => {
    setActiva(activa === i ? null : i);
  };

  const notificaciones = [
    {
      titulo: "Confirmación de Reserva",
      descripcion: "Notifica a tus clientes cuando su reserva ha sido confirmada.",
      icono: "bi-check-circle",
      detalle:
        "Cuando un cliente realiza una reserva, se le envía una notificación automática para confirmar la fecha, hora y servicio reservado.",
    },
    {
      titulo: "Recordatorios de Cita",
      descripcion: "Envía recordatorios automáticos antes de cada cita.",
      icono: "bi-bell",
      detalle:
        "Se programan recordatorios por correo o notificación push 24 horas antes de la cita para reducir inasistencias.",
    },
    {
      titulo: "Cancelaciones / Modificaciones",
      descripcion: "Informa a tus clientes de cualquier cambio o cancelación.",
      icono: "bi-x-circle",
      detalle:
        "Si una cita es cancelada o modificada, se notifica inmediatamente al cliente para que esté al tanto del cambio.",
    },
    {
      titulo: "Solicitudes de Calificación",
      descripcion: "Pide feedback a tus clientes después del servicio.",
      icono: "bi-star",
      detalle:
        "Después del servicio, se envía un mensaje pidiendo al cliente calificar al estilista o barbero, lo cual mejora la calidad.",
    },
    {
      titulo: "Notificaciones del Sistema",
      descripcion: "Comunica actualizaciones generales, como cambios de horario.",
      icono: "bi-gear",
      detalle:
        "Estas notificaciones se utilizan para informar sobre horarios especiales, mantenimientos del sistema o promociones.",
    },
  ];

  return (
    <div className="admin-notifications-page">
      <FloatingBackground />
      <HeaderComponent />
      <section className="edit-services container mt-3">
        <div className='row'>
          <div className='col-12'>
            <div className="notificaciones-container">
              <div className="header-title mb-4">
                <h2 className="page-title">Gestión de Notificaciones</h2>
                <div className="d-flex justify-content-end mb-2">
                  <button className="btn btn-back" onClick={(e) => { e.preventDefault(); navigate('/dashboard-admin'); }}>
                    <i className="fas fa-arrow-left me-2"></i>Volver
                  </button>
                </div>
              </div>
              <h2 className="titulo-principal">Selecciona una notificación para ver más detalles.</h2>

              <div className="notificaciones-grid">
                {notificaciones.map((n, i) => (
                  <div key={i} className="notificacion-card">
                    <i className={`bi ${n.icono}`}></i>
                    <div className="notificacion-titulo">{n.titulo}</div>
                    <div className="notificacion-descripcion">{n.descripcion}</div>
                    <button className="notificacion-boton" onClick={() => toggleDetalle(i)}>
                      {activa === i ? "Ocultar detalle" : "Ver detalle"}
                    </button>
                    <div className={`notificacion-detalle ${activa === i ? "activa" : ""}`}>
                      {n.detalle}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <FooterComponent />
    </div>
  );
};

export default Notifications;
