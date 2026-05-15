import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

export default api;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string; organizationName?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  memberships: () => api.get('/auth/memberships'),
  switchOrg: (orgId: string) => api.post(`/auth/switch-org/${orgId}`),
  googleAuthUrl: () => `${BASE_URL}/auth/google`,
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  getSummary: (date?: string) => api.get('/billing/dashboard', { params: date ? { date } : {} }),
};

// ─── Farmers ─────────────────────────────────────────────────────────────────
export const farmersApi = {
  list: () => api.get('/farmers'),
  get: (id: string) => api.get(`/farmers/${id}`),
  stats: (id: string) => api.get(`/farmers/${id}/stats`),
  create: (data: unknown) => api.post('/farmers', data),
  update: (id: string, data: unknown) => api.put(`/farmers/${id}`, data),
  remove: (id: string) => api.delete(`/farmers/${id}`),
};

// ─── Retailers ────────────────────────────────────────────────────────────────
export const retailersApi = {
  list: () => api.get('/retailers'),
  get: (id: string) => api.get(`/retailers/${id}`),
  create: (data: unknown) => api.post('/retailers', data),
  update: (id: string, data: unknown) => api.put(`/retailers/${id}`, data),
  remove: (id: string) => api.delete(`/retailers/${id}`),
};

// ─── Market Rates ─────────────────────────────────────────────────────────────
export const marketRatesApi = {
  list: () => api.get('/market-rates'),
  latest: () => api.get('/market-rates/latest'),
  set: (data: { date: string; session: string; ratePerMaund: number }) =>
    api.post('/market-rates', data),
};

// ─── Collection ───────────────────────────────────────────────────────────────
export const collectionApi = {
  list: (date?: string, page = 1, limit = 50) =>
    api.get('/collection', { params: { ...(date ? { date } : {}), page, limit } }),
  summary: (date: string) => api.get('/collection/summary', { params: { date } }),
  create: (data: unknown) => api.post('/collection', data),
};

// ─── Delivery ─────────────────────────────────────────────────────────────────
export const deliveryApi = {
  list: (date?: string, page = 1, limit = 50) =>
    api.get('/delivery', { params: { ...(date ? { date } : {}), page, limit } }),
  summary: (date: string) => api.get('/delivery/summary', { params: { date } }),
  create: (data: unknown) => api.post('/delivery', data),
};

