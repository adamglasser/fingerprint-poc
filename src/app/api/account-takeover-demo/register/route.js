import { NextResponse } from 'next/server';

// We'll use a simple in-memory store for this demo
// In a real application, you would use a database
const userStore = new Map();

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
    
    // Check if username already exists
    if (userStore.has(username)) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }
    
    // Store the user with their fingerprint
    userStore.set(username, {
      password,
      fingerprint,
      registeredAt: new Date().toISOString()
    });
    
    console.log(`User registered: ${username} with fingerprint: ${fingerprint}`);
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}

// Expose the user store for use by other routes
export { userStore }; 