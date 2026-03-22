console.log("--- DEBUG: ACTUAL REDIS_URL SEEN IN APP:", process.env.REDIS_URL);
import express from 'express';
import http from 'http';
import cors from 'cors';
import { PORT, connectDB } from './config';
import { initSockets } from './sockets';
import { initQueues } from './queues';
import { startWorkers } from './workers';
import assignmentRoutes from './routes/assignment.routes';
import path from 'path';

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '15mb' }));
app.use('/pdfs', express.static(path.join(__dirname, '../public/pdfs')));
app.use('/docx', express.static(path.join(__dirname, '../public/docx')));

// Routes
app.use('/assignments', assignmentRoutes);

const startServer = async () => {
  await connectDB();
  await initQueues();
  initSockets(server);
  startWorkers();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
