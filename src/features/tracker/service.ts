import type { MetricLog, AchievementLog, SiteLog, YearStats } from './model.ts';
import { PerformanceMetric } from './model.ts';
import db from '../../config/db.ts';
import { randomUUID } from 'node:crypto';

export class TrackerService {

    constructor() { }

    async logMetric(entry: Omit<MetricLog, 'id'>): Promise<MetricLog> {
        const newEntry: MetricLog = { ...entry, id: randomUUID() };
        await db.run(
            `INSERT INTO metric_logs (id, date, descriptor, count, projectId) VALUES (?, ?, ?, ?, ?)`,
            [newEntry.id, newEntry.date.toISOString(), newEntry.descriptor, newEntry.count, newEntry.projectId]
        );
        return newEntry;
    }

    async logAchievement(entry: Omit<AchievementLog, 'id'>): Promise<AchievementLog> {
        const newEntry: AchievementLog = { ...entry, id: randomUUID() };
        await db.run(
            `INSERT INTO achievement_logs (id, date, title, impact, projectId) VALUES (?, ?, ?, ?, ?)`,
            [newEntry.id, newEntry.date.toISOString(), newEntry.title, newEntry.impact, newEntry.projectId]
        );
        return newEntry;
    }

    async logSiteVisit(entry: Omit<SiteLog, 'id'>): Promise<SiteLog> {
        const newEntry: SiteLog = { ...entry, id: randomUUID() };
        await db.run(
            `INSERT INTO site_logs (id, date, siteId, actionType, notes) VALUES (?, ?, ?, ?, ?)`,
            [newEntry.id, newEntry.date.toISOString(), newEntry.siteId, newEntry.actionType, newEntry.notes]
        );
        return newEntry;
    }

    async getMetricLogs(): Promise<MetricLog[]> {
        const rows = await db.query(`SELECT * FROM metric_logs ORDER BY date DESC`);
        return rows.map(row => ({ ...row, date: new Date(row.date) }));
    }

    async getAchievementLogs(): Promise<AchievementLog[]> {
        const rows = await db.query(`SELECT * FROM achievement_logs ORDER BY date DESC`);
        return rows.map(row => ({ ...row, date: new Date(row.date) }));
    }

    async getSiteLogs(): Promise<SiteLog[]> {
        const rows = await db.query(`SELECT * FROM site_logs ORDER BY date DESC`);
        return rows.map(row => ({ ...row, date: new Date(row.date) }));
    }

    // Retained for backward compatibility or stats migration if needed
    async getStatsByYear(year: number): Promise<YearStats> {
        // Placeholder: Returning zero stats for now as logic requires updates for new schema
        return {
            year,
            totalEntries: 0,
            byMetric: {
                [PerformanceMetric.QUERY_RESOLUTION]: 0,
                [PerformanceMetric.SITE_TRAINING]: 0,
                [PerformanceMetric.VISIT_COMPLETE]: 0,
                [PerformanceMetric.PROACTIVE_SOLVING]: 0,
                [PerformanceMetric.OTHER]: 0
            }
        };
    }
}
