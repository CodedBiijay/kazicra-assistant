import type { Site } from './model.js';
import db from '../../config/db.js';
import { randomUUID } from 'node:crypto';

export interface TimesheetEntry {
    id: string;
    date: Date;
    projectId: string; // The code/name
    siteId?: string; // Optional now
    hours: number;
    activityType: string;
    linkedAchievementId?: string;
    notes: string;
}

export interface Project {
    id: string;
    code: string;
    name: string;
}

export class SiteService {

    // --- Sites ---
    async addSite(site: Omit<Site, 'id'>): Promise<Site> {
        const newSite: Site = { ...site, id: randomUUID() };
        await db.run(
            `INSERT INTO sites (id, siteId, name, location, notes, hotel_best, restaurant_best, parking_spot, door_code, primary_contact_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [newSite.id, newSite.siteId, newSite.name, newSite.location, newSite.notes, newSite.hotel_best || null, newSite.restaurant_best || null, newSite.parking_spot || null, newSite.door_code || null, newSite.primary_contact_name || null]
        );
        return newSite;
    }

    async getSites(): Promise<Site[]> {
        const rows = await db.query(`SELECT * FROM sites ORDER BY siteId ASC`);
        return rows as Site[];
    }

    async updateSiteLogistics(id: string, logistics: Partial<Site>): Promise<void> {
        const fields: string[] = [];
        const values: any[] = [];

        if (logistics.hotel_best !== undefined) { fields.push('hotel_best = ?'); values.push(logistics.hotel_best); }
        if (logistics.restaurant_best !== undefined) { fields.push('restaurant_best = ?'); values.push(logistics.restaurant_best); }
        if (logistics.parking_spot !== undefined) { fields.push('parking_spot = ?'); values.push(logistics.parking_spot); }
        if (logistics.door_code !== undefined) { fields.push('door_code = ?'); values.push(logistics.door_code); }
        if (logistics.primary_contact_name !== undefined) { fields.push('primary_contact_name = ?'); values.push(logistics.primary_contact_name); }
        if (logistics.notes !== undefined) { fields.push('notes = ?'); values.push(logistics.notes); }

        if (fields.length === 0) return Promise.resolve();
        values.push(id);

        await db.run(`UPDATE sites SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    // --- Projects ---
    async addProject(project: Omit<Project, 'id'>): Promise<Project> {
        const newProject: Project = { ...project, id: randomUUID() };
        await db.run(
            `INSERT INTO projects (id, code, name) VALUES (?, ?, ?)`,
            [newProject.id, newProject.code, newProject.name]
        );
        return newProject;
    }

    async getProjects(): Promise<Project[]> {
        const rows = await db.query(`SELECT * FROM projects ORDER BY code ASC`);
        return rows as Project[];
    }

    // --- Timesheets ---
    async logTimesheet(entry: Omit<TimesheetEntry, 'id'>): Promise<TimesheetEntry> {
        const newEntry: TimesheetEntry = { ...entry, id: randomUUID() };
        await db.run(
            `INSERT INTO timesheets (id, date, projectId, siteId, hours, activityType, linkedAchievementId, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [newEntry.id, newEntry.date.toISOString(), newEntry.projectId, newEntry.siteId || null, newEntry.hours, newEntry.activityType, newEntry.linkedAchievementId, newEntry.notes]
        );
        return newEntry;
    }

    async updateTimesheet(id: string, entry: Partial<TimesheetEntry>): Promise<void> {
        // Build dynamic query
        const fields: string[] = [];
        const values: any[] = [];

        if (entry.date) { fields.push('date = ?'); values.push(entry.date.toISOString()); }
        if (entry.projectId) { fields.push('projectId = ?'); values.push(entry.projectId); }
        if (entry.siteId !== undefined) { fields.push('siteId = ?'); values.push(entry.siteId || null); }
        if (entry.hours) { fields.push('hours = ?'); values.push(entry.hours); }
        if (entry.activityType) { fields.push('activityType = ?'); values.push(entry.activityType); }
        if (entry.notes) { fields.push('notes = ?'); values.push(entry.notes); }

        if (fields.length === 0) return Promise.resolve();

        values.push(id);
        const sql = `UPDATE timesheets SET ${fields.join(', ')} WHERE id = ?`;

        await db.run(sql, values);
    }

    async deleteTimesheet(id: string): Promise<void> {
        await db.run(`DELETE FROM timesheets WHERE id = ?`, [id]);
    }

    async getTimesheets(): Promise<TimesheetEntry[]> {
        const rows = await db.query(`SELECT * FROM timesheets ORDER BY date DESC`);
        return rows.map(row => ({ ...row, date: new Date(row.date) }));
    }
}
