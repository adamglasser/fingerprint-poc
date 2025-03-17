import { NextResponse } from 'next/server';
import { userStore } from '../register/route';

export async function POST(request) {
  try {
    const { username } = await request.json();
    
    // Basic validation
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }
    
    // Check if user exists
    if (!userStore.has(username)) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get the user record
    const user = userStore.get(username);
    
    // Prepare fingerprint data to return
    let fingerprints = [];
    
    if (Array.isArray(user.fingerprint)) {
      fingerprints = user.fingerprint;
    } else {
      // If it's a single value, put it in an array
      fingerprints = [user.fingerprint];
    }
    
    // Return the fingerprints
    return NextResponse.json({
      success: true,
      fingerprints: fingerprints,
      currentFingerprint: fingerprints.length > 0 ? fingerprints[0] : null
    });
  } catch (error) {
    console.error('Get user fingerprints error:', error);
    return NextResponse.json(
      { error: 'An error occurred while retrieving fingerprints' },
      { status: 500 }
    );
  }
} 