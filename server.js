const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* Middleware */
app.use(cors());
app.use(express.json());

/* Serve frontend */
app.use(express.static(path.join(__dirname, "public")));

/* Health check */
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "CampusConnect backend is running!",
        timestamp: new Date().toISOString()
    });
});

/* API information */
app.get("/api", (req, res) => {
    res.json({
        name: "CampusConnect",
        version: "1.0.0",
        description: "College Event Management System",
        status: "running"
    });
});

/* Catch-all route for frontend */
app.get("*", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});

/* Start server */
app.listen(PORT, () => {
    console.log(
        `CampusConnect server running on port ${PORT}`
    );
});















