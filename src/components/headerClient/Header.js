import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faUser, faCut } from '@fortawesome/free-solid-svg-icons';
import './Header.scss';

// Generate random floating shapes for the header background
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

const Header = ({ clientName = "Cliente", clientEmail = "cliente@ejemplo.com" }) => {
  const headerRef = useRef(null);
  const navigate = useNavigate();
  const [shapes] = useState(() => generateShapes(15));
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  let userInfo = {};
  try {
    const raw = sessionStorage.getItem("user");
    userInfo = raw ? JSON.parse(raw) : {};
  } catch (e) {
    userInfo = {};
  }
  // Format time to HH:MM AM/PM
  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 70000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  // Handle logout
  const handleLogout = (e) => {
    e.preventDefault();
    sessionStorage.removeItem("user");
    navigate('/dashboard-login');
  };

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header
      ref={headerRef}
      className={`app-header ${scrolled ? 'scrolled' : ''}`}
    >
      {/* Animated background shapes */}
      <div className="header-background">
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

      <div className="header-client-container">
        {/* Branding and Logo */}
        <div className="header-brand">
          <div className="logo-container">
            <FontAwesomeIcon icon={faCut} className="logo-icon" />
          </div>
          <div className="brand-text">
            <h1>Uptown Hair</h1>
            <p className="welcome-text">Panel de Cliente</p>
          </div>
        </div>

        {/* Header Info - User Profile and Actions */}
        <div className="header-info">
          {/* Time Display */}
          <div className="time-display">
            <i className="far fa-clock"></i>
            <span>{formatTime(currentTime)}</span>
          </div>

          {/* User Profile */}
          <div
            className="client-profile"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className="client-avatar">
              {getInitials(userInfo.name || clientName) || <FontAwesomeIcon icon={faUser} />}
            </div>
            <div className="client-details">
              <span className="client-name">{userInfo.name || ''}</span>
              <span className="client-email">{userInfo.email || ''}</span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            className="logout-btn"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
          </button>
        </div>
      </div>

      {/* Mobile Menu (can be expanded later) */}
      {isMenuOpen && (
        <div className="mobile-menu">
          {/* Add mobile menu items here if needed */}
        </div>
      )}
    </header>
  );
};

export default Header;
