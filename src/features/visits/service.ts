import db from '../../config/db.ts';
import { randomUUID } from 'crypto';

export interface ChecklistItem {
    id: string;
    label: string;
    category: string;
    completed: boolean;
    notes?: string;
}

export interface IsfItem {
    id: string;
    section: string;
    label: string;
    description?: string; // Additional context from Master Checklist
    status: 'Present' | 'Missing' | 'Expired/Needs Update' | 'N/A';
    actionPlan?: string;
    files?: { name: string; path: string; url: string }[];
}

export interface Visit {
    id: string;
    site_id: string;
    type: 'SIV' | 'IMV' | 'COV' | 'PSV';
    mode: 'On-site' | 'Remote';
    date: string;
    status: 'scheduled' | 'in-progress' | 'completed';
    checklist: ChecklistItem[];
    isf?: IsfItem[];
    progress_percent: number;
}

const ISF_SECTIONS = {
    "Protocol & Regulatory": [
        { label: "CSP v6.0", description: "Current Protocol (19Nov2024)" },
        { label: "CSP v5.0", description: "Previous Protocol (29Aug2023)" },
        { label: "CSP v4.0", description: "Archived Protocol (21Feb2023)" },
        { label: "Protocol Agreement Form", description: "Signed by PI" },
        { label: "FDA-1572", description: "Must list current site address and labs" },
        { label: "Financial Disclosure Forms (FDF)", description: "For all investigators listed on 1572" },
        { label: "CVs & Medical Licenses", description: "Current for all PI/Sub-I" },
        { label: "Delegation of Responsibilities (DoR) Log", description: "Must match 1572 and Training Logs" }
    ],
    "Investigator Brochure": [
        { label: "Breztri IB v10", description: "Current Version" },
        { label: "Symbicort IB v13", description: "Current Version" },
        { label: "IB Acknowledgement of Receipt", description: "Signed by PI" }
    ],
    "IRB/IEC": [
        { label: "IRB Approvals", description: "Protocol, IB, ICFs, Ads" },
        { label: "Approved ICFs", description: "Clean and Tracked versions" },
        { label: "IRB Roster / Composition", description: "Current version" },
        { label: "Continuing Review Approvals", description: "Annual re-approvals" }
    ],
    "Safety": [
        { label: "SAE Report Forms", description: "Paper copies (if RAVE down)" },
        { label: "Medication Error Report Forms", description: "Blank copies available" },
        { label: "Pregnancy Outcome Forms", description: "Blank copies available" },
        { label: "Safety Notification Letters", description: "Acknowledged by PI" }
    ],
    "Vendors & Manuals": [
        { label: "LabCorp Manual v6.0", description: "Current Lab Manual" },
        { label: "Specimen Collection Guide", description: "LabCorp" },
        { label: "Signant IRT User Guide", description: "IP Management" },
        { label: "MonTe User Guide", description: "Temperature Monitoring" },
        { label: "Clario eCOA Manual", description: "Device instructions" },
        { label: "NIOX User Manual", description: "FeNO testing" }
    ],
    "IP & Supplies": [
        { label: "Drug Dispensing Log", description: "Current and up to date" },
        { label: "Shipping Invoices/Receipts", description: "Acknowledged in IRT" },
        { label: "Temperature Logs", description: "MonTe downloads / excursion reports" },
        { label: "IP Return/Destruction Records", description: "If applicable" }
    ],
    "Subject Logs": [
        { label: "Screening & Enrollment Log", description: "Up to date" },
        { label: "Subject Identification Log", description: "Confidential - stored separately?" },
        { label: "HBS (Biosample) Log", description: "Tracking CONSENT for samples" }
    ]
};

