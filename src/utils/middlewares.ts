import { ErrorRequestHandler } from 'express';
import dotenv from 'dotenv';

dotenv.config();

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500; // Ensure proper status code
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined, // Show stack only in development
  });
};
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export const successResponse = <T>(message: string, data?: T): ApiResponse<T> => {
  return {
    success: true,
    message,
    data
  };
};

export const errorResponse = (message: string, error?: string): ApiResponse<null> => {
  return {
    success: false,
    message,
    error
  };
};