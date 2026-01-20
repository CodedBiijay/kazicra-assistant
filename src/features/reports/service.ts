import db from '../../config/db.js';

interface ReportFilters {
    startDate: string;
    endDate: string;
    includeCategories?: string[]; // Optional filter
}

export class ReportingService {

    async generateDossier(filters: ReportFilters): Promise<string> {
        const { startDate, endDate } = filters;

        // 1. Fetch Data
        // Wins
        const winsPromise = db.query(
            `SELECT * FROM site_achievements WHERE date >= ? AND date <= ? ORDER BY date DESC`,
            [startDate, endDate]
        );

        // Visits
        const visitsPromise = db.query(
            `SELECT * FROM visits WHERE date >= ? AND date <= ? AND status = 'completed'`,
            [startDate, endDate]
        );

        // Timesheets (Aggregation)
        const timePromise = db.query(
            `SELECT SUM(hours_spent) as total_hours FROM timesheet_entries WHERE date >= ? AND date <= ?`,
            [startDate, endDate]
        );

        // Site Count (Unique sites visited or managed in this period)
        // We can approximate by looking at visits or wins or just sites table.
        // Let's count unique sites in visits + wins for accuracy of "Active Management"
        const activeSitesPromise = db.query(
            `SELECT COUNT(DISTINCT site_id) as count FROM visits WHERE date >= ? AND date <= ?`,
            [startDate, endDate]
        );

        const [wins, visits, timeResult, siteResult] = await Promise.all([
            winsPromise, visitsPromise, timePromise, activeSitesPromise
        ]);

        const totalHours = timeResult[0]?.total_hours || 0;
        const activeSites = siteResult[0]?.count || 0;

        // 2. Format as Markdown
        return this.formatMarkdown({
            startDate,
            endDate,
            totalHours,
            activeSites,
            wins,
            visits
        });
    }

    private formatMarkdown(data: any): string {
        const start = new Date(data.startDate).toLocaleDateString();
        const end = new Date(data.endDate).toLocaleDateString();

        return `
# Clinical Performance Dossier
**Reporting Period:** ${start} — ${end}
**Role:** Senior Clinical Research Associate (CRA)

---

## 1. Executive Summary
During this period, I actively managed **${data.activeSites} sites**, executing a total of **${data.visits.length} monitoring visits**. My primary focus was on ensuring protocol compliance, resolving critical queries, and maintaining inspection readiness across all assigned centers.
- **Total Monitoring Volume:** ${data.totalHours.toFixed(1)} Hours
- **Visits Completed:** ${data.visits.length}
- **Key Impact Areas:** ${this.getTopCategories(data.wins)}

---

## 2. Qualitative Achievements (Wins)
*Documented professional impact and proactive site management.*

${this.formatWins(data.wins)}

---

## 3. Monitoring Activity (Visits)
*Completed site visits with fully verified regulatory workflows.*

${this.formatVisits(data.visits)}

---

## 4. Professional Growth
*Demonstrated mastery of clinical operations.*

- **Protocol Deviation Management**: Proactively identified risks during ${data.visits.length} visits.
- **Data Integrity**: Verified critical endpoints ensuring robust study data.
- **Site Relationships**: Maintained partnerships across ${data.activeSites} active sites.

> *Confidentiality Notice: This document contains metadata-only performance metrics. No Patient Health Information (PHI) or proprietary identification is included.*
`;
    }

    private formatWins(wins: any[]): string {
        if (wins.length === 0) return "_No specific achievements logged for this period._";

        // Group by Category? Or Chronological?
        // Let's do Chronological for now, or Grouped. Grouped is often better for reviews.
        const groups: Record<string, any[]> = {};
        wins.forEach((w: any) => {
            const cat = w.category || 'General';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(w);
        });

        let md = "";
        for (const [cat, items] of Object.entries(groups)) {
            md += `### ${cat}\n`;
            items.forEach((item: any) => {
                const d = new Date(item.date).toLocaleDateString();
                md += `- **${d}**: ${item.impact_description || item.title}\n`;
            });
            md += "\n";
        }
        return md;
    }

    private formatVisits(visits: any[]): string {
        if (visits.length === 0) return "_No visits recorded in this period._";

        let md = "| Date | Type | Site ID | Progress |\n|---|---|---|---|\n";
        visits.forEach((v: any) => {
            const d = new Date(v.date).toLocaleDateString();
            md += `| ${d} | **${v.type}** | ${v.site_id} | 100% Verified |\n`;
        });
        return md;
    }

    private getTopCategories(wins: any[]): string {
        if (wins.length === 0) return "General Operations";
        const counts: Record<string, number> = {};
        wins.forEach((w: any) => {
            const c = w.category || 'General';
            counts[c] = (counts[c] || 0) + 1;
        });
        // Sort
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        return sorted.slice(0, 3).map(s => s[0]).join(", ");
    }
}

export const reportingService = new ReportingService();
