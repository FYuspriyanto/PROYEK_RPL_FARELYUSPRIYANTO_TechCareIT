import type { Metadata } from 'next';
import './globals.css';
import { ChatbotPopup } from '@/components/ChatbotPopup';

export const metadata: Metadata = {
  title: 'TechCare IT Services & Repair Platform',
  description:
    'Platform Layanan & Perbaikan IT, Komputer, Laptop, dan Hardware Terpercaya Berbasis AI & Profesional.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <div className="bg-mesh" />
        
        {/* Main Content */}
        <main>{children}</main>

        {/* Chatbot Popup (fixed, muncul di semua halaman termasuk homepage /) */}
        <ChatbotPopup />
      </body>
    </html>
  );
}
