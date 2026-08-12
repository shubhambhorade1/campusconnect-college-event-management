const API = "/api";

let currentUser =
    JSON.parse(localStorage.getItem("campusUser")) || null;

let allEvents = [];

/* =========================
   BASIC HELPERS
========================= */

function $(id) {
    return document.getElementById(id);
}

function showToast(message, type = "success") {
    const toast = $("toast");
    const toastMessage = $("toastMessage");
    const toastIcon = $("toastIcon");

    if (!toast) return;

    if (toastMessage) {
        toastMessage.textContent = message;
    }

    if (toastIcon) {
        toastIcon.textContent =
            type === "error" ? "✕" : "✓";
    }

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

async function api(url, options = {}) {
    const response = await fetch(API + url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.message || "Something went wrong"
        );
    }

    return data;
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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

    document.querySelectorAll(".nav-link").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === page
        );
    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    const mobileNav =
        document.querySelector(".nav-links");

    if (mobileNav) {
        mobileNav.classList.remove("mobile-open");
    }

    if (page === "events") {
        loadEvents();
    }

    if (page === "my-events") {
        loadMyEvents();
    }

    if (page === "profile") {
        loadProfile();
    }

    if (page === "admin") {
        loadAdminDashboard();
    }
}

/* =========================
   USER UI
========================= */

function updateUserUI() {
    const loggedIn = !!currentUser;

    const loginNavBtn = $("loginNavBtn");
    const registerNavBtn = $("registerNavBtn");
    const userMenu = $("userMenu");
    const myEventsNav = $("myEventsNav");
    const adminNav = $("adminNav");

    if (loginNavBtn) {
        loginNavBtn.hidden = loggedIn;
    }

    if (registerNavBtn) {
        registerNavBtn.hidden = loggedIn;
    }

    if (userMenu) {
        userMenu.hidden = !loggedIn;
    }

    if (myEventsNav) {
        myEventsNav.hidden = !loggedIn;
    }

    document.querySelectorAll(".student-only").forEach(element => {
        element.hidden = !loggedIn;
    });

    if (currentUser) {
        const initial = $("userInitial");
        const name = $("userNameNav");

        if (initial) {
            initial.textContent =
                currentUser.name
                    ? currentUser.name
                        .charAt(0)
                        .toUpperCase()
                    : "U";
        }

        if (name) {
            name.textContent =
                currentUser.name || "User";
        }

        if (adminNav) {
            adminNav.hidden =
                currentUser.role !== "admin";
        }
    } else {
        if (adminNav) {
            adminNav.hidden = true;
        }
    }
}

/* =========================
   LOAD EVENTS
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

        const count = $("heroEventCount");

        if (count) {
            count.textContent = allEvents.length;
        }

    } catch (error) {
        console.error(error);

        if ($("allEvents")) {
            $("allEvents").innerHTML = `
                <div class="loading-card">
                    Unable to load events.
                </div>
            `;
        }

        if ($("featuredEvents")) {
            $("featuredEvents").innerHTML = `
                <div class="loading-card">
                    Unable to load events.
                </div>
            `;
        }
    }
}

/* =========================
   RENDER EVENTS
========================= */

