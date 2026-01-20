// src/features/tracker/reportSchema.ts
// Metadata-only schema for annual reporting

export interface PerformanceDossier {
    reportingPeriod: {
        start: string;
        end: string;
    };
    overview: {
        totalMonitoringHours: number; // Quantitative impact
        sitesManagedCount: number;
        visitsByType: Record<string, number>; // e.g., { "IMV": 45, "SIV": 4 }
    };
    achievements: Array<{
        category: "Query Resolution" | "Site Training" | "Innovation" | "Proactive Issue";
        title: string;
        impactDescription: string; // The "Review Architect" output
        linkedProjectID: string; // e.g., "Project A"
    }>;
}
