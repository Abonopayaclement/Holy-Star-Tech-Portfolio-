import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import organizationRoutes from './routes/organizationRoutes';
import queueRoutes from './routes/queueRoutes';
import paymentRoutes from './routes/paymentRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import notificationRoutes from './routes/notificationRoutes';
import ratingRoutes from './routes/ratingRoutes';
import skillRoutes from './routes/skillRoutes';
import callbackRoutes from './routes/callbackRoutes';
import messageRoutes from './routes/messageRoutes';
import kioskRoutes from './routes/kioskRoutes';
import counterRoutes from './routes/counterRoutes';
import lobbyRoutes from './routes/lobbyRoutes';
import analyticsRoutes from './routes/analyticsRoutes';

dotenv.config();
// Live reload triggered

const app: Application = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust for production
    methods: ['GET', 'POST'],
  },
});

const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api', skillRoutes);
app.use('/api/callbacks', callbackRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/kiosks', kioskRoutes);
app.use('/api/counters', counterRoutes);
app.use('/api/lobby', lobbyRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get(['/health', '/api/health'], (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'QueueLess API is running' });
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_queue_room', (queueId: string) => {
    socket.join(`queue_${queueId}`);
    console.log(`User ${socket.id} joined room queue_${queueId}`);
  });

  socket.on('join_user_room', (userId: string) => {
    socket.join(`user_${userId}`);
    console.log(`User ${socket.id} joined room user_${userId}`);
  });

  socket.on('join_branch_room', (branchId: string) => {
    socket.join(`branch_${branchId}`);
    console.log(`User ${socket.id} joined room branch_${branchId}`);
  });

  socket.on('join_lobby_room', (branchId: string) => {
    socket.join(`lobby_${branchId}`);
    socket.join(`branch_${branchId}`);
    console.log(`User ${socket.id} joined lobby room for branch ${branchId}`);
  });

  socket.on('join_conversation', (conversationId: string) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`User ${socket.id} joined room conversation_${conversationId}`);
  });

  socket.on('leave_conversation', (conversationId: string) => {
    socket.leave(`conversation_${conversationId}`);
    console.log(`User ${socket.id} left room conversation_${conversationId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

import { ensureDbSynced } from './utils/dbSync';

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await ensureDbSynced();
  });
}

export { app, io };
