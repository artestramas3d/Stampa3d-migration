import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Format API error detail
export function formatApiError(error) {
  const detail = error.response?.data?.detail;
  if (detail == null) return "Si è verificato un errore. Riprova.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

// Filaments
export const getFilaments = () => api.get('/filaments').then(r => r.data);
export const createFilament = (data) => api.post('/filaments', data).then(r => r.data);
export const updateFilament = (id, data) => api.put(`/filaments/${id}`, data).then(r => r.data);
export const deleteFilament = (id) => api.delete(`/filaments/${id}`).then(r => r.data);

// Printers
export const getPrinters = () => api.get('/printers').then(r => r.data);
export const createPrinter = (data) => api.post('/printers', data).then(r => r.data);
export const updatePrinter = (id, data) => api.put(`/printers/${id}`, data).then(r => r.data);
export const deletePrinter = (id) => api.delete(`/printers/${id}`).then(r => r.data);

// Accessories
export const getAccessories = () => api.get('/accessories').then(r => r.data);
export const createAccessory = (data) => api.post('/accessories', data).then(r => r.data);
export const updateAccessory = (id, data) => api.put(`/accessories/${id}`, data).then(r => r.data);
export const deleteAccessory = (id) => api.delete(`/accessories/${id}`).then(r => r.data);

// Purchases
export const getPurchases = () => api.get('/purchases').then(r => r.data);
export const createPurchase = (data) => api.post('/purchases', data).then(r => r.data);
export const deletePurchase = (id) => api.delete(`/purchases/${id}`).then(r => r.data);

// Sales
export const getSales = () => api.get('/sales').then(r => r.data);
export const createSale = (data) => api.post('/sales', data).then(r => r.data);
export const deleteSale = (id) => api.delete(`/sales/${id}`).then(r => r.data);

// Calculator
export const calculatePrint = (data) => api.post('/calculate', data).then(r => r.data);

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats').then(r => r.data);

// Exports
export const exportSalesCSV = () => `${API}/export/sales`;
export const exportPurchasesCSV = () => `${API}/export/purchases`;

export default api;
