import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import "./header.scss";

// Sample admin data - replace with actual user data from your auth system
const adminName = "Admin";
const adminEmail = "admin@uptownhair.com";

// Generate random floating shapes for the header background
const generateShapes = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: `${Math.random() * 15 + 5}px`,
    duration: `${Math.random() * 15 + 10}s`,
    delay: `${Math.random() * 5}s`,
    x: `${Math.random() * 100}%`,
    y: `${Math.random() * 100}%`
  }));
};

const Header = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [time, setTime] = useState(new Date().toLocaleTimeString());
    const [shapes] = useState(() => generateShapes(12));
    const menuRef = useRef(null);
  const userInfo = (() => { try { const raw = sessionStorage.getItem("user"); return raw ? JSON.parse(raw) : {}; } catch (e) { return {}; } })();
    // Format time to show hours and minutes only
    const formatTime = (date) => {
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    useEffect(() => {
        // Update time every second
        const timer = setInterval(() => {
            setTime(formatTime(new Date()));
        }, 1000);

        // Handle scroll effect
        const handleScroll = () => {
            const isScrolled = window.scrollY > 10;
            if (isScrolled !== scrolled) {
                setScrolled(isScrolled);
            }
        };

        // Handle clicks outside the menu
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                // Handle menu close if needed
            }
        };

        window.addEventListener('scroll', handleScroll);
        document.addEventListener('mousedown', handleClickOutside);
        
        // Set initial time
        setTime(formatTime(new Date()));
        
        return () => {
            clearInterval(timer);
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [scrolled]);

    const handleLogout = (e) => {
        e.preventDefault();
        sessionStorage.removeItem("user");
        navigate('/dashboard-login');
    };

    return (
        <header className={`admin-header ${scrolled ? 'scrolled' : ''}`}>
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
            
            <div className="header-container">
                {/* Branding Section */}
                <div className="header-brand">
                    <div className="logo-container">
                        <i className="fas fa-cut"></i>
                    </div>
                    <div className="brand-text">
                        <h1>Panel de Administración</h1>
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
                    
                    {/* Admin Profile */}
                    <div className="admin-profile" ref={menuRef}>
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
                    </div>
                </div>
            </div>
        </header>
    );
};


export default Header;




{/* {menuAbierto && (
              <div className="offcanvas-menu" ref={menuRef}>
                <div className="offcanvas-body">
                  <div className='d-flex align-items-center gap-2'>
                    <i className="fa-solid fa-shield-halved text-white"></i>
                    <p className='text-white'>Adminitrador</p>
                  </div>
                  <button className="w-100 text-start btn btn-dark text-white" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Cerrar sesión</button>
                </div>
              </div>
            )} */}
