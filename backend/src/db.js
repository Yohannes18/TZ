import './config/env.js';
import pkg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pkg;

function getSslConfig() {
  const sslMode = process.env.DB_SSL_MODE || process.env.PGSSLMODE;
  const forceSsl =
    process.env.DB_SSL === 'true' ||
    process.env.DATABASE_SSL === 'true' ||
    sslMode === 'require';

  if (!forceSsl) {
    return undefined;
  }

  const rejectUnauthorized =
    process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' &&
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false';

  return { rejectUnauthorized };
}

const connectionConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: getSslConfig(),
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME || 'tradezella',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: getSslConfig(),
    };

// Create a PostgreSQL connection pool
const pool = new Pool(connectionConfig);

// Function to get a database connection
export async function getDb() {
  return pool;
}

// Function to run migration files
export async function runMigrations() {
  const client = await pool.connect();
  
  try {
    // Get all migration files and sort them
    const migrationsDirCandidates = [
      path.resolve(process.cwd(), 'src', 'migrations'),
      path.resolve(process.cwd(), 'backend', 'src', 'migrations'),
    ];
    const migrationsDir = migrationsDirCandidates.find((dir) => fs.existsSync(dir));

    if (!migrationsDir) {
      throw new Error('Could not locate migrations directory');
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    // Run each migration file
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      try {
        await client.query(sql);
        console.log(`Successfully ran migration: ${file}`);
      } catch (err) {
        console.error(`Error running migration ${file}:`, err);
        throw err;
      }
    }
    
    console.log('All migrations completed successfully');
  } finally {
    client.release();
  }
}

// Function to initialize the database with required tables
export async function initDb() {
  const client = await pool.connect();
  
  try {
    // Run all migrations
    await runMigrations();
    
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Export the pool for direct queries when needed
export { pool };
