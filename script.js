const express = require("express");
const app = express();
const connectToDB = require("./DB/db");
const userRouter = require("./route/user.route");
const postRouter = require("./route/post.route");
const authRouter = require("./auth/auth.route");
const isAuth = require("./middlewares/isAuth.middleware");
const cors = require("cors");
const { upload } = require('./config/clodinary.config');

// Add error logging for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Enhanced CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://express-front-two.vercel.app',
      'http://localhost:5173'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Add route-specific error handling
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.use("/auth", asyncHandler(authRouter));
app.use("/users", isAuth, asyncHandler(userRouter));
app.use("/posts", isAuth, asyncHandler(postRouter));

// Enhanced upload endpoint with error handling
app.post('/upload', asyncHandler(async (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ error: 'File upload failed' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({
      url: req.file.path,
      public_id: req.file.filename
    });
  });
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Initialize server with proper error handling
const startServer = async () => {
  try {
    console.log('Connecting to database...');
    await connectToDB();
    console.log('Database connected');
    
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error('Server startup failed:', err);
    process.exit(1);
  }
};

startServer();

module.exports = app;