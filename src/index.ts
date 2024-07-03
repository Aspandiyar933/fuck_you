import express, { Request, Response } from 'express';
import Database from './config/db.js';
import globalRouter from './global-router.js';
import { logger } from './logger.js';

const app = express();

const PORT: number = 3000;

const conn = new Database();

conn.connect()
    .then(() => {
        console.log("Database connection check completed");
    })
    .catch((error) => {
        console.error("Error during database connection check:", error);
    });

app.use(logger);
app.use(express.json());
app.use('/api/v1/', globalRouter);

app.listen(PORT, () => {
    console.log(`It is alive on http://localhost:${PORT}`);
}).on('error', (err: Error) => {
    console.error('Error starting server:', err);
});