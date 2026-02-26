import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import "./adminFooter.scss";

// Generate random floating shapes for the footer background
const generateShapes = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: `${Math.random() * 10 + 3}px`,
    duration: `${Math.random() * 15 + 10}s`,
    delay: `${Math.random() * 5}s`,
    x: `${Math.random() * 100}%`,
    y: `${Math.random() * 100}%`
  }));
};

const AdminFooter = () => {
  const [shapes] = useState(() => generateShapes(15));
  const [currentYear] = useState(new Date().getFullYear());
  const [isHovered, setIsHovered] = useState(false);
  
  // Footer links
  const footerLinks = [
    { text: 'Ayuda', to: '/help' },
    { text: 'Términos', to: '/terms' },
  ];

  return (
    <footer className="footerAdmin">
      {/* Animated background shapes */}
      <div className="footer-background">
        <div className="floating-shapes">
          {shapes.map((shape) => (
            <div 
              key={shape.id}
              className="floating-shape"
              style={{
                '--size': shape.size,
                '--duration': shape.duration,
                '--delay': shape.delay,
                '--x': shape.x,
                '--y': shape.y
              }}
            />
          ))}
        </div>
      </div>
      
      <div className="footer-container">
        <div className="footer-content">
          {/* Logo */}
          <div className="footer-logo">
            <div className="logo-icon">
              <i className="fas fa-cut"></i>
            </div>
            <div className="logo-text">Uptown Hair</div>
          </div>
          
          {/* Navigation Links */}
          <nav className="footer-links">
            {footerLinks.map((link, index) => (
              <Link 
                key={index} 
                to={link.to}
                className="footer-link"
                onMouseEnter={() => setIsHovered(index)}
                onMouseLeave={() => setIsHovered(null)}
              >
                {link.text}
              </Link>
            ))}
          </nav>
          
          {/* Copyright */}
          <div className="copyright">
            &copy; {currentYear} <span className="highlight">Uptown Hair</span>. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AdminFooter;