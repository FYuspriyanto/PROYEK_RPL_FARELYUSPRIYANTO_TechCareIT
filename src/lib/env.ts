export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  JWT_SECRET: process.env.JWT_SECRET || 'super-secret-jwt-key-for-it-services-2026-min-32-chars-length',
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME || 'it_service_session',
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'TechCare AI IT Services',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  isProduction: process.env.NODE_ENV === 'production',

  // WhatsApp Notification Settings
  WHATSAPP_ENABLED: process.env.WHATSAPP_ENABLED === 'true',
  WHATSAPP_PROVIDER: process.env.WHATSAPP_PROVIDER || 'generic',
  WHATSAPP_API_URL: process.env.WHATSAPP_API_URL || '',
  WHATSAPP_API_KEY: process.env.WHATSAPP_API_KEY || '',
  WHATSAPP_ADMIN_PHONE: process.env.WHATSAPP_ADMIN_PHONE || '6288231331266',
  WHATSAPP_SENDER_NAME: process.env.WHATSAPP_SENDER_NAME || 'TechCare AI',

  // Telegram Notification Settings
  TELEGRAM_ENABLED: process.env.TELEGRAM_ENABLED === 'true',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_ADMIN_CHAT_ID: process.env.TELEGRAM_ADMIN_CHAT_ID || '',
  TELEGRAM_SENDER_NAME: process.env.TELEGRAM_SENDER_NAME || 'TechCare AI',
};
