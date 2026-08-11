const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

function setupMiddleware(app, options = {}) {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

  // Allow ALL origins in development, and specific ones in production
  const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

  // ============================================
  // 1. TRUST PROXY
  // ============================================
  if (!isDevelopment) {
    app.set('trust proxy', 1);
  }

  // ============================================
  // 2. CORS - FIXED for uploads
  // ============================================
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);
      
      // In development, allow ALL origins
      if (isDevelopment) {
        return callback(null, true);
      }
      
      // In production, check against whitelist
      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      
      console.warn(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    optionsSuccessStatus: 200
  }));

  // ============================================
  // 3. HELMET - Fixed CSP for uploads
  // ============================================
  app.use(helmet());

  // Custom CSP that allows images from all sources
  const cspDirectives = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
    imgSrc: ["'self'", "data:", "blob:", "https:", "http:", "*"], // Allow all image sources
    connectSrc: ["'self'", "blob:", "https:", "http:"],
    mediaSrc: ["'self'", "blob:", "https:", "http:"],
    objectSrc: ["'none'"],
    frameSrc: ["'self'", "https://www.youtube.com"],
    frameAncestors: ["'self'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
  };

  // Handle upgrade-insecure-requests based on environment
  if (!isDevelopment) {
    cspDirectives.upgradeInsecureRequests = [];
  } else {
    cspDirectives.upgradeInsecureRequests = null;
  }

  app.use(
    helmet.contentSecurityPolicy({
      useDefaults: false,
      directives: cspDirectives,
    })
  );

  // Extra security headers - Allow images
  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': "camera=(), microphone=(), geolocation=(), interest-cohort=()",
      // Allow cross-origin resource sharing for images
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Cross-Origin-Opener-Policy': 'unsafe-none',
    });
    next();
  });

  if (!isDevelopment) {
    app.use(
      helmet.hsts({
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      })
    );
  }

  // ============================================
  // 4. BODY PARSING
  // ============================================
  const MAX_PAYLOAD = process.env.MAX_FILE_SIZE || '10mb';
  app.use(express.json({ limit: MAX_PAYLOAD }));
  app.use(express.urlencoded({ 
    extended: true, 
    limit: MAX_PAYLOAD, 
    parameterLimit: 2000 
  }));

  // ============================================
  // 5. COMPRESSION
  // ============================================
  app.use(compression({ 
    level: 6,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));

  // ============================================
  // 6. LOGGING
  // ============================================
  if (isDevelopment) {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', { 
      skip: (req, res) => res.statusCode < 400 
    }));
  }

  // ============================================
  // 7. RATE LIMITING
  // ============================================
  const RATE_PUBLIC   = parseInt(process.env.RATE_LIMIT_PUBLIC   || (isDevelopment ? 10000 : 1500));
  const RATE_AUTH     = parseInt(process.env.RATE_LIMIT_AUTH     || (isDevelopment ?  100 :    5));
  const RATE_REGISTER = parseInt(process.env.RATE_LIMIT_REGISTER || (isDevelopment ?  100 :    3));
  const RATE_UPLOAD   = parseInt(process.env.RATE_LIMIT_UPLOAD   || (isDevelopment ? 1000 :  100));

  const createLimiter = (opts) => rateLimit({
    windowMs: opts.windowMs || 15 * 60 * 1000,
    limit: opts.limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { 
      success: false, 
      message: opts.message || 'Too many requests. Please slow down.' 
    },
    skip: opts.skip || (() => false),
  });

  const publicReadLimiter = createLimiter({
    limit: RATE_PUBLIC,
    message: 'Too many requests. Please slow down.',
    skip: (req) => {
      // Skip rate limiting for uploads and health check
      return req.path.startsWith('/uploads') || 
             req.path === '/api/health' || 
             req.path === '/api';
    },
  });

  const authLimiter = createLimiter({
    limit: RATE_AUTH,
    message: 'Too many login attempts. Please try again in 15 minutes.',
    windowMs: 15 * 60 * 1000,
  });

  const registerLimiter = createLimiter({
    limit: RATE_REGISTER,
    message: 'Too many registration attempts. Please try again later.',
    windowMs: 60 * 60 * 1000,
  });

  const adminWriteLimiter = createLimiter({
    limit: isDevelopment ? 1000 : 50,
    message: 'Too many admin operations. Please slow down.',
  });

  const uploadLimiter = createLimiter({
    limit: RATE_UPLOAD,
    message: 'Too many uploads. Please try again later.',
    windowMs: 60 * 60 * 1000,
  });

  // Apply rate limiters
  app.use('/api/news', publicReadLimiter);
  app.use('/api/categories', publicReadLimiter);
  app.use('/api/footer', publicReadLimiter);
  app.use('/api/team', publicReadLimiter);

  // Store limiters for specific route usage
  app.locals.authLimiter = authLimiter;
  app.locals.registerLimiter = registerLimiter;
  app.locals.adminWriteLimiter = adminWriteLimiter;
  app.locals.uploadLimiter = uploadLimiter;

  // ============================================
  // 8. STATIC UPLOADS - FIXED for better serving
  // ============================================
  const uploadPath = process.env.UPLOAD_PATH || path.join(process.cwd(), 'uploads');
  
  // Ensure uploads directory exists
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log('📁 Created uploads directory:', uploadPath);
  }

  // Debug middleware to log upload requests
  app.use('/uploads', (req, res, next) => {
    console.log(`🖼️ Upload request: ${req.method} ${req.url}`);
    const fullPath = path.join(uploadPath, req.url);
    console.log(`   Looking for: ${fullPath}`);
    console.log(`   File exists: ${fs.existsSync(fullPath)}`);
    next();
  });

  // Serve static files from uploads
  app.use('/uploads', express.static(uploadPath, {
    maxAge: isDevelopment ? 0 : '7d',
    etag: true,
    lastModified: true,
    index: false,
    fallthrough: true,
    setHeaders: (res, filePath) => {
      // Security headers
      res.set('X-Content-Type-Options', 'nosniff');
      res.set('Content-Disposition', 'inline');
      res.set('Access-Control-Allow-Origin', '*'); // Allow all origins for images
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      
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
        '.pdf': 'application/pdf',
        '.json': 'application/json',
        '.txt': 'text/plain',
        '.css': 'text/css',
        '.js': 'application/javascript'
      };
      
      if (mimeTypes[ext]) {
        res.set('Content-Type', mimeTypes[ext]);
      }
      
      // Cache control for production
      if (!isDevelopment) {
        res.set('Cache-Control', 'public, max-age=604800, immutable');
      }
      
      console.log(`📁 Serving: ${path.basename(filePath)} (${mimeTypes[ext] || 'unknown'})`);
    },
  }));

  // Optional: Serve specific subdirectories explicitly
  const subDirs = ['news', 'categories', 'team', 'ads', 'gallery'];
  subDirs.forEach(subDir => {
    const subDirPath = path.join(uploadPath, subDir);
    if (fs.existsSync(subDirPath)) {
      app.use(`/uploads/${subDir}`, express.static(subDirPath, {
        maxAge: isDevelopment ? 0 : '7d',
        etag: true,
        lastModified: true,
        setHeaders: (res) => {
          res.set('Access-Control-Allow-Origin', '*');
          res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        }
      }));
      console.log(`📁 Serving subdirectory: /uploads/${subDir}`);
    }
  });

  // ============================================
  // 9. ANTI-PARAMETER-POLLUTION
  // ============================================
  app.use((req, res, next) => {
    Object.keys(req.query).forEach((key) => {
      if (Array.isArray(req.query[key])) {
        req.query[key] = req.query[key][0];
      }
    });
    next();
  });

  // ============================================
  // 10. LOGGING
  // ============================================
  console.log('✅ Middleware configured successfully');
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Uploads path: ${uploadPath}`);
  console.log(`🔒 CORS: ${isDevelopment ? 'Open (development)' : 'Restricted (production)'}`);
  console.log(`📊 Rate Limits: Public: ${RATE_PUBLIC}/15min, Auth: ${RATE_AUTH}/15min`);
}

module.exports = { setupMiddleware };