import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  registerFranchise: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
};

export const franchiseAPI = {
  getAll: () => api.get('/franchises'),
  getById: (id) => api.get(`/franchises/${id}`),
  getDetails: (id) => api.get(`/franchises/${id}/details`),
  update: (id, data) => api.put(`/franchises/${id}`, data),
  delete: (id) => api.delete(`/franchises/${id}`),
  getAnalytics: () => api.get('/franchises/analytics'),
  getAllocationHistory: (franchiseId) => api.get(`/franchises/${franchiseId}/allocations`),
  getProduction: (franchiseId) => api.get(`/franchises/${franchiseId}/production`),
};

export const shopAPI = {
  getAll: () => api.get('/shops'),
  getById: (id) => api.get(`/shops/${id}`),
  create: (data) => api.post('/shops', data),
  update: (id, data) => api.put(`/shops/${id}`, data),
  delete: (id) => api.delete(`/shops/${id}`),
};

export const stockAPI = {
  allocateToFranchise: (data) => api.post('/stock/allocate-franchise', data),
  allocateToShop: (data) => api.post('/stock/allocate-shop', data),
  getFranchiseStock: (franchiseId) => api.get(`/stock/franchise${franchiseId ? `?franchiseId=${franchiseId}` : ''}`),
  getShopStock: (shopId) => api.get(`/stock/shop/${shopId}`),
  getOwnerInventory: () => api.get('/stock/owner-inventory'),
};

export const transactionAPI = {
  recordSales: (data) => api.post('/transactions/sales', data),
  recordEmptyBottles: (data) => api.post('/transactions/empty-bottles', data),
  getTransactions: (params) => api.get('/transactions', { params }),
  getOwnerOverview: () => api.get('/transactions/overview'),
  getFranchiseOverview: () => api.get('/transactions/franchise-overview'),
  getShopSales: (shopId) => api.get(`/transactions/shop-sales/${shopId}`),
  update: (id, data) => api.put(`/transactions/${id}`, data),
};

export const productionAPI = {
  record: (data) => api.post('/franchise-production/record', data),
  getHistory: () => api.get('/franchise-production/history'),
  getInventory: () => api.get('/franchise-production/inventory'),
};

export const adminAPI = {
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard'),
  getSystemHealth: () => api.get('/admin/system-health'),
  
  // User Management
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id, confirmPassword) => api.delete(`/admin/users/${id}`, { data: { confirmPassword } }),
  resetUserPassword: (id) => api.post(`/admin/users/${id}/reset-password`),
  toggleUserStatus: (id) => api.post(`/admin/users/${id}/toggle-status`),
  impersonateUser: (id) => api.post(`/admin/users/${id}/impersonate`),
  endImpersonation: (impersonatedUserId) => api.post('/admin/impersonate/end', { impersonatedUserId }),
  
  // Franchise Management
  getFranchises: (params) => api.get('/admin/franchises', { params }),
  overrideFranchiseStock: (id, data) => api.post(`/admin/franchises/${id}/override-stock`, data),
  getFranchiseAudit: (id) => api.get(`/admin/franchises/${id}/audit`),
  
  // Transaction Management
  getTransactions: (params) => api.get('/admin/transactions', { params }),
  deleteTransaction: (id, confirmPassword) => api.delete(`/admin/transactions/${id}`, { data: { confirmPassword } }),
  
  // Audit Logs
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  
  // System Maintenance
  cleanupData: (data) => api.post('/admin/cleanup', data),
  exportData: (data) => api.post('/admin/export', data),
};

export default api;
