import { SQLiteAdapter, PostgresAdapter } from './adapter.ts';
import type { IDatabase } from './adapter.ts';

const dbType = process.env.DB_TYPE || 'sqlite';
let db: IDatabase;

console.log(`Initializing Database: ${dbType}`);

if (dbType === 'postgres') {
    db = new PostgresAdapter();
} else {
    // Default to SQLite
    db = new SQLiteAdapter('kazi.db');
}

// Initialize Tables
async function initDb() {
    try {
        await db.run(`CREATE TABLE IF NOT EXISTS achievements (
            id TEXT PRIMARY KEY,
            date TEXT,
            metricType TEXT,
            projectId TEXT,
            details TEXT,
            impactScore INTEGER
        )`);

        await db.run(`CREATE TABLE IF NOT EXISTS metric_logs (
            id TEXT PRIMARY KEY,
            date TEXT,
            descriptor TEXT,
            count INTEGER,
            projectId TEXT
        )`);

        await db.run(`CREATE TABLE IF NOT EXISTS achievement_logs (
            id TEXT PRIMARY KEY,
            date TEXT,
            title TEXT,
            impact TEXT,
            projectId TEXT
        )`);

        await db.run(`CREATE TABLE IF NOT EXISTS site_logs (
            id TEXT PRIMARY KEY,
            date TEXT,
            siteId TEXT,
            actionType TEXT,
            notes TEXT
        )`);

        await db.run(`CREATE TABLE IF NOT EXISTS sites (
            id TEXT PRIMARY KEY,
            siteId TEXT UNIQUE,
            name TEXT,
            location TEXT,
            notes TEXT
        )`);

        await db.run(`CREATE TABLE IF NOT EXISTS timesheets (
            id TEXT PRIMARY KEY,
            date TEXT,
            siteId TEXT,
            projectId TEXT,
            hours REAL,
            activityType TEXT,
            linkedAchievementId TEXT,
            notes TEXT,
            FOREIGN KEY(siteId) REFERENCES sites(siteId)
        )`);

        await db.run(`CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            code TEXT,
            name TEXT
        )`);

        console.log('Database tables initialized');

        // Migrations (Best effort)
        try {
            await db.run(`ALTER TABLE timesheets ADD COLUMN projectId TEXT`);
        } catch (e) { /* ignore if exists */ }

        try {
            await db.run(`ALTER TABLE timesheets ADD COLUMN linkedAchievementId TEXT`);
        } catch (e) { /* ignore if exists */ }

    } catch (err) {
        console.error('Failed to initialize DB tables', err);
    }
}

// Kick off initialization
initDb();

export default db;
