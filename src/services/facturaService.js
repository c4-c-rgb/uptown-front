// src/services/facturaService.js
import axios from 'axios';
import API_BASE_URL from '../config/api';

const API_BASE = API_BASE_URL; // ajusta a tu puerto/backend real
const BASE = `${API_BASE}/facturas`;

export const facturaService = {
  verificarFactura: async (idReserva) => {
    try {
      const resp = await axios.get(`${BASE}/verificar/${idReserva}`);
      // resp.data.data => { tieneFactura: bool, factura?: {...} }
      return resp.data;
    } catch (error) {
      console.error('Error verificando factura:', error?.response?.data || error.message);
      // devolvemos objeto que indique que no tiene factura para que front no falle
      return { data: { tieneFactura: false } };
    }
  },
  enviarCorreoFactura(email, facturaId) {
    console.log(email, "----")
    return axios.post(`${BASE}/enviar-correo`, {
      email,
      facturaId
    });
  },

  crearFacturaAutomatica: async (reservaId, userId) => {
    try {
      const resp = await axios.post(`${BASE}/crear-automatica`, {
        id_reserva: Number(reservaId),
        id_user: Number(userId),
      });
      // El backend responde { statusCode, message, data: factura }
      return resp.data.data; // devolvemos la factura directamente
    } catch (error) {
      console.error('Error creando factura automática:', error?.response?.data || error.message);
      throw error;
    }
  },

  descargarPDF: async (idFactura) => {
    try {
      const resp = await axios.get(`${BASE}/${idFactura}/pdf`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `factura-${idFactura}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      console.error('Error descargando PDF:', error?.response?.data || error.message);
      throw error;
    }
  },
};
