/* =========================================
   CAMPUSCONNECT
   College Event Management System
   Frontend JavaScript
========================================= */

"use strict";

/* =========================================
   DEMO DATA
   Backend connect hone ke baad API se replace
========================================= */

const events = [
    {
        id: 1,
        title: "CodeFest 2026",
        category: "Technical",
        description: "A coding competition for students to test their programming skills.",
        date: "2026-08-25",
        time: "10:00",
        venue: "Computer Lab",
        capacity: 100,
        registered: 42,
        image: ""
    },
    {
        id: 2,
        title: "Annual Cultural Fest",
        category: "Cultural",
        description: "Music, dance, drama and exciting cultural performances.",
        date: "2026-08-30",
        time: "16:00",
        venue: "Main Auditorium",
        capacity: 500,
        registered: 320,
        image: ""
    },
    {
        id: 3,
        title: "Web Development Workshop",
        category: "Workshop",
        description: "Learn modern web development with HTML, CSS and JavaScript.",
        date: "2026-09-05",
        time: "11:00",
        venue: "Seminar Hall",
        capacity: 80,
        registered: 55,
        image: ""
    },
    {
        id: 4,
        title: "Inter College Cricket",
        category: "Sports",
        description: "An exciting cricket tournament between college teams.",
        date: "2026-09-10",
        time: "09:00",
        venue: "College Ground",
        capacity: 200,
        registered: 150,
        image: ""
    },
    {
        id: 5,
        title: "AI & Future Technology",
        category: "Technical",
        description: "Explore artificial intelligence and emerging technologies.",
        date: "2026-09-15",
        time: "12:00",
        venue: "Innovation Lab",
        capacity: 120,
        registered: 78,
        image: ""
    },
    {
        id: 6,
        title: "Photography Contest",
        category: "Other",
        description: "Show your creativity through photography and visual storytelling.",
        date: "2026-09-20",
        time: "14:00",
        venue: "Art Gallery",
        capacity: 60,
        registered: 31,
        image: ""
    }
];

/* =========================================
   DEMO USERS
========================================= */

let users = JSON.parse(
    localStorage.getItem("campusconnect_users") || "[]"
);

let currentUser = JSON.parse(
    localStorage.getItem("campusconnect_current_user") || "null"
);

let registrations = JSON.parse(
    localStorage.getItem("campusconnect_registrations") || "[]"
);

/* =========================================
   DOM HELPERS
========================================= */

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => document.querySelectorAll(selector);

/* =========================================
   INITIALIZATION
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeNavigation();

    initializeAuth();

    initializeModals();

    initializeEventSearch();

    initializeAdminTabs();

    initializeForms();

    renderFeaturedEvents();

    renderAllEvents();

    renderMyEvents();

    renderAdminDashboard();

    updateUIForUser();

});

/* =========================================
   NAVIGATION
========================================= */

function initializeNavigation() {

    $$("[data-page]").forEach((button) => {

        button.addEventListener("click", () => {

            const page = button.dataset.page;

            showPage(page);

        });

    });

}

function showPage(page) {

    $$(".page").forEach((section) => {
        section.classList.remove("active-page");
    });

    const target = $(`#${page}Page`);

    if (!target) {
        return;
    }

    target.classList.add("active-page");

    $$(".nav-link").forEach((link) => {
        link.classList.remove("active");
    });

    const activeNav = $(`.nav-link[data-page="${page}"]`);

    if (activeNav) {
        activeNav.classList.add("active");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (page === "events") {
        renderAllEvents();
    }

    if (page === "my-events") {
        renderMyEvents();
    }

    if (page === "admin") {
        renderAdminDashboard();
    }

}

/* =========================================
   AUTH UI
========================================= */

function initializeAuth() {

    const loginButtons = [
        $("#loginNavBtn"),
        $("#footerLogin")
    ];

    loginButtons.forEach((button) => {

        if (button) {
            button.addEventListener("click", () => {
                openModal("loginModal");
            });
        }

    });

    const registerButtons = [
        $("#registerNavBtn"),
        $("#footerRegister"),
        $("#heroRegisterBtn")
    ];

    registerButtons.forEach((button) => {

        if (button) {
            button.addEventListener("click", () => {
                openModal("registerModal");
            });
        }

    });

    const logoutButton = $("#logoutBtn");

    if (logoutButton) {

        logoutButton.addEventListener("click", logout);

    }

}

/* =========================================
   UPDATE NAVIGATION FOR USER
========================================= */

function updateUIForUser() {

    const loginButton = $("#loginNavBtn");

    const registerButton = $("#registerNavBtn");

    const userMenu = $("#userMenu");

    const myEventsNav = $("#myEventsNav");

    const adminNav = $("#adminNav");

    const userName = $("#userNameNav");

    const userInitial = $("#userInitial");

    if (currentUser) {

        if (loginButton) {
            loginButton.hidden = true;
        }

        if (registerButton) {
            registerButton.hidden = true;
        }

        if (userMenu) {
            userMenu.hidden = false;
        }

        if (myEventsNav) {
            myEventsNav.hidden = false;
        }

        if (userName) {
            userName.textContent = currentUser.name;
        }

        if (userInitial) {
            userInitial.textContent =
                currentUser.name
                    ? currentUser.name.charAt(0).toUpperCase()
                    : "U";
        }

        if (currentUser.role === "admin") {

            if (adminNav) {
                adminNav.hidden = false;
            }

        }

    } else {

        if (loginButton) {
            loginButton.hidden = false;
        }

        if (registerButton) {
            registerButton.hidden = false;
        }

        if (userMenu) {
            userMenu.hidden = true;
        }

        if (myEventsNav) {
            myEventsNav.hidden = true;
        }

        if (adminNav) {
            adminNav.hidden = true;
        }

    }

}

/* =========================================
   REGISTER
========================================= */

function initializeForms() {

    const registerForm = $("#registerForm");

    if (registerForm) {

        registerForm.addEventListener("submit", (event) => {

            event.preventDefault();

            const name = $("#registerName").value.trim();

            const email = $("#registerEmail").value.trim().toLowerCase();

            const department =
                $("#registerDepartment").value.trim();

            const password =
                $("#registerPassword").value;

            if (password.length < 8) {

                showToast(
                    "Password must contain at least 8 characters.",
                    "error"
                );

                return;
            }

            const existingUser = users.find(
                (user) => user.email === email
            );

            if (existingUser) {

                showToast(
                    "An account with this email already exists.",
                    "error"
                );

                return;
            }

            const newUser = {

                id: Date.now(),

                name,

                email,

                department,

                password,

                role: "student"

            };

            users.push(newUser);

            saveUsers();

            currentUser = {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                department: newUser.department,
                role: newUser.role
            };

            saveCurrentUser();

            closeAllModals();

            updateUIForUser();

            registerForm.reset();

            showToast(
                "Account created successfully!",
                "success"
            );

        });

    }

    /* =====================================
       LOGIN
    ===================================== */

    const loginForm = $("#loginForm");

    if (loginForm) {

        loginForm.addEventListener("submit", (event) => {

            event.preventDefault();

            const email =
                $("#loginEmail").value.trim().toLowerCase();

            const password =
                $("#loginPassword").value;

            /* Demo admin account */

            if (
                email === "admin@campusconnect.com" &&
                password === "admin123"
            ) {

                currentUser = {

                    id: "admin",

                    name: "Administrator",

                    email,

                    department: "Administration",

                    role: "admin"

                };

                saveCurrentUser();

                closeAllModals();

                updateUIForUser();

                loginForm.reset();

                showToast(
                    "Admin login successful!",
                    "success"
                );

                return;
            }

            const user = users.find(
                (item) =>
                    item.email === email &&
                    item.password === password
            );

            if (!user) {

                showToast(
                    "Invalid email or password.",
                    "error"
                );

                return;
            }

            currentUser = {

                id: user.id,

                name: user.name,

                email: user.email,

                department: user.department,

                role: user.role

            };

            saveCurrentUser();

            closeAllModals();

            updateUIForUser();

            loginForm.reset();

            showToast(
                "Login successful!",
                "success"
            );

        });

    }

    /* =====================================
       PROFILE
    ===================================== */

    const profileForm = $("#profileForm");

    if (profileForm) {

        profileForm.addEventListener("submit", (event) => {

            event.preventDefault();

            if (!currentUser) {

                showToast(
                    "Please login first.",
                    "error"
                );

                return;
            }

            const name =
                $("#profileName").value.trim();

            const department =
                $("#profileDepartment").value.trim();

            currentUser.name = name;

            currentUser.department = department;

            saveCurrentUser();

            const userIndex = users.findIndex(
                (user) => user.id === currentUser.id
            );

            if (userIndex !== -1) {

                users[userIndex].name = name;

                users[userIndex].department = department;

                const newPassword =
                    $("#profilePassword").value;

                if (newPassword) {
                    users[userIndex].password =
                        newPassword;
                }

                saveUsers();

            }

            updateUIForUser();

            showToast(
                "Profile updated successfully!",
                "success"
            );

        });

    }

    /* =====================================
       EVENT FORM
    ===================================== */

    const eventForm = $("#eventForm");

    if (eventForm) {

        eventForm.addEventListener("submit", (event) => {

            event.preventDefault();

            if (!currentUser || currentUser.role !== "admin") {

                showToast(
                    "Admin access required.",
                    "error"
                );

                return;
            }

            const title =
                $("#eventTitle").value.trim();

            const category =
                $("#eventCategory").value;

            const description =
                $("#eventDescription").value.trim();

            const date =
                $("#eventDate").value;

            const time =
                $("#eventTime").value;

            const venue =
                $("#eventVenue").value.trim();

            const capacity =
                Number($("#eventCapacity").value);

            const image =
                $("#eventImage").value.trim();

            const eventId =
                $("#eventId").value;

            if (eventId) {

                const existing =
                    events.find(
                        (item) =>
                            item.id === Number(eventId)
                    );

                if (existing) {

                    existing.title = title;
                    existing.category = category;
                    existing.description = description;
                    existing.date = date;
                    existing.time = time;
                    existing.venue = venue;
                    existing.capacity = capacity;
                    existing.image = image;

                }

                showToast(
                    "Event updated successfully!",
                    "success"
                );

            } else {

                events.push({

                    id: Date.now(),

                    title,

                    category,

                    description,

                    date,

                    time,

                    venue,

                    capacity,

                    registered: 0,

                    image

                });

                showToast(
                    "Event created successfully!",
                    "success"
                );

            }

            closeModal("eventModal");

            eventForm.reset();

            $("#eventId").value = "";

            renderFeaturedEvents();

            renderAllEvents();

            renderAdminDashboard();

        });

    }

}

/* =========================================
   SAVE DATA
========================================= */

function saveUsers() {

    localStorage.setItem(
        "campusconnect_users",
        JSON.stringify(users)
    );

}

function saveCurrentUser() {

    localStorage.setItem(
        "campusconnect_current_user",
        JSON.stringify(currentUser)
    );

}

/* =========================================
   LOGOUT
========================================= */

function logout() {

    currentUser = null;

    localStorage.removeItem(
        "campusconnect_current_user"
    );

    updateUIForUser();

    showPage("home");

    showToast(
        "Logged out successfully.",
        "success"
    );

}

/* =========================================
   EVENTS RENDERING
========================================= */

function renderFeaturedEvents() {

    const container = $("#featuredEvents");

    if (!container) {
        return;
    }

    const featured = events.slice(0, 3);

    container.innerHTML = featured
        .map(createEventCard)
        .join("");

    updateHeroEventCount();

}

function renderAllEvents() {

    const container = $("#allEvents");

    if (!container) {
        return;
    }

    const search =
        ($("#eventSearch")?.value || "")
            .toLowerCase()
            .trim();

    const category =
        $("#categoryFilter")?.value || "all";

    const filtered = events.filter((event) => {

        const matchesSearch =

            event.title
                .toLowerCase()
                .includes(search)

            ||

            event.description
                .toLowerCase()
                .includes(search)

            ||

            event.venue
                .toLowerCase()
                .includes(search);

        const matchesCategory =
            category === "all" ||
            event.category === category;

        return matchesSearch && matchesCategory;

    });

    if (filtered.length === 0) {

        container.innerHTML = `
            <div class="empty-card">
                No events found.
            </div>
        `;

        return;
    }

    container.innerHTML =
        filtered.map(createEventCard).join("");

}

function createEventCard(event) {

    const remaining =
        Math.max(
            event.capacity - event.registered,
            0
        );

    let imageContent = "🎓";

    if (event.image) {

        imageContent = `
            <img
                src="${escapeHTML(event.image)}"
                alt="${escapeHTML(event.title)}"
                onerror="this.style.display='none'"
            >
        `;

    }

    return `

        <article class="event-card">

            <div class="event-image">
                ${imageContent}
            </div>

            <div class="event-content">

                <span class="event-category">
                    ${escapeHTML(event.category)}
                </span>

                <h3>
                    ${escapeHTML(event.title)}
                </h3>

                <p class="event-description">
                    ${escapeHTML(event.description)}
                </p>

                <div class="event-meta">

                    <span>
                        📅 ${formatDate(event.date)}
                    </span>

                    <span>
                        🕐 ${formatTime(event.time)}
                    </span>

                    <span>
                        📍 ${escapeHTML(event.venue)}
                    </span>

                </div>

                <div class="event-footer">

                    <span class="event-capacity">
                        ${remaining} seats left
                    </span>

                    <button
                        class="btn btn-primary btn-small"
                        onclick="registerForEvent(${event.id})"
                    >
                        Register
                    </button>

                </div>

            </div>

        </article>

    `;

}

/* =========================================
   REGISTER FOR EVENT
========================================= */

function registerForEvent(eventId) {

    if (!currentUser) {

        openModal("loginModal");

        showToast(
            "Please login to register.",
            "error"
        );

        return;
    }

    if (currentUser.role === "admin") {

        showToast(
            "Admin accounts cannot register for events.",
            "error"
        );

        return;
    }

    const event =
        events.find(
            (item) => item.id === eventId
        );

    if (!event) {
        return;
    }

    if (event.registered >= event.capacity) {

        showToast(
            "This event is already full.",
            "error"
        );

        return;
    }

    const alreadyRegistered =
        registrations.some(
            (registration) =>
                registration.userId === currentUser.id &&
                registration.eventId === eventId
        );

    if (alreadyRegistered) {

        showToast(
            "You are already registered.",
            "error"
        );

        return;
    }

    registrations.push({

        id: Date.now(),

        userId: currentUser.id,

        eventId,

        status: "Confirmed",

        createdAt: new Date().toISOString()

    });

    event.registered++;

    saveRegistrations();

    renderAllEvents();

    renderFeaturedEvents();

    renderMyEvents();

    renderAdminDashboard();

    showToast(
        "Event registration successful!",
        "success"
    );

}

/* =========================================
   MY EVENTS
========================================= */

function renderMyEvents() {

    const container = $("#myRegistrations");

    if (!container) {
        return;
    }

    if (!currentUser) {

        container.innerHTML = `
            <div class="empty-card">
                Please login to see your registered events.
            </div>
        `;

        return;
    }

    const myRegistrations =
        registrations.filter(
            (registration) =>
                registration.userId === currentUser.id
        );

    if (myRegistrations.length === 0) {

        container.innerHTML = `
            <div class="empty-card">
                You haven't registered for any events yet.
            </div>
        `;

        return;
    }

    container.innerHTML =
        myRegistrations.map((registration) => {

            const event =
                events.find(
                    (item) =>
                        item.id === registration.eventId
                );

            if (!event) {
                return "";
            }

            return `

                <div class="registration-card">

                    <div>

                        <h3>
                            ${escapeHTML(event.title)}
                        </h3>

                        <p>
                            📅 ${formatDate(event.date)}
                            •
                            🕐 ${formatTime(event.time)}
                        </p>

                        <p>
                            📍 ${escapeHTML(event.venue)}
                        </p>

                    </div>

                    <button
                        class="btn btn-outline btn-small"
                        onclick="cancelRegistration(${registration.id})"
                    >
                        Cancel
                    </button>

                </div>

            `;

        }).join("");

}

/* =========================================
   CANCEL REGISTRATION
========================================= */

function cancelRegistration(registrationId) {

    const index =
        registrations.findIndex(
            (registration) =>
                registration.id === registrationId
        );

    if (index === -1) {
        return;
    }

    const registration =
        registrations[index];

    const event =
        events.find(
            (item) =>
                item.id === registration.eventId
        );

    if (event && event.registered > 0) {
        event.registered--;
    }

    registrations.splice(index, 1);

    saveRegistrations();

    renderMyEvents();

    renderAllEvents();

    renderFeaturedEvents();

    renderAdminDashboard();

    showToast(
        "Registration cancelled.",
        "success"
    );

}

/* =========================================
   SEARCH & FILTER
========================================= */

function initializeEventSearch() {

    const search = $("#eventSearch");

    const category = $("#categoryFilter");

    if (search) {

        search.addEventListener(
            "input",
            renderAllEvents
        );

    }

    if (category) {

        category.addEventListener(
            "change",
            renderAllEvents
        );

    }

}

/* =========================================
   ADMIN DASHBOARD
========================================= */

function renderAdminDashboard() {

    const statEvents = $("#statEvents");

    const statStudents = $("#statStudents");

    const statRegistrations =
        $("#statRegistrations");

    if (statEvents) {
        statEvents.textContent =
            events.length;
    }

    if (statStudents) {
        statStudents.textContent =
            users.length;
    }

    if (statRegistrations) {
        statRegistrations.textContent =
            registrations.length;
    }

    renderAdminEventsTable();

    renderRegistrationsTable();

}

function renderAdminEventsTable() {

    const table =
        $("#adminEventsTable");

    if (!table) {
        return;
    }

    if (events.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="6">
                    No events available.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML =
        events.map((event) => {

            return `

                <tr>

                    <td>
                        <strong>
                            ${escapeHTML(event.title)}
                        </strong>
                    </td>

                    <td>
                        ${escapeHTML(event.category)}
                    </td>

                    <td>
                        ${formatDate(event.date)}
                    </td>

                    <td>
                        ${event.capacity}
                    </td>

                    <td>
                        ${event.registered}
                    </td>

                    <td>

                        <button
                            class="btn btn-outline btn-small"
                            onclick="editEvent(${event.id})"
                        >
                            Edit
                        </button>

                        <button
                            class="btn btn-small"
                            style="background:#ffe8e8;color:#d33"
                            onclick="deleteEvent(${event.id})"
                        >
                            Delete
                        </button>

                    </td>

                </tr>

            `;

        }).join("");

}

/* =========================================
   EDIT EVENT
========================================= */

function editEvent(eventId) {

    if (!currentUser || currentUser.role !== "admin") {

        showToast(
            "Admin access required.",
            "error"
        );

        return;
    }

    const event =
        events.find(
            (item) => item.id === eventId
        );

    if (!event) {
        return;
    }

    $("#eventId").value = event.id;

    $("#eventTitle").value =
        event.title;

    $("#eventCategory").value =
        event.category;

    $("#eventDescription").value =
        event.description;

    $("#eventDate").value =
        event.date;

    $("#eventTime").value =
        event.time;

    $("#eventVenue").value =
        event.venue;

    $("#eventCapacity").value =
        event.capacity;

    $("#eventImage").value =
        event.image || "";

    $("#eventModalTitle").textContent =
        "Edit Event";

    openModal("eventModal");

}

/* =========================================
   DELETE EVENT
========================================= */

function deleteEvent(eventId) {

    if (!currentUser || currentUser.role !== "admin") {

        showToast(
            "Admin access required.",
            "error"
        );

        return;
    }

    const index =
        events.findIndex(
            (event) =>
                event.id === eventId
        );

    if (index === -1) {
        return;
    }

    const confirmed =
        confirm(
            "Are you sure you want to delete this event?"
        );

    if (!confirmed) {
        return;
    }

    events.splice(index, 1);

    registrations =
        registrations.filter(
            (registration) =>
                registration.eventId !== eventId
        );

    saveRegistrations();

    renderFeaturedEvents();

    renderAllEvents();

    renderAdminDashboard();

    showToast(
        "Event deleted successfully.",
        "success"
    );

}

/* =========================================
   ADMIN REGISTRATIONS
========================================= */

function renderRegistrationsTable() {

    const table =
        $("#registrationsTable");

    if (!table) {
        return;
    }

    if (registrations.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="6">
                    No registrations yet.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML =
        registrations.map((registration) => {

            const user =
                users.find(
                    (item) =>
                        item.id === registration.userId
                );

            const event =
                events.find(
                    (item) =>
                        item.id === registration.eventId
                );

            if (!user || !event) {
                return "";
            }

            return `

                <tr>

                    <td>
                        ${escapeHTML(user.name)}
                    </td>

                    <td>
                        ${escapeHTML(user.email)}
                    </td>

                    <td>
                        ${escapeHTML(event.title)}
                    </td>

                    <td>
                        ${escapeHTML(user.department || "-")}
                    </td>

                    <td>
                        ${registration.status}
                    </td>

                    <td>

                        <button
                            class="btn btn-outline btn-small"
                            onclick="adminCancelRegistration(${registration.id})"
                        >
                            Cancel
                        </button>

                    </td>

                </tr>

            `;

        }).join("");

}

/* =========================================
   ADMIN CANCEL REGISTRATION
========================================= */

function adminCancelRegistration(registrationId) {

    if (!currentUser || currentUser.role !== "admin") {

        showToast(
            "Admin access required.",
            "error"
        );

        return;
    }

    cancelRegistration(registrationId);

}

/* =========================================
   ADMIN TABS
========================================= */

function initializeAdminTabs() {

    $$(".admin-tab").forEach((tab) => {

        tab.addEventListener("click", () => {

            $$(".admin-tab").forEach((item) => {
                item.classList.remove("active");
            });

            tab.classList.add("active");

            const selected =
                tab.dataset.adminTab;

            $("#adminEventsPanel")
                ?.classList.toggle(
                    "active",
                    selected === "events"
                );

            $("#adminRegistrationsPanel")
                ?.classList.toggle(
                    "active",
                    selected === "registrations"
                );

        });

    });

    $("#refreshAdminEvents")
        ?.addEventListener(
            "click",
            renderAdminDashboard
        );

    $("#addEventBtn")
        ?.addEventListener(
            "click",
            () => {

                if (
                    !currentUser ||
                    currentUser.role !== "admin"
                ) {

                    showToast(
                        "Admin access required.",
                        "error"
                    );

                    return;
                }

                $("#eventForm")?.reset();

                $("#eventId").value = "";

                $("#eventModalTitle").textContent =
                    "Add Event";

                openModal("eventModal");

            }
        );

}

/* =========================================
   REGISTRATION SEARCH
========================================= */

document.addEventListener("input", (event) => {

    if (
        event.target &&
        event.target.id === "registrationSearch"
    ) {

        filterRegistrations(
            event.target.value
        );

    }

});

function filterRegistrations(value) {

    const search =
        value.toLowerCase().trim();

    $$("#registrationsTable tr")
        .forEach((row) => {

            row.style.display =
                row.textContent
                    .toLowerCase()
                    .includes(search)
                    ? ""
                    : "none";

        });

}

/* =========================================
   EXPORT CSV
========================================= */

$("#exportCsvBtn")
    ?.addEventListener(
        "click",
        exportRegistrationsCSV
    );

function exportRegistrationsCSV() {

    if (!currentUser || currentUser.role !== "admin") {

        showToast(
            "Admin access required.",
            "error"
        );

        return;
    }

    if (registrations.length === 0) {

        showToast(
            "No registrations to export.",
            "error"
        );

        return;
    }

    const rows = [

        [
            "Student",
            "Email",
            "Event",
            "Department",
            "Status"
        ]

    ];

    registrations.forEach((registration) => {

        const user =
            users.find(
                (item) =>
                    item.id === registration.userId
            );

        const event =
            events.find(
                (item) =>
                    item.id === registration.eventId
            );

        if (user && event) {

            rows.push([

                user.name,

                user.email,

                event.title,

                user.department || "",

                registration.status

            ]);

        }

    });

    const csv =
        rows
            .map(
                (row) =>
                    row
                        .map(csvEscape)
                        .join(",")
            )
            .join("\n");

    const blob =
        new Blob(
            [csv],
            {
                type: "text/csv;charset=utf-8;"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "campusconnect-registrations.csv";

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

    showToast(
        "CSV exported successfully!",
        "success"
    );

}

function csvEscape(value) {

    const stringValue =
        String(value ?? "");

    if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
    ) {

        return `"${stringValue.replace(
            /"/g,
            '""'
        )}"`;

    }

    return stringValue;

}

/* =========================================
   MODALS
========================================= */

function initializeModals() {

    $$("[data-close-modal]")
        .forEach((button) => {

            button.addEventListener(
                "click",
                closeAllModals
            );

        });

    $$(".modal-overlay")
        .forEach((overlay) => {

            overlay.addEventListener(
                "click",
                closeAllModals
            );

        });

    $("#switchToRegister")
        ?.addEventListener(
            "click",
            () => {

                closeModal("loginModal");

                openModal("registerModal");

            }
        );

    $("#switchToLogin")
        ?.addEventListener(
            "click",
            () => {

                closeModal("registerModal");

                openModal("loginModal");

            }
        );

    document.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Escape") {

                closeAllModals();

            }

        }
    );

}

function openModal(id) {

    const modal = $(`#${id}`);

    if (!modal) {
        return;
    }

    modal.classList.add("active");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";

}

function closeModal(id) {

    const modal = $(`#${id}`);

    if (!modal) {
        return;
    }

    modal.classList.remove("active");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow =
        "";

}

function closeAllModals() {

    $$(".modal").forEach((modal) => {

        modal.classList.remove("active");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

    });

    document.body.style.overflow =
        "";

}

/* =========================================
   TOAST
========================================= */

let toastTimer;

function showToast(message, type = "success") {

    const toast = $("#toast");

    const toastMessage =
        $("#toastMessage");

    const toastIcon =
        $("#toastIcon");

    if (!toast) {
        return;
    }

    toastMessage.textContent =
        message;

    toastIcon.textContent =
        type === "error"
            ? "!"
            : "✓";

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);

}

