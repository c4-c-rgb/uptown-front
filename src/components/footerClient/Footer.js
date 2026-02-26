import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMapMarkerAlt,
  faPhone,
  faEnvelope,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';

import './Footer.scss';

const Footer = () => {
  const [currentYear] = useState(new Date().getFullYear());



  const contactInfo = [
    {
      icon: faEnvelope,
      text: 'uptownhairapp2025@gmail.com',
      link: 'mailto: uptownhairapp2025@gmail.com',
      style: { border: 'none', padding: 0 }
    },
  ];

  // Generate bubble elements
  const bubbles = Array.from({ length: 15 }, (_, i) => (
    <div key={i} className="bubble" />
  ));

  return (
    <footer className="footer">
      {/* Background with floating shapes (Admin Style) */}
      <div className="footer-background">
        <div className="floating-shapes">
          <span className="floating-shape"></span>
          <span className="floating-shape"></span>
          <span className="floating-shape"></span>
        </div>
      </div>

      <div className="footer-wrapper">
        <div className="container">

          {/* Contenido principal */}
          <div className="footer-content row gy-2 mt-0 mb-0">

            {/* Marca */}
            <div className="footer-brand col-lg-4 col-md-6">
              <h2 className="footer-title">Uptown Hair</h2>
              <p className="tagline m-0">Tu belleza, nuestra pasión</p>
            </div>

            {/* Contacto */}
            <div className="footer-contact col-lg-4 col-md-6">
              <h3 className="footer-heading">Contáctanos</h3>
              <ul className="contact-info list-unstyled">
                {contactInfo.map((item, index) => (
                  <li key={index} className="contact-item">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-link d-flex justify-content-center align-items-center"
                    >
                      <span className="icon me-2">
                        <FontAwesomeIcon icon={item.icon} />
                      </span>
                      <span className="text">{item.text}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Horario */}
            <div className="footer-hours col-lg-4 col-md-12">
              <h3 className="footer-heading">Horario de atención</h3>
              <ul className="list-unstyled">
                <li>Domingo a Domingo: 9:00 AM - 7:00 PM</li>
              </ul>
            </div>

          </div>

          {/* Copyright */}
          <div className="footer-bottom text-center my-2">
            <p className="m-0">&copy; {currentYear} Uptown Hair. Todos los derechos reservados.</p>
          </div>

        </div>
      </div>
    </footer>

  );
};

export default Footer;
