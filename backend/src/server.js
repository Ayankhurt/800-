import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables FIRST
dotenv.config();

// Import utilities (after dotenv.config)
import { validateEnv } from "./utils/validateEnv.js";
import logger, { requestLogger, errorLogger } from "./utils/logger.js";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "fs";

// Validate environment variables at startup
validateEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const swaggerDocument = require("./swagger.json");

const app = express();

// Security & Rate Limiting Middleware
import {
  checkBlockedIp,
  ddosDetector,
  globalRateLimiter,
  createRateLimiter,
} from "./middlewares/rateLimit.js";

app.use(checkBlockedIp);
app.use(ddosDetector);
app.use(globalRateLimiter);

// CORS Configuration (Production-ready)
const corsOptions = {
  origin: function (origin, callback) {
    // In development, always allow localhost origins
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // In development, allow all localhost origins (most permissive)
    if (isDevelopment) {
      if (origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.includes('localhost')) {
        return callback(null, true);
      }
      // In development, allow all origins for easier testing
      return callback(null, true);
    }

    // If CORS_ORIGIN is set, use it
    if (process.env.CORS_ORIGIN) {
      const allowedOrigins = process.env.CORS_ORIGIN.split(',').map(o => o.trim());
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
    }

    // In production without CORS_ORIGIN configured, deny all
    if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGIN) {
      return callback(new Error('Not allowed by CORS'));
    }

    // Deny by default in production
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Cache-Control',
    'cache-control',
    'Pragma',
    'pragma',
    'Expires',
    'expires',
    'X-CSRF-Token',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Request parsing with size limits
// Capture raw body for Stripe webhooks
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    if (req.originalUrl.includes('/webhook')) {
      req.rawBody = buf.toString();
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Request logging
app.use(requestLogger);

// Serve static files from backend directory
app.use(express.static(path.join(__dirname, "..")));

// Serve reset-password.html at /reset-password route
app.get("/reset-password", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "reset-password.html"));
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    },
  });
});


// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "BidRoom API Documentation",
  customJs: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.min.js'
  ],
  customCssUrl: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css'
  ]
}));
logger.info('Swagger documentation available at /api-docs');


// Import Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import bidRoutes from "./routes/bidRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import communicationRoutes from "./routes/communicationRoutes.js"; // New
import notificationRoutes from "./routes/notificationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import contractorRoutes from "./routes/contractorRoutes.js";
import disputeRoutes from "./routes/disputeRoutes.js";
import financeRoutes from "./routes/financeRoutes.js"; // New
import verificationRoutes from "./routes/verificationRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import savedRoutes from "./routes/savedRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import endorsementRoutes from "./routes/endorsementRoutes.js";
import inviteRoutes from "./routes/inviteRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import referralRoutes from "./routes/referralRoutes.js";
import videoConsultationRoutes from "./routes/videoConsultationRoutes.js";
import templateRoutes from "./routes/templateRoutes.js";
import quoteRoutes from "./routes/quoteRoutes.js";
import badgeRoutes from "./routes/badgeRoutes.js";
import extendedAdminRoutes from "./routes/extendedAdminRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import moderationRoutes from "./routes/moderationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js"; // Added
import transactionRoutes from "./routes/transactionRoutes.js"; // Added

// API Versioning - Register routes under /api/v1
const v1Router = express.Router();

// Register Routes with versioning
v1Router.use("/auth", authRoutes);
v1Router.use("/users", userRoutes);
v1Router.use("/jobs", jobRoutes);
v1Router.use("/bids", bidRoutes);
v1Router.use("/projects", projectRoutes);
v1Router.use("/reviews", reviewRoutes);
v1Router.use("/communication", communicationRoutes); // New
v1Router.use("/notifications", notificationRoutes);
v1Router.use("/admin", adminRoutes);
v1Router.use("/admin", extendedAdminRoutes);
v1Router.use("/appointments", appointmentRoutes);
v1Router.use("/stats", statsRoutes);
v1Router.use("/contractors", contractorRoutes);
v1Router.use("/disputes", disputeRoutes);
v1Router.use("/finance", financeRoutes); // New
v1Router.use("/verification", verificationRoutes);
v1Router.use("/applications", applicationRoutes);
v1Router.use("/saved", savedRoutes);
v1Router.use("/settings", settingsRoutes);
v1Router.use("/endorsements", endorsementRoutes);
v1Router.use("/invites", inviteRoutes);
v1Router.use("/reports", reportRoutes);
v1Router.use("/analytics", analyticsRoutes);
v1Router.use("/referrals", referralRoutes);
v1Router.use("/video-consultations", videoConsultationRoutes);
v1Router.use("/templates", templateRoutes);
v1Router.use("/quotes", quoteRoutes);
v1Router.use("/badges", badgeRoutes);
v1Router.use("/upload", uploadRoutes);
v1Router.use("/ai", aiRoutes);
v1Router.use("/payments", paymentRoutes);
v1Router.use("/messages", messageRoutes); // Added
v1Router.use("/transactions", transactionRoutes); // Added
v1Router.use("/admin/moderation", moderationRoutes);

// Mount versioned routes
app.use("/api/v1", v1Router);

// Backward compatibility - also mount at /api (deprecated)
app.use("/api", v1Router);

// Error handling middleware
app.use(errorLogger);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    data: {
      path: req.path,
      method: req.method,
    },
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    data: process.env.NODE_ENV === 'production' ? null : { stack: err.stack },
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`🚀 Backend server running on port ${PORT}`);
  logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  logger.info(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});


// Restart trigger
