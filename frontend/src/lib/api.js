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
export const getRecentSales = (limit = 10) => api.get(`/sales/recent?limit=${limit}`).then(r => r.data);
export const createSale = (data) => api.post('/sales', data).then(r => r.data);
export const updateSalePaid = (id, paid) => api.patch(`/sales/${id}/paid`, { paid }).then(r => r.data);
export const deleteSale = (id) => api.delete(`/sales/${id}`).then(r => r.data);

// Calculator
export const calculatePrint = (data) => api.post('/calculate', data).then(r => r.data);

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats').then(r => r.data);

// Exports
export const exportSalesCSV = () => `${API}/export/sales`;
export const exportPurchasesCSV = () => `${API}/export/purchases`;

// Banners
export const getBanners = () => api.get('/banners').then(r => r.data);
export const getActiveBanners = () => api.get('/banners/active').then(r => r.data);
export const createBanner = (data) => api.post('/banners', data).then(r => r.data);
export const updateBanner = (id, data) => api.put(`/banners/${id}`, data).then(r => r.data);
export const deleteBanner = (id) => api.delete(`/banners/${id}`).then(r => r.data);

// Auth - Password Recovery & Verification
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email }).then(r => r.data);
export const resetPassword = (token, new_password) => api.post('/auth/reset-password', { token, new_password }).then(r => r.data);
export const verifyEmail = (token) => api.get(`/auth/verify-email?token=${token}`).then(r => r.data);
export const resendVerification = () => api.post('/auth/resend-verification').then(r => r.data);
export const updateProfile = (data) => api.put('/auth/profile', data).then(r => r.data);
export const changePassword = (data) => api.post('/auth/change-password', data).then(r => r.data);

// Admin
export const getAdminUsers = () => api.get('/admin/users').then(r => r.data);
export const adminVerifyUser = (id) => api.post(`/admin/verify-user/${id}`).then(r => r.data);
export const adminToggleAdmin = (id) => api.post(`/admin/toggle-admin/${id}`).then(r => r.data);
export const adminDeleteUser = (id) => api.delete(`/admin/users/${id}`).then(r => r.data);
export const getAdminStats = () => api.get('/admin/stats').then(r => r.data);
export const getAdminEmailLogs = () => api.get('/admin/email-logs').then(r => r.data);
export const getAdminNewsletters = () => api.get('/admin/newsletters').then(r => r.data);
export const sendAdminNewsletter = (data) => api.post('/admin/newsletters', data).then(r => r.data);
export const deleteAdminNewsletter = (id) => api.delete(`/admin/newsletters/${id}`).then(r => r.data);

// Site Settings
export const getSiteSettings = () => api.get('/site-settings').then(r => r.data);
export const updateSiteSettings = (data) => api.put('/admin/site-settings', data).then(r => r.data);

// Bug Reports
export const createBugReport = (data) => api.post('/bug-reports', data).then(r => r.data);
export const getMyBugReports = () => api.get('/bug-reports').then(r => r.data);
export const getAdminBugReports = () => api.get('/admin/bug-reports').then(r => r.data);
export const getAdminBugScreenshot = (id) => api.get(`/admin/bug-reports/${id}/screenshot`).then(r => r.data);
export const updateAdminBugReport = (id, data) => api.put(`/admin/bug-reports/${id}`, data).then(r => r.data);

// Products
export const getProducts = () => api.get('/products').then(r => r.data);
export const createProduct = (data) => api.post('/products', data).then(r => r.data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data).then(r => r.data);
export const deleteProduct = (id) => api.delete(`/products/${id}`).then(r => r.data);

// Public endpoints (no auth)
export const getPublicListino = () => api.get('/public/listino').then(r => r.data);
export const getPublicLanding = () => api.get('/public/landing').then(r => r.data);
export const submitContactForm = (data) => api.post('/public/contact', data).then(r => r.data);

// Admin - Landing Settings
export const getLandingSettings = () => api.get('/admin/landing-settings').then(r => r.data);
export const updateLandingSettings = (data) => api.put('/admin/landing-settings', data).then(r => r.data);
export const getContactRequests = () => api.get('/admin/contact-requests').then(r => r.data);

// 3MF Import
export const import3mf = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/import/3mf', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
};

export default api;
