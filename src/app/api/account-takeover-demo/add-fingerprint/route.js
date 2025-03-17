import { NextResponse } from 'next/server';
import { userStore } from '../register/route';

export async function POST(request) {
  try {
    const { username, newFingerprint } = await request.json();
    
    console.log(`Add fingerprint request for ${username}`);
    const userEntries = await userStore.entries();
    console.log('Current userStore:', userEntries);
    
    // Basic validation
    if (!username || !newFingerprint) {
      return NextResponse.json(
        { error: 'Username and new fingerprint are required' },
        { status: 400 }
      );
    }
    
    // Check if user exists
    if (!(await userStore.has(username))) {
      console.log(`User not found for add-fingerprint: ${username}`);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get the user record
    const user = await userStore.get(username);
    console.log(`User found for add-fingerprint: ${username}`, user);
    
    // Ensure fingerprint is always stored as an array
    if (!Array.isArray(user.fingerprint)) {
      user.fingerprint = [user.fingerprint];
    }
    
    // Add the new fingerprint if it doesn't already exist
    if (!user.fingerprint.includes(newFingerprint)) {
      user.fingerprint.push(newFingerprint);
      console.log(`New fingerprint added for ${username}:`, newFingerprint);
    } else {
      console.log(`Fingerprint already exists for ${username}:`, newFingerprint);
    }
    
    // Update the user in the store
    await userStore.set(username, user);
    
    console.log(`Updated user record:`, user);
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Fingerprint added successfully',
      fingerprintsCount: user.fingerprint.length
    });
  } catch (error) {
    console.error('Add fingerprint error:', error);
    return NextResponse.json(
      { error: 'An error occurred while adding the fingerprint' },
      { status: 500 }
    );
  }
} 