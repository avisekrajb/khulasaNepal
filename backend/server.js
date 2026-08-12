require('dotenv').config();
const express = require('express');
const db = require('./src/config/db');
const app = express();
const path = require('path');
const fs = require('fs');

// ============================================
// IMPORT MODELS
// ============================================
const News = require('./src/models/News');
const Category = require('./src/models/Category');
const Footer = require('./src/models/Footer');
const Ad = require('./src/models/Ads');
const Team = require('./src/models/Team');
const Comment = require('./src/models/Comment');
const AdminLog = require('./src/models/AdminLog');
const VisitLog = require('./src/models/VisitLog');

// ============================================
// IMPORT ROUTES
// ============================================
const adsRoutes = require('./src/routes/adsRoutes');
const newsRoutes = require('./src/routes/newsRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const footerRoutes = require('./src/routes/footerRoutes');
const teamRoutes = require('./src/routes/teamRoutes');
const datetimeRoutes = require('./src/routes/datetimeRoutes');
const weatherRoutes = require('./src/routes/weatherRoutes');
const commentRoutes = require('./src/routes/commentRoutes');
const adminLogRoutes = require('./src/routes/adminLogRoutes');
const visitRoutes = require('./src/routes/visitRoutes');

// ============================================
// IMPORT UTILITIES
// ============================================
const { initializeDatabase } = require('./src/utils/dbInitializer');
const { errorHandler } = require('./src/utils/errorHandler');
const { successResponse } = require('./src/utils/responseHandler');

// ============================================
// CONFIGURATION
// ============================================
const isDevelopment = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://khulasanepal.onrender.com';
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

// ============================================
// SYNC DATABASE MODELS
// ============================================
Ad.sync({ alter: isDevelopment }).then(() => {
  console.log('✅ Ad model synced with database');
}).catch(err => {
  console.error('❌ Error syncing Ad model:', err);
});

Team.sync({ alter: isDevelopment }).then(() => {
  console.log('✅ Team model synced with database');
}).catch(err => {
  console.error('❌ Error syncing Team model:', err);
});

Comment.sync({ alter: isDevelopment }).then(() => {
  console.log('✅ Comment model synced with database');
}).catch(err => {
  console.error('❌ Error syncing Comment model:', err);
});

AdminLog.sync({ alter: isDevelopment }).then(() => {
  console.log('✅ AdminLog model synced with database');
}).catch(err => {
  console.error('❌ Error syncing AdminLog model:', err);
});

VisitLog.sync({ alter: isDevelopment }).then(() => {
  console.log('✅ VisitLog model synced with database');
}).catch(err => {
  console.error('❌ Error syncing VisitLog model:', err);
});

// ============================================
// MODEL ASSOCIATIONS
// ============================================
const models = { News, Category, Footer, Ad, Team, Comment, AdminLog, VisitLog };
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// ============================================
// CORS MIDDLEWARE - MUST BE FIRST
// ============================================
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow all origins in development
  if (isDevelopment) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } 
  // In production, allow specific origins
  else {
    const allowedOrigins = [
      'https://khulasanepal.onrender.com',
      'https://khulasanepalbackend.onrender.com',
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else {
      // For uploads, allow all origins
      if (req.path.startsWith('/uploads')) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
      } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
    }
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// ============================================
// REQUEST LOGGING MIDDLEWARE
// ============================================
app.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log(`   Body:`, req.body);
  }
  next();
});

