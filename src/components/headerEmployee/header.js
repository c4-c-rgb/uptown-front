import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faScissors, faPalette, faSpa, faHandSparkles, faBrush } from '@fortawesome/free-solid-svg-icons';
import './header.scss';
import API_BASE_URL from '../../config/api';

const Header = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [shapes, setShapes] = useState([]);
  const headerRef = useRef(null);
  const userInfo = (() => { try { const raw = sessionStorage.getItem("user"); return raw ? JSON.parse(raw) : {}; } catch (e) { return {}; } })();
  const API_BASE = API_BASE_URL;
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Construir timestamp seguro desde 'YYYY-MM-DD' y 'HH:mm'
  const safeTs = (ymd, hhmm) => {
    try {
      if (!ymd) return 0;
      const [y, m, d] = String(ymd).split('-').map(n => parseInt(n, 10) || 0);
      const [hh, mm] = String(hhmm || '00:00').slice(0, 5).split(':').map(n => parseInt(n, 10) || 0);
      // new Date(y, m-1, d, hh, mm) usa zona local sin desfases UTC
      const t = new Date(y, (m || 1) - 1, d || 1, hh, mm).getTime();
      return isNaN(t) ? 0 : t;
    } catch { return 0; }
  };

  const getServiceIcon = (name) => {
    const n = String(name || '').toLowerCase();
    if (/tinte|color/i.test(n)) return faPalette;
    if (/manic|uñas|nail/i.test(n)) return faHandSparkles;
    if (/spa|relax|facial|skin/i.test(n)) return faSpa;
    if (/maquill|brush|ceja|pesta/i.test(n)) return faBrush;
    return faScissors;
  };

  const goToCalendar = (n) => {
    try {
      const fecha = encodeURIComponent(n.fecha || '');
      const hora = encodeURIComponent((n.hora || '').slice(0, 5));
      setNotifOpen(false);
      navigate(`/dashboard-calendar-employee?date=${fecha}${hora ? `&time=${hora}` : ''}`);
    } catch (_) { }
  };

  // Generate random floating shapes
  useEffect(() => {
    if (headerRef.current) {
      const newShapes = [];
      const shapeCount = 8; // Number of floating shapes

      for (let i = 0; i < shapeCount; i++) {
        newShapes.push({
          id: i,
          size: Math.random() * 20 + 10, // Random size between 10 and 30px
          x: Math.random() * 100, // Random x position (0-100%)
          y: Math.random() * 100, // Random y position (0-100%)
          duration: Math.random() * 10 + 10, // Random animation duration (10-20s)
          delay: Math.random() * -20 // Random delay (0-20s)
        });
      }

      setShapes(newShapes);
    }
  }, []);

  // Cerrar dropdown de perfil al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    sessionStorage.removeItem("user");
    navigate('/dashboard-login');
  };

  // Format time to show hours and minutes only
  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const [time, setTime] = useState(formatTime(new Date()));

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(formatTime(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const estilistaId = userInfo?.id || userInfo?.user?.id;
    if (!estilistaId) return;

    let mounted = true;

    const load = async () => {
      try {
        const baseUrl = `${API_BASE}/reservas`;
        const today = new Date();
        const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const dayList = Array.from({ length: 15 }).map((_, i) => {
          const dt = new Date(today); dt.setHours(0, 0, 0, 0); dt.setDate(today.getDate() + i);
          return toISO(dt);
        });

        const all = [];
        for (const fecha of dayList) {
          const qs = new URLSearchParams();
          qs.append('estilistaId', String(estilistaId));
          qs.append('fecha', fecha);
          try {
            const res = await fetch(`${baseUrl}?${qs.toString()}`, { credentials: 'include' });
            if (!res.ok) continue;
            const json = await res.json();
            const arr = Array.isArray(json) ? json : [];
            for (const r of arr) {
              const hora = String(r?.hora || r?.hora_inicio || '').slice(0, 5);
              all.push({
                id: r?.id || `${fecha}-${hora}-${r?.idUser || ''}`,
                fecha,
                hora,
                cliente: r?.cliente?.nombre || r?.cliente_nombre || r?.clienteNombre || '',
                servicio: r?.servicio?.name || r?.servicio_nombre || r?.servicio || r?.service?.name || '',
                ts: safeTs(fecha, hora),
              });
            }
          } catch (_) { continue; }
        }
        if (!mounted) return;
        const normalized = all
          .sort((a, b) => (b.ts || 0) - (a.ts || 0))
          .slice(0, 40);
        setNotifications(normalized);

        const readRaw = sessionStorage.getItem('empNotifReadIds') || '[]';
        let readIds;
        try { readIds = JSON.parse(readRaw); } catch { readIds = []; }
        const unread = normalized.filter(n => !readIds.includes(n.id)).length;
        setUnreadCount(unread);
      } catch (_) {
        // noop
      }
    };

    load();
    const t = setInterval(load, 30000);
    return () => { mounted = false; clearInterval(t); };
  }, [API_BASE, userInfo]);

  const markAllAsRead = () => {
    const ids = notifications.map(n => n.id);
    const existingRaw = sessionStorage.getItem('empNotifReadIds') || '[]';
    let existing;
    try { existing = JSON.parse(existingRaw); } catch { existing = []; }
    const merged = Array.from(new Set([...(existing || []), ...ids]));
    sessionStorage.setItem('empNotifReadIds', JSON.stringify(merged));
    setUnreadCount(0);
  };

  return (
    <header className={`employee-header ${isScrolled ? 'scrolled' : ''}`} ref={headerRef}>
      {/* Floating background shapes */}
      <div className="header-background">
        <div className="floating-shapes">
          {shapes.map(shape => (
            <div
              key={shape.id}
              className="floating-shape"
              style={{
                '--size': `${shape.size}px`,
                '--x': `${shape.x}%`,
                '--y': `${shape.y}%`,
                '--duration': `${shape.duration}s`,
                '--delay': `${shape.delay}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="header-container">
        {/* Branding Section */}
        <div className="header-brand">
          <div className="logo-container">
            <i className="fas fa-cut"></i>
          </div>
          <div className="brand-text">
            <h1>Panel de Empleado</h1>
            <p className="welcome-text">Bienvenido, {userInfo.name || ''}</p>
          </div>
        </div>

        {/* Right-side Info Section */}
        <div className="header-info">
          {/* Time Display */}
          <div className="time-display">
            <i className="far fa-clock"></i>
            <span>{time}</span>
          </div>
          <div className="notification-wrapper">
            <button
              className="bell-btn"
              onClick={() => { const next = !notifOpen; setNotifOpen(next); if (next) markAllAsRead(); }}
              aria-label="Notificaciones"
              title="Notificaciones"
            >
              <FontAwesomeIcon icon={faBell} />
              {unreadCount > 0 && (
                <span className="badge" aria-label={`${unreadCount} notificaciones`}>{unreadCount}</span>
              )}
            </button>
            {notifOpen && (
              <div className="notification-dropdown">
                <div className="nd-header">Notificaciones</div>
                <div className="nd-list">
                  {(() => {
                    const today = new Date();
                    const y = today.getFullYear();
                    const m = String(today.getMonth() + 1).padStart(2, '0');
                    const d = String(today.getDate()).padStart(2, '0');
                    const todayStr = `${y}-${m}-${d}`;
                    const readRaw = sessionStorage.getItem('empNotifReadIds') || '[]';
                    let readIds; try { readIds = JSON.parse(readRaw); } catch { readIds = []; }
                    const isUnread = (id) => !readIds.includes(id);

                    const toTs = (n) => n.ts || safeTs(n.fecha, n.hora);
                    const todayItems = notifications.filter(n => n.fecha === todayStr).sort((a, b) => (toTs(a) - toTs(b)));
                    const futureItems = notifications.filter(n => n.ts > safeTs(todayStr, '23:59')).sort((a, b) => (toTs(a) - toTs(b)));

                    const sections = [];
                    if (todayItems.length > 0) {
                      sections.push(
                        <div key="sec-today">
                          <div className="nd-header">Hoy</div>
                          {todayItems.map(n => (
                            <div key={n.id} className={`nd-item ${isUnread(n.id) ? 'nd-unread' : ''}`} onClick={() => goToCalendar(n)} role="button" tabIndex={0}>
                              <div className="nd-left">
                                <FontAwesomeIcon icon={getServiceIcon(n.servicio)} />
                              </div>
                              <div className="nd-content">
                                <div className="nd-title">{n.servicio || 'Reserva'}</div>
                                <div className="nd-meta">{[n.fecha, n.hora].filter(Boolean).join(' • ')}</div>
                                {n.cliente && <div className="nd-sub">Cliente: {n.cliente}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    if (futureItems.length > 0) {
                      sections.push(
                        <div key="sec-future">
                          <div className="nd-header">Próximas</div>
                          {futureItems.map(n => (
                            <div key={n.id} className={`nd-item ${isUnread(n.id) ? 'nd-unread' : ''}`} onClick={() => goToCalendar(n)} role="button" tabIndex={0}>
                              <div className="nd-left">
                                <FontAwesomeIcon icon={getServiceIcon(n.servicio)} />
                              </div>
                              <div className="nd-content">
                                <div className="nd-title">{n.servicio || 'Reserva'}</div>
                                <div className="nd-meta">{[n.fecha, n.hora].filter(Boolean).join(' • ')}</div>
                                {n.cliente && <div className="nd-sub">Cliente: {n.cliente}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    if (sections.length === 0) {
                      return <div className="nd-empty">Sin nuevas reservas</div>;
                    }
                    return sections;
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Employee Profile */}
          <div
            className="admin-profile"
            ref={profileRef}
            onClick={() => setProfileOpen((prev) => !prev)}
          >
            <div className="admin-avatar">
              <i className="fas fa-user-shield"></i>
            </div>
            <div className="admin-details">
              <span className="admin-name">{userInfo.name || ''}</span>
              <span className="admin-email">{userInfo.email || ''}</span>
            </div>
            <button
              className="logout-btn"
              onClick={handleLogout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
            {profileOpen && (
              <div className="profile-dropdown">
                <div className="pd-name">{userInfo.name || ''}</div>
                <div className="pd-email">{userInfo.email || ''}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;

