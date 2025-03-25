import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Simple function to hash the session token
function hashToken(token) {
  return crypto
    .createHash('sha256')
    .update(`${token}${process.env.NEXTAUTH_SECRET}`)
    .digest('hex');
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ user: null });
    }
    
    // In a real app, you would validate the token against a database
    // For this simple example, we'll just return the user if the token exists
    // We could also verify the token hash here for additional security
    
    return NextResponse.json({
      user: { id: '1', name: 'Admin', email: 'admin@example.com' }
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
} 