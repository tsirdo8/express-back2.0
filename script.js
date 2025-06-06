const express = require("express")
const app = express();
const connectToDB = require("./DB/db")
const userRouter = require("./route/user.route")
const postRouter = require("./route/post.route")
const authRouter = require("./auth/auth.route")
const isAuth = require("./middlewares/isAuth.middleware")
const multer = require('multer')
const cors = require("cors")

const {upload} = require('./config/clodinary.config')




app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true // If using cookies/auth headers
}));


const allowedOrigins = [
  'http://localhost:5173',
  'https://your-production-frontend.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json())
app.use("/users",isAuth, userRouter)
app.use("/posts", isAuth, postRouter)
app.use("/auth", authRouter)


connectToDB()
app.post('/upload', upload.single('image'), (req, res) => {
    res.send(req.file)
})

app.get("/", (req, res)=>{
    res.send("hello world")
})

app.listen(3000, ()=>{
    console.log("Server is running on http://localhost:3000")
})

