import { NextResponse } from 'next/server';
import { userStore } from '../register/route';

export async function POST(request) {
  try {
    const { username, password, fingerprint } = await request.json();
    
    // Basic validation
    if (!username || !password || !fingerprint) {
      return NextResponse.json(
        { error: 'Username, password, and fingerprint are required' },
        { status: 400 }
      );
    }
    
    // Check if user exists
    if (!userStore.has(username)) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }
    
    // Get the user record
    const user = userStore.get(username);
    
    // Verify password
    if (user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }
    
    // Check if the fingerprint matches
    const fingerprintMatch = user.fingerprint === fingerprint;
    
    console.log(`Login attempt for ${username}: Password verified, fingerprint match: ${fingerprintMatch}`);
    console.log(`Stored fingerprint: ${user.fingerprint}`);
    console.log(`Current fingerprint: ${fingerprint}`);
    
    // Return login success, but include fingerprint match status
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      fingerprintMatch,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
} 