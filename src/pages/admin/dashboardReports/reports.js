import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import HeaderComponent from "../../../components/headerAdmin/header";
import FooterComponent from "../../../components/footerAdmin/adminFooter";
import FloatingBackground from "../../../components/shared/FloatingBackground";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import "./reports.scss";
// import { formatCOP } from "../../../utils/formatCOP";
import API_BASE_URL from '../../../config/api';
// Charts
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
// import { Bar as ChartBar, Line, Doughnut } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);

const BASE_URL = API_BASE_URL;

const COLORS = [
  '#0EA5E9', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6',
  '#14B8A6', '#F43F5E', '#6366F1', '#84CC16', '#10B981',
];

const Reports = () => {
  const navigate = useNavigate();
  const [reservas, setReservas] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filterType, setFilterType] = useState("mes");
  const [servicesMap, setServicesMap] = useState({});

  // 🔹 Cargar reservas
  useEffect(() => {
    const fetchReservas = async () => {
      try {
        const res = await fetch(`${BASE_URL}/reservas/admin`);
        if (!res.ok) throw new Error("Error al cargar reservas");
        const data = await res.json();
        setReservas(data);
        setFiltered(data);
      } catch (err) {
        console.error("Error al cargar reservas:", err);
      }
    };
    fetchReservas();
  }, []);

  // Cargar catálogo de servicios para mapear IDs a nombres
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(`${BASE_URL}/services`);
        if (!res.ok) return;
        const data = await res.json();
        const map = {};
        (Array.isArray(data) ? data : []).forEach(s => {
          if (s && (s.id != null)) map[s.id] = s.name || s.nombre || `Servicio ${s.id}`;
        });
        setServicesMap(map);
      } catch (_) { }
    };
    fetchServices();
  }, []);

  // 🔹 Filtrar por día, semana o mes
  const filterBy = (type) => {
    setFilterType(type);
    const now = new Date();

    const filteredData = reservas.filter((r) => {
      const fecha = new Date(r.dateReservation || r.fecha);
      if (isNaN(fecha)) return false;

      if (type === "dia") return fecha.toDateString() === now.toDateString();

      if (type === "semana") {
        const inicio = new Date(now);
        inicio.setDate(now.getDate() - 7);
        return fecha >= inicio && fecha <= now;
      }

      if (type === "mes")
        return (
          fecha.getMonth() === now.getMonth() &&
          fecha.getFullYear() === now.getFullYear()
        );

      return true;
    });

    setFiltered(filteredData);
  };

  // 🔹 Datos para los gráficos
  const chartData = useMemo(() => {
    const conteo = {};
    filtered.forEach((r) => {
      const nombreServicio =
        r.servicio?.nombre?.trim() || r.servicio?.name?.trim() || "Sin servicio";
      conteo[nombreServicio] = (conteo[nombreServicio] || 0) + 1;
    });

    return Object.keys(conteo).map((name) => ({
      name,
      value: conteo[name],
    }));
  }, [filtered]);

  // 🔹 Descargar Excel desde backend
  const handleDownload = async () => {
    try {
      const res = await fetch(`${BASE_URL}/reports/reservas-excel`, {
        method: "GET",
        headers: {
          Accept:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        console.error("Error backend:", res.status, txt);
        alert("Error al generar el reporte — revisa consola");
        return;
      }

      const blob = await res.blob();
      if (!blob || blob.size === 0) {
        console.error("Archivo vacío recibido del backend");
        alert("El reporte está vacío o dañado.");
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "reservas.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar reporte:", err);
      alert("Error al descargar reporte — revisa consola o logs backend.");
    }
  };

  return (
    <div className="admin-reports-page">
      <FloatingBackground />
      <style>{`
        @media (max-width: 768px) {
          .reports-page .btn.regresar { padding: 6px 10px; font-size: 0.85rem; border-radius: 8px; }
        }
        @media (max-width: 576px) {
          .reports-page .btn.regresar { padding: 5px 8px; font-size: 0.8rem; }
        }
      `}</style>
      <HeaderComponent />
      <div className="reports-page">
        <div className="card-grande">
          {/* ENCABEZADO */}
          <div className="card-header d-block bg-white text-dark pt-4 pb-0 border-0">
            <h2 className="page-title">Reporte de Reservas</h2>
            <div className="d-flex justify-content-end mb-2">
              <button
                className="btn btn-back"
                title="Volver"
                onClick={() => navigate("/dashboard-admin")}
              >
                <i className="fa-solid fa-arrow-left me-2"></i>Volver
              </button>
            </div>
          </div>

          {/* FILTROS Y BOTÓN */}
          <div className="filter-actions">
            <div className="filters">
              <button
                className={filterType === "dia" ? "active" : ""}
                onClick={() => filterBy("dia")}
              >
                Hoy
              </button>
              <button
                className={filterType === "semana" ? "active" : ""}
                onClick={() => filterBy("semana")}
              >
                Semana
              </button>
              <button
                className={filterType === "mes" ? "active" : ""}
                onClick={() => filterBy("mes")}
              >
                Mes
              </button>
            </div>

            <button className="btn-download" onClick={handleDownload}>
              <i className="fa-solid fa-file-arrow-down"></i> Descargar Excel
            </button>
          </div>

          {/* GRÁFICOS */}
          <div className="charts-container">
            <div className="chart-card">
              <h4>Reservas por Servicio</h4>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <RechartsLegend />
                    <Bar dataKey="value" fill="#4e73df" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center">No hay datos para mostrar</p>
              )}
            </div>

            <div className="chart-card">
              <h4>Distribución porcentual</h4>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={100}
                      label
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center">No hay datos para mostrar</p>
              )}
            </div>
          </div>

          {/* TABLA */}
          <div className="table-section">
            <div className="card-header">
              <h3>Listado de Reservas</h3>
            </div>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Servicio</th>
                    <th>Empleado</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? (
                    filtered.map((r) => {
                      const cliente =
                        r.usuario?.first_name || r.usuario?.last_name
                          ? `${r.usuario?.first_name || ""} ${r.usuario?.last_name || ""
                            }`.trim()
                          : r.cliente || "Sin cliente";

                      const empleado =
                        r.empleado?.first_name || r.empleado?.last_name
                          ? `${r.empleado?.first_name || ""} ${r.empleado?.last_name || ""
                            }`.trim()
                          : r.empleado || "Sin empleado";

                      const svcId = r.idService || r.serviceId || r.id_service || r.servicio_id || r.service_id;
                      const servicio = (() => {
                        // 1) Direct map by explicit id fields
                        if (svcId != null && servicesMap[String(svcId)]) return servicesMap[String(svcId)];
                        if (svcId != null && servicesMap[Number(svcId)]) return servicesMap[Number(svcId)];

                        // 2) If r.servicio is a number or string id
                        if (typeof r.servicio === 'number' && servicesMap[r.servicio]) return servicesMap[r.servicio];
                        if (typeof r.servicio === 'string') {
                          const raw = r.servicio.trim();
                          if (raw) {
                            const n = Number(raw);
                            if (!Number.isNaN(n) && servicesMap[n]) return servicesMap[n];
                            // Use the text directly if it looks like a name
                            return raw;
                          }
                        }

                        // 3) If r.servicio is object with common name keys
                        if (r.servicio && typeof r.servicio === 'object') {
                          const n = r.servicio.nombre || r.servicio.name || r.servicio.titulo || r.servicio.title;
                          if (n && String(n).trim()) return String(n).trim();
                          const sid = r.servicio.id || r.servicio.id_service || r.servicio.service_id;
                          if (sid != null && (servicesMap[sid] || servicesMap[String(sid)])) return servicesMap[sid] || servicesMap[String(sid)];
                        }

                        // 4) If r.services is an object or array
                        if (r.services) {
                          if (Array.isArray(r.services) && r.services.length) {
                            const first = r.services[0];
                            const n = first?.name || first?.nombre;
                            if (n && String(n).trim()) return String(n).trim();
                          } else if (typeof r.services === 'object') {
                            const n = r.services.name || r.services.nombre;
                            if (n && String(n).trim()) return String(n).trim();
                          }
                        }

                        // 5) Other common fields
                        const fall = r.service?.name || r.service?.nombre || r.servicio_nombre || r.nombre_servicio || r.name || r.titulo || r.title;
                        if (fall && String(fall).trim()) return String(fall).trim();

                        return "Sin servicio";
                      })();

                      if (servicio === "Sin servicio") {
                        try { console.warn('Reports: reserva sin servicio, payload keys:', Object.keys(r || {})); } catch (_) { }
                      }
                      return (
                        <tr key={r.id}>
                          <td>{r.id}</td>
                          <td>{cliente}</td>
                          <td>{servicio}</td>
                          <td>{empleado}</td>
                          <td>
                            {r.dateReservation
                              ? new Date(
                                r.dateReservation
                              ).toLocaleDateString("es-CO")
                              : r.fecha
                                ? new Date(r.fecha).toLocaleDateString("es-CO")
                                : "Sin fecha"}
                          </td>
                          <td>{r.timeReservation || r.hora || "Sin hora"}</td>
                          <td>{(() => { const raw = (r.state || r.estado || r.statusReservation || r.status || '').toString().toLowerCase(); return raw === 'cancelada' ? 'Cancelada' : 'Confirmada'; })()}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center">
                        No hay reservas registradas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <FooterComponent />
    </div>
  );
};

export default Reports;
