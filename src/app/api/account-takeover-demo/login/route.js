import { NextResponse } from 'next/server';
import { userStore } from '../register/route';

export async function POST(request) {
  try {
    const { username, password, fingerprint } = await request.json();
    
    console.log(`Login attempt for ${username}`);
    console.log('Current userStore:', Array.from(userStore.entries()));
    
    // Basic validation
    if (!username || !password || !fingerprint) {
      return NextResponse.json(
        { error: 'Username, password, and fingerprint are required' },
        { status: 400 }
      );
    }
    
    // Check if user exists
    if (!userStore.has(username)) {
      console.log(`User not found: ${username}`);
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }
    
    // Get the user record
    const user = userStore.get(username);
    console.log(`User found: ${username}`, user);
    
    // Verify password
    if (user.password !== password) {
      console.log(`Password mismatch for user: ${username}`);
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }
    
    // Always ensure fingerprint is treated as an array
    const fingerprintArray = Array.isArray(user.fingerprint) 
      ? user.fingerprint 
      : [user.fingerprint];
    
    // Check if the fingerprint matches any in the array
    const fingerprintMatch = fingerprintArray.includes(fingerprint);
    
    console.log(`Fingerprint check for ${username}:`);
    console.log(`- Stored fingerprints: ${JSON.stringify(fingerprintArray)}`);
    console.log(`- Current fingerprint: ${fingerprint}`);
    console.log(`- Match result: ${fingerprintMatch}`);
    
    // Return appropriate response
    return NextResponse.json({
      success: true,
      fingerprintMatch,
      message: fingerprintMatch 
        ? 'Login successful' 
        : 'New device detected',
      status: fingerprintMatch ? 'normal' : 'verification_required'
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
} 