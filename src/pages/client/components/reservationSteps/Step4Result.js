import React, { useState, useEffect } from 'react';
import { useRef } from 'react';
import { formatCOP } from '../../../../utils/formatCOP';
import { useNavigate } from 'react-router-dom';
import { facturaService } from '../../../../services/facturaService';

const Step4Result = ({ mode, goToDashboard, reservationId, userId, stylist, date, time }) => {
  const navigate = useNavigate();
  const [factura, setFactura] = useState(null);
  const [loadingFactura, setLoadingFactura] = useState(false);
  const [errorFactura, setErrorFactura] = useState(null);
  const invoiceRef = useRef(null);

  useEffect(() => {

    const obtenerDetalleFactura = async () => {
      try {
        setLoadingFactura(true);

        // ⬅️ Traer usuario del sessionStorage
        const sessionUser = sessionStorage.getItem("user");
        let email = null;

        if (sessionUser) {
          const userData = JSON.parse(sessionUser);
          email = userData.email;
        }

        // 1. Obtener o crear factura
        let currentFactura = null;

        // Verificación inicial
        const verificacion = await facturaService.verificarFactura(reservationId);

        if (verificacion?.data?.tieneFactura) {
          currentFactura = verificacion.data.factura;
        } else {
          // Si no existe, crearla
          currentFactura = await facturaService.crearFacturaAutomatica(
            reservationId,
            userId
          );
        }

        // 2. ACTUALIZAR UI INMEDIATAMENTE - No esperar al correo
        setFactura(currentFactura);
        setLoadingFactura(false);

        // 3. Enviar correo en SEGUNDO PLANO
        if (email && currentFactura?.id) {
          // No usamos await para bloquear la UI, pero manejamos la promesa
          facturaService.enviarCorreoFactura(email, currentFactura.id)
            .then(resp => {
              if (resp?.data?.success === false) {
                console.warn("El correo no se envió:", resp.data.message);
                // Opcional: mostrar un toast silencioso
              } else {
                console.log("Correo enviado con éxito (background)");
              }
            })
            .catch(err => {
              console.error("Error al enviar correo (background):", err);
            });
        } else {
          console.warn("No se envío correo: falta email o ID factura");
        }

      } catch (error) {
        console.error("Error al obtener o enviar la factura:", error);
        setErrorFactura("No se pudo generar la factura automáticamente");
        setLoadingFactura(false);
      }
    };

    const loadHtml2Pdf = () => {
      return new Promise((resolve, reject) => {
        if (window.html2pdf) return resolve(window.html2pdf);
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => resolve(window.html2pdf);
        script.onerror = () => reject(new Error('No se pudo cargar html2pdf'));
        document.body.appendChild(script);
      });
    };

    const handleDescargarFacturaEstilada = async () => {
      try {
        const html2pdf = await loadHtml2Pdf();
        const element = invoiceRef.current;
        if (!element) return;
        const opt = {
          margin: 10,
          filename: `factura-${factura?.numero_factura || factura?.id || 'reserva'}.pdf`,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        await html2pdf().from(element).set(opt).save();
      } catch (e) {
        alert('No se pudo generar el PDF con el diseño. Intenta con "Imprimir" y guardar como PDF.');
      }
    };

    obtenerDetalleFactura();
  }, [reservationId, userId]);


  const handleGoToDashboard = () => {
    navigate('/dashboard-client');
  };

  const handleGoToMisReservas = () => {
    navigate('/mis-reservas-cliente');
  };

  // (Se elimina descarga por PDF; usa el botón Imprimir para guardar como PDF)

  // ------------------- UI ---------------------

  // IVA inclusivo: si el backend no envía subtotal/impuestos, se calcula asumiendo
  // que el precio actual ya incluye IVA (19%).
  const IVA_RATE = 0.19;
  const totalInclIva = (() => {
    if (factura?.total != null) return Number(factura.total) || 0;
    if (factura?.precio_unitario != null) return Number(factura.precio_unitario) || 0;
    return 0;
  })();
  const hasBackendImpuestos = typeof factura?.impuestos === 'number';
  const hasBackendSubtotal = typeof factura?.subtotal === 'number';
  const computedImpuestos = hasBackendImpuestos
    ? Number(factura.impuestos)
    : Math.max(0, Math.round(totalInclIva - (totalInclIva / (1 + IVA_RATE))));
  const computedSubtotal = hasBackendSubtotal
    ? Number(factura.subtotal)
    : Math.max(0, Math.round(totalInclIva - computedImpuestos));
  const computedTotal = totalInclIva || Math.max(0, computedSubtotal + computedImpuestos);

  if (mode === 'create') {
    return (
      <div className="success-message">
        <div className="text-center mb-4">
          <i className="bi bi-check-circle" style={{ fontSize: '4rem', color: '#0d47a1' }}></i>
        </div>

        <h2 className="text-center">¡Reserva creada!</h2>
        <p className="text-center">Tu reserva ha sido creada con éxito.</p>
        <p className="text-center mt-4">Descarga tu factura virtual.</p>

        {loadingFactura && (
          <div className="text-center mt-3">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted small mt-2">Generando factura...</p>
          </div>
        )}

        {errorFactura && (
          <div className="alert alert-warning mt-3" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {errorFactura}
          </div>
        )}

        {factura && !loadingFactura && (
          <>
            <div className="invoice-preview mt-4">
              <div className="invoice-card" ref={invoiceRef}>
                {/* Encabezado de impresión (solo en PDF/Imprimir) */}
                <div className="print-only print-header">
                  <div><strong>Factura:</strong> {factura?.numero_factura || '-'}</div>
                  <div><strong>Fecha:</strong> {new Date(factura?.fecha_emision || Date.now()).toLocaleString()}</div>
                </div>
                <div className="invoice-header">
                  <div className="brand">
                    <img src="/img/logo.png" alt="Uptown Hair" className="brand-logo" crossOrigin="anonymous" />
                    <div className="brand-info">
                      <h4 className="m-0">Uptown Hair</h4>
                      <small>Tu belleza, nuestra pasión</small>
                    </div>
                  </div>
                  <div className="invoice-meta">
                    <div><strong>Factura:</strong> {factura?.numero_factura || '-'}</div>
                    <div><strong>Fecha:</strong> {new Date(factura?.fecha_emision || Date.now()).toLocaleString()}</div>
                    <div><strong>Método de pago:</strong> Pendiente</div>
                    <div><strong>Estado:</strong> Pendiente</div>
                  </div>
                </div>

                <div className="invoice-parties">
                  <div>
                    <h6>Emisor</h6>
                    <div>Uptown Hair</div>
                    <div>contacto: uptownhairapp2025@gmail.com</div>
                  </div>
                  <div>
                    <h6>Cliente</h6>
                    <div>{(JSON.parse(sessionStorage.getItem('user') || '{}')?.name) || 'Cliente'}</div>
                    <div>{(JSON.parse(sessionStorage.getItem('user') || '{}')?.email) || '-'}</div>
                  </div>
                </div>

                {/* Información de la cita */}
                <div className="invoice-appointment">
                  <h6>Detalles de la Cita</h6>
                  <div className="appointment-grid">
                    <div><strong>Estilista:</strong> {stylist || factura?.estilista_nombre || 'Por asignar'}</div>
                    <div><strong>Fecha:</strong> {date || factura?.fecha || '-'}</div>
                    <div><strong>Hora:</strong> {time || factura?.hora || '-'}</div>
                  </div>
                </div>

                <div className="invoice-table-wrapper">
                  <table className="invoice-table">
                    <thead>
                      <tr>
                        <th>Descripción</th>
                        <th className="text-end">Cantidad</th>
                        <th className="text-end">Precio</th>
                        <th className="text-end">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{factura?.servicio_nombre || 'Servicio de belleza'}</td>
                        <td className="text-end">1</td>
                        <td className="text-end">{formatCOP(factura?.precio_unitario ?? factura?.total ?? 0)}</td>
                        <td className="text-end">{formatCOP(computedTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="invoice-totals">
                  <div className="notes">
                    <small>
                      Gracias por tu reserva. Presenta este comprobante el día de tu cita.
                      <br />
                      Tratamiento de datos: al agendar autorizas el uso de tus datos según nuestra política de privacidad.
                      <br />
                      Política de cancelación: por favor cancela o reprograma con al menos 24 horas de antelación.
                    </small>
                  </div>
                  <div className="total-box">
                    <div className="row-item"><span>Subtotal</span><span>{formatCOP(computedSubtotal)}</span></div>
                    <div className="row-item"><span>Impuestos (IVA {Math.round(IVA_RATE * 100)}%)</span><span>{formatCOP(computedImpuestos)}</span></div>
                    <div className="row-item total"><span>Total</span><span>{formatCOP(computedTotal)}</span></div>
                  </div>
                </div>

                {/* Pie de impresión (solo en PDF/Imprimir) */}
                <div className="print-only print-footer">
                  <div>Uptown Hair — Gracias por tu preferencia</div>
                  <div className="page-counter"></div>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-center flex-wrap gap-2 mt-3">
              <button className="btn btn-outline-secondary" onClick={() => window.print()}>
                <i className="bi bi-printer me-2"></i>
                Imprimir o descargar PDF
              </button>
              <button className="btn btn-outline-primary" onClick={handleGoToMisReservas}>
                Mis reservas
              </button>
            </div>

            <style data-invoice-style>{`
              .invoice-preview { display: flex; justify-content: center; }
              .invoice-card {
                width: 100%;
                max-width: 800px;
                background: #ffffff;
                border-radius: 12px;
                border: 1px solid rgba(27,60,135,0.15);
                box-shadow: 0 10px 30px rgba(27,60,135,0.12);
                overflow: hidden;
              }
              .print-only { display: none; }
              .invoice-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 24px;
                background: linear-gradient(135deg, rgba(27,60,135,0.12), rgba(13,36,86,0.12));
                border-bottom: 1px solid rgba(27,60,135,0.25);
              }
              .brand { display: flex; align-items: center; gap: 12px; }
              .brand-logo { width: 48px; height: 48px; object-fit: contain; }
              .brand-info h4 { font-weight: 700; font-family: 'Oswald', sans-serif; color: #1B3C87; }
              .invoice-meta { text-align: right; font-size: 0.95rem; color: #1B3C87; }
              .invoice-parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px 24px; }
              .invoice-parties h6 { margin-bottom: 6px; font-weight: 700; color: #1B3C87; }
              .invoice-appointment { padding: 16px 24px; background: #f8fafc; border-top: 1px solid rgba(27,60,135,0.12); border-bottom: 1px solid rgba(27,60,135,0.12); }
              .invoice-appointment h6 { margin-bottom: 12px; font-weight: 700; color: #1B3C87; }
              .appointment-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
              .appointment-grid div { color: #374151; }
              .appointment-grid strong { color: #1B3C87; }
              .invoice-table-wrapper { padding: 0 16px 16px 16px; }
              .invoice-table { width: 100%; border-collapse: collapse; background: #fff; }
              .invoice-table th, .invoice-table td { padding: 12px 12px; border-bottom: 1px solid rgba(27,60,135,0.12); }
              .invoice-table th { text-align: left; background: #eef2ff; color: #0D2456; font-weight: 600; }
              .invoice-table .text-end { text-align: right; }
              .invoice-totals { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding: 16px 24px 24px; }
              .invoice-totals .notes { color: #475569; max-width: 60%; }
              .total-box { min-width: 240px; border: 1px solid rgba(27,60,135,0.15); border-radius: 10px; overflow: hidden; }
              .total-box .row-item { display: flex; justify-content: space-between; padding: 10px 14px; background: #fff; border-bottom: 1px solid rgba(27,60,135,0.12); }
              .total-box .row-item.total { background: #1B3C87; color: #fff; font-weight: 700; }
              @media (max-width: 576px) {
                .invoice-header { flex-direction: column; align-items: flex-start; gap: 8px; }
                .invoice-meta { text-align: left; }
                .invoice-parties { grid-template-columns: 1fr; }
                .invoice-totals { flex-direction: column; }
                .invoice-totals .notes { max-width: 100%; }
                .total-box { width: 100%; }
              }
              @media print {
                @page { size: A4; margin: 10mm; }
                body * { visibility: hidden; }
                .invoice-card, .invoice-card * { visibility: visible; }
                .invoice-card {
                  position: absolute; left: 0; top: 0; width: 100%; max-width: 100%;
                  box-shadow: none; border: none; background: #ffffff;
                  page-break-inside: avoid;
                }
                .invoice-header { padding: 12px 16px; }
                .invoice-parties { padding: 12px 16px; gap: 10px; }
                .invoice-table-wrapper { padding: 0 12px 12px 12px; }
                .invoice-totals { padding: 12px 16px 16px; gap: 12px; }
                .print-only { display: block !important; }
                .print-header { padding: 8px 16px; font-size: 12px; border-bottom: 1px solid rgba(27,60,135,0.2); }
                .print-footer { padding: 8px 16px; font-size: 12px; border-top: 1px solid rgba(27,60,135,0.2); display: flex; justify-content: space-between; align-items: center; }
                .print-footer .page-counter::after { content: "Página " counter(page) " de " counter(pages); }
              }
            `}</style>
          </>
        )}
      </div>
    );
  }

  return null;
};

export default Step4Result;