// ============================================
// STATIC FILES - UPLOADS (FIXED FOR PRODUCTION)
// ============================================
const uploadsDir = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Create subdirectories if they don't exist
const subDirs = ['news', 'categories', 'team', 'ads', 'gallery', 'comments', 'comments/voice', 'comments/video'];
subDirs.forEach(dir => {
  const dirPath = path.join(uploadsDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created uploads/${dir} directory`);
  }
});

// ============================================
// SERVE STATIC FILES WITH PROPER HEADERS
// ============================================
// Function to serve static files with proper headers
const serveStaticWithHeaders = (dirPath, routePath) => {
  app.use(routePath, (req, res, next) => {
    // Set CORS headers for static files
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    
    // Log file access in development
    if (isDevelopment) {
      console.log(`🖼️ Accessing: ${req.url}`);
      const fullPath = path.join(dirPath, req.url);
      console.log(`   Looking for: ${fullPath}`);
      console.log(`   File exists: ${fs.existsSync(fullPath)}`);
    }
    
    next();
  }, express.static(dirPath, {
    maxAge: isDevelopment ? 0 : '7d',
    etag: true,
    lastModified: true,
    index: false,
    fallthrough: true,
    setHeaders: (res, filePath) => {
      // Set security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      
      // Set correct MIME types
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.bmp': 'image/bmp',
        '.tiff': 'image/tiff',
        '.ico': 'image/x-icon',
        '.mp4': 'video/mp4',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.webm': 'video/webm',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.json': 'application/json',
        '.txt': 'text/plain',
        '.css': 'text/css',
        '.js': 'application/javascript'
      };
      
      if (mimeTypes[ext]) {
        res.setHeader('Content-Type', mimeTypes[ext]);
      }
      
      // Cache control for production
      if (!isDevelopment) {
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      }
    }
  }));
};

// Serve the main uploads directory
serveStaticWithHeaders(uploadsDir, '/uploads');

// Also serve each subdirectory explicitly
subDirs.forEach(subDir => {
  const subDirPath = path.join(uploadsDir, subDir);
  if (fs.existsSync(subDirPath)) {
    serveStaticWithHeaders(subDirPath, `/uploads/${subDir}`);
    console.log(`📁 Serving subdirectory: /uploads/${subDir}`);
  }
});

// ============================================
// MIDDLEWARE SETUP
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// API ROUTES
// ============================================
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/footer', footerRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/datetime', datetimeRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin-logs', adminLogRoutes);
app.use('/api/visits', visitRoutes);

// Backward compatibility redirects for OLD API routes
const legacyRoutes = ['society', 'local', 'sports', 'more'];
legacyRoutes.forEach(route => {
  app.use(`/api/${route}`, (req, res) => {
    res.redirect(307, `/api/news/category/${route}${req.url}`);
  });
});

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
app.get('/api/health', async (req, res) => {
  try {
    await db.authenticate();
    successResponse(res, 'Server is healthy', {
      status: 'healthy',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime(),
      uploads: {
        directory: uploadsDir,
        exists: fs.existsSync(uploadsDir),
        subdirectories: subDirs.filter(dir => 
          fs.existsSync(path.join(uploadsDir, dir))
        )
      },
      cors: {
        frontend: FRONTEND_URL,
        backend: BACKEND_URL
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      message: 'Database connection failed',
      error: isDevelopment ? error.message : undefined
    });
  }
});

// ============================================
// ROOT API ENDPOINT
// ============================================
app.get('/api', (req, res) => {
  successResponse(res, 'Welcome to the News API', {
    version: '2.0',
    environment: process.env.NODE_ENV || 'development',
    backend_url: BACKEND_URL,
    frontend_url: FRONTEND_URL,
    features: [
      'Dynamic category system',
      'Protected core categories',
      'Unified news management',
      'Category CRUD operations',
      'File upload support',
      'Security with Helmet',
      'Rate limiting protection',
      'Response compression',
      'Image optimization',
      'Comment system with text, voice, and video support'
    ],
    endpoints: {
      health: '/api/health',
      categories: '/api/categories',
      news: '/api/news',
      admin: '/api/admin',
      footer: '/api/footer',
      team: '/api/team',
      ads: '/api/ads',
      datetime: '/api/datetime',
      weather: '/api/weather',
      comments: '/api/comments',
      uploads: '/uploads/:subfolder/:filename'
    }
  });
});

// ============================================
// SERVE STATIC FILES FROM REACT BUILD
// ============================================
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir, {
    maxAge: isDevelopment ? 0 : '7d',
    etag: true,
    lastModified: true
  }));
  console.log('📁 Serving static files from public directory');
} else {
  console.warn('⚠️  Public directory not found. Create it by building React app.');
}

// ============================================
// CATCH-ALL HANDLER FOR REACT ROUTER
// ============================================
app.use((req, res, next) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>News API</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
              h1 { color: #333; }
              .info { background: #f0f0f0; padding: 20px; border-radius: 5px; }
              .endpoint { background: #e8f4f8; padding: 10px; margin: 5px 0; border-radius: 3px; }
            </style>
          </head>
          <body>
            <h1>🚀 News API Server</h1>
            <div class="info">
              <p><strong>Status:</strong> Running</p>
              <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
              <p><strong>API Endpoint:</strong> <a href="/api">/api</a></p>
              <p><strong>Health Check:</strong> <a href="/api/health">/api/health</a></p>
              <p><strong>Uploads:</strong> <a href="/uploads">/uploads</a></p>
              <p><strong>Frontend:</strong> ${FRONTEND_URL}</p>
              <p><strong>Backend:</strong> ${BACKEND_URL}</p>
            </div>
            <h2>📁 Uploads Directory:</h2>
            <div class="info">
              ${subDirs.map(dir => {
                const exists = fs.existsSync(path.join(uploadsDir, dir));
                const files = exists ? fs.readdirSync(path.join(uploadsDir, dir)).filter(f => !f.startsWith('.')).length : 0;
                return `<p><strong>/${dir}:</strong> ${exists ? `✅ ${files} files` : '❌ Not found'}</p>`;
              }).join('')}
            </div>
          </body>
        </html>
      `);
    }
  } else {
    next();
  }
});

