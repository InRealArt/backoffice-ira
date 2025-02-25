import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const notifications = await prisma.notification.findMany({
        where: {
            complete: false
        }
    });
    console.log('notifications', notifications);
    return NextResponse.json({ notifications }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    return NextResponse.json(
      { error: 'Impossible de récupérer les notifications' },
      { status: 500 }
    );
  }
}