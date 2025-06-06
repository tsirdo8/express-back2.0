const express = require("express");
const app = express();
const connectToDB = require("./DB/db");
const userRouter = require("./route/user.route");
const postRouter = require("./route/post.route");
const authRouter = require("./auth/auth.route");
const isAuth = require("./middlewares/isAuth.middleware");
const multer = require('multer');
const cors = require("cors");
const { upload } = require('./config/clodinary.config');

// Enhanced CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://express-front-two.vercel.app',
      'http://localhost:5173'
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Explicitly handle OPTIONS requests
app.options('*', cors(corsOptions));

app.use(express.json());
app.use("/users", isAuth, userRouter);
app.use("/posts", isAuth, postRouter);
app.use("/auth", authRouter);

connectToDB();

app.post('/upload', upload.single('image'), (req, res) => {
    res.send(req.file);
});

app.get("/", (req, res) => {
    res.send("hello world");
});

module.exports = app; // Important for Vercel