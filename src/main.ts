import express from 'express';
import path from 'node:path';
import { TrackerService } from './features/tracker/service.ts';
import { SiteService } from './features/sites/service.ts';
import { z } from 'zod';

const app = express();
const PORT = process.env.PORT || 3000;
const trackerService = new TrackerService();
const siteService = new SiteService();

app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

// Zod Schemas
const MetricSchema = z.object({
    date: z.string().datetime(),
    descriptor: z.string(),
    count: z.number(),
    projectId: z.string()
});

const AchievementSchema = z.object({
    date: z.string().datetime(),
    title: z.string(),
    impact: z.string(),
    projectId: z.string()
});

const SiteLogSchema = z.object({
    date: z.string().datetime(),
    siteId: z.string(),
    actionType: z.string(),
    notes: z.string()
});

const SiteSchema = z.object({
    siteId: z.string(),
    name: z.string(),
    location: z.string(),
    notes: z.string()
});

const ProjectSchema = z.object({
    code: z.string(),
    name: z.string()
});

const TimesheetSchema = z.object({
    date: z.string().datetime(),
    projectId: z.string(),
    siteId: z.string().optional().nullable(),
    hours: z.number(),
    activityType: z.string(),
    notes: z.string(),
    isWin: z.boolean().optional(),
    winDetails: z.object({
        title: z.string(),
        impact: z.string()
    }).optional()
});

const TimesheetUpdateSchema = TimesheetSchema.partial();

// Logs API Routes
app.get('/api/logs/metric', async (req, res) => {
    res.json(await trackerService.getMetricLogs());
});
app.post('/api/logs/metric', async (req, res) => {
    const v = MetricSchema.safeParse(req.body);
    if (!v.success) return res.status(400).json(v.error);
    const entry = await trackerService.logMetric({ ...v.data, date: new Date(v.data.date) });
    res.status(201).json(entry);
});

app.get('/api/logs/achievement', async (req, res) => {
    res.json(await trackerService.getAchievementLogs());
});
app.post('/api/logs/achievement', async (req, res) => {
    const v = AchievementSchema.safeParse(req.body);
    if (!v.success) return res.status(400).json(v.error);
    const entry = await trackerService.logAchievement({ ...v.data, date: new Date(v.data.date) });
    res.status(201).json(entry);
});

app.get('/api/logs/site', async (req, res) => {
    res.json(await trackerService.getSiteLogs());
});
app.post('/api/logs/site', async (req, res) => {
    const v = SiteLogSchema.safeParse(req.body);
    if (!v.success) return res.status(400).json(v.error);
    const entry = await trackerService.logSiteVisit({ ...v.data, date: new Date(v.data.date) });
    res.status(201).json(entry);
});

// Sites API
app.get('/api/sites', async (req, res) => {
    res.json(await siteService.getSites());
});
app.post('/api/sites', async (req, res) => {
    const v = SiteSchema.safeParse(req.body);
    if (!v.success) return res.status(400).json(v.error);
    try {
        const site = await siteService.addSite(v.data);
        res.status(201).json(site);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add site' });
    }
});

// Projects API
app.get('/api/projects', async (req, res) => {
    res.json(await siteService.getProjects());
});
app.post('/api/projects', async (req, res) => {
    const v = ProjectSchema.safeParse(req.body);
    if (!v.success) return res.status(400).json(v.error);
    try {
        const project = await siteService.addProject(v.data);
        res.status(201).json(project);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add project' });
    }
});

// Timesheet API
app.get('/api/timesheets', async (req, res) => {
    res.json(await siteService.getTimesheets());
});
app.post('/api/timesheets', async (req, res) => {
    const v = TimesheetSchema.safeParse(req.body);
    if (!v.success) return res.status(400).json(v.error);

    try {
        const data = v.data;
        let linkedAchievementId: string | undefined;

        if (data.isWin && data.winDetails) {
            const achievement = await trackerService.logAchievement({
                date: new Date(data.date),
                title: data.winDetails.title,
                impact: data.winDetails.impact,
                projectId: data.projectId
            });
            linkedAchievementId = achievement.id;
        }

        const entry = await siteService.logTimesheet({
            date: new Date(data.date),
            projectId: data.projectId,
            siteId: data.siteId || undefined,
            hours: data.hours,
            activityType: data.activityType,
            notes: data.notes,
            linkedAchievementId
        });
        res.status(201).json(entry);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to log timesheet' });
    }
});

app.put('/api/timesheets/:id', async (req, res) => {
    const v = TimesheetUpdateSchema.safeParse(req.body);
    if (!v.success) return res.status(400).json(v.error);
    try {
        const data = { ...v.data, date: v.data.date ? new Date(v.data.date) : undefined };
        if (data.siteId === null) data.siteId = undefined;

        await siteService.updateTimesheet(req.params.id, data as any);
        res.status(200).send();
    } catch (err) {
        res.status(500).json({ error: 'Failed to update' });
    }
});

app.delete('/api/timesheets/:id', async (req, res) => {
    try {
        await siteService.deleteTimesheet(req.params.id);
        res.status(200).send();
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete' });
    }
});

// Export API
app.get('/api/export/wins', async (req, res) => {
    try {
        const wins = await trackerService.getAchievementLogs();
        let md = '# Monthly Achievements Log\n\n';
        wins.forEach(win => {
            const date = new Date(win.date).toLocaleDateString();
            md += `## ${win.title}\n`;
            md += `- **Date**: ${date}\n`;
            md += `- **Project**: ${win.projectId}\n`;
            md += `- **Impact**: ${win.impact}\n\n`;
            md += `---\n\n`;
        });

        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', 'attachment; filename="wins-export.md"');
        res.send(md);
    } catch (err) {
        res.status(500).send('Failed to export data');
    }
});

app.get('*', (req, res) => {
    const pathname = req.path;
    if (pathname === '/tools') {
        res.sendFile(path.join(process.cwd(), 'public', 'tools.html'));
    } else if (pathname === '/sites.html') {
        res.sendFile(path.join(process.cwd(), 'public', 'sites.html'));
    } else {
        res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
    }
});

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`KaziCRA Server (Express) running at http://0.0.0.0:${PORT}`);
    console.log(`Runtime: Node ${process.version}`);
});
