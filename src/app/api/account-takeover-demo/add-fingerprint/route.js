import { NextResponse } from 'next/server';
import { userStore } from '../register/route';

export async function POST(request) {
  try {
    const { username, newFingerprint } = await request.json();
    
    // Basic validation
    if (!username || !newFingerprint) {
      return NextResponse.json(
        { error: 'Username and new fingerprint are required' },
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
    
    // If user already has a fingerprint array, add the new one
    // Otherwise, convert the single fingerprint to an array and add the new one
    if (Array.isArray(user.fingerprint)) {
      // Check if fingerprint already exists to avoid duplicates
      if (!user.fingerprint.includes(newFingerprint)) {
        user.fingerprint.push(newFingerprint);
      }
    } else {
      // Convert to array only if the new fingerprint is different
      const originalFingerprint = user.fingerprint;
      if (originalFingerprint !== newFingerprint) {
        user.fingerprint = [originalFingerprint, newFingerprint];
      }
    }
    
    // Update the user in the store
    userStore.set(username, user);
    
    console.log(`Fingerprint added for ${username}. Current fingerprints:`, user.fingerprint);
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Fingerprint added successfully'
    });
  } catch (error) {
    console.error('Add fingerprint error:', error);
    return NextResponse.json(
      { error: 'An error occurred while adding the fingerprint' },
      { status: 500 }
    );
  }
} 