// SITE LOGIC
// -----------------------------------------------------------------------------
// Shared by all pages. Reads the content from data.js and renders it.
// You normally should NOT need to edit this file — edit js/data.js instead.


// Small helper so text from data.js is treated as plain text, not HTML.
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Formats "2026-08-20" or "2026-08-20T15:30:00" as "August 20, 2026".
function formatDate(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Converts "14:20" to "2:20 PM".
function formatTime12h(timeStr) {
  const parts = timeStr.split(":");
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return h + ":" + m + " " + ampm;
}
// COUNTDOWN

// Reusable countdown component. Creates a card that ticks every second and
// shows Days / Hours / Minutes / Seconds until the target date. When the date
// passes, it shows a clean "has passed" message instead of negative numbers.
// Computes the next occurrence of a recurring weekly event.
// dayOfWeek: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
// timeStr: "HH:MM" in 24h format, e.g. "14:20"
function getNextWeeklyOccurrence(dayOfWeek, timeStr) {
  const now = new Date();
  const parts = timeStr.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  // Build the next candidate: same day-of-week, same time, this week or next
  const candidate = new Date(now);
  candidate.setHours(hours, minutes, 0, 0);

  // Days until the target day-of-week
  const currentDay = now.getDay();
  let daysAhead = dayOfWeek - currentDay;
  if (daysAhead < 0 || (daysAhead === 0 && candidate <= now)) {
    daysAhead += 7;
  }
  candidate.setDate(candidate.getDate() + daysAhead);
  return candidate;
}

function createCountdown(item) {
  const card = document.createElement("div");
  card.className = "countdown-card";

  // TBD dates — no timer, just show the message.
  if (item.tbd) {
    card.innerHTML =
      '<h3 class="countdown-name">' +
      escapeHtml(item.name) +
      "</h3>" +
      (item.note
        ? '<p class="countdown-note">' + escapeHtml(item.note) + "</p>"
        : "") +
      '<p class="countdown-tbd">Date: TBD</p>';
    return card;
  }

  // Recurring weekly — compute the next occurrence dynamically.
  const target = item.recurring === "weekly"
    ? getNextWeeklyOccurrence(item.dayOfWeek, item.time).getTime()
    : new Date(item.date).getTime();
  card.innerHTML =
    '<h3 class="countdown-name">' +
    escapeHtml(item.name) +
    "</h3>" +
    (item.note
      ? '<p class="countdown-note">' + escapeHtml(item.note) + "</p>"
      : "") +
    '<div class="countdown-time">' +
    '<div class="countdown-unit"><span class="countdown-value" data-unit="days">--</span><span class="countdown-label">Days</span></div>' +
    '<div class="countdown-unit"><span class="countdown-value" data-unit="hours">--</span><span class="countdown-label">Hours</span></div>' +
    '<div class="countdown-unit"><span class="countdown-value" data-unit="minutes">--</span><span class="countdown-label">Minutes</span></div>' +
    '<div class="countdown-unit"><span class="countdown-value" data-unit="seconds">--</span><span class="countdown-label">Seconds</span></div>' +
    "</div>" +
    '<p class="countdown-date">' +
    (item.recurring === "weekly"
      ? "Every Wednesday at " + formatTime12h(item.time)
      : formatDate(item.date)) +
    "</p>";

  const values = {
    days: card.querySelector('[data-unit="days"]'),
    hours: card.querySelector('[data-unit="hours"]'),
    minutes: card.querySelector('[data-unit="minutes"]'),
    seconds: card.querySelector('[data-unit="seconds"]'),
  };

  function pad(num) {
    return String(num).padStart(2, "0");
  }

  let timer;
  function update() {
    const diff = target - Date.now();
    if (diff <= 0) {
      // Expired — stop the timer and show a clean message.
      clearInterval(timer);
      card.classList.add("countdown-expired");
      card.querySelector(".countdown-time").innerHTML =
        '<p class="countdown-past">This event has passed.</p>';
      return;
    }
    const totalSeconds = Math.floor(diff / 1000);
    values.days.textContent = Math.floor(totalSeconds / 86400);
    values.hours.textContent = pad(Math.floor((totalSeconds % 86400) / 3600));
    values.minutes.textContent = pad(Math.floor((totalSeconds % 3600) / 60));
    values.seconds.textContent = pad(totalSeconds % 60);
  }

  update();
  timer = setInterval(update, 1000);
  return card;
}

function renderCountdowns() {
  const container = document.getElementById("countdown-list");
  if (!container) return;
  COUNTDOWNS.forEach(function (item) {
    container.appendChild(createCountdown(item));
  });
}
// ANNOUNCEMENTS
// Shows the newest announcement first (sorts by date, then priority).
function renderAnnouncements() {
  const container = document.getElementById("announcements");
  if (!container) return;

  const sorted = ANNOUNCEMENTS.slice().sort(function (a, b) {
    if ((b.priority || 0) !== (a.priority || 0)) {
      return (b.priority || 0) - (a.priority || 0);
    }
    return new Date(b.date) - new Date(a.date);
  });

  sorted.forEach(function (item) {
    const card = document.createElement("article");
    card.className = "announcement-card";

    let html =
      '<header class="announcement-header">' +
      "<h3>" +
      escapeHtml(item.title) +
      "</h3>" +
      '<p class="announcement-date">' +
      formatDate(item.date) +
      "</p>" +
      "</header>" +
      "<p>" +
      escapeHtml(item.description) +
      "</p>";

    if (item.link) {
      html +=
        '<p class="announcement-link"><a href="' +
        escapeHtml(item.link) +
        '" target="_blank" rel="noopener">' +
        escapeHtml(item.linkText || "Learn more") +
        "</a></p>";
    }

    card.innerHTML = html;
    container.appendChild(card);
  });
}

// -----------------------------------------------------------------------------
// EVENTS
// -----------------------------------------------------------------------------
// Event type -> label + CSS class for the colored badge. The label is shown as
// text so event type is never communicated by color alone.
const EVENT_TYPES = {
  meeting: { label: "Meeting", className: "type-meeting" },
  deadline: { label: "Deadline", className: "type-deadline" },
  competition: { label: "Competition", className: "type-competition" },
  conference: { label: "Conference", className: "type-conference" },
  fundraiser: { label: "Fundraiser", className: "type-fundraiser" },
  service: { label: "Community Service", className: "type-service" },
  testing: { label: "Testing", className: "type-testing" },
};

function createEventCard(event) {
  const card = document.createElement("article");
  const type = EVENT_TYPES[event.type] || {
    label: "Event",
    className: "type-meeting",
  };
  card.className = "event-card";

  let html =
    '<div class="event-type ' +
    type.className +
    '">' +
    escapeHtml(type.label) +
    "</div>" +
    "<h3>" +
    escapeHtml(event.name) +
    "</h3>" +
    '<p class="event-meta">' +
    (event.dateTbd ? "Date: TBD" : formatDate(event.date)) +
    (event.time ? " · " + escapeHtml(event.time) : "") +
    (event.location ? " · " + escapeHtml(event.location) : "") +
    "</p>" +
    "<p>" +
    escapeHtml(event.description) +
    "</p>";

  if (event.link) {
    html +=
      '<p class="event-link"><a href="' +
      escapeHtml(event.link) +
      '" target="_blank" rel="noopener">More info</a></p>';
  }

  card.innerHTML = html;
  return card;
}

function renderEvents() {
  const upcoming = document.getElementById("upcoming-events");
  const past = document.getElementById("past-events");
  if (!upcoming && !past) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingList = [];
  const pastList = [];
  EVENTS.forEach(function (event) {
    if (event.dateTbd || new Date(event.date) >= today) {
      upcomingList.push(event);
    } else {
      pastList.push(event);
    }
  });

  // Sort upcoming soonest-first (TBD events last), past most-recent-first.
  upcomingList.sort(function (a, b) {
    if (a.dateTbd && !b.dateTbd) return 1;
    if (!a.dateTbd && b.dateTbd) return -1;
    return new Date(a.date) - new Date(b.date);
  });
  pastList.sort(function (a, b) {
    return new Date(b.date) - new Date(a.date);
  });

  if (upcoming) {
    if (upcomingList.length === 0) {
      upcoming.innerHTML = '<p class="empty-note">No upcoming events yet.</p>';
    } else {
      upcomingList.forEach(function (event) {
        upcoming.appendChild(createEventCard(event));
      });
    }
  }

  if (past) {
    const heading = document.getElementById("past-events-heading");
    if (pastList.length === 0) {
      if (heading) heading.classList.add("hidden");
    } else {
      pastList.forEach(function (event) {
        past.appendChild(createEventCard(event));
      });
    }
  }
}

// -----------------------------------------------------------------------------
// HOME PAGE EVENT PREVIEW
// -----------------------------------------------------------------------------
// Shows the next few upcoming events on the Home page (soonest first).
function renderHomeEvents() {
  const container = document.getElementById("home-events");
  if (!container) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = EVENTS.filter(function (event) {
    return event.dateTbd || new Date(event.date) >= today;
  }).sort(function (a, b) {
    if (a.dateTbd && !b.dateTbd) return 1;
    if (!a.dateTbd && b.dateTbd) return -1;
    return new Date(a.date) - new Date(b.date);
  });

  if (upcoming.length === 0) {
    container.innerHTML =
      '<p class="empty-note">No upcoming events yet. Check back soon.</p>';
    return;
  }

  upcoming.slice(0, 3).forEach(function (event) {
    container.appendChild(createEventCard(event));
  });
}

// -----------------------------------------------------------------------------
// RESOURCES
// -----------------------------------------------------------------------------
function renderResources() {
  const national = document.getElementById("national-resources");
  const arizona = document.getElementById("arizona-resources");
  if (!national && !arizona) return;

  RESOURCES.forEach(function (resource) {
    const card = document.createElement("article");
    card.className = "resource-card";
    card.innerHTML =
      "<h3>" +
      escapeHtml(resource.title) +
      "</h3>" +
      "<p>" +
      escapeHtml(resource.description) +
      "</p>" +
      '<p class="resource-link"><a href="' +
      escapeHtml(resource.url) +
      '" target="_blank" rel="noopener">Visit resource</a></p>';

    if (resource.category === "arizona" && arizona) {
      arizona.appendChild(card);
    } else if (national) {
      national.appendChild(card);
    }
  });
}

// -----------------------------------------------------------------------------
// MOBILE NAVIGATION
// -----------------------------------------------------------------------------
function setupMobileNav() {
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", function () {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  // Close the menu after choosing a link (useful on small screens).
  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

// -----------------------------------------------------------------------------
// INIT
// -----------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
  setupMobileNav();
  renderCountdowns();
  renderAnnouncements();
  renderEvents();
  renderHomeEvents();
  renderResources();
});