const TEMPLATES: Record<string, ChecklistItem[]> = {
    'IMV': [
        // EDC (RAVE)
        { id: '1', label: 'Data Entry up to date?', category: 'EDC (RAVE)', completed: false },
        { id: '2', label: 'Queries over 30 days resolved?', category: 'EDC (RAVE)', completed: false },
        { id: '3', label: 'Pending Investigator eCRF reviews cleared?', category: 'EDC (RAVE)', completed: false },
        // IP Management (IRT)
        { id: '4', label: 'IP Inventory adequate?', category: 'IP Management (IRT)', completed: false },
        { id: '5', label: 'Expiry risk checked (<30/60 days)?', category: 'IP Management (IRT)', completed: false },
        { id: '6', label: 'Shipments acknowledged in IRT?', category: 'IP Management (IRT)', completed: false },
        // Shipments (MonTe)
        { id: '7', label: 'All shipments uploaded?', category: 'Shipments (MonTe)', completed: false },
        { id: '8', label: 'Temp excursions reported?', category: 'Shipments (MonTe)', completed: false },
        // Safety
        { id: '9', label: 'Any new SAEs since last visit?', category: 'Safety', completed: false }
    ],
    'COV': [
        // IP Accountability
        { id: '1', label: 'IP Accountability Center Level Summary collected?', category: 'IP Accountability', completed: false },
        { id: '2', label: 'Drug Dispensing Log final version collected?', category: 'IP Accountability', completed: false },
        { id: '3', label: 'IP Return/Destruction certificates filed?', category: 'IP Accountability', completed: false },
        // Regulatory & IRB
        { id: '4', label: 'IRB Notification of Trial Termination uploaded?', category: 'Regulatory & IRB', completed: false },
        { id: '5', label: 'Final Site Signature Sheet reviewed for pagination?', category: 'Regulatory & IRB', completed: false },
        { id: '6', label: 'Site Closure Form submitted?', category: 'Regulatory & IRB', completed: false },
        // Site Staff
        { id: '7', label: 'Final Delegation Log collected?', category: 'Site Staff', completed: false },
        { id: '8', label: 'All training records accounted for?', category: 'Site Staff', completed: false }
    ],
    'PSV': [
        // Feasibility
        { id: '1', label: 'Facility assessment complete?', category: 'Feasibility', completed: false },
        { id: '2', label: 'PI Qualifications verified?', category: 'Feasibility', completed: false },
        { id: '3', label: 'Staffing levels confirmed?', category: 'Feasibility', completed: false }
    ],
    'SIV': [
        // Training
        { id: '1', label: 'SIV Attendance Log signed?', category: 'Training', completed: false },
        { id: '2', label: 'Protocol training recorded?', category: 'Training', completed: false },
        { id: '3', label: 'System access (RAVE/IRT) confirmed for all staff?', category: 'Training', completed: false }
    ],
    'RDC': [
        // RAVE (EDC)
        { id: '1', label: 'Data Entry up to date?', category: 'RAVE (EDC)', completed: false },
        { id: '2', label: 'Oldest aging queries addressed?', category: 'RAVE (EDC)', completed: false },
        { id: '3', label: 'Any queries >30 days open?', category: 'RAVE (EDC)', completed: false },
        { id: '4', label: 'Site Monitor queries closed?', category: 'RAVE (EDC)', completed: false },
        { id: '5', label: 'Missing pages addressed?', category: 'RAVE (EDC)', completed: false },
        { id: '6', label: 'Subject Status accurate vs EDC?', category: 'RAVE (EDC)', completed: false },
        // Signant IRT
        { id: '7', label: 'IP Inventory Adequate?', category: 'Signant IRT', completed: false },
        { id: '8', label: 'Expiry risk check (<60d)?', category: 'Signant IRT', completed: false },
        { id: '9', label: 'Pending Shipments received in IRT?', category: 'Signant IRT', completed: false },
        { id: '10', label: 'MonTe (Shipments) Uploaded?', category: 'Signant IRT', completed: false },
        // CM Dashboard
        { id: '11', label: 'Pending MARs >30 days?', category: 'CM Dashboard', completed: false },
        { id: '12', label: 'SAEs pending eCRF completion?', category: 'CM Dashboard', completed: false },
        // Central Lab (Xcellerate)
        { id: '13', label: 'Lab Kits stock adequate?', category: 'Central Lab', completed: false },
        { id: '14', label: 'Expiring kits identified?', category: 'Central Lab', completed: false },
        { id: '15', label: 'Open Lab Queries?', category: 'Central Lab', completed: false },
        // Unify
        { id: '16', label: 'Unify accounts active for all randomized?', category: 'Unify', completed: false },
        { id: '17', label: 'HEs Compliance <60% flagged?', category: 'Unify', completed: false },
        { id: '18', label: 'Overdose reports acknowledged?', category: 'Unify', completed: false },
        // Clario
        { id: '19', label: 'Required site staff active?', category: 'Clario', completed: false },
        { id: '20', label: 'Subject visits complete?', category: 'Clario', completed: false },
        // Safety
        { id: '21', label: 'Any new AEs or SAEs since last RDC?', category: 'Safety', completed: false },
        // JUDI
        { id: '22', label: 'Adjudicated events in JUDI?', category: 'JUDI', completed: false },
        { id: '23', label: 'Spirometry Uploads complete?', category: 'JUDI', completed: false },
        { id: '24', label: 'Open Spirometry QC queries?', category: 'JUDI', completed: false }
    ]
};

export class VisitService {
    async createVisit(siteId: string, type: 'SIV' | 'IMV' | 'COV', date: string, mode: 'On-site' | 'Remote'): Promise<Visit> {
        const id = randomUUID();

        // Smart Template Selection
        let templateKey: string = type;
        if (mode === 'Remote' && TEMPLATES['RDC']) {
            templateKey = 'RDC';
        }

        // Deep copy template
        const checklist = JSON.parse(JSON.stringify(TEMPLATES[templateKey] || TEMPLATES[type] || TEMPLATES['IMV']));

        // Initialize ISF with Smart Data
        const isf: IsfItem[] = [];
        let isfIdx = 1;
        Object.entries(ISF_SECTIONS).forEach(([section, items]) => {
            items.forEach((item) => {
                isf.push({
                    id: `${id}-isf-${isfIdx++}`,
                    section,
                    label: item.label,
                    description: item.description,
                    status: 'N/A'
                });
            });
        });

        // Add unique IDs to list items
        checklist.forEach((item: ChecklistItem, idx: number) => item.id = `${id}-${idx}`);

        const visit: Visit = {
            id,
            site_id: siteId,
            type,
            mode,
            date,
            status: 'scheduled',
            checklist,
            isf,
            progress_percent: 0
        };

        await db.run(
            `INSERT INTO visits (id, site_id, type, date, status, checklist, progress_percent, mode, isf) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [visit.id, visit.site_id, visit.type, visit.date, visit.status, JSON.stringify(visit.checklist), 0, visit.mode, JSON.stringify(visit.isf)]
        );

        return visit;
    }

    async getVisitsBySite(siteId: string): Promise<Visit[]> {
        const rows = await db.query(`SELECT * FROM visits WHERE site_id = ? ORDER BY date DESC`, [siteId]);
        return rows.map(r => ({ ...r, checklist: JSON.parse(r.checklist), isf: r.isf ? JSON.parse(r.isf) : [] }));
    }

    async getUpcomingVisits(): Promise<Visit[]> {
        const rows = await db.query(`SELECT * FROM visits WHERE status != 'completed' ORDER BY date ASC`);
        return rows.map(r => ({ ...r, checklist: JSON.parse(r.checklist), isf: r.isf ? JSON.parse(r.isf) : [] }));
    }

    async getVisit(id: string): Promise<Visit | null> {
        const rows = await db.query(`SELECT * FROM visits WHERE id = ?`, [id]);
        if (rows.length === 0) return null;
        const row = rows[0];
        return { ...row, checklist: JSON.parse(row.checklist), isf: row.isf ? JSON.parse(row.isf) : [] };
    }

    async updateIsf(visitId: string, items: IsfItem[]): Promise<void> {
        await db.run(
            `UPDATE visits SET isf = ? WHERE id = ?`,
            [JSON.stringify(items), visitId]
        );
    }

    async updateChecklist(visitId: string, items: ChecklistItem[]): Promise<Visit> {
        const total = items.length;
        const completed = items.filter(i => i.completed).length;
        const percent = Math.round((completed / total) * 100);

        let status = 'in-progress';
        if (percent === 100) status = 'completed';
        if (percent === 0) status = 'scheduled';

        await db.run(
            `UPDATE visits SET checklist = ?, progress_percent = ?, status = ? WHERE id = ?`,
            [JSON.stringify(items), percent, status, visitId]
        );

        return (await this.getVisit(visitId))!;
    }

    async completeVisit(visitId: string): Promise<void> {
        await db.run(
            `UPDATE visits SET status = 'completed' WHERE id = ?`,
            [visitId]
        );
    }
}

export const visitService = new VisitService();