// ============================================
// 404 HANDLER FOR API ROUTES
// ============================================
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.error(`❌ 404 - API route not found: ${req.method} ${req.path}`);
    return res.status(404).json({
      success: false,
      message: 'API route not found',
      path: req.originalUrl,
      method: req.method,
      available_endpoints: '/api'
    });
  }
  next();
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================
async function startServer() {
  try {
    await initializeDatabase(db, { isDevelopment });
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('\n' + '='.repeat(70));
      console.log('🚀 SERVER STARTED SUCCESSFULLY');
      console.log('='.repeat(70));
      console.log(`\n📊 Configuration:`);
      console.log(`   Environment:     ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Port:            ${PORT}`);
      console.log(`   Backend URL:     ${BACKEND_URL}`);
      console.log(`   Frontend URL:    ${FRONTEND_URL}`);
      console.log(`   Uploads Path:    ${uploadsDir}`);
      console.log(`\n🔒 Security:`);
      console.log(`   CORS:            ✅ Fixed for production`);
      console.log(`\n📁 Static Files:`);
      console.log(`   Uploads:         ${BACKEND_URL}/uploads`);
      console.log(`   Public:          ${BACKEND_URL}/`);
      console.log(`\n📰 API Endpoints:`);
      console.log(`   Health Check:    GET  ${BACKEND_URL}/api/health`);
      console.log(`   API Info:        GET  ${BACKEND_URL}/api`);
      console.log(`   Categories:      GET  ${BACKEND_URL}/api/categories`);
      console.log(`   News:            GET  ${BACKEND_URL}/api/news`);
      console.log(`   Homepage:        GET  ${BACKEND_URL}/api/news/homepage`);
      console.log(`   Admin Login:     POST ${BACKEND_URL}/api/admin/login`);
      console.log(`   Footer:          GET  ${BACKEND_URL}/api/footer`);
      console.log(`   Team:            GET  ${BACKEND_URL}/api/team`);
      console.log(`   Ads:             GET  ${BACKEND_URL}/api/ads`);
      console.log(`   Weather:         GET  ${BACKEND_URL}/api/weather`);
      console.log(`   Datetime:        GET  ${BACKEND_URL}/api/datetime`);
      console.log(`   Comments:        GET  ${BACKEND_URL}/api/comments/news/:newsId`);
      console.log(`   Comments:        POST ${BACKEND_URL}/api/comments`);
      console.log(`   Comments:        POST ${BACKEND_URL}/api/comments/:commentId/like`);
      console.log(`\n📂 Upload Directories:`);
      subDirs.forEach(dir => {
        const dirPath = path.join(uploadsDir, dir);
        const exists = fs.existsSync(dirPath);
        const files = exists ? fs.readdirSync(dirPath).filter(f => !f.startsWith('.')).length : 0;
        console.log(`   ${dir}: ${exists ? '✅' : '❌'} ${dirPath} ${exists ? `(${files} files)` : ''}`);
      });
      console.log('\n' + '='.repeat(70));
      console.log('✨ Ready to accept requests!\n');
    });

    // ============================================
    // GRACEFUL SHUTDOWN
    // ============================================
    const gracefulShutdown = async (signal) => {
      console.log(`\n👋 ${signal} received, shutting down gracefully...`);
      
      server.close(async () => {
        console.log('✅ HTTP server closed');
        
        try {
          await db.close();
          console.log('✅ Database connection closed');
          console.log('👋 Goodbye!\n');
          process.exit(0);
        } catch (err) {
          console.error('❌ Error during shutdown:', err);
          process.exit(1);
        }
      });

      setTimeout(() => {
        console.error('⚠️  Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    process.on('uncaughtException', (err) => {
      console.error('💥 Uncaught Exception:', err);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (err) {
    console.error('💥 Failed to start server:', err);
    process.exit(1);
  }
}

// ============================================
// START THE SERVER
// ============================================
startServer();

// ============================================
// EXPORT FOR TESTING
// ============================================
module.exports = app;
