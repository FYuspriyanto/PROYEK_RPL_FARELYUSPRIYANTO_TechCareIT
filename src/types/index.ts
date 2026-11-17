export type UserRole = 'ADMIN' | 'CUSTOMER';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
}

export type OrderStatus =
  | 'PENDING'
  | 'DIAGNOSING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'UNPAID' | 'PAID' | 'CANCELLED';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
