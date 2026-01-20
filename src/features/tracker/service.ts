import { PrivacySentry } from '../../utils/privacySentry.js';
import db from '../../config/db.js';
import { randomUUID } from 'node:crypto';

export interface SiteAchievement {
    id: string;
    date: Date;
    project_id: string;
    category: string;
    title: string;
    impact_description: string;
    is_review_ready: boolean;
}

export interface TimesheetEntry {
    id: string;
    date: Date;
    project_id: string;
    activity_type: string;
    hours_spent: number;
    achievement_link_id?: string;
    notes?: string;
}

export class TrackerService {

    async logWin(entry: Omit<SiteAchievement, 'id' | 'is_review_ready' | 'impact_description'> & { impact: string }): Promise<SiteAchievement> {
        // Run Privacy Sentry Checks
        const sanitizedTitle = PrivacySentry.sanitize(entry.title);
        const sanitizedImpact = PrivacySentry.sanitize(entry.impact);

        if (sanitizedTitle.triggered || sanitizedImpact.triggered) {
            console.warn(`[PrivacySentry] Sanitized PII in win log: ${entry.project_id}`);
        }

        const newEntry: SiteAchievement = {
            id: randomUUID(),
            date: entry.date,
            project_id: entry.project_id,
            category: entry.category,
            title: sanitizedTitle.clean,
            impact_description: sanitizedImpact.clean,
            is_review_ready: false
        };

        await db.run(
            `INSERT INTO site_achievements (id, date, project_id, category, title, impact_description, is_review_ready) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [newEntry.id, newEntry.date.toISOString(), newEntry.project_id, newEntry.category, newEntry.title, newEntry.impact_description, newEntry.is_review_ready ? 1 : 0]
        );
        return newEntry;
    }

    async getWins(): Promise<SiteAchievement[]> {
        const rows = await db.query(`SELECT * FROM site_achievements ORDER BY date DESC`);
        return rows.map(row => ({
            ...row,
            date: new Date(row.date),
            is_review_ready: !!row.is_review_ready
        }));
    }

    async logTimesheet(entry: Omit<TimesheetEntry, 'id'>): Promise<TimesheetEntry> {
        // Run Privacy Sentry Checks
        let sanitizedNotes = entry.notes;
        if (entry.notes) {
            const check = PrivacySentry.sanitize(entry.notes);
            if (check.triggered) {
                console.warn(`[PrivacySentry] Sanitized PII in timesheet: ${entry.project_id}`);
                sanitizedNotes = check.clean;
            }
        }

        const newEntry: TimesheetEntry = {
            id: randomUUID(),
            ...entry,
            notes: sanitizedNotes
        };

        await db.run(
            `INSERT INTO timesheet_entries (id, date, project_id, activity_type, hours_spent, achievement_link_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [newEntry.id, newEntry.date.toISOString(), newEntry.project_id, newEntry.activity_type, newEntry.hours_spent, newEntry.achievement_link_id || null, newEntry.notes || null]
        );
        return newEntry;
    }

    async getTimesheets(): Promise<TimesheetEntry[]> {
        const rows = await db.query(`SELECT * FROM timesheet_entries ORDER BY date DESC`);
        return rows.map(row => ({
            ...row,
            date: new Date(row.date)
        }));
    }
}
