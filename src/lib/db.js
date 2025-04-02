// lib/db.js
import { Pool, neon } from '@neondatabase/serverless';

// Check if we're in development mode or CLI mode
const isDevelopment = process.env.NODE_ENV === 'development';
const isCliMode = process.env.CLI_MODE === 'true';
console.log(`Database running in ${isDevelopment ? 'development' : 'production'} mode, CLI mode: ${isCliMode ? 'yes' : 'no'}`);

// Choose the appropriate connection string based on the environment
const getConnectionString = () => {
  if (isDevelopment || isCliMode) {
    // For development, you might want to use the unpooled connection
    return process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  }
  // For production, use the pooled connection for better performance
  return process.env.DATABASE_URL;
};

// For HTTP-based queries (simple queries)
export const sql = neon(getConnectionString());

// Helper to convert SQLite-style queries to PostgreSQL
function convertSqliteToPg(sqliteQuery) {
  let paramCount = 0;
  return sqliteQuery.replace(/\?/g, () => `$${++paramCount}`);
}

// In serverless environments, we need to create a pool for each request
function getPool() {
  // Create a new pool if it doesn't exist yet
  if (!pool) {
    pool = new Pool({
      connectionString: getConnectionString()
    });
  }
  return pool;
}

// Initialize database connection pool for WebSocket-based connections
// (when you need sessions or transactions)
let pool = null;

// Initialize database connection
export async function openDb() {
  try {
    // Ensure we have a pool - in serverless environments, this ensures
    // we create a new one if needed for each request
    const currentPool = getPool();
    
    // Create tables if they don't exist
    await currentPool.query(`
      CREATE TABLE IF NOT EXISTS visitors (
        visitor_id TEXT PRIMARY KEY,
        first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        visit_count INTEGER DEFAULT 1
      );
      
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        visitor_id TEXT,
        request_id TEXT UNIQUE,
        timestamp TIMESTAMP,
        event_time TEXT,
        ip TEXT,
        incognito BOOLEAN,
        url TEXT,
        raw_data TEXT,
        FOREIGN KEY (visitor_id) REFERENCES visitors(visitor_id)
      );
    `);
    
    // Return an object that wraps the pool and provides compatibility methods
    return {
      query: (...args) => currentPool.query(...args),
      // SQLite compatibility methods
      exec: async (sqlStatement) => {
        // In PostgreSQL, we can just execute the SQL directly
        return await currentPool.query(sqlStatement);
      },
      // Equivalent to SQLite's get - returns the first row
      get: async (sql, ...params) => {
        // Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
        const pgSql = convertSqliteToPg(sql);
        // Flatten parameters array - SQLite's driver allows nested arrays but PostgreSQL doesn't
        const flatParams = params.flat();
        
        console.log('SQL query:', pgSql);
        console.log('Parameters:', flatParams);
        
        const result = await currentPool.query(pgSql, flatParams);
        return result.rows[0] || null;
      },
      // Equivalent to SQLite's all - returns all rows
      all: async (sql, ...params) => {
        // Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
        const pgSql = convertSqliteToPg(sql);
        // Flatten parameters array - SQLite's driver allows nested arrays but PostgreSQL doesn't
        const flatParams = params.flat();
        
        console.log('SQL query:', pgSql);
        console.log('Parameters:', flatParams);
        
        const result = await currentPool.query(pgSql, flatParams);
        return result.rows;
      },
      // Equivalent to SQLite's run - executes SQL and returns metadata
      run: async (sql, ...params) => {
        // Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
        const pgSql = convertSqliteToPg(sql);
        // Flatten parameters array - SQLite's driver allows nested arrays but PostgreSQL doesn't
        const flatParams = params.flat();
        
        console.log('SQL query:', pgSql);
        console.log('Parameters:', flatParams);
        
        const result = await currentPool.query(pgSql, flatParams);
        return { 
          changes: result.rowCount, 
          lastID: result.rows[0]?.id 
        };
      },
      // Add close method for backward compatibility
      close: async () => closeDb(),
      // For direct pool access
      pool: currentPool
    };
  } catch (error) {
    console.error('Error initializing database connection:', error);
    throw error;
  }
}

// Close the database connection
export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Helper function for simple queries using HTTP
export async function query(text, params = []) {
  try {
    // Use the sql template tag for HTTP-based queries
    if (params.length > 0) {
      return await sql.query(text, params);
    }
    return await sql`${sql.unsafe(text)}`;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}

// Helper function for transaction-based queries using WebSockets
export async function withTransaction(callback) {
  const client = await (await openDb()).pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}