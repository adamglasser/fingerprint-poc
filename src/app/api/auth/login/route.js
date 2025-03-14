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

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    
    // Validate credentials
    if (username === 'admin' && password === process.env.ADMIN_PASSWORD) {
      // Create a session token
      const token = crypto.randomBytes(32).toString('hex');
      const hashedToken = hashToken(token);
      
      // Set the session cookie
      cookies().set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });
      
      return NextResponse.json({ 
        success: true, 
        user: { id: '1', name: 'Admin', email: 'admin@example.com' } 
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    );
  }
} 