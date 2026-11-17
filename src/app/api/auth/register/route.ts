import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, setSessionCookie } from '@/lib/auth';
import { jsonError, jsonSuccess } from '@/lib/response';
import { NotificationService } from '@/lib/notifications/service';
import { notifyUserRegistered } from '@/lib/notifications/whatsapp';
import { notifyUserRegisteredTelegram } from '@/lib/notifications/telegram';

const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().email('Format email tidak valid').max(255),
  // bcrypt memotong input > 72 byte — batasi agar tidak ambigu
  password: z.string().min(8, 'Password minimal 8 karakter').max(72),
  phone: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      const errorMsg = validation.error.errors[0]?.message || 'Input tidak valid';
      return jsonError(errorMsg, 400);
    }

    const { name, email, password, phone, address } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return jsonError('Email sudah terdaftar. Silakan gunakan email lain atau login.', 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create User and CustomerProfile in transaction
    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'CUSTOMER',
        phone: phone || null,
        profile: {
          create: {
            address: address || null,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    // Auto-login session
    const sessionData = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role as 'ADMIN' | 'CUSTOMER',
      phone: newUser.phone,
    };

    await setSessionCookie(sessionData);

    // Send WhatsApp notification to admin (non-blocking)
    try {
      await notifyUserRegistered({
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone || undefined,
        address: newUser.profile?.address || undefined,
      });
    } catch (whatsappError) {
      console.error('[Register] WhatsApp notification failed:', whatsappError);
      // Don't fail registration if WhatsApp fails
    }

    // Send Telegram notification to admin (non-blocking)
    try {
      await notifyUserRegisteredTelegram({
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone || undefined,
        address: newUser.profile?.address || undefined,
      });
    } catch (telegramError) {
      console.error('[Register] Telegram notification failed:', telegramError);
      // Don't fail registration if Telegram fails
    }

    return jsonSuccess(
      {
        user: sessionData,
        redirectTo: '/customer/dashboard',
      },
      'Registrasi berhasil',
      201
    );
  } catch (error: any) {
    console.error('Register error:', error);
    return jsonError('Terjadi kesalahan pada server saat registrasi', 500);
  }
}
