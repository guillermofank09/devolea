import express from "express";
import cors from "cors";
import courtRoutes from "./routes/courts.routes";
import playerRoutes from "./routes/player.routes";
import bookingRoutes from "./routes/booking.routes";
import tournamentRoutes from "./routes/tournament.routes";
import clubProfileRoutes from "./routes/clubProfile.routes";
import appSettingsRoutes from "./routes/appSettings.routes";
import authRoutes from "./routes/auth.routes";
import statsRoutes from "./routes/stats.routes";
import profesorRoutes from "./routes/profesor.routes";
import publicRoutes from "./routes/public.routes";
import { AppDataSource } from "./data-source";

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
}));
app.use(express.json({ limit: "5mb" }));

// Lazy DB init — works both for serverless (Vercel) and long-running (local) processes.
app.use(async (_req, res, next) => {
  if (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize();
    } catch (err) {
      console.error("DB init error", err);
      res.status(500).json({ error: "Database connection failed" });
      return;
    }
  }
  next();
});

app.use("/api", courtRoutes);
app.use("/api", playerRoutes);
app.use("/api", bookingRoutes);
app.use("/api", tournamentRoutes);
app.use("/api", clubProfileRoutes);
app.use("/api", appSettingsRoutes);
app.use("/api", authRoutes);
app.use("/api", statsRoutes);
app.use("/api", profesorRoutes);
app.use("/api", publicRoutes);

// Local development only — Vercel sets VERCEL=1 automatically.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
}

export default app;

