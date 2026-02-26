import React, { useState, useEffect, useCallback } from 'react';
import { formatCOP } from '../../../../utils/formatCOP';
import './Step1ServiceStylist.scss';
import API_BASE_URL from '../../../../config/api';

const Step1ServiceStylist = ({ service, setService, setServiceId, stylist, stylistId, setStylist, setStylistId, handleNextStep }) => {
  const BASE_URL = API_BASE_URL;
  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [localService, setLocalService] = useState(service || '');
  // Mantener el ID seleccionado localmente para el select
  const [localStylist, setLocalStylist] = useState(stylistId || '');

  // Cargar servicios desde la API
  const loadServices = useCallback(() => {
    fetch(`${BASE_URL}/services`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setServices(data);
        } else if (data && Array.isArray(data.data)) {
          setServices(data.data);
        } else {
          console.error("Formato inesperado de servicios:", data);
          setServices([]);
        }
      })
      .catch(err => {
        console.error("Error cargando servicios:", err);
        setServices([]);
      });
  }, [BASE_URL]);

  // Cargar estilistas desde la API
  const loadStylists = useCallback(() => {
    fetch(`${BASE_URL}/api/users/estilistas`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStylists(data);
        } else if (data && Array.isArray(data.data)) {
          setStylists(data.data);
        } else {
          console.error("Formato inesperado de estilistas:", data);
          setStylists([]);
        }
      })
      .catch(err => {
        console.error("Error cargando estilistas:", err);
        setStylists([]);
      });
  }, [BASE_URL]);

  useEffect(() => {
    loadServices();
    loadStylists();
  }, [loadServices, loadStylists]);

  // Selección de servicio
  const handleServiceSelection = (selectedServiceName, selectedServiceId) => {
    if (localService === selectedServiceName) {
      // Deseleccionar
      setLocalService('');
      setLocalStylist('');
      setService('');
      if (setServiceId) setServiceId('');
      setStylist('');
      if (setStylistId) setStylistId('');
    } else {
      setLocalService(selectedServiceName);
      setLocalStylist('');
      setService(selectedServiceName);
      if (setServiceId) setServiceId(String(selectedServiceId));
      setStylist('');
      if (setStylistId) setStylistId('');
    }
  };

  // Selección de estilista
  const handleStylistChange = (event) => {
    const value = event.target.value; // id del estilista
    const label = event.target.options[event.target.selectedIndex]?.text || '';
    setLocalStylist(value);
    // Guardar el nombre para mostrar en confirmación y resultado
    setStylist(label);
    if (setStylistId) {
      setStylistId(value);
    }
  };

  // 🔹 Filtrar estilistas según servicio seleccionado y activos
  const filteredStylists = localService
    ? stylists.filter((stylistItem) =>
      stylistItem.is_active === true &&
      stylistItem.services?.some((srv) => srv.name === localService)
    )
    : [];

  return (
    <div className="step1-service-stylist container my-4">
      <h2 className="reservation-header text-center mb-4">
        Selección de servicio y estilista
      </h2>

      <form>
        {/* Servicios */}
        <div className="form-group mb-4">
          <h4 className="text-center mb-4">Selecciona un servicio:</h4>

          <div className="row g-4">
            {services.map((s) => (
              <div key={s.id} className="col-sm-12 col-md-6 col-lg-4 mb-4">
                <div
                  className={`service-card ${localService === s.name ? "selected" : ""}`}
                  onClick={() => handleServiceSelection(s.name, s.id)}
                  role="button"
                  tabIndex="0"
                >
                  {(s.badge || s.is_featured) && (
                    <div className="badge">{s.badge || 'HOT SALE'}</div>
                  )}

                  <div className="tilt">
                    <div className="img">
                      {s.image ? (
                        (s.image.startsWith && s.image.startsWith('http')) ? (
                          <img src={s.image} alt={s.name} />
                        ) : (
                          <img src={`${BASE_URL}${s.image}`} alt={s.name} />
                        )
                      ) : (
                        <img
                          src={`https://via.placeholder.com/600x400?text=${encodeURIComponent(s.name)}`}
                          alt={s.name}
                        />
                      )}
                    </div>
                  </div>

                  <div className="info">
                    <div className="cat">Servicio</div>
                    <h2 className="title">{s.name}</h2>
                    <p className="desc">{s.description || 'Descripción no disponible.'}</p>
                    <div className="feats">
                      <span className="feat">Duración: {s.minutes_duration ?? '-'} min</span>
                    </div>
                    <div className="bottom">
                      <div className="price">
                        {s.old_price && <span className="old">{formatCOP(s.old_price)}</span>}
                        <span className="new">{s.price !== undefined && s.price !== null ? formatCOP(s.price) : '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estilistas */}
        <div className="form-group mb-4">
          <label className="form-label">Estilista:</label>
          <select
            className="form-select"
            value={localStylist}
            onChange={handleStylistChange}
            disabled={!localService}
          >
            <option value="">Seleccione un estilista</option>
            {filteredStylists.map((stylistItem) => (
              <option key={stylistItem.id} value={stylistItem.id}>
                {stylistItem.first_name} {stylistItem.last_name}
              </option>
            ))}
          </select>

          {!localService && (
            <div className="text-muted small mt-2">
              <i className="bi bi-info-circle me-1"></i>
              Primero selecciona un servicio para ver los estilistas disponibles
            </div>
          )}

          {localService && filteredStylists.length === 0 && (
            <div className="text-danger small mt-2">
              <i className="bi bi-exclamation-circle me-1"></i>
              No hay estilistas disponibles para este servicio
            </div>
          )}
        </div>

        {/* Botón siguiente */}
        <div className="d-flex justify-content-end btn-navigation">
          <button
            type="button"
            className="btn btn-next"
            disabled={!localService || !localStylist}
            onClick={() => {
              if (localService && localStylist) {
                setService(localService);
                // No sobreescribir el nombre del estilista aquí; ya se guardó en handleStylistChange
                setTimeout(() => handleNextStep(), 100);
              }
            }}
          >
            Siguiente
          </button>
        </div>
      </form>
    </div>
  );
};

export default Step1ServiceStylist;
