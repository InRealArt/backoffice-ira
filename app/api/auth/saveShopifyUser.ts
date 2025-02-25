import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email, walletAddress, userMetadata } = await request.json();

    const user = await prisma.shopifyUser.upsert({
      where: { email },
      update: {
        email,
        walletAddress,
        lastLogin: new Date(),
        userMetadata
      },
      create: {
        email,
        walletAddress,
        lastLogin: new Date(),
        userMetadata
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Error saving user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save user' },
      { status: 500 }
    );
  }
}