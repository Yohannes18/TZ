import fs from 'fs';
import path from 'path';
import { pool } from '../db.js';

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    // Read all .sql files in the migrations directory
    const migrationDirCandidates = [
      path.resolve(process.cwd(), 'src', 'migrations'),
      path.resolve(process.cwd(), 'backend', 'src', 'migrations'),
    ];
    const migrationDir = migrationDirCandidates.find((dir) => fs.existsSync(dir));

    if (!migrationDir) {
      throw new Error('Could not locate migrations directory');
    }

    const files = fs.readdirSync(migrationDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`Found ${files.length} migration files`);
    
    for (const file of files) {
      console.log(`Running migration: ${file}`);
      
      const filePath = path.join(migrationDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Execute the entire file content as a single query
      try {
        await client.query(sql);
        console.log('Migration file executed successfully');
      } catch (err) {
        console.error('Error executing migration file:', err);
        console.error('File:', file);
        throw err;
      }
      
      console.log(`Completed migration: ${file}\n`);
    }
    
    console.log('All migrations completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(process.cwd(), 'src', 'migrations', 'migrate.js')) {
  runMigrations().catch(err => {
    console.error('Migration error:', err);
    process.exit(1);
  });
} else if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(process.cwd(), 'backend', 'src', 'migrations', 'migrate.js')) {
  runMigrations().catch(err => {
    console.error('Migration error:', err);
    process.exit(1);
  });
}

export default runMigrations;
