import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import HeaderComponent from '../../../components/headerAdmin/header';
import FooterComponent from '../../../components/footerAdmin/adminFooter';
import "./dashboardAdmin.scss";

const DashboardAdmin = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Add animation class to cards when component mounts
        const cards = document.querySelectorAll('.admin-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('animate-in');
        });
    }, []);

    const menuItems = [
        { icon: 'fa-users', title: 'Usuarios', path: '/dashboard-users' },
        // { icon: 'fa-scissors', title: 'Estilistas', path: '/dashboard-stilist' },
        { icon: 'fa-plus', title: 'Servicios', path: '/dashboard-services' },
        { icon: 'fa-calendar-days', title: 'Gestionar Horarios', path: '/dashboard-schedules' },
        { icon: 'fa-calendar-check', title: 'Reservas', path: '/dashboard-reservas' },
        { icon: 'fa-chart-column', title: 'Reportes', path: '/dashboard-reports' }
    ];

    return (
        <div className="dashboard-admin">
            <HeaderComponent />
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

            <main className="dashboard-container">
                <div className="dashboard-header">
                    <h1 className="dashboard-title">Panel de <span>Administración</span></h1>
                    <p className="dashboard-subtitle">Gestiona todos los aspectos de tu negocio</p>
                </div>

                <div className="admin-grid">
                    {menuItems.map((item, index) => (
                        <div
                            key={index}
                            className="admin-card"
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
            </main>
            <FooterComponent />
        </div>
    );
};



export default DashboardAdmin;