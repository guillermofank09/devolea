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
import { AppDataSource } from "./data-source";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.use("/api", courtRoutes);
app.use("/api", playerRoutes);
app.use("/api", bookingRoutes);
app.use("/api", tournamentRoutes);
app.use("/api", clubProfileRoutes);
app.use("/api", appSettingsRoutes);
app.use("/api", authRoutes);
app.use("/api", statsRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log("Server is running on port", PORT));
AppDataSource.initialize().then(() => {
    console.log("Data Source has been initialized!");
}).catch((err) => {
    console.error("Error during Data Source initialization", err);
});

