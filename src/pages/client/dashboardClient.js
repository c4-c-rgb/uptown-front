import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from "react";
import HeaderComponent from '../../components/headerClient/Header';
import Footer from '../../components/footerClient/Footer';
import "./dashboardClient.scss";

const DashboardClient = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    const userInfo = (() => { try { const raw = sessionStorage.getItem("user"); return raw ? JSON.parse(raw) : {}; } catch (e) { return {}; } })();

    useEffect(() => {
        // Pseudo-loading simulation to match Employee Dashboard feel
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isLoading) {
            const cards = document.querySelectorAll('.client-card');
            cards.forEach((card, index) => {
                card.style.animationDelay = `${index * 0.1}s`;
                card.classList.add('animate-in');
            });
        }
    }, [isLoading]);

    const menuItems = [
        { icon: 'fa-calendar-plus', title: 'Hacer una Reserva', path: '/crear-reserva-cliente' },
        { icon: 'fa-calendar-check', title: 'Mis Reservas', path: '/mis-reservas-cliente' },
        { icon: 'fa-user', title: 'Mi Perfil', path: '/dashboard-perfil-cliente' },
    ];

    if (isLoading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Cargando panel de cliente...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-client">
            <HeaderComponent clientName={userInfo.name || ''} clientEmail={userInfo.email || ''} />

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
                        <h1 className="page-title">Panel de <span style={{ color: '#2563eb' }}>Cliente</span></h1>
                    </div>

                    <div className="dashboard-header">
                        <p className="dashboard-subtitle">Bienvenido, {userInfo.name || 'Cliente'}</p>
                        <p className="dashboard-subtitle" style={{ fontSize: '1rem', marginTop: '0.5rem' }}>¿Qué te gustaría hacer hoy?</p>
                    </div>

                    <div className="client-grid">
                        {menuItems.map((item, index) => (
                            <div
                                key={index}
                                className="client-card"
                                onClick={() => navigate(item.path)}
                            >
                                <div className="card-inner">
                                    <div className="card-front">
                                        <div className="card-icon">
                                            <i className={`fas ${item.icon}`}></i>
                                        </div>
                                        <h3 className="card-title">{item.title}</h3>
                                    </div>
                                    <div className="card-back">
                                        <span>Haz clic para acceder</span>
                                        <i className="fas fa-arrow-right"></i>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default DashboardClient;
