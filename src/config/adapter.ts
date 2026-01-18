import sqlite3 from 'sqlite3';
import pg from 'pg';
const { Pool } = pg;

export interface IDatabase {
    query(sql: string, params?: any[]): Promise<any[]>;
    run(sql: string, params?: any[]): Promise<void>;
}

// Convert '?' placeholders to '$1', '$2', etc. for Postgres
function convertToPostgresParams(sql: string): string {
    let i = 1;
    return sql.replace(/\?/g, () => `$${i++}`);
}

export class SQLiteAdapter implements IDatabase {
    private db: sqlite3.Database;

    constructor(filename: string) {
        this.db = new sqlite3.Database(filename, (err) => {
            if (err) console.error('SQLite connection error', err);
            else console.log(`Connected to SQLite: ${filename}`);
        });
    }

    query(sql: string, params: any[] = []): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    run(sql: string, params: any[] = []): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

export class PostgresAdapter implements IDatabase {
    private pool: pg.Pool;

    constructor() {
        this.pool = new Pool({
            max: 10, // Limit connections for Cloud Run
            connectionTimeoutMillis: 5000
        });

        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle Postgres client', err);
        });
        console.log('Initialized Postgres Pool');
    }

    async query(sql: string, params: any[] = []): Promise<any[]> {
        const pgSql = convertToPostgresParams(sql);
        const res = await this.pool.query(pgSql, params);
        return res.rows;
    }

    async run(sql: string, params: any[] = []): Promise<void> {
        const pgSql = convertToPostgresParams(sql);
        await this.pool.query(pgSql, params);
    }
}
