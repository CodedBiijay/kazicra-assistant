import db from '../../config/db.ts';
import { randomUUID } from 'node:crypto';

export interface UserTool {
    id: string;
    name: string;
    type: 'calculator' | 'reference';
    config: any; // JSON object defining inputs/formula
    date_added: string;
}

export class CalculatorService {

    // "AI" Logic: Maps keywords to calculator configs
    // In a real AI system, this would call an LLM. Here we use a robust heuristic.
    generateCalculator(query: string): UserTool | null {
        const q = query.toLowerCase();

        if (q.includes('bsa') || q.includes('body surface')) {
            return {
                id: randomUUID(),
                name: 'BSA Calculator (Mosteller)',
                type: 'calculator',
                date_added: new Date().toISOString(),
                config: {
                    inputs: [
                        { name: 'height_cm', label: 'Height (cm)', type: 'number' },
                        { name: 'weight_kg', label: 'Weight (kg)', type: 'number' }
                    ],
                    formula: 'Math.sqrt((height_cm * weight_kg) / 3600)',
                    unit: 'm²'
                }
            };
        }

        if (q.includes('bmi') || q.includes('mass index')) {
            return {
                id: randomUUID(),
                name: 'BMI Calculator',
                type: 'calculator',
                date_added: new Date().toISOString(),
                config: {
                    inputs: [
                        { name: 'height_cm', label: 'Height (cm)', type: 'number' },
                        { name: 'weight_kg', label: 'Weight (kg)', type: 'number' }
                    ],
                    formula: 'weight_kg / ((height_cm / 100) * (height_cm / 100))',
                    unit: 'kg/m²'
                }
            };
        }

        if (q.includes('carboplatin') || q.includes('calvert')) {
            return {
                id: randomUUID(),
                name: 'Carboplatin Dosing (Calvert)',
                type: 'calculator',
                date_added: new Date().toISOString(),
                config: {
                    inputs: [
                        { name: 'target_auc', label: 'Target AUC', type: 'number' },
                        { name: 'gfr', label: 'GFR (mL/min)', type: 'number' }
                    ],
                    formula: 'target_auc * (gfr + 25)',
                    unit: 'mg'
                }
            };
        }

        return null;
    }

    async saveTool(tool: UserTool): Promise<void> {
        await db.run(
            `INSERT INTO user_tools (id, name, type, config, date_added) VALUES (?, ?, ?, ?, ?)`,
            [tool.id, tool.name, tool.type, JSON.stringify(tool.config), tool.date_added]
        );
    }

    async getUserTools(): Promise<UserTool[]> {
        const rows = await db.query(`SELECT * FROM user_tools ORDER BY date_added DESC`);
        return rows.map(r => ({
            ...r,
            config: JSON.parse(r.config)
        })) as UserTool[];
    }
}