function renderEvents(events, container) {
    if (!container) return;

    if (!events.length) {
        container.innerHTML = `
            <div class="loading-card">
                No events found.
            </div>
        `;

        return;
    }

    container.innerHTML = events.map(event => {

        const capacity =
            Number(event.capacity || 0);

        const registered =
            Number(event.registered || 0);

        const seatsLeft =
            capacity - registered;

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

                        <span>
                            📅 ${formatDate(event.date)}
                        </span>

                        <span>
                            ⏰ ${escapeHTML(event.time)}
                        </span>

                        <span>
                            📍 ${escapeHTML(event.venue)}
                        </span>

                    </div>

                    <div class="event-card-footer">

                        <span class="seats">
                            ${
                                seatsLeft > 0
                                    ? `${seatsLeft} seats left`
                                    : "Event Full"
                            }
                        </span>

                        <button
                            class="btn btn-primary btn-small"
                            data-register-event="${event.id}"
                            ${
                                seatsLeft <= 0
                                    ? "disabled"
                                    : ""
                            }
                        >
                            Register
                        </button>

                    </div>

                </div>

            </article>
        `;
    }).join("");
}

/* =========================
   SEARCH / FILTER
========================= */

function filterEvents() {
    const search =
        ($("eventSearch")?.value || "")
            .toLowerCase()
            .trim();

    const category =
        $("categoryFilter")?.value || "all";

    const filtered =
        allEvents.filter(event => {

            const title =
                String(event.title || "")
                    .toLowerCase();

            const eventCategory =
                String(event.category || "")
                    .toLowerCase();

            const venue =
                String(event.venue || "")
                    .toLowerCase();

            const description =
                String(event.description || "")
                    .toLowerCase();

            const matchesSearch =
                title.includes(search) ||
                eventCategory.includes(search) ||
                venue.includes(search) ||
                description.includes(search);

            const matchesCategory =
                category === "all" ||
                event.category === category;

            return (
                matchesSearch &&
                matchesCategory
            );
        });

    renderEvents(
        filtered,
        $("allEvents")
    );
}

/* =========================
   EVENT REGISTRATION
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
                eventId: Number(eventId)
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

    const container =
        $("myRegistrations");

    if (!container) return;

    if (!currentUser) {
        container.innerHTML = `
            <div class="loading-card">
                Please login to view your events.
            </div>
        `;

        return;
    }

    try {
        const registrations =
            await api("/registrations");

        const myRegistrations =
            registrations.filter(
                registration =>
                    Number(registration.userId) ===
                    Number(currentUser.id)
            );

        if (!myRegistrations.length) {
            container.innerHTML = `
                <div class="loading-card">
                    You haven't registered for any events yet.
                </div>
            `;

            return;
        }

        container.innerHTML =
            myRegistrations.map(registration => {

                const event =
                    allEvents.find(
                        item =>
                            Number(item.id) ===
                            Number(registration.eventId)
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
                                ⏰ ${escapeHTML(event.time)}
                            </p>

                            <p>
                                📍 ${escapeHTML(event.venue)}
                            </p>

                        </div>

                        <button
                            class="btn btn-outline btn-small"
                            data-cancel-registration="${registration.id}"
                        >
                            Cancel
                        </button>

                    </div>
                `;
            }).join("");

    } catch (error) {
        console.error(error);

        container.innerHTML = `
            <div class="loading-card">
                Unable to load registrations.
            </div>
        `;
    }
}

async function cancelRegistration(id) {

    const confirmed =
        confirm(
            "Are you sure you want to cancel this registration?"
        );

    if (!confirmed) return;

    try {
        await api(
            `/registrations/${id}`,
            {
                method: "DELETE"
            }
        );

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

async function loginUser(email, password) {

    try {

        const result =
            await api("/login", {
                method: "POST",
                body: JSON.stringify({
                    email: email,
                    password: password
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

        const form = $("loginForm");

        if (form) {
            form.reset();
        }

    } catch (error) {

        console.error("Login error:", error);

        showToast(
            error.message ||
            "Login failed.",
            "error"
        );
    }
}

/* =========================
   REGISTER ACCOUNT
========================= */

async function registerAccount(data) {

    try {

        const result =
            await api("/register", {
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

        const form = $("registerForm");

        if (form) {
            form.reset();
        }

    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        showToast(
            error.message ||
            "Registration failed.",
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

    if ($("profileName")) {
        $("profileName").value =
            currentUser.name || "";
    }

    if ($("profileEmail")) {
        $("profileEmail").value =
            currentUser.email || "";
    }

    if ($("profileDepartment")) {
        $("profileDepartment").value =
            currentUser.department || "";
    }
}

async function saveProfile(event) {

    event.preventDefault();

    if (!currentUser) {
        openModal("loginModal");
        return;
    }

    currentUser.name =
        $("profileName").value.trim();

    currentUser.department =
        $("profileDepartment").value.trim();

    localStorage.setItem(
        "campusUser",
        JSON.stringify(currentUser)
    );

    updateUserUI();

    showToast(
        "Profile updated successfully!"
    );
}

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

        if ($("statEvents")) {
            $("statEvents").textContent =
                events.length;
        }

        if ($("statStudents")) {
            $("statStudents").textContent =
                users.filter(
                    user =>
                        user.role === "student"
                ).length;
        }

        if ($("statRegistrations")) {
            $("statRegistrations").textContent =
                registrations.length;
        }

        renderAdminEvents(events);

        renderAdminRegistrations(
            registrations,
            users,
            events
        );

    } catch (error) {

        console.error(error);

        showToast(
            "Unable to load admin dashboard.",
            "error"
        );
    }
}

/* =========================
   ADMIN EVENTS
========================= */

function renderAdminEvents(events) {

    const table =
        $("adminEventsTable");

    if (!table) return;

    table.innerHTML =
        events.map(event => {

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
                        ${event.registered || 0}
                    </td>

                    <td>

                        <button
                            class="btn btn-outline btn-small"
                            data-edit-event="${event.id}"
                        >
                            Edit
                        </button>

                        <button
                            class="btn btn-small"
                            data-delete-event="${event.id}"
                        >
                            Delete
                        </button>

                    </td>

                </tr>
            `;
        }).join("");
}

/* =========================
   ADMIN REGISTRATIONS
========================= */

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
                    item =>
                        Number(item.id) ===
                        Number(registration.userId)
                );

            const event =
                events.find(
                    item =>
                        Number(item.id) ===
                        Number(registration.eventId)
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
                        ${escapeHTML(
                            user.department || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            registration.status
                        )}
                    </td>

                    <td>

                        <button
                            class="btn btn-small"
                            data-cancel-registration="${registration.id}"
                        >
                            Cancel
                        </button>

                    </td>

                </tr>
            `;
        }).join("");
}

/* =========================
   ADD EVENT
========================= */

function openAddEvent() {

    const form =
        $("eventForm");

    if (form) {
        form.reset();
    }

    if ($("eventId")) {
        $("eventId").value = "";
    }

    if ($("eventModalTitle")) {
        $("eventModalTitle").textContent =
            "Add Event";
    }

    openModal("eventModal");
}

/* =========================
   EDIT EVENT
========================= */

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

/* =========================
   SAVE EVENT
========================= */

async function saveEvent(event) {

    event.preventDefault();

    const id =
        $("eventId").value;

    const eventData = {
        title:
            $("eventTitle").value.trim(),

        category:
            $("eventCategory").value,

        description:
            $("eventDescription").value.trim(),

        date:
            $("eventDate").value,

        time:
            $("eventTime").value,

        venue:
            $("eventVenue").value.trim(),

        capacity:
            Number(
                $("eventCapacity").value
            )
    };

    try {

        if (id) {

            await api(
                `/events/${id}`,
                {
                    method: "PUT",
                    body: JSON.stringify(
                        eventData
                    )
                }
            );

            showToast(
                "Event updated successfully!"
            );

        } else {

            await api(
                "/events",
                {
                    method: "POST",
                    body: JSON.stringify(
                        eventData
                    )
                }
            );

            showToast(
                "Event created successfully!"
            );
        }

        closeAllModals();

        await loadEvents();

        if (
            currentUser &&
            currentUser.role === "admin"
        ) {
            await loadAdminDashboard();
        }

    } catch (error) {

        showToast(
            error.message,
            "error"
        );
    }
}

/* =========================
   DELETE EVENT
========================= */

async function deleteEvent(id) {

    if (!confirm("Delete this event?")) {
        return;
    }

    try {

        await api(
            `/events/${id}`,
            {
                method: "DELETE"
            }
        );

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

    if (!modal) {
        console.error(
            "Modal not found:",
            id
        );

        return;
    }

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
   USER BUTTON
========================= */

function toggleUserMenu() {

    const userMenu =
        $("userMenu");

    if (!userMenu) return;

    userMenu.classList.toggle(
        "open"
    );
}

/* =========================
   PAGE BUTTONS
========================= */

document.addEventListener(
    "click",
    function(event) {

        const pageButton =
            event.target.closest(
                "[data-page]"
            );

        if (pageButton) {

            event.preventDefault();

            const page =
                pageButton.dataset.page;

            showPage(page);
        }

        const registerButton =
            event.target.closest(
                "[data-register-event]"
            );

        if (registerButton) {

            const eventId =
                registerButton.dataset.registerEvent;

            registerForEvent(eventId);
        }

        const cancelButton =
            event.target.closest(
                "[data-cancel-registration]"
            );

        if (cancelButton) {

            const id =
                cancelButton.dataset
                    .cancelRegistration;

            cancelRegistration(id);
        }

        const editButton =
            event.target.closest(
                "[data-edit-event]"
            );

        if (editButton) {

            const id =
                editButton.dataset.editEvent;

            editEvent(id);
        }

        const deleteButton =
            event.target.closest(
                "[data-delete-event]"
            );

        if (deleteButton) {

            const id =
                deleteButton.dataset.deleteEvent;

            deleteEvent(id);
        }
    }
);

/* =========================
   LOGIN BUTTON
========================= */

if ($("loginNavBtn")) {
    $("loginNavBtn").addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            openModal("loginModal");
        }
    );
}

/* =========================
   REGISTER BUTTON
========================= */

if ($("registerNavBtn")) {
    $("registerNavBtn").addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            openModal("registerModal");
        }
    );
}

/* =========================
   HERO REGISTER
========================= */

if ($("heroRegisterBtn")) {
    $("heroRegisterBtn").addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            openModal("registerModal");
        }
    );
}

/* =========================
   FOOTER LOGIN
========================= */

if ($("footerLogin")) {
    $("footerLogin").addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            openModal("loginModal");
        }
    );
}

/* =========================
   FOOTER REGISTER
========================= */

if ($("footerRegister")) {
    $("footerRegister").addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            openModal("registerModal");
        }
    );
}

/* =========================
   LOGOUT
========================= */

if ($("logoutBtn")) {
    $("logoutBtn").addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            logout();
        }
    );
}

/* =========================
   SWITCH LOGIN
========================= */

if ($("switchToLogin")) {
    $("switchToLogin").addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            closeAllModals();

            openModal("loginModal");
        }
    );
}

/* =========================
   SWITCH REGISTER
========================= */

if ($("switchToRegister")) {
    $("switchToRegister").addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            closeAllModals();

            openModal("registerModal");
        }
    );
}

/* =========================
   CLOSE MODAL BUTTONS
========================= */

document
    .querySelectorAll("[data-close-modal]")
    .forEach(button => {

        button.addEventListener(
            "click",
            function(event) {

                event.preventDefault();

                closeAllModals();
            }
        );
    });

/* =========================
   MODAL OVERLAY
========================= */

document
    .querySelectorAll(".modal-overlay")
    .forEach(overlay => {

        overlay.addEventListener(
            "click",
            closeAllModals
        );
    });

/* =========================
   LOGIN FORM
========================= */

if ($("loginForm")) {

    $("loginForm").addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const email =
                $("loginEmail").value.trim();

            const password =
                $("loginPassword").value;

            if (!email || !password) {

                showToast(
                    "Please enter email and password.",
                    "error"
                );

                return;
            }

            await loginUser(
                email,
                password
            );
        }
    );
}

/* =========================
   REGISTER FORM
========================= */

if ($("registerForm")) {

    $("registerForm").addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const name =
                $("registerName").value.trim();

            const email =
                $("registerEmail").value.trim();

            const department =
                $("registerDepartment").value.trim();

            const password =
                $("registerPassword").value;

            if (!name || !email || !password) {

                showToast(
                    "Please fill all required fields.",
                    "error"
                );

                return;
            }

            await registerAccount({
                name,
                email,
                department,
                password
            });
        }
    );
}

/* =========================
   PROFILE FORM
========================= */

if ($("profileForm")) {

    $("profileForm").addEventListener(
        "submit",
        saveProfile
    );
}

/* =========================
   EVENT FORM
========================= */

if ($("eventForm")) {

    $("eventForm").addEventListener(
        "submit",
        saveEvent
    );
}

/* =========================
   ADD EVENT
========================= */

if ($("addEventBtn")) {

    $("addEventBtn").addEventListener(
        "click",
        openAddEvent
    );
}

/* =========================
   SEARCH
========================= */

if ($("eventSearch")) {

    $("eventSearch").addEventListener(
        "input",
        filterEvents
    );
}

/* =========================
   CATEGORY FILTER
========================= */

if ($("categoryFilter")) {

    $("categoryFilter").addEventListener(
        "change",
        filterEvents
    );
}

/* =========================
   REFRESH ADMIN
========================= */

if ($("refreshAdminEvents")) {

    $("refreshAdminEvents").addEventListener(
        "click",
        loadAdminDashboard
    );
}

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
                    .forEach(item => {
                        item.classList.remove(
                            "active"
                        );
                    });

                document
                    .querySelectorAll(".admin-panel")
                    .forEach(panel => {
                        panel.classList.remove(
                            "active"
                        );
                    });

                this.classList.add(
                    "active"
                );

                const tabName =
                    this.dataset.adminTab;

                if (
                    tabName === "events"
                ) {
                    $("adminEventsPanel")
                        ?.classList.add(
                            "active"
                        );
                }

                if (
                    tabName === "registrations"
                ) {
                    $("adminRegistrationsPanel")
                        ?.classList.add(
                            "active"
                        );
                }
            }
        );
    });

/* =========================
   MOBILE MENU
========================= */

if ($("mobileMenuBtn")) {

    $("mobileMenuBtn").addEventListener(
        "click",
        function() {

            const nav =
                document.querySelector(
                    ".nav-links"
                );

            if (nav) {
                nav.classList.toggle(
                    "mobile-open"
                );
            }
        }
    );
}

/* =========================
   INITIALIZE
========================= */

async function init() {

    updateUserUI();

    await loadEvents();

    if (currentUser) {

        console.log(
            "Logged in as:",
            currentUser.name
        );
    }
}

init();
