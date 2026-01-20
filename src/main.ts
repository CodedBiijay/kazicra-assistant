import express from 'express';
import path from 'node:path';
import { TrackerService } from './features/tracker/service.js';
import { SiteService } from './features/sites/service.js';
import { z } from 'zod';
import multer from 'multer';
import fs from 'node:fs';

const app = express();
const PORT = process.env.PORT || 3000;
const trackerService = new TrackerService();
const siteService = new SiteService();

app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public'), { index: false }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));


// Zod Schemas
const WinSchema = z.object({
    date: z.string().datetime(),
    projectId: z.string(),
    category: z.string().default('General'), // Add category as requested
    title: z.string(),
    impact: z.string()
});

const TimesheetSchema = z.object({
    date: z.string().datetime(),
    projectId: z.string(),
    activityType: z.string(),
    hoursSpent: z.number(),
    notes: z.string().optional()
});

// Logs API Routes (Wins)
app.get('/api/wins', async (req, res) => {
    res.json(await trackerService.getWins());
});

app.post('/api/wins', async (req, res) => {
    const v = WinSchema.safeParse(req.body);
    if (!v.success) return res.status(400).json(v.error);

    try {
        const entry = await trackerService.logWin({
            date: new Date(v.data.date),
            project_id: v.data.projectId,
            category: v.data.category,
            title: v.data.title,
            impact: v.data.impact // Mapping impact to impact_description in service
        });
        res.status(201).json(entry);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to log win' });
    }
});

// Timesheet API
app.get('/api/timesheet', async (req, res) => {
    res.json(await trackerService.getTimesheets());
});

app.post('/api/timesheet', async (req, res) => {
    const v = TimesheetSchema.safeParse(req.body);
    if (!v.success) return res.status(400).json(v.error);

    try {
        const entry = await trackerService.logTimesheet({
            date: new Date(v.data.date),
            project_id: v.data.projectId,
            activity_type: v.data.activityType,
            hours_spent: v.data.hoursSpent,
            notes: v.data.notes
        });
        res.status(201).json(entry);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to log timesheet' });
    }
});

// Site Logistics API
const SiteLogisticsSchema = z.object({
    siteId: z.string(),
    name: z.string(),
    location: z.string(),
    notes: z.string().optional(),
    hotel_best: z.string().optional().nullable(), // Allow nulls from JSON
    restaurant_best: z.string().optional().nullable(),
    parking_spot: z.string().optional().nullable(),
    door_code: z.string().optional().nullable(),
    primary_contact_name: z.string().optional().nullable()
});

app.get('/api/sites', async (req, res) => {
    res.json(await siteService.getSites());
});

app.post('/api/sites', async (req, res) => {
    const v = SiteLogisticsSchema.safeParse(req.body);
    if (!v.success) return res.status(400).json(v.error);

    try {
        // Check if exists update vs create logic could be here, 
        // but for now we follow the simple "addSite" pattern or we can strictly use ID.
        // Given constraints, we'll keep it simple: Add if new ID, but maybe we need an update endpoint?
        // The implementation plan suggested POST updates logistics details.

        // Let's check if site exists strictly by siteId for this simplified flow
        const existingSites = await siteService.getSites();
        const existing = existingSites.find(s => s.siteId === v.data.siteId);

        if (existing) {
            // Update mode
            await siteService.updateSiteLogistics(existing.id, {
                hotel_best: v.data.hotel_best,
                restaurant_best: v.data.restaurant_best,
                parking_spot: v.data.parking_spot,
                door_code: v.data.door_code,
                primary_contact_name: v.data.primary_contact_name,
                notes: v.data.notes
            });
            res.json({ status: 'updated', id: existing.id });
        } else {
            // Create mode
            const newSite = await siteService.addSite({
                siteId: v.data.siteId,
                name: v.data.name,
                location: v.data.location,
                notes: v.data.notes || '',
                hotel_best: v.data.hotel_best || null,
                restaurant_best: v.data.restaurant_best || null,
                parking_spot: v.data.parking_spot || null,
                door_code: v.data.door_code || null,
                primary_contact_name: v.data.primary_contact_name || null
            });
            res.status(201).json(newSite);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save site' });
    }
});

// Calculator API
import { CalculatorService } from './features/tools/calculatorService.js';
const calculatorService = new CalculatorService();

app.get('/api/tools/my-tools', async (req, res) => {
    res.json(await calculatorService.getUserTools());
});

// Tool Search
app.post('/api/tools/search', async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query required' });
    const tool = await calculatorService.generateCalculator(query);
    if (!tool) return res.status(404).json({ error: 'No calculator found' });
    await calculatorService.saveTool(tool);
    res.json(tool);
});

