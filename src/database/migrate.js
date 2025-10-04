const fs = require('fs');
const path = require('path');
const { pool, query } = require('./connection');
const logger = require('../utils/logger');

class DatabaseMigrator {
    constructor() {
        this.migrationsPath = path.join(__dirname, 'migrations');
        this.ensureMigrationsTable();
    }

    // Ensure migrations table exists
    async ensureMigrationsTable() {
        try {
            await query(`
                CREATE TABLE IF NOT EXISTS migrations (
                    id SERIAL PRIMARY KEY,
                    filename VARCHAR(255) UNIQUE NOT NULL,
                    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
        } catch (error) {
            logger.error('Error creating migrations table:', error);
            throw error;
        }
    }

    // Get list of executed migrations
    async getExecutedMigrations() {
        try {
            const result = await query('SELECT filename FROM migrations ORDER BY id');
            return result.rows.map(row => row.filename);
        } catch (error) {
            logger.error('Error getting executed migrations:', error);
            throw error;
        }
    }

    // Get list of migration files
    getMigrationFiles() {
        try {
            if (!fs.existsSync(this.migrationsPath)) {
                fs.mkdirSync(this.migrationsPath, { recursive: true });
                return [];
            }
            
            return fs.readdirSync(this.migrationsPath)
                .filter(file => file.endsWith('.sql'))
                .sort();
        } catch (error) {
            logger.error('Error reading migration files:', error);
            throw error;
        }
    }

    // Execute a single migration
    async executeMigration(filename) {
        try {
            const filePath = path.join(this.migrationsPath, filename);
            const sql = fs.readFileSync(filePath, 'utf8');
            
            logger.info(`Executing migration: ${filename}`);
            
            // Execute the migration SQL
            await query(sql);
            
            // Record the migration as executed
            await query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
            
            logger.info(`Migration ${filename} executed successfully`);
        } catch (error) {
            logger.error(`Error executing migration ${filename}:`, error);
            throw error;
        }
    }

    // Run all pending migrations
    async migrate() {
        try {
            logger.info('Starting database migration...');
            
            const executedMigrations = await this.getExecutedMigrations();
            const migrationFiles = this.getMigrationFiles();
            
            const pendingMigrations = migrationFiles.filter(
                file => !executedMigrations.includes(file)
            );
            
            if (pendingMigrations.length === 0) {
                logger.info('No pending migrations found');
                return;
            }
            
            logger.info(`Found ${pendingMigrations.length} pending migrations`);
            
            for (const migration of pendingMigrations) {
                await this.executeMigration(migration);
            }
            
            logger.info('Database migration completed successfully');
        } catch (error) {
            logger.error('Migration failed:', error);
            throw error;
        }
    }

    // Rollback last migration
    async rollback() {
        try {
            logger.info('Rolling back last migration...');
            
            const result = await query(`
                SELECT filename FROM migrations 
                ORDER BY id DESC 
                LIMIT 1
            `);
            
            if (result.rows.length === 0) {
                logger.info('No migrations to rollback');
                return;
            }
            
            const lastMigration = result.rows[0].filename;
            logger.info(`Rolling back migration: ${lastMigration}`);
            
            // Note: This is a simplified rollback - in production you'd want
            // to implement proper rollback scripts for each migration
            await query('DELETE FROM migrations WHERE filename = $1', [lastMigration]);
            
            logger.info(`Migration ${lastMigration} rolled back successfully`);
        } catch (error) {
            logger.error('Rollback failed:', error);
            throw error;
        }
    }

    // Get migration status
    async getStatus() {
        try {
            const executedMigrations = await this.getExecutedMigrations();
            const migrationFiles = this.getMigrationFiles();
            
            const pendingMigrations = migrationFiles.filter(
                file => !executedMigrations.includes(file)
            );
            
            return {
                executed: executedMigrations,
                pending: pendingMigrations,
                total: migrationFiles.length,
                executedCount: executedMigrations.length,
                pendingCount: pendingMigrations.length
            };
        } catch (error) {
            logger.error('Error getting migration status:', error);
            throw error;
        }
    }
}

// CLI interface
async function main() {
    const command = process.argv[2];
    const migrator = new DatabaseMigrator();
    
    try {
        switch (command) {
            case 'migrate':
                await migrator.migrate();
                break;
            case 'rollback':
                await migrator.rollback();
                break;
            case 'status':
                const status = await migrator.getStatus();
                console.log('Migration Status:');
                console.log(`Total migrations: ${status.total}`);
                console.log(`Executed: ${status.executedCount}`);
                console.log(`Pending: ${status.pendingCount}`);
                if (status.pending.length > 0) {
                    console.log('Pending migrations:', status.pending);
                }
                break;
            default:
                console.log('Usage: node migrate.js [migrate|rollback|status]');
                process.exit(1);
        }
    } catch (error) {
        logger.error('Migration command failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

if (require.main === module) {
    main();
}

module.exports = DatabaseMigrator;