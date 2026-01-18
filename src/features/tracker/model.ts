export const PerformanceMetric = {
    QUERY_RESOLUTION: 'Query Resolution',
    SITE_TRAINING: 'Site Training',
    VISIT_COMPLETE: 'Visit Complete',
    PROACTIVE_SOLVING: 'Proactive Problem Solving',
    OTHER: 'Other'
} as const;

export type PerformanceMetric = typeof PerformanceMetric[keyof typeof PerformanceMetric];

// Deprecated: Migrating to specialized logs
export interface PerformanceEntry {
    id: string;
    date: Date;
    metricType: PerformanceMetric;
    projectId: string;
    details: string;
    impactScore: number;
}

// New Privacy-First Schema
export interface MetricLog {
    id: string;
    date: Date;
    descriptor: string; // e.g., "queries_closed"
    count: number;
    projectId: string;
}

export interface AchievementLog {
    id: string;
    date: Date;
    title: string;
    impact: string;     // e.g., "Reduced data lag by 15%"
    projectId: string;
}

export interface SiteLog {
    id: string;
    date: Date;
    siteId: string;     // e.g., "SITE-101"
    actionType: string; // e.g., "SIV", "IMV"
    notes: string;      // metadata only, NO PHI
}

export interface YearStats {
    year: number;
    totalEntries: number;
    byMetric: Record<PerformanceMetric, number>;
}
