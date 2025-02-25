import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { from, subject } = await request.json();

    if (!from || !subject) {
      return NextResponse.json(
        { success: false, error: 'Email et sujet requis' },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        from,
        subject,
        // sentDate sera automatiquement défini par la valeur par défaut
      }
    });

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    return NextResponse.json(
      { success: false, error: 'Échec de la création de la notification' },
      { status: 500 }
    );
  }
}