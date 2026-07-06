const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Load environment variables
dotenv.config();

const supabaseClient = require('./supabase/client');

const app = express();
app.locals.dbConnected = false;
app.locals.supabaseConnected = Boolean(
    supabaseClient
    && supabaseClient.from
    && supabaseClient.supabaseUrl
    && (supabaseClient.supabaseServiceRoleKey || supabaseClient.supabaseAnonKey)
    && !String(supabaseClient.supabaseServiceRoleKey || supabaseClient.supabaseAnonKey).includes('replace_with')
);

// ===== MIDDLEWARE =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS Configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// ===== DATABASE CONNECTION =====
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agrodrop';
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        app.locals.dbConnected = true;
        console.log('✓ MongoDB connected successfully');
    } catch (error) {
        app.locals.dbConnected = false;
        console.error('✗ MongoDB connection failed:', error.message);
        console.warn('⚠ Continuing without MongoDB. API routes that need the database may fail until MongoDB is available.');
    }
};

connectDB();

// ===== ROUTES =====
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/medicines', require('./routes/medicines.routes'));
app.use('/api/suppliers', require('./routes/suppliers.routes'));
app.use('/api/purchases', require('./routes/purchases.routes'));
app.use('/api/sales', require('./routes/sales.routes'));
app.use('/api/alerts', require('./routes/alerts.routes'));
app.use('/api/reports', require('./routes/reports.routes'));

// ===== STATIC FRONTEND =====
const frontendRoot = path.join(__dirname, '..');
app.use(express.static(frontendRoot));

app.get('/', (req, res) => {
    const indexPath = path.join(frontendRoot, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Frontend entry point not found');
    }
});

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'AgroMaster API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        supabaseConfigured: app.locals.supabaseConnected,
        mongodbConfigured: app.locals.dbConnected
    });
});

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ===== 404 HANDLER =====
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found',
        path: req.path
    });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const getLocalIp = () => {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
};

const server = app.listen(PORT, HOST, () => {
    const localIp = getLocalIp();
    console.log(`
╔════════════════════════════════════════╗
║    AgroMaster API Server Started      ║
║    Environment: ${process.env.NODE_ENV || 'development'.padEnd(18)}║
║    Port: ${PORT.toString().padEnd(27)}║
║    URL: http://localhost:${PORT}     ║
║    LAN: http://${localIp}:${PORT}     ║
╚════════════════════════════════════════╝
  `);
});

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGINT', () => {
    console.log('\n✓ Shutting down gracefully...');
    server.close(() => {
        mongoose.connection.close(false, () => {
            console.log('✓ MongoDB connection closed');
            process.exit(0);
        });
    });
});

module.exports = app;
