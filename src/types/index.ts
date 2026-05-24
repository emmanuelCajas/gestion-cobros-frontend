export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'COBRADOR';
  activo: boolean;
  createdAt: string;
}

export interface Client {
  id: string;
  nombre: string;
  telefono: string;
  direccion: string;
  email?: string;
  cedula: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  prestamos?: Loan[];
}

export interface Loan {
  id: string;
  clienteId: string;
  montoOriginal: number;
  tasaInteresMensual?: number;
  totalConInteres: number;
  saldoPendiente: number;
  fechaCreacion: string;
  activo: boolean;
  cliente?: {
    id: string;
    nombre: string;
    cedula: string;
    telefono?: string;
  };
  pagos?: Payment[];
  totalPagado?: number;
  cantidadPagos?: number;
  porcentajePagado?: number;
}

export interface Payment {
  id: string;
  prestamoId: string;
  monto: number;
  fechaPago: string;
  horaRegistro: string;
  registradoPorId: string;
  observacion?: string;
  saldoRestante?: number;
  prestamo?: {
    id: string;
    montoOriginal: number;
    totalConInteres: number;
    saldoPendiente: number;
    cliente: {
      id: string;
      nombre: string;
      cedula: string;
    };
  };
  registradoPor?: {
    id: string;
    nombre: string;
  };
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
  statusCode: number;
}