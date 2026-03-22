import { Queue, Worker, QueueEvents } from 'bullmq';
import { bullMqConnection } from '../config';

export const generationQueueName = 'question-generation';
export const pdfQueueName = 'pdf-generation';

// Queues
export const generationQueue = new Queue(generationQueueName, { connection: bullMqConnection });
export const pdfQueue = new Queue(pdfQueueName, { connection: bullMqConnection });

// Queue Events
export const generationQueueEvents = new QueueEvents(generationQueueName, { connection: bullMqConnection });
export const pdfQueueEvents = new QueueEvents(pdfQueueName, { connection: bullMqConnection });

export const initQueues = async () => {
  console.log('Queues initialized');
};
