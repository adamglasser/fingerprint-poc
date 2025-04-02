import { NextResponse } from 'next/server';
import { userStore } from '../register/route';
import { openDb } from '@/lib/db';

export async function POST(request) {
  let db = null;
  try {
    const { username } = await request.json();
    
    // Basic validation
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }
    
    // Open a single DB connection for all operations
    db = await openDb();
    
    // Check if user exists - pass the db connection
    const exists = await db.get('SELECT * FROM users WHERE username = ?', username);
    if (!exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Parse the fingerprint JSON array
    const fingerprints = JSON.parse(exists.fingerprints || '[]');
    
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
  } finally {
    // Make sure to close the DB connection when done
    if (db) await db.close();
  }
} 