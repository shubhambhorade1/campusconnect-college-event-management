const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const dataPath = path.join(__dirname, "data");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function readData(file) {
    const filePath = path.join(dataPath, file);

    try {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (error) {
        return [];
    }
}

function writeData(file, data) {
    const filePath = path.join(dataPath, file);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/* =========================
   HEALTH CHECK
========================= */

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "CampusConnect backend is running!"
    });
});

/* =========================
   EVENTS
========================= */

app.get("/api/events", (req, res) => {
    const events = readData("events.json");
    res.json(events);
});

app.get("/api/events/:id", (req, res) => {
    const events = readData("events.json");

    const event = events.find(
        e => e.id === Number(req.params.id)
    );

    if (!event) {
        return res.status(404).json({
            success: false,
            message: "Event not found"
        });
    }

    res.json(event);
});

app.post("/api/events", (req, res) => {
    const events = readData("events.json");

    const newEvent = {
        id: events.length
            ? Math.max(...events.map(e => e.id)) + 1
            : 1,

        title: req.body.title,
        category: req.body.category,
        description: req.body.description || "",
        date: req.body.date,
        time: req.body.time,
        venue: req.body.venue,
        capacity: Number(req.body.capacity),
        registered: 0
    };

    events.push(newEvent);
    writeData("events.json", events);

    res.status(201).json({
        success: true,
        event: newEvent
    });
});

app.put("/api/events/:id", (req, res) => {
    const events = readData("events.json");

    const index = events.findIndex(
        e => e.id === Number(req.params.id)
    );

    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: "Event not found"
        });
    }

    events[index] = {
        ...events[index],
        ...req.body,
        id: events[index].id
    };

    writeData("events.json", events);

    res.json({
        success: true,
        event: events[index]
    });
});

app.delete("/api/events/:id", (req, res) => {
    let events = readData("events.json");

    const eventId = Number(req.params.id);

    const exists = events.some(
        e => e.id === eventId
    );

    if (!exists) {
        return res.status(404).json({
            success: false,
            message: "Event not found"
        });
    }

    events = events.filter(
        e => e.id !== eventId
    );

    writeData("events.json", events);

    res.json({
        success: true,
        message: "Event deleted"
    });
});

/* =========================
   USERS
========================= */

app.get("/api/users", (req, res) => {
    const users = readData("users.json");

    const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
    });

    res.json(safeUsers);
});

/* =========================
   LOGIN
========================= */

app.post("/api/login", (req, res) => {
    const users = readData("users.json");

    const { email, password } = req.body;

    const user = users.find(
        u =>
            u.email.toLowerCase() === String(email).toLowerCase() &&
            u.password === password
    );

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Invalid email or password"
        });
    }

    const { password: ignored, ...safeUser } = user;

    res.json({
        success: true,
        user: safeUser
    });
});

/* =========================
   REGISTER
========================= */

app.post("/api/register", (req, res) => {
    const users = readData("users.json");

    const {
        name,
        email,
        password,
        department
    } = req.body;

    const existingUser = users.find(
        u =>
            u.email.toLowerCase() ===
            String(email).toLowerCase()
    );

    if (existingUser) {
        return res.status(409).json({
            success: false,
            message: "Email already registered"
        });
    }

    const newUser = {
        id: users.length
            ? Math.max(...users.map(u => u.id)) + 1
            : 1,

        name,
        email,
        password,
        department: department || "",
        role: "student"
    };

    users.push(newUser);
    writeData("users.json", users);

    const { password: ignored, ...safeUser } = newUser;

    res.status(201).json({
        success: true,
        user: safeUser
    });
});

/* =========================
   REGISTRATIONS
========================= */

app.get("/api/registrations", (req, res) => {
    const registrations = readData("registrations.json");

    res.json(registrations);
});

app.post("/api/registrations", (req, res) => {
    const registrations = readData("registrations.json");
    const events = readData("events.json");

    const {
        userId,
        eventId
    } = req.body;

    const event = events.find(
        e => e.id === Number(eventId)
    );

    if (!event) {
        return res.status(404).json({
            success: false,
            message: "Event not found"
        });
    }

    const alreadyRegistered = registrations.some(
        r =>
            r.userId === Number(userId) &&
            r.eventId === Number(eventId)
    );

    if (alreadyRegistered) {
        return res.status(409).json({
            success: false,
            message: "Already registered"
        });
    }

    if (event.registered >= event.capacity) {
        return res.status(400).json({
            success: false,
            message: "Event is full"
        });
    }

    const newRegistration = {
        id: registrations.length
            ? Math.max(...registrations.map(r => r.id)) + 1
            : 1,

        userId: Number(userId),
        eventId: Number(eventId),
        status: "registered",
        registeredAt: new Date().toISOString()
    };

    registrations.push(newRegistration);

    event.registered += 1;

    writeData("registrations.json", registrations);
    writeData("events.json", events);

    res.status(201).json({
        success: true,
        registration: newRegistration
    });
});

app.delete("/api/registrations/:id", (req, res) => {
    let registrations = readData("registrations.json");
    const events = readData("events.json");

    const registrationId = Number(req.params.id);

    const registration = registrations.find(
        r => r.id === registrationId
    );

    if (!registration) {
        return res.status(404).json({
            success: false,
            message: "Registration not found"
        });
    }

    registrations = registrations.filter(
        r => r.id !== registrationId
    );

    const event = events.find(
        e => e.id === registration.eventId
    );

    if (event && event.registered > 0) {
        event.registered -= 1;
    }

    writeData("registrations.json", registrations);
    writeData("events.json", events);

    res.json({
        success: true,
        message: "Registration cancelled"
    });
});

/* =========================
   FRONTEND
========================= */

app.use((req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
    console.log(
        `CampusConnect running on port ${PORT}`
    );
});