// --- Visits API ---
import { visitService } from './features/visits/service.js';

app.post('/api/visits', async (req, res) => {
    const { siteId, type, date, mode } = req.body;
    if (!siteId || !type || !date || !mode) return res.status(400).json({ error: "Missing fields" });
    try {
        const visit = await visitService.createVisit(siteId, type, date, mode);
        res.status(201).json(visit);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Creation failed" });
    }

});

app.get('/api/visits', async (req, res) => {
    try {
        const visits = await visitService.getUpcomingVisits();
        res.json(visits);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Fetch failed" });
    }
});

app.get('/api/visits/:siteId', async (req, res) => {
    try {
        const visits = await visitService.getVisitsBySite(req.params.siteId);
        res.json(visits);
    } catch (e) { res.status(500).json({ error: "Fetch failed" }); }
});

app.get('/api/visit/:id', async (req, res) => {
    try {
        const visit = await visitService.getVisit(req.params.id);
        if (!visit) return res.status(404).json({ error: "Not found" });
        res.json(visit);
    } catch (e) { res.status(500).json({ error: "Fetch failed" }); }
});

app.put('/api/visit/:id/checklist', async (req, res) => {
    try {
        const visit = await visitService.updateChecklist(req.params.id, req.body.items);
        res.json(visit);
    } catch (e) { res.status(500).json({ error: "Update failed" }); }
});

app.post('/api/visit/:id/complete', async (req, res) => {
    try {
        await visitService.completeVisit(req.params.id);
        res.json({ status: 'completed' });
    } catch (e) { res.status(500).json({ error: "Completion failed" }); }
});

app.put('/api/visit/:id/isf', async (req, res) => {
    try {
        const { items } = req.body;
        await visitService.updateIsf(req.params.id, items);
        res.json({ status: 'updated' });
    } catch (e) { res.status(500).json({ error: "Update failed" }); }
});

// --- File Upload API ---
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Construct public URL - we need to serve 'uploads' folder statically
    // But uploads is outside public. Let's add a virtual static route.
    const url = `/uploads/${req.file.filename}`;

    res.json({
        filename: req.file.filename,
        path: req.file.path,
        url: url,
        originalName: req.file.originalname
    });
});


// --- Reporting API ---
import { reportingService } from './features/reports/service.js';
import { reviewArchitectService } from './features/reports/reviewService.js';

app.post('/api/reports/generate', async (req, res) => {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) return res.status(400).json({ error: "Date range required" });
    try {
        const md = await reportingService.generateDossier({ startDate, endDate });
        res.json({ markdown: md });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Report generation failed" });
    }
});

app.post('/api/reviews/analyze', async (req, res) => {
    const { visitId } = req.body;
    if (!visitId) return res.status(400).json({ error: "Visit ID required" });
    try {
        const analysis = await reviewArchitectService.analyzeVisit(visitId);
        res.json({ markdown: analysis });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Analysis failed" });
    }
});

// --- Marketing API ---
import { marketingService } from './features/marketing/service.js';

app.post('/api/leads', async (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ error: "Name and Email required" });
    try {
        const id = await marketingService.captureLead(name, email);
        res.status(201).json({ status: 'success', id });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to capture lead" });
    }
});

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });
    try {
        const reply = await marketingService.processChat(message);
        res.json({ reply });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Chat failed" });
    }
});

// --- HTML Routes ---
const PUBLIC_DIR = path.join(process.cwd(), 'public');
app.get('/', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'landing.html')));
app.get('/app', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'app.html')));
app.get('/visit-mode', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'visit_mode.html')));
app.get('/report', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'report.html')));

app.get('*', (req, res) => {
    const pathname = req.path;
    if (pathname === '/tools') {
        res.sendFile(path.join(process.cwd(), 'public', 'tools.html'));
    } else if (pathname === '/sites.html') {
        res.sendFile(path.join(process.cwd(), 'public', 'sites.html'));
    } else if (pathname === '/timesheet.html') {
        res.sendFile(path.join(process.cwd(), 'public', 'timesheet.html'));
    } else if (pathname === '/visits.html') {
        res.sendFile(path.join(process.cwd(), 'public', 'visits.html'));
    } else {
        res.sendFile(path.join(process.cwd(), 'public', 'landing.html'));
    }
});

// Export for Vercel Serverless
export default app;

// Only start server if run directly (Development or Cloud Run)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`CRABuddy Server (Express) running at http://0.0.0.0:${PORT}`);
        console.log(`Runtime: Node ${process.version}`);
    });
}
