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
  record: (data) => api.post('/production', data),
  getHistory: () => api.get('/production'),
  getInventory: () => api.get('/production/inventory'),
};

export default api;
