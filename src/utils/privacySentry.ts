export class PrivacySentry {

    private static PATIENT_ID_REGEX = /\b[A-Za-z]{2,3}(-|\s)?\d{2,4}\b|\b\d{3}(-|\s)?\d{2}\b/g; // Matches JS-123, 001-02, etc.
    private static DOB_REGEX = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g; // Matches 01/01/1980

    static sanitize(input: string): { clean: string, triggered: boolean } {
        let clean = input;
        let triggered = false;

        // Mask Patient IDs
        if (this.PATIENT_ID_REGEX.test(clean)) {
            clean = clean.replace(this.PATIENT_ID_REGEX, '[PARTICIPANT_ID]');
            triggered = true;
        }

        // Mask DOBs
        if (this.DOB_REGEX.test(clean)) {
            clean = clean.replace(this.DOB_REGEX, '[DATE_REMOVED]');
            triggered = true;
        }

        // Basic Drug Name masking (Example list)
        const proprietaryTerms = ['MK-3475', 'Keytruda', 'Protocol-X'];
        proprietaryTerms.forEach(term => {
            const regex = new RegExp(`\\b${term}\\b`, 'gi');
            if (regex.test(clean)) {
                clean = clean.replace(regex, '[STUDY_DRUG]');
                triggered = true;
            }
        });

        return { clean, triggered };
    }
}
