
// Vercel Serverless Function Config
// This file delegates all API requests to the main Express app
import app from '../src/main.js'; // Note .js extension for ESM resolution in some envs, checking tsconfig
// Actually, since we use TS and node --experimental-strip-types, Vercel might need specific handling.
// Standard Vercel Node Runtime supports TS. We'll import from the source.

export default app;
