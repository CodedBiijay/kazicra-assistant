import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { visitService } from '../visits/service.ts';

dotenv.config();

const PROMPTS = {
    'SIV': `You are assisting a CRA preparing for a Site Initiation Visit (SIV).

Context provided by the CRA:
- Slide sections with high execution complexity
- Report sections requiring strong justification
- Anticipated staffing or workflow constraints

Your task:
1. Identify where SIV slide content may not translate cleanly into execution.
2. Flag areas likely to be weakly documented if not addressed deliberately.
3. Suggest questions or confirmations that would support strong SIV report language.
4. Highlight signals that should influence IMV strategy selection.

Constraints:
- Do not rewrite slides.
- Do not generate report language.
- Do not assume site incompetence.

Output format:
## Slide-to-Execution Risk Areas
(Bulleted list)

## Documentation Risk Alerts
(Bulleted list)

## Suggested Live Confirmations
(Bulleted list)

## IMV Strategy Signals
(Bulleted list)
`,
    'IMV': `You are assisting a CRA planning an Interim Monitoring Visit (IMV).

Inputs:
- Checklist completion status
- ISF Gaps and Status
- Open Action Items

Your task:
1. Assess whether the current monitoring approach is appropriate.
2. Identify trends that warrant strategy adjustment.
3. Suggest verification priorities for the upcoming IMV.

Constraints:
- Do not default to increased monitoring.
- Do not restate findings.
- Focus on trend validation, not issue hunting.

Output format:
## Strategy Validation
(Bulleted list)

## Suggested Adjustments
(Bulleted list)

## IMV Verification Priorities
(Bulleted list)
`,
    'COV': `You are assisting a CRA preparing for a Close-Out Visit (COV).

Inputs:
- Full monitoring history context
- Open Action Items

Your task:
1. Identify unresolved systemic risks versus administrative tasks.
2. Assess inspection readiness confidence.
3. Highlight lessons that trace back to early study decisions.

Constraints:
- Do not restate findings.
- Do not generate audit language.
- Focus on decision quality over time.

Output format:
## Residual Risk Assessment
(Bulleted list)

## Inspection Readiness Signals
(Bulleted list)

## Lifecycle Lessons Learned
(Bulleted list)
`,
    'PSV': `You are assisting a CRA preparing for a Pre-Study Visit (PSV).

Inputs provided:
- Site Profile
- Visit Mode

Your task:
1. Identify assumptions that could create downstream SIV or IMV issues.
2. Flag protocol elements likely to strain site capacity.
3. Suggest what should be emphasized during SIV if this site activates.

Constraints:
- Do not summarize the protocol.
- Focus on execution risk, not compliance theory.
- Output should inform monitoring strategy, not training content.

Output format:
## PSV Assumptions at Risk
(Bulleted list)

## Likely SIV Pressure Points
(Bulleted list)

## Early Monitoring Considerations
(Bulleted list)
`
};

export class ReviewArchitectService {
    private genAI: GoogleGenerativeAI | null = null;
    private model: any = null;

    constructor() {
        const key = process.env.GEMINI_API_KEY;
        if (key) {
            this.genAI = new GoogleGenerativeAI(key);
            this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        }
    }

    async analyzeVisit(visitId: string): Promise<string> {
        if (!this.model) return "## AI Service Unavailable\nPlease configure GEMINI_API_KEY.";

        const visit = await visitService.getVisit(visitId);
        if (!visit) throw new Error("Visit not found");

        const promptTemplate = PROMPTS[visit.type] || PROMPTS['IMV']; // Default to IMV

        // Construct the context payload
        const checklistSummary = visit.checklist
            .map(i => `- [${i.completed ? 'x' : ' '}] ${i.category}: ${i.label} ${i.notes ? `(Note: ${i.notes})` : ''}`)
            .join('\n');

        const isfGaps = (visit.isf || [])
            .filter(i => i.status !== 'Present' && i.status !== 'N/A')
            .map(i => `- ${i.section}: ${i.label} is ${i.status}. Plan: ${i.actionPlan || 'None'}`)
            .join('\n');

        const context = `
Current Visit Context:
- Type: ${visit.type}
- Mode: ${visit.mode}
- Date: ${visit.date}
- Progress: ${visit.progress_percent}%

Checklist Items:
${checklistSummary}

ISF Gaps/Issues:
${isfGaps || "None detected."}
`;

        const finalPrompt = `${promptTemplate}\n\n${context}`;

        try {
            const result = await this.model.generateContent(finalPrompt);
            return result.response.text();
        } catch (error) {
            console.error("AI Analysis Failed:", error);
            return "## Analysis Failed\nCould not generate insight at this time.";
        }
    }
}

export const reviewArchitectService = new ReviewArchitectService();
