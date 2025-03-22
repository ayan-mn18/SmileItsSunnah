import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import quranRoutes from './src/routes/quranRoutes';
import { errorHandler } from './src/utils/middlewares';
import { Request, Response, NextFunction } from 'express';
import router from './src/routes';
import { getRegisteredRoutes } from './src/utils/registeredRoutes';

// Load environment variables
dotenv.config();

// Create Express application
const app = express();
const PORT = process.env.PORT || 313;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: '*', // Allow all origins
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
}));

// Routes
app.use('/api', router);


// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use(errorHandler as ErrorRequestHandler);

// Then replace your hardcoded logs with:
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('-----------------------------------');
  console.log('Available endpoints:');
  
  const routes = getRegisteredRoutes(app);
  routes.forEach(route => {
    console.log(route);
  });
  
  console.log('-----------------------------------');
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});