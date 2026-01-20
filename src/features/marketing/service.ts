import db from '../../config/db.ts';
import { randomUUID } from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const SYSTEM_INSTRUCTION = `
You are the "ExoCore Assistant" for CRABuddy.
Your goal is to answer questions about the CRABuddy application for Senior Clinical Research Associates (CRAs).

**CORE KNOWLEDGE BASE**:
1. **Product**: CRABuddy is an "Operating System for Elite CRAs". It tracks proactive interventions ("Wins"), manages site logistics (codes, parking), and generates performance dossiers.
2. **Pricing**: Currently in "Early Access". Free for the first 500 Senior CRAs.
3. **Privacy**: "Metadata-Only Architecture". We NEVER store PHI (Patient Health Information). Data is encrypted locally and in transit.
4. **Philosophy**: Built by "ExoCore Systems". We build "exoskeletons" for professionals to handle admin debt so they can focus on high-value work.
5. **Features**:
    - **Evidence Locker**: Logs critical interventions.
    - **Site Intelligence**: Stores non-PHI logistics (parking, hotels).
    - **Dossier Gen**: Exports a PDF review narrative.

**GUARDRAILS**:
- Answer ONLY questions related to CRABuddy, Clinical Research, CRA work, or ExoCore.
- If asked about general topics (e.g., "Write a poem", "What is the capital of France"), politely refuse: "I am designed only to assist with CRABuddy and Clinical Operations inquiries."
- Maintain a professional, 'Senior CRA' tone: concise, precise, and helpful.
- Do NOT hallucinate features not listed above.
`;

export class MarketingService {
    private genAI: GoogleGenerativeAI | null = null;
    private model: any = null;

    constructor() {
        const key = process.env.GEMINI_API_KEY;
        if (key) {
            this.genAI = new GoogleGenerativeAI(key);
            this.model = this.genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                systemInstruction: SYSTEM_INSTRUCTION
            });
        }
    }

    // --- Lead Gen ---
    async captureLead(name: string, email: string): Promise<string> {
        const id = randomUUID();
        const date = new Date().toISOString();

        await db.run(
            `INSERT INTO leads (id, name, email, date_captured) VALUES (?, ?, ?, ?)`,
            [id, name, email, date]
        );

        return id;
    }

    // --- AI Agent ---
    async processChat(message: string): Promise<string> {
        // Fallback if no key
        if (!this.model) {
            return this.fallbackChat(message);
        }

        try {
            const result = await this.model.generateContent(message);
            const response = result.response;
            return response.text();
        } catch (error) {
            console.error("AI Generation Error:", error);
            // Fallback on error (e.g., quota)
            return this.fallbackChat(message);
        }
    }

    // Legacy Rule-Based Fallback
    private fallbackChat(message: string): string {
        const msg = message.toLowerCase();
        if (msg.match(/prime|pricing|cost|free|trial/)) return "CRABuddy is currently in Early Access. Free for the first 500 Senior CRAs.";
        if (msg.match(/security|phi|privacy|safe/)) return "We use a 'Metadata-Only' architecture. No PHI is ever stored. 100% Compliant.";
        if (msg.match(/feature|dossier|log/)) return "I can track Wins, manage Site Logistics, and generate Dossiers. Check the demo!";
        return "I'll flag this for our Product Team. (System Note: AI connection unavailable, running in offline mode).";
    }
}

export const marketingService = new MarketingService();
