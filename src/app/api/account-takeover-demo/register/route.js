import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

// Export a userStore with methods that interact with the database
// This is used by the other routes that currently import userStore
export const userStore = {
  async has(username) {
    const db = await openDb();
    try {
      // Add users table if it doesn't exist
      await this._ensureUsersTable(db);
      
      // Check if the user exists
      const user = await db.get('SELECT * FROM users WHERE username = ?', username);
      return !!user;
    } finally {
      if (db) await db.close();
    }
  },
  
  async get(username) {
    const db = await openDb();
    try {
      // Add users table if it doesn't exist
      await this._ensureUsersTable(db);
      
      // Get the user
      const user = await db.get('SELECT * FROM users WHERE username = ?', username);
      
      if (!user) return null;
      
      // Parse the fingerprint JSON array
      const fingerprints = JSON.parse(user.fingerprints || '[]');
      
      // Return in same format as original in-memory implementation
      return {
        password: user.password,
        fingerprint: fingerprints,
        registeredAt: user.registered_at
      };
    } finally {
      if (db) await db.close();
    }
  },
  
  async set(username, userData) {
    const db = await openDb();
    try {
      // Add users table if it doesn't exist
      await this._ensureUsersTable(db);
      
      // Store fingerprints as JSON string array
      const fingerprintJson = JSON.stringify(
        Array.isArray(userData.fingerprint) ? userData.fingerprint : [userData.fingerprint]
      );
      
      // Check if user already exists
      const existingUser = await db.get('SELECT * FROM users WHERE username = ?', username);
      
      if (existingUser) {
        // Update existing user
        await db.run(
          'UPDATE users SET password = ?, fingerprints = ? WHERE username = ?',
          userData.password,
          fingerprintJson,
          username
        );
      } else {
        // Insert new user
        await db.run(
          'INSERT INTO users (username, password, fingerprints, registered_at) VALUES (?, ?, ?, ?)',
          username,
          userData.password,
          fingerprintJson,
          userData.registeredAt || new Date().toISOString()
        );
      }
      
      return true;
    } finally {
      if (db) await db.close();
    }
  },
  
  async entries() {
    const db = await openDb();
    try {
      // Add users table if it doesn't exist
      await this._ensureUsersTable(db);
      
      // Get all users
      const users = await db.all('SELECT * FROM users');
      
      // Convert to Map-like entries format
      return users.map(user => [
        user.username, 
        {
          password: user.password,
          fingerprint: JSON.parse(user.fingerprints || '[]'),
          registeredAt: user.registered_at
        }
      ]);
    } finally {
      if (db) await db.close();
    }
  },
  
  // Internal helper to ensure table exists
  async _ensureUsersTable(db) {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        fingerprints TEXT NOT NULL,
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
};

export async function POST(request) {
  let db = null;
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
    if (await userStore.has(username)) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }
    
    // Store the user with their fingerprint as an array for consistency
    // This makes it easier to add new fingerprints later
    await userStore.set(username, {
      password,
      fingerprint: [fingerprint],
      registeredAt: new Date().toISOString()
    });
    
    console.log(`User registered: ${username} with fingerprint: ${fingerprint}`);
    const entries = await userStore.entries();
    console.log('Current userStore:', entries);
    
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