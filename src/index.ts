import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import authRouter from "./routes/auth"
import debugRouter from "./routes/debug"
import postRouter from "./routes/post"
import generateRouter from "./routes/ai"
import reviewRouter from "./routes/review"
import readfunRouter from "./routes/readfun"
import adminRouter from "./routes/admin"
import notificationRouter from "./routes/notification"
import { authenticate } from "./middleware/auth"
import { requireRole } from "./middleware/role"
import { Role } from "./models/user.model"
dotenv.config()

const PORT = process.env.PORT || "5000"
const MONGO_URI = process.env.MONGO_URI as string | undefined

if (!MONGO_URI) {
  console.error("Missing MONGO_URI in environment. Create a .env with MONGO_URI=<your-mongo-uri> and try again.")
  process.exit(1)
}

const app = express()

// MongoDB connection with caching for serverless
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }
  
  try {
    await mongoose.connect(MONGO_URI);
    isConnected = true;
    console.log("DB connected");
  } catch (err) {
    console.error("DB connection failed:", err);
    throw err;
  }
};

app.use(express.json())
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174", 
      process.env.FRONTEND_URL || "https://frontend-sparktales-story-sharing-p-psi.vercel.app"
    ].filter(Boolean),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  })
)

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ message: "Database connection failed" });
  }
});

app.use("/api/v1/auth", authRouter)
app.use("/api/v1/debug", debugRouter)
app.use("/api/v1/post", postRouter)
app.use("/api/v1/ai", generateRouter)
app.use("/api/v1/review", reviewRouter)
app.use("/api/v1/readfun", readfunRouter)
app.use("/api/v1/admin", adminRouter)
app.use("/api/v1/notifications", notificationRouter)

//sample route without auth
app.get("/",(req,res) => {
  res.send("BE running")
})

// sample route with auth
// public
app.get("/test-1", (req, res) => {})

// protected
app.get("/test-2", authenticate, (req, res) => {})

// admin only
app.get("/test-3", authenticate, requireRole([Role.ADMIN]), (req, res) => {})

// For local development
if (process.env.NODE_ENV !== 'production') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  }).catch(err => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}

// Export for Vercel serverless
export default app;
// --------------------------------------
// // Built in middlewares (Global)
// app.use(express.json())

// // Thrid party middlewares (Global)
// app.use(
//   cors({
//     origin: ["http://localhost:3000"],
//     methods: ["GET", "POST", "PUT", "DELETE"] // optional
//   })
// )

// // Global middleware
// app.use((req, res, next) => {
//   console.log("Hello")
//   if (true) {
//     next() // go forword
//   } else {
//     res.sendStatus(400) // stop
//   }
// })

// app.get("/hello", testMiddleware, (req, res) => {
//   //
//   res.send("")
// })

// app.get("/", testMiddleware, (req, res) => {
//   console.log("I'm router")
//   res.status(200).send("Ok")
// })

// app.get("/private", testMiddleware, (req, res) => {
//   console.log("I'm router")
//   res.status(200).send("Ok")
// })

// app.get("/test", (req, res) => {
//   res.status(200).send("Test Ok")
// })

// app.listen(5000, () => {
//   console.log("Server is running")
// })

// path params
// http://localhost:5000/1234
// http://localhost:5000/4321
// http://localhost:5000/hello
// app.get("/:id", (req, res) => {
//   const params = req.params
//   console.log(params)
//   console.log(params?.id)

//   res.status(200).send("Ok")
// })

// query params ?id=1234
// http://localhost:5000/?id=1234
// http://localhost:5000/?id=4321
// app.get("/", (req, res) => {
//   const params = req.query
//   console.log(params)
//   console.log(params?.id)

//   res.status(200).send("Ok")
// })