/* =========================================
   DATE / TIME
========================================= */

function formatDate(dateString) {

    if (!dateString) {
        return "-";
    }

    const date =
        new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}

function formatTime(timeString) {

    if (!timeString) {
        return "-";
    }

    const [hours, minutes] =
        timeString.split(":");

    const date =
        new Date();

    date.setHours(
        Number(hours),
        Number(minutes)
    );

    return date.toLocaleTimeString(
        "en-IN",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );

}

/* =========================================
   LOCAL STORAGE
========================================= */

function saveRegistrations() {

    localStorage.setItem(
        "campusconnect_registrations",
        JSON.stringify(registrations)
    );

}

/* =========================================
   HERO EVENT COUNT
========================================= */

function updateHeroEventCount() {

    const count =
        $("#heroEventCount");

    if (count) {

        count.textContent =
            events.length;

    }

}

/* =========================================
   SECURITY HELPER
========================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

/* =========================================
   MOBILE MENU
========================================= */

$("#mobileMenuBtn")
    ?.addEventListener(
        "click",
        () => {

            const nav =
                $(".nav-links");

            const actions =
                $(".nav-actions");

            if (!nav || !actions) {
                return;
            }

            const visible =
                nav.style.display === "flex";

            nav.style.display =
                visible ? "" : "flex";

            actions.style.display =
                visible ? "" : "flex";

        }
    );

/* =========================================
   ADMIN DEMO INFORMATION
========================================= */

console.log(
    "CampusConnect loaded successfully."
);

console.log(
    "Demo Admin Login: admin@campusconnect.com / admin123"
);
