"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load environment variables FIRST before any other imports
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const database_1 = require("./src/config/database");
const error_middleware_1 = require("./src/middleware/error.middleware");
// Routes
const admin_routes_1 = __importDefault(require("./src/routes/admin.routes"));
const bhandara_routes_1 = __importDefault(require("./src/routes/bhandara.routes"));
const donor_routes_1 = __importDefault(require("./src/routes/donor.routes"));
const donation_routes_1 = __importDefault(require("./src/routes/donation.routes"));
const stats_routes_1 = __importDefault(require("./src/routes/stats.routes"));
const upload_routes_1 = __importDefault(require("./src/routes/upload.routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Security middleware
app.use((0, helmet_1.default)());
// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use((0, cors_1.default)(corsOptions));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});
// API routes
app.use('/api/admin', admin_routes_1.default);
app.use('/api/bhandara', bhandara_routes_1.default);
app.use('/api/donor', donor_routes_1.default);
app.use('/api/donation', donation_routes_1.default);
app.use('/api/stats', stats_routes_1.default);
app.use('/api/upload', upload_routes_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});
// Error handling middleware (must be last)
app.use(error_middleware_1.errorHandler);
// Start server
async function startServer() {
    try {
        // Connect to database
        await (0, database_1.connectToDatabase)();
        // Start listening
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/health`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    process.exit(0);
});
startServer();
//# sourceMappingURL=index.js.map