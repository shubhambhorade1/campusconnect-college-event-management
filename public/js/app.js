const API = "/api";

let currentUser = JSON.parse(
    localStorage.getItem("campusUser")
) || null;

let allEvents = [];

/* =========================
   HELPERS
========================= */

function $(id) {
    return document.getElementById(id);
}

function showToast(message, type = "success") {
    const toast = $("toast");
    const toastMessage = $("toastMessage");
    const toastIcon = $("toastIcon");

    if (!toast) return;

    toastMessage.textContent = message;
    toastIcon.textContent = type === "error" ? "✕" : "✓";

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

async function api(url, options = {}) {
    const response = await fetch(API + url, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.message || "Something went wrong"
        );
    }

    return data;
}

/* =========================
   NAVIGATION
========================= */

function showPage(page) {
    document.querySelectorAll(".page").forEach(section => {
        section.classList.remove("active-page");
    });

    const target = $(page + "Page");

    if (target) {
        target.classList.add("active-page");
    }

    document.querySelectorAll(".nav-link").forEach(btn => {
        btn.classList.toggle(
            "active",
            btn.dataset.page === page
        );
    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (page === "events") {
        loadEvents();
    }

    if (page === "my-events") {
        loadMyEvents();
    }

    if (page === "admin") {
        loadAdminDashboard();
    }

    if (page === "profile") {
        loadProfile();
    }
}

/* =========================
   USER UI
========================= */

function updateUserUI() {
    const loggedIn = !!currentUser;

    $("loginNavBtn").hidden = loggedIn;
    $("registerNavBtn").hidden = loggedIn;
    $("userMenu").hidden = !loggedIn;

    if ($("myEventsNav")) {
        $("myEventsNav").hidden = !loggedIn;
    }

    document.querySelectorAll(".student-only").forEach(el => {
        el.hidden = !loggedIn;
    });

    if (currentUser) {
        $("userInitial").textContent =
            currentUser.name.charAt(0).toUpperCase();

        $("userNameNav").textContent =
            currentUser.name;

        if ($("adminNav")) {
            $("adminNav").hidden =
                currentUser.role !== "admin";
        }
    } else {
        if ($("adminNav")) {
            $("adminNav").hidden = true;
        }
    }
}

/* =========================
   EVENTS
========================= */

async function loadEvents() {
    try {
        allEvents = await api("/events");

        renderEvents(
            allEvents,
            $("allEvents")
        );

        renderEvents(
            allEvents.slice(0, 3),
            $("featuredEvents")
        );

        if ($("heroEventCount")) {
            $("heroEventCount").textContent =
                allEvents.length;
        }
    } catch (error) {
        console.error(error);

        if ($("allEvents")) {
            $("allEvents").innerHTML =
                `<div class="loading-card">
                    Unable to load events.
                </div>`;
        }
    }
}

function renderEvents(events, container) {
    if (!container) return;

    if (!events.length) {
        container.innerHTML =
            `<div class="loading-card">
                No events found.
            </div>`;
        return;
    }

    container.innerHTML = events.map(event => {
        const seatsLeft =
            Number(event.capacity) -
            Number(event.registered || 0);

        return `
            <article class="event-card">

                <div class="event-card-image">
                    <div class="event-category">
                        ${escapeHTML(event.category)}
                    </div>

                    <div class="event-calendar-icon">
                        📅
                    </div>
                </div>

                <div class="event-card-body">

                    <h3>
                        ${escapeHTML(event.title)}
                    </h3>

                    <p>
                        ${escapeHTML(
                            event.description || ""
                        )}
                    </p>

                    <div class="event-info">
                        <span>📅 ${formatDate(event.date)}</span>
                        <span>⏰ ${event.time}</span>
                        <span>📍 ${escapeHTML(event.venue)}</span>
                    </div>

                    <div class="event-card-footer">

                        <span class="seats">
                            ${seatsLeft > 0
                                ? seatsLeft + " seats left"
                                : "Event Full"}
                        </span>

                        <button
                            class="btn btn-primary btn-small"
                            onclick="registerForEvent(${event.id})"
                            ${seatsLeft <= 0 ? "disabled" : ""}
                        >
                            Register
                        </button>

                    </div>

                </div>

            </article>
        `;
    }).join("");
}

function formatDate(date) {
    if (!date) return "";

    return new Date(date + "T00:00:00")
        .toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================
   SEARCH & FILTER
========================= */

function filterEvents() {
    const search =
        ($("eventSearch")?.value || "")
            .toLowerCase()
            .trim();

    const category =
        $("categoryFilter")?.value || "all";

    const filtered = allEvents.filter(event => {

        const matchesSearch =
            event.title.toLowerCase().includes(search) ||
            event.category.toLowerCase().includes(search) ||
            event.venue.toLowerCase().includes(search) ||
            (event.description || "")
                .toLowerCase()
                .includes(search);

        const matchesCategory =
            category === "all" ||
            event.category === category;

        return matchesSearch && matchesCategory;
    });

    renderEvents(
        filtered,
        $("allEvents")
    );
}

/* =========================
   REGISTER FOR EVENT
========================= */

async function registerForEvent(eventId) {

    if (!currentUser) {
        openModal("loginModal");

        showToast(
            "Please login before registering.",
            "error"
        );

        return;
    }

    try {
        await api("/registrations", {
            method: "POST",
            body: JSON.stringify({
                userId: currentUser.id,
                eventId: eventId
            })
        });

        showToast(
            "Successfully registered!"
        );

        await loadEvents();

    } catch (error) {
        showToast(
            error.message,
            "error"
        );
    }
}

/* =========================
   MY EVENTS
========================= */

async function loadMyEvents() {

    const container = $("myRegistrations");

    if (!container || !currentUser) return;

    try {
        const registrations =
            await api("/registrations");

        const myRegistrations =
            registrations.filter(
                r => r.userId === currentUser.id
            );

        if (!myRegistrations.length) {
            container.innerHTML =
                `<div class="loading-card">
                    You haven't registered for any events yet.
                </div>`;

            return;
        }

        container.innerHTML =
            myRegistrations.map(registration => {

                const event =
                    allEvents.find(
                        e => e.id === registration.eventId
                    );

                if (!event) return "";

                return `
                    <div class="registration-item">

                        <div>
                            <h3>
                                ${escapeHTML(event.title)}
                            </h3>

                            <p>
                                📅 ${formatDate(event.date)}
                                &nbsp; • &nbsp;
                                ⏰ ${event.time}
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

    } catch (error) {
        container.innerHTML =
            `<div class="loading-card">
                Unable to load registrations.
            </div>`;
    }
}

async function cancelRegistration(id) {

    if (!confirm(
        "Are you sure you want to cancel this registration?"
    )) {
        return;
    }

    try {
        await api(`/registrations/${id}`, {
            method: "DELETE"
        });

        showToast(
            "Registration cancelled."
        );

        await loadEvents();
        await loadMyEvents();

    } catch (error) {
        showToast(
            error.message,
            "error"
        );
    }
}

/* =========================
   LOGIN
========================= */

async function login(email, password) {

    try {
        const result = await api("/login", {
            method: "POST",
            body: JSON.stringify({
                email,
                password
            })
        });

        currentUser = result.user;

        localStorage.setItem(
            "campusUser",
            JSON.stringify(currentUser)
        );

        updateUserUI();
        closeAllModals();

        showToast(
            `Welcome, ${currentUser.name}!`
        );

        $("loginForm").reset();

    } catch (error) {
        showToast(
            error.message,
            "error"
        );
    }
}

/* =========================
   REGISTER ACCOUNT
========================= */

async function registerAccount(data) {

    try {
        const result = await api("/register", {
            method: "POST",
            body: JSON.stringify(data)
        });

        currentUser = result.user;

        localStorage.setItem(
            "campusUser",
            JSON.stringify(currentUser)
        );

        updateUserUI();
        closeAllModals();

        showToast(
            "Account created successfully!"
        );

        $("registerForm").reset();

    } catch (error) {
        showToast(
            error.message,
            "error"
        );
    }
}

/* =========================
   PROFILE
========================= */

function loadProfile() {

    if (!currentUser) {
        openModal("loginModal");
        return;
    }

    $("profileName").value =
        currentUser.name || "";

    $("profileEmail").value =
        currentUser.email || "";

    $("profileDepartment").value =
        currentUser.department || "";
}

$("profileForm")?.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        const updatedUser = {
            ...currentUser,
            name: $("profileName").value,
            department:
                $("profileDepartment").value
        };

        currentUser = updatedUser;

        localStorage.setItem(
            "campusUser",
            JSON.stringify(currentUser)
        );

        updateUserUI();

        showToast(
            "Profile updated successfully!"
        );
    }
);

/* =========================
   ADMIN DASHBOARD
========================= */

async function loadAdminDashboard() {

    if (
        !currentUser ||
        currentUser.role !== "admin"
    ) {
        showToast(
            "Admin access required.",
            "error"
        );

        showPage("home");
        return;
    }

    try {

        const events =
            await api("/events");

        const users =
            await api("/users");

        const registrations =
            await api("/registrations");

        $("statEvents").textContent =
            events.length;

        $("statStudents").textContent =
            users.filter(
                u => u.role === "student"
            ).length;

        $("statRegistrations").textContent =
            registrations.length;

        renderAdminEvents(events);
        renderAdminRegistrations(
            registrations,
            users,
            events
        );

    } catch (error) {
        showToast(
            "Unable to load admin dashboard.",
            "error"
        );
    }
}

function renderAdminEvents(events) {

    const table =
        $("adminEventsTable");

    if (!table) return;

    table.innerHTML = events.map(event => `
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
                ${event.registered || 0}
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
                    onclick="deleteEvent(${event.id})"
                >
                    Delete
                </button>

            </td>

        </tr>
    `).join("");
}

function renderAdminRegistrations(
    registrations,
    users,
    events
) {

    const table =
        $("registrationsTable");

    if (!table) return;

    table.innerHTML =
        registrations.map(registration => {

            const user =
                users.find(
                    u => u.id === registration.userId
                );

            const event =
                events.find(
                    e => e.id === registration.eventId
                );

            if (!user || !event) return "";

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
                        ${escapeHTML(
                            user.department || "-"
                        )}
                    </td>

                    <td>
                        ${registration.status}
                    </td>

                    <td>
                        <button
                            class="btn btn-small"
                            onclick="cancelRegistration(${registration.id})"
                        >
                            Cancel
                        </button>
                    </td>

                </tr>
            `;
        }).join("");
}

/* =========================
   ADMIN EVENT FORM
========================= */

function openAddEvent() {

    $("eventForm").reset();

    $("eventId").value = "";

    $("eventModalTitle").textContent =
        "Add Event";

    openModal("eventModal");
}

async function editEvent(id) {

    try {

        const event =
            await api(`/events/${id}`);

        $("eventId").value =
            event.id;

        $("eventTitle").value =
            event.title;

        $("eventCategory").value =
            event.category;

        $("eventDescription").value =
            event.description || "";

        $("eventDate").value =
            event.date;

        $("eventTime").value =
            event.time;

        $("eventVenue").value =
            event.venue;

        $("eventCapacity").value =
            event.capacity;

        $("eventModalTitle").textContent =
            "Edit Event";

        openModal("eventModal");

    } catch (error) {
        showToast(
            error.message,
            "error"
        );
    }
}

async function saveEvent(event) {

    event.preventDefault();

    const id =
        $("eventId").value;

    const eventData = {
        title: $("eventTitle").value,
        category: $("eventCategory").value,
        description: $("eventDescription").value,
        date: $("eventDate").value,
        time: $("eventTime").value,
        venue: $("eventVenue").value,
        capacity: Number(
            $("eventCapacity").value
        )
    };

    try {

        if (id) {

            await api(`/events/${id}`, {
                method: "PUT",
                body: JSON.stringify(
                    eventData
                )
            });

            showToast(
                "Event updated successfully!"
            );

        } else {

            await api("/events", {
                method: "POST",
                body: JSON.stringify(
                    eventData
                )
            });

            showToast(
                "Event created successfully!"
            );
        }

        closeAllModals();

        await loadEvents();
        await loadAdminDashboard();

    } catch (error) {

        showToast(
            error.message,
            "error"
        );
    }
}

async function deleteEvent(id) {

    if (!confirm(
        "Delete this event?"
    )) {
        return;
    }

    try {

        await api(`/events/${id}`, {
            method: "DELETE"
        });

        showToast(
            "Event deleted."
        );

        await loadEvents();
        await loadAdminDashboard();

    } catch (error) {

        showToast(
            error.message,
            "error"
        );
    }
}

/* =========================
   MODALS
========================= */

function openModal(id) {

    const modal = $(id);

    if (!modal) return;

    modal.classList.add("show");
    modal.setAttribute(
        "aria-hidden",
        "false"
    );
}

function closeAllModals() {

    document
        .querySelectorAll(".modal")
        .forEach(modal => {

            modal.classList.remove("show");

            modal.setAttribute(
                "aria-hidden",
                "true"
            );
        });
}

/* =========================
   LOGOUT
========================= */

function logout() {

    currentUser = null;

    localStorage.removeItem(
        "campusUser"
    );

    updateUserUI();

    showPage("home");

    showToast(
        "Logged out successfully."
    );
}

/* =========================
   EVENT LISTENERS
========================= */

document.addEventListener(
    "click",
    function(event) {

        const pageButton =
            event.target.closest(
                "[data-page]"
            );

        if (pageButton) {

            const page =
                pageButton.dataset.page;

            showPage(page);
        }
    }
);

$("loginNavBtn")?.addEventListener(
    "click",
    () => openModal("loginModal")
);

$("registerNavBtn")?.addEventListener(
    "click",
    () => openModal("registerModal")
);

$("heroRegisterBtn")?.addEventListener(
    "click",
    () => openModal("registerModal")
);

$("footerLogin")?.addEventListener(
    "click",
    () => openModal("loginModal")
);

$("footerRegister")?.addEventListener(
    "click",
    () => openModal("registerModal")
);

$("logoutBtn")?.addEventListener(
    "click",
    logout
);

$("switchToRegister")?.addEventListener(
    "click",
    () => {
        closeAllModals();
        openModal("registerModal");
    }
);

$("switchToLogin")?.addEventListener(
    "click",
    () => {
        closeAllModals();
        openModal("loginModal");
    }
);

document
    .querySelectorAll("[data-close-modal]")
    .forEach(button => {
        button.addEventListener(
            "click",
            closeAllModals
        );
    });

document
    .querySelectorAll(".modal-overlay")
    .forEach(overlay => {
        overlay.addEventListener(
            "click",
            closeAllModals
        );
    });

$("loginForm")?.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        login(
            $("loginEmail").value,
            $("loginPassword").value
        );
    }
);

$("registerForm")?.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        registerAccount({
            name: $("registerName").value,
            email: $("registerEmail").value,
            department:
                $("registerDepartment").value,
            password:
                $("registerPassword").value
        });
    }
);

$("eventForm")?.addEventListener(
    "submit",
    saveEvent
);

$("addEventBtn")?.addEventListener(
    "click",
    openAddEvent
);

$("eventSearch")?.addEventListener(
    "input",
    filterEvents
);

$("categoryFilter")?.addEventListener(
    "change",
    filterEvents
);

$("refreshAdminEvents")?.addEventListener(
    "click",
    loadAdminDashboard
);

/* =========================
   ADMIN TABS
========================= */

document
    .querySelectorAll(".admin-tab")
    .forEach(tab => {

        tab.addEventListener(
            "click",
            function() {

                document
                    .querySelectorAll(".admin-tab")
                    .forEach(t =>
                        t.classList.remove("active")
                    );

                document
                    .querySelectorAll(".admin-panel")
                    .forEach(panel =>
                        panel.classList.remove("active")
                    );

                this.classList.add("active");

                const tabName =
                    this.dataset.adminTab;

                if (tabName === "events") {
                    $("adminEventsPanel")
                        ?.classList.add("active");
                }

                if (
                    tabName === "registrations"
                ) {
                    $("adminRegistrationsPanel")
                        ?.classList.add("active");
                }
            }
        );
    });

/* =========================
   MOBILE MENU
========================= */

$("mobileMenuBtn")?.addEventListener(
    "click",
    function() {

        document
            .querySelector(".nav-links")
            ?.classList.toggle("mobile-open");
    }
);

/* =========================
   INITIALIZE
========================= */

async function init() {

    updateUserUI();

    await loadEvents();

    if (currentUser) {
        console.log(
            `Logged in as ${currentUser.name}`
        );
    }
}

init();
