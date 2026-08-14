import axios from 'axios';

// Path API relativo al dominio corrente. Funziona su:
// - calcolatore.artestramas3d.it (app principale)
// - shop.artestramas3d.it (vetrina pubblica)
// - listino.artestramas3d.it (legacy alias)
// - Emergent preview env
// nginx ha la rule `location /api/` per ogni dominio che proxa al backend.
const API = '/api';

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
export const getAccessoryCategories = () => api.get('/accessory-categories').then(r => r.data);
export const addAccessoryCategory = (name) => api.post('/accessory-categories', { name }).then(r => r.data);
export const deleteAccessoryCategory = (name) => api.delete(`/accessory-categories/${encodeURIComponent(name)}`).then(r => r.data);

// Purchases
export const getPurchases = () => api.get('/purchases').then(r => r.data);
export const createPurchase = (data) => api.post('/purchases', data).then(r => r.data);
export const deletePurchase = (id) => api.delete(`/purchases/${id}`).then(r => r.data);

// Sales
export const getSales = () => api.get('/sales').then(r => r.data);
export const getRecentSales = (limit = 10) => api.get(`/sales/recent?limit=${limit}`).then(r => r.data);
export const createSale = (data) => api.post('/sales', data).then(r => r.data);
export const updateSalePaid = (id, paid) => api.patch(`/sales/${id}/paid`, { paid }).then(r => r.data);
export const updateSale = (id, data) => api.patch(`/sales/${id}`, data).then(r => r.data);
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
export const getPublicBanners = (page) => api.get(`/public/banners/${page}`).then(r => r.data);
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
// Products (admin)
export const getProducts = () => api.get('/products').then(r => r.data);
export const createProduct = (data) => api.post('/products', data).then(r => r.data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data).then(r => r.data);
export const deleteProduct = (id) => api.delete(`/products/${id}`).then(r => r.data);

// Public shop
export const getPublicListino = () => api.get('/public/listino').then(r => r.data);
export const getPublicProduct = (slug) => api.get(`/public/product/${slug}`).then(r => r.data);
export const sendProductInquiry = (data) => api.post('/public/product-inquiry', data).then(r => r.data);

// Admin - Richieste/Inquiries + Product Analytics
export const getAdminInquiries = () => api.get('/admin/inquiries').then(r => r.data);
export const updateAdminInquiry = (id, data) => api.put(`/admin/inquiries/${id}`, data).then(r => r.data);
export const deleteAdminInquiry = (id) => api.delete(`/admin/inquiries/${id}`).then(r => r.data);
export const getAdminProductStats = () => api.get('/admin/product-stats').then(r => r.data);

// Page tracking
export const trackPageView = (path, visitor_id) => api.post('/track/page-view', { path, visitor_id, referrer: typeof document !== 'undefined' ? document.referrer : '' }).then(r => r.data).catch(() => {});
export const getAdminPageStats = (days = 7) => api.get(`/admin/page-stats?days=${days}`).then(r => r.data);
export const resetAdminPageStats = () => api.delete('/admin/page-stats').then(r => r.data);

// Affiliate links
export const getAdminAffiliateLinks = () => api.get('/admin/affiliate-links').then(r => r.data);
export const createAffiliateLink = (data) => api.post('/admin/affiliate-links', data).then(r => r.data);
export const updateAffiliateLink = (id, data) => api.put(`/admin/affiliate-links/${id}`, data).then(r => r.data);
export const deleteAffiliateLink = (id) => api.delete(`/admin/affiliate-links/${id}`).then(r => r.data);
export const getAdminAffiliateStats = (days = 7) => api.get(`/admin/affiliate-links/stats?days=${days}`).then(r => r.data);
export const getAffiliateLinksByPlacement = (placement) => api.get(`/affiliate-links/${placement}`).then(r => r.data);
export const trackAffiliateClick = (id) => api.post(`/affiliate-links/${id}/click`).then(r => r.data);

// Public endpoints (no auth)
export const getPublicLanding = () => api.get('/public/landing').then(r => r.data);
export const submitContactForm = (data) => api.post('/public/contact', data).then(r => r.data);

// Admin - Landing Settings
export const getLandingSettings = () => api.get('/admin/landing-settings').then(r => r.data);
export const updateLandingSettings = (data) => api.put('/admin/landing-settings', data).then(r => r.data);
export const getContactRequests = () => api.get('/admin/contact-requests').then(r => r.data);
export const getAdminUserProfile = (id) => api.get(`/admin/users/${id}/profile`).then(r => r.data);

// 3MF Import
export const import3mf = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/import/3mf', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
};

