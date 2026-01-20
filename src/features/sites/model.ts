export interface Site {
    id: string;
    siteId: string; // e.g. "101"
    name: string;   // e.g. "General Hospital"
    location: string;
    notes: string;
    hotel_best?: string | null;
    restaurant_best?: string | null;
    parking_spot?: string | null;
    door_code?: string | null;
    primary_contact_name?: string | null;
}
