import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { redisConnection } from '../config';

let io: Server;

type GenerationStatus = 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';

export const initSockets = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH']
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join-assignment', (assignmentId: string) => {
      socket.join(assignmentId);
      console.log(`Socket ${socket.id} joined assignment ${assignmentId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

export const emitGenerationProgress = (
  assignmentId: string,
  percentage: number,
  step: string,
  status: GenerationStatus = 'GENERATING',
) => {
  if (!io) return;
  io.to(assignmentId).emit('generation-progress', {
    percentage,
    progress: percentage,
    step,
    status,
  });
};

export const emitGenerationComplete = (assignmentId: string, data: any) => {
  if (!io) return;
  io.to(assignmentId).emit('generation-complete', data);
};

export const emitGenerationFailed = (assignmentId: string, error: string) => {
  if (!io) return;
  io.to(assignmentId).emit('generation-failed', { error });
};
