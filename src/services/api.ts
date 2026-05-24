import type { Client, Loan, Payment, User, LoginResponse } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
  },

  users: {
    getAll: () => request<User[]>('/users'),
    getProfile: () => request<User>('/users/profile'),
    updateProfile: (data: { nombre?: string; email?: string }) =>
      request<User>('/users/profile', { method: 'PATCH', body: JSON.stringify(data) }),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      request<{ message: string }>('/users/profile/password', { method: 'POST', body: JSON.stringify(data) }),
    create: (data: { nombre: string; email: string; password: string; rol: 'ADMIN' | 'COBRADOR' }) =>
      request<User>('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ nombre: string; email: string; password: string; rol: string; activo: boolean }>) =>
      request<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<User>(`/users/${id}`, { method: 'DELETE' }),
  },

  clients: {
    getAll: (search?: string) => request<Client[]>(`/clients${search ? `?search=${search}` : ''}`),
    getOne: (id: string) => request<Client>(`/clients/${id}`),
    create: (data: Omit<Client, 'id' | 'activo' | 'createdAt' | 'updatedAt' | 'prestamos'>) =>
      request<Client>('/clients', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Client>) =>
      request<Client>(`/clients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<Client>(`/clients/${id}`, { method: 'DELETE' }),
  },

  loans: {
    getByClient: (clientId: string) => request<Loan[]>(`/loans/client/${clientId}`),
    getOne: (id: string) => request<Loan>(`/loans/${id}`),
    create: (data: { clienteId: string; montoOriginal: number; tasaInteresMensual?: number; fechaCreacion?: string }) =>
      request<Loan>('/loans', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ montoOriginal: number; tasaInteresMensual: number; activo: boolean }>) =>
      request<Loan>(`/loans/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<Loan>(`/loans/${id}`, { method: 'DELETE' }),
  },

  payments: {
    getByLoan: (loanId: string) => request<Payment[]>(`/payments/loan/${loanId}`),
    getOne: (id: string) => request<Payment>(`/payments/${id}`),
    create: (data: { prestamoId: string; monto: number; fechaPago: string; observacion?: string }) =>
      request<Payment>('/payments', { method: 'POST', body: JSON.stringify(data) }),
  },
};