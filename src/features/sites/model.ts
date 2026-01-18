export interface Site {
    id: string;
    siteId: string; // e.g. "101"
    name: string;   // e.g. "General Hospital"
    location: string;
    notes: string;  // Non-PHI, e.g. "Parking code 1234"
}
