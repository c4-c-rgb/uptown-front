import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from "react";
import Header from '../../components/headerEmployee/header';
import Footer from '../../components/footerEmployee';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faUser } from '@fortawesome/free-solid-svg-icons';
import "./dashboardEmployee.scss";

const DashboardEmployee = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const userInfo = JSON.parse(sessionStorage.getItem("user"));
    useEffect(() => {
        // Pseudo-loading simulation
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 500);

        // Add animation class to cards when component mounts (after loading)
        if (!isLoading) {
            const cards = document.querySelectorAll('.employee-card');
            cards.forEach((card, index) => {
                card.style.animationDelay = `${index * 0.1}s`;
                card.classList.add('animate-in');
            });
        }

        return () => clearTimeout(timer);
    }, [isLoading]);

    const handleNavigation = (path) => {
        navigate(path);
    };

    if (isLoading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Cargando panel de control...</p>
            </div>
        );
    }

    return (
        <div className="employee-dashboard">
            <Header />
            <div className="dashboard-background">
                <div className="floating-shapes">
                    {[...Array(15)].map((_, i) => (
                        <div key={i} className="floating-shape" style={{
                            '--i': i,
                            '--size': `${Math.random() * 20 + 10}px`,
                            '--duration': `${Math.random() * 15 + 10}s`,
                            '--delay': `${Math.random() * 5}s`,
                            '--x': `${Math.random() * 100}%`,
                            '--y': `${Math.random() * 100}%`
                        }}></div>
                    ))}
                </div>
            </div>

            <main className="dashboard-main">
                <div className="dashboard-container">
                    <div className="header-bar">
                        <div className="hb-spacer" aria-hidden="true"></div>
                        <h1 className="page-title">Panel del <span style={{ color: '#2563eb' }}>Empleado</span></h1>
                        <div className="hb-spacer" aria-hidden="true"></div>
                    </div>
                    <div className="dashboard-header">
                        <p className="dashboard-subtitle">¿Qué te gustaría hacer hoy?</p>
                    </div>

                    <div className="employee-grid">
                        <div
                            className="employee-card"
                            onClick={() => handleNavigation('/dashboard-calendar-employee')}
                        >
                            <div className="card-inner">
                                <div className="card-front">
                                    <div className="card-icon">
                                        <FontAwesomeIcon icon={faCalendarCheck} />
                                    </div>
                                    <h3 className="card-title">Calendario</h3>
                                </div>
                                <div className="card-back">
                                    <span>Haz clic para acceder</span>
                                    <i className="fas fa-arrow-right"></i>
                                </div>
                            </div>
                        </div>

                        <div
                            className="employee-card"
                            onClick={() => handleNavigation('/dashboard-profile-employee')}
                        >
                            <div className="card-inner">
                                <div className="card-front">
                                    <div className="card-icon">
                                        <FontAwesomeIcon icon={faUser} />
                                    </div>
                                    <h3 className="card-title">Perfil</h3>
                                </div>
                                <div className="card-back">
                                    <span>Haz clic para acceder</span>
                                    <i className="fas fa-arrow-right"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default DashboardEmployee;
