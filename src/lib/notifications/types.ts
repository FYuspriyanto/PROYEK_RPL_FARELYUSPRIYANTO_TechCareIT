// =============================================
// Notification Types & Interfaces
// =============================================

export type NotificationType =
  // Customer notifications
  | 'ORDER_RECEIVED'
  | 'DIAGNOSING'
  | 'ESTIMATE_READY'
  | 'APPROVAL_NEEDED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'INVOICE_CREATED'
  | 'PAYMENT_RECEIVED'
  // Admin notifications
  | 'NEW_ORDER_ADMIN'
  | 'CUSTOMER_APPROVAL'
  | 'PAYMENT_UPDATE'
  // System notifications (WhatsApp to admin)
  | 'USER_REGISTERED'
  | 'USER_REPORT';

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  metadata: string | null;
  createdAt: Date;
}

// Future channel interface for extensibility
export interface NotificationChannel {
  name: string;
  send(payload: NotificationPayload): Promise<void>;
}
