import { SQLiteAdapter, PostgresAdapter } from './adapter.ts';
import type { IDatabase } from './adapter.ts';

const dbType = process.env.DB_TYPE || 'sqlite';
let db: IDatabase;

console.log(`Initializing Database: ${dbType}`);

if (dbType === 'postgres') {
    db = new PostgresAdapter();
} else {
    // Default to SQLite
    // In Production (Cloud Run), we MUST use /tmp because the file system is read-only.
    // In Local (Development), we use the local cwd.
    const dbPath = process.env.NODE_ENV === 'production' ? '/tmp/crabuddy.db' : 'crabuddy.db';
    console.log(`Using SQLite DB Path: ${dbPath}`);
    db = new SQLiteAdapter(dbPath);
}

// Initialize Tables
async function initDb() {
    try {
        await db.run(`CREATE TABLE IF NOT EXISTS site_achievements (
            id TEXT PRIMARY KEY,
            date TEXT,
            project_id TEXT,
            category TEXT,
            title TEXT,
            impact_description TEXT,
            is_review_ready BOOLEAN
        )`);

        await db.run(`CREATE TABLE IF NOT EXISTS timesheet_entries (
            id TEXT PRIMARY KEY,
            date TEXT,
            project_id TEXT,
            activity_type TEXT,
            hours_spent REAL,
            achievement_link_id TEXT,
            notes TEXT
        )`);

        console.log('Core tables (site_achievements, timesheet_entries) initialized');

        // Legacy/Support tables
        await db.run(`CREATE TABLE IF NOT EXISTS sites (
            id TEXT PRIMARY KEY,
            siteId TEXT UNIQUE,
            name TEXT,
            location TEXT,
            notes TEXT,
            hotel_best TEXT,
            restaurant_best TEXT,
            parking_spot TEXT,
            door_code TEXT,
            primary_contact_name TEXT
        )`);

        await db.run(`CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            code TEXT,
            name TEXT
        )`);

        console.log('Database tables initialized');

        // Migrations
        try {
            await db.run(`ALTER TABLE timesheets ADD COLUMN projectId TEXT`);
        } catch (e) { console.log('Migration timesheets projectId error (expected if exists):', e); }

        try {
            await db.run(`ALTER TABLE timesheets ADD COLUMN linkedAchievementId TEXT`);
        } catch (e) { console.log('Migration timesheets linkedAchievementId error (expected if exists):', e); }

        // Site Logistics Migrations
        const siteCols = ['hotel_best', 'restaurant_best', 'parking_spot', 'door_code', 'primary_contact_name'];
        for (const col of siteCols) {
            try {
                await db.run(`ALTER TABLE sites ADD COLUMN ${col} TEXT`);
            } catch (e) { console.log(`Migration sites ${col} error (expected if exists):`, e); }
        }

        // Visit Mode Migration
        try {
            await db.run(`ALTER TABLE visits ADD COLUMN mode TEXT`);
        } catch (e) { /* ignore if exists */ }

        // Calculator Tools Table
        await db.run(`CREATE TABLE IF NOT EXISTS user_tools (
            id TEXT PRIMARY KEY,
            name TEXT,
            type TEXT,
            config TEXT,
            date_added TEXT
        )`);

        await db.run(`CREATE TABLE IF NOT EXISTS visits (
            id TEXT PRIMARY KEY,
            site_id TEXT,
            type TEXT, -- SIV, IMV, COV
            mode TEXT, -- On-site, Remote
            date TEXT,
            status TEXT, -- scheduled, in-progress, completed
            checklist TEXT, -- JSON blob
            progress_percent INTEGER,
            FOREIGN KEY(site_id) REFERENCES sites(id)
        )`);

        await db.run(`CREATE TABLE IF NOT EXISTS leads (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT,
            date_captured TEXT
        )`);

    } catch (err) {
        console.error('Failed to initialize DB tables', err);
    }
}

// Kick off initialization
initDb();

export default db;