// Clients
export const getClients = () => api.get('/clients').then(r => r.data);
export const createClient = (data) => api.post('/clients', data).then(r => r.data);
export const updateClient = (id, data) => api.put(`/clients/${id}`, data).then(r => r.data);
export const deleteClient = (id) => api.delete(`/clients/${id}`).then(r => r.data);
export const getClientSales = (id) => api.get(`/clients/${id}/sales`).then(r => r.data);

// Business Settings
export const getBusinessSettings = () => api.get('/business-settings').then(r => r.data);
export const updateBusinessSettings = (data) => api.put('/business-settings', data).then(r => r.data);

// Quotes
export const generateQuotePdf = (data) => api.post('/quotes/generate-pdf', data).then(r => r.data);
export const getQuotes = () => api.get('/quotes').then(r => r.data);
export const getQuotesSalesMap = () => api.get('/quotes/sales-map').then(r => r.data);
export const deleteQuote = (id) => api.delete(`/quotes/${id}`).then(r => r.data);
export const updateQuote = (id, data) => api.put(`/quotes/${id}`, data).then(r => r.data);
export const sendQuoteEmail = (data) => api.post('/quotes/send-email', data).then(r => r.data);

// Demo stats
export const recordDemoVisit = () => api.post('/public/demo-visit').then(r => r.data);
export const getDemoStats = () => api.get('/admin/demo-stats').then(r => r.data);

// Export URLs
export const exportFilamentsCSV = () => `${API}/export/filaments`;
export const exportClientsCSV = () => `${API}/export/clients`;

// Public site scripts (no auth)
export const getPublicSiteScripts = () => api.get('/public/site-scripts').then(r => r.data);

// Shop Settings
export const getPublicShopSettings = () => api.get('/public/shop-settings').then(r => r.data);
export const getAdminShopSettings = () => api.get('/admin/shop-settings').then(r => r.data);
export const updateShopSettings = (data) => api.put('/admin/shop-settings', data).then(r => r.data);
export const toggleShopOwner = (userId) => api.post(`/admin/toggle-shop-owner/${userId}`).then(r => r.data);

// Cricut / Plotter da taglio
export const getCricutMeta = () => api.get('/cricut/meta').then(r => r.data);
export const getCricutMaterials = () => api.get('/cricut/materials').then(r => r.data);
export const createCricutMaterial = (data) => api.post('/cricut/materials', data).then(r => r.data);
export const updateCricutMaterial = (id, data) => api.put(`/cricut/materials/${id}`, data).then(r => r.data);
export const deleteCricutMaterial = (id) => api.delete(`/cricut/materials/${id}`).then(r => r.data);
export const getCricutMachines = () => api.get('/cricut/machines').then(r => r.data);
export const createCricutMachine = (data) => api.post('/cricut/machines', data).then(r => r.data);
export const updateCricutMachine = (id, data) => api.put(`/cricut/machines/${id}`, data).then(r => r.data);
export const deleteCricutMachine = (id) => api.delete(`/cricut/machines/${id}`).then(r => r.data);
export const getCricutConsumables = () => api.get('/cricut/consumables').then(r => r.data);
export const createCricutConsumable = (data) => api.post('/cricut/consumables', data).then(r => r.data);
export const updateCricutConsumable = (id, data) => api.put(`/cricut/consumables/${id}`, data).then(r => r.data);
export const deleteCricutConsumable = (id) => api.delete(`/cricut/consumables/${id}`).then(r => r.data);
export const getCricutProjects = () => api.get('/cricut/projects').then(r => r.data);
export const getCricutProject = (id) => api.get(`/cricut/projects/${id}`).then(r => r.data);
export const createCricutProject = (data) => api.post('/cricut/projects', data).then(r => r.data);
export const updateCricutProject = (id, data) => api.put(`/cricut/projects/${id}`, data).then(r => r.data);
export const deleteCricutProject = (id) => api.delete(`/cricut/projects/${id}`).then(r => r.data);
export const duplicateCricutProject = (id) => api.post(`/cricut/projects/${id}/duplicate`).then(r => r.data);

// News / Notizie
export const getAdminNews = () => api.get('/admin/news').then(r => r.data);
export const createNews = (data) => api.post('/admin/news', data).then(r => r.data);
export const updateNews = (id, data) => api.put(`/admin/news/${id}`, data).then(r => r.data);
export const deleteNews = (id) => api.delete(`/admin/news/${id}`).then(r => r.data);
export const getPublicNews = (params = {}) => api.get('/public/news', { params }).then(r => r.data);
export const getPublicNewsDetail = (slug) => api.get(`/public/news/${slug}`).then(r => r.data);
export const getPublicNewsCategories = () => api.get('/public/news-categories').then(r => r.data);

export default api;
