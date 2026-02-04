const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
// const xss = require('xss-clean'); // Temporarily disabled
const connect = require('./Config/db');
const { errorHandler } = require('./Middleware/errorHandler');


require('dotenv').config();
const PORT = process.env.PORT || 5000;

// Security Headers - Helmet (must be first)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        }
    },
    crossOriginEmbedderPolicy: false
}));

// CORS Configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Rate Limiting
// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Login rate limiter
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per windowMs
    message: {
        success: false,
        message: 'Too many login attempts, please try again after 15 minutes.'
    },
    skipSuccessfulRequests: true,
});

// Registration rate limiter
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: {
        success: false,
        message: 'Too many registration attempts, please try again after an hour.'
    },
});

// Apply general rate limiter to all API routes
app.use('/api/', apiLimiter);

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie Parser
app.use(cookieParser());

// Data Sanitization against NoSQL Injection
// app.use(mongoSanitize()); // Temporarily disabled for Express 5 compatibility

// Data Sanitization against XSS
// app.use(xss()); // Temporarily disabled due to package issues


// Database connection
connect();

// Routes
const authRoutes = require("./Routes/authRoute");
const journalRoutes = require('./Routes/journalRoute');
const categoryRoutes = require('./Routes/categoryRoute');
const promptRoutes = require('./Routes/promptRoute');

// Apply specific rate limiters to auth routes
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/register", registerLimiter);

app.use("/api", authRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/prompt", promptRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Handle 404 - Route Not Found
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Global Error Handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