// ─── Billing ─────────────────────────────────────────────────────────────────
export const billingApi = {
  farmerInvoices: (farmerId?: string, isPaid?: string, dateFrom?: string, dateTo?: string, paymentMode?: string, page = 1, limit = 50) =>
    api.get('/billing/farmers', { params: { farmerId, isPaid, dateFrom, dateTo, paymentMode, page, limit } }),
  retailerInvoices: (retailerId?: string, isPaid?: string, dateFrom?: string, dateTo?: string, paymentMode?: string, page = 1, limit = 50) =>
    api.get('/billing/retailers', { params: { retailerId, isPaid, dateFrom, dateTo, paymentMode, page, limit } }),
  generateFarmerInvoices: (date: string) => api.post('/billing/generate/farmers', { date }),
  generateRetailerInvoices: (date: string) => api.post('/billing/generate/retailers', { date }),
  markFarmerPaid: (id: string, paymentMode?: string, paymentReference?: string) =>
    api.patch(`/billing/farmers/${id}/paid`, { paymentMode, paymentReference }),
  markRetailerPaid: (id: string, paymentMode?: string, paymentReference?: string) =>
    api.patch(`/billing/retailers/${id}/paid`, { paymentMode, paymentReference }),
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentsApi = {
  list: (params?: {
    direction?: string;
    paymentType?: string;
    dateFrom?: string;
    dateTo?: string;
    farmerId?: string;
    retailerId?: string;
  }) => api.get('/payments', { params }),
  summary: (dateFrom?: string, dateTo?: string) =>
    api.get('/payments/summary', { params: { dateFrom, dateTo } }),
  create: (data: unknown) => api.post('/payments', data),
  remove: (id: string) => api.delete(`/payments/${id}`),
};

// ─── Transport ────────────────────────────────────────────────────────────────
export const transportApi = {
  trips: () => api.get('/transport/trips'),
  trip: (id: string) => api.get(`/transport/trips/${id}`),
  createTrip: (data: unknown) => api.post('/transport/trips', data),
  addStop: (id: string, data: unknown) => api.post(`/transport/trips/${id}/stops`, data),
  completeTrip: (id: string) => api.patch(`/transport/trips/${id}/complete`),
  tanks: () => api.get('/transport/tanks'),
  createTank: (data: unknown) => api.post('/transport/tanks', data),
};

// ─── Staff ────────────────────────────────────────────────────────────────────
export const staffApi = {
  list: () => api.get('/staff'),
  payroll: () => api.get('/staff/payroll'),
  create: (data: unknown) => api.post('/staff', data),
  update: (id: string, data: unknown) => api.put(`/staff/${id}`, data),
  remove: (id: string) => api.delete(`/staff/${id}`),
};

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportsApi = {
  collection: (dateFrom: string, dateTo: string, session?: string) =>
    api.get('/reports/collection', { params: { dateFrom, dateTo, session } }),
  delivery: (dateFrom: string, dateTo: string, session?: string) =>
    api.get('/reports/delivery', { params: { dateFrom, dateTo, session } }),
  balance: (dateFrom: string, dateTo: string) =>
    api.get('/reports/balance', { params: { dateFrom, dateTo } }),
  quality: (dateFrom: string, dateTo: string, farmerId?: string) =>
    api.get('/reports/quality', { params: { dateFrom, dateTo, farmerId } }),
  payments: (dateFrom: string, dateTo: string) =>
    api.get('/reports/payments', { params: { dateFrom, dateTo } }),
  receivables: () => api.get('/reports/receivables'),
};

// ─── Accounts ─────────────────────────────────────────────────────────────────
export const accountsApi = {
  profitLoss: (dateFrom: string, dateTo: string) =>
    api.get('/accounts/profit-loss', { params: { dateFrom, dateTo } }),
  balanceSheet: () => api.get('/accounts/balance-sheet'),
};

// ─── Subscription ─────────────────────────────────────────────────────────────
export const subscriptionApi = {
  current: () => api.get('/subscription'),
  history: () => api.get('/subscription/history'),
};

// ─── Organization Settings ────────────────────────────────────────────────────
export const orgSettingsApi = {
  get: () => api.get('/organization/settings'),
  update: (data: Record<string, unknown>) => api.patch('/organization/settings', data),
};

// ─── Scheduler ────────────────────────────────────────────────────────────────
export const schedulerApi = {
  list: () => api.get('/scheduler'),
  create: (data: unknown) => api.post('/scheduler', data),
  update: (id: string, data: unknown) => api.patch(`/scheduler/${id}`, data),
  toggle: (id: string, isActive: boolean) => api.patch(`/scheduler/${id}/toggle`, { isActive }),
  remove: (id: string) => api.delete(`/scheduler/${id}`),
};

// ─── Users (Admin) ────────────────────────────────────────────────────────────
export const usersApi = {
  list: () => api.get('/users'),
  invite: (data: { name: string; email: string; role?: string; department?: string; position?: string }) =>
    api.post('/users/invite', data),
  updateRole: (id: string, role: string) => api.patch(`/users/${id}/role`, { role }),
  updatePermissions: (id: string, allowedPages: string[]) =>
    api.patch(`/users/${id}/permissions`, { allowedPages }),
  block: (id: string) => api.patch(`/users/${id}/block`),
  unblock: (id: string) => api.patch(`/users/${id}/unblock`),
  resetPassword: (id: string) => api.post(`/users/${id}/reset-password`),
  remove: (id: string) => api.delete(`/users/${id}`),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: (channel?: string, unread?: boolean) =>
    api.get('/notifications', { params: { channel, unread } }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// ─── Public Branding (no auth) ────────────────────────────────────────────────
export const publicBrandingApi = {
  get: () => api.get('/organization/public-branding'),
};

// ─── Auth: accept invite ──────────────────────────────────────────────────────
export const acceptInviteApi = {
  accept: (token: string, password: string) => api.post('/auth/accept-invite', { token, password }),
};
