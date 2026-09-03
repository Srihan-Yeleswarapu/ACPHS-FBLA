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

// -----------------------------------------------------------------------------
// ADD TO CALENDAR
// -----------------------------------------------------------------------------
// Any event or countdown can get an "Add to Calendar" button by adding a
// `calendar: { ... }` block to its entry in js/data.js. Every field inside the
// block is optional — see the big comment in data.js for the full list.
//
// What happens on tap depends on the device, so the button always does
// something visible (a silent file download reads like a mystery .ics):
//   iPhone/iPad -> iOS Safari shows its own "Add to Calendar" sheet and
//                  drops the user straight into Apple Calendar.
//   everyone else (Android + desktop) -> opens a pre-filled Google Calendar
//                  save page in a new tab. That's Android's default calendar
//                  app anyway, and on desktop it's just a normal web page
//                  with a Save button.
//
// Date/times are written as "floating" local times (no UTC offset), matching
// how dates are entered in data.js, so the event lands at school-local time
// in whichever calendar app opens it.

function pad2(num) {
  return String(num).padStart(2, "0");
}

// RFC 5545 escaping for text values (backslash, semicolon, comma, newlines).
function icsEscapeText(value) {
  return String(value == null ? "" : value)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// Fold long lines at ~74 chars with a leading space, per RFC 5545.
function icsFold(line) {
  if (line.length <= 74) return line;
  let out = line.slice(0, 74);
  let rest = line.slice(74);
  while (rest.length > 0) {
    out += "\r\n " + rest.slice(0, 73);
    rest = rest.slice(73);
  }
  return out;
}

// Local timestamp like "20260915T091200" (no timezone suffix).
function icsLocalStamp(date) {
  return (
    date.getFullYear() +
    pad2(date.getMonth() + 1) +
    pad2(date.getDate()) +
    "T" +
    pad2(date.getHours()) +
    pad2(date.getMinutes()) +
    pad2(date.getSeconds())
  );
}

// UTC timestamp like "20260825T163000Z" (used for DTSTAMP).
function icsUtcStamp(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// Date only like "20260915".
function icsDateOnly(date) {
  return (
    date.getFullYear() + pad2(date.getMonth() + 1) + pad2(date.getDate())
  );
}

// Safe filename/uid chunk: lowercase letters, numbers, dashes.
function icsSlug(text) {
  const slug = String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "event";
}

// Minutes -> RFC 5545 duration like "PT1H30M".
function icsDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  let out = "PT";
  if (h > 0) out += h + "H";
  if (m > 0) out += m + "M";
  return out === "PT" ? "PT0M" : out;
}

// Turns an event/countdown's `calendar` block into a fully-resolved config,
// filling gaps from the parent entry (name/date/description/location/link).
// Returns null when the entry has no usable calendar info (e.g. no date).
function resolveCalendar(item) {
  const cal = item.calendar;
  if (!cal || typeof cal !== "object") return null;

  const startSrc = cal.start || item.date || "";
  const start = startSrc ? new Date(startSrc) : null;
  if (!start || isNaN(start.getTime())) return null;

  let end = null;
  if (cal.end) {
    const parsedEnd = new Date(cal.end);
    if (!isNaN(parsedEnd.getTime())) end = parsedEnd;
  }
  // No explicit end -> use durationMinutes (default 60). All-day events are
  // handled separately in buildIcs (their end date is inclusive).
  if (!end && !cal.allDay) {
    const minutes =
      typeof cal.durationMinutes === "number" && cal.durationMinutes > 0
        ? cal.durationMinutes
        : 60;
    end = new Date(start.getTime() + minutes * 60000);
  }

  const upper = function (v, allowed, fallback) {
    const s = String(v || "").toUpperCase();
    return allowed.indexOf(s) !== -1 ? s : fallback;
  };

  return {
    title: cal.title || item.name || "FBLA-IT Event",
    description:
      cal.description != null ? String(cal.description) : item.description || "",
    location:
      cal.location != null ? String(cal.location) : item.location || "",
    url: cal.url ? String(cal.url) : item.link || "",
    start: start,
    end: end,
    allDay: cal.allDay === true,
    categories: Array.isArray(cal.categories) ? cal.categories : [],
    status: upper(cal.status, ["CONFIRMED", "TENTATIVE", "CANCELLED"], "CONFIRMED"),
    transparent: cal.transparent === true,
    privacy: upper(cal.privacy, ["PUBLIC", "PRIVATE", "CONFIDENTIAL"], "PUBLIC"),
    priority:
      typeof cal.priority === "number" && cal.priority >= 0 && cal.priority <= 9
        ? Math.round(cal.priority)
        : null,
    geo: typeof cal.geo === "string" ? cal.geo.trim() : "",
    color: cal.color ? String(cal.color) : "",
    organizer:
      cal.organizer && typeof cal.organizer === "object" ? cal.organizer : null,
    attendees: Array.isArray(cal.attendees) ? cal.attendees : [],
    reminders: Array.isArray(cal.reminders)
      ? cal.reminders.filter(function (m) {
          return typeof m === "number" && m > 0;
        })
      : [],
    recurrence: cal.recurrence ? String(cal.recurrence).trim() : "",
  };
}

// Builds the full .ics file text for a resolved calendar config.
function buildIcs(c) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ACPHS FBLA-IT Website//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:" + icsSlug(c.title) + "-" + icsLocalStamp(c.start) + "@acphs-fbla-it",
    "DTSTAMP:" + icsUtcStamp(new Date()),
  ];

  if (c.allDay) {
    lines.push("DTSTART;VALUE=DATE:" + icsDateOnly(c.start));
    // DTEND for date values is exclusive, but data.js treats `end` as the
    // inclusive last day — so add one day here.
    let endDay;
    if (c.end) {
      endDay = new Date(c.end);
      endDay.setDate(endDay.getDate() + 1);
      endDay = icsDateOnly(endDay);
    } else {
      const next = new Date(c.start);
      next.setDate(next.getDate() + 1);
      endDay = icsDateOnly(next);
    }
    lines.push("DTEND;VALUE=DATE:" + endDay);
  } else {
    lines.push("DTSTART:" + icsLocalStamp(c.start));
    if (c.end) lines.push("DTEND:" + icsLocalStamp(c.end));
  }

  lines.push("SUMMARY:" + icsEscapeText(c.title));

  if (c.description) lines.push("DESCRIPTION:" + icsEscapeText(c.description));
  if (c.location) lines.push("LOCATION:" + icsEscapeText(c.location));
  if (c.url) lines.push("URL:" + icsEscapeText(c.url));
  if (c.categories.length > 0) {
    lines.push(
      "CATEGORIES:" + c.categories.map(icsEscapeText).join(",")
    );
  }

  lines.push("STATUS:" + c.status);
  lines.push("TRANSP:" + (c.transparent ? "TRANSPARENT" : "OPAQUE"));
  lines.push("CLASS:" + c.privacy);
  if (c.priority !== null) lines.push("PRIORITY:" + c.priority);

  // GEO uses "lat;long" — its semicolon is a separator, never escaped.
  if (/^-?\d+(\.\d+)?\s*;\s*-?\d+(\.\d+)?$/.test(c.geo)) {
    lines.push("GEO:" + c.geo.replace(/\s+/g, ""));
  }
  if (c.color) lines.push("COLOR:" + icsEscapeText(c.color));

  if (c.organizer && c.organizer.email) {
    lines.push(
      (c.organizer.name ? "ORGANIZER;CN=" + icsEscapeText(c.organizer.name) + ":" : "ORGANIZER:") +
        "mailto:" + icsEscapeText(c.organizer.email)
    );
  }
  c.attendees.forEach(function (person) {
    if (person && person.email) {
      lines.push(
        (person.name ? "ATTENDEE;CN=" + icsEscapeText(person.name) + ";" : "ATTENDEE;") +
          "ROLE=REQ-PARTICIPANT:mailto:" + icsEscapeText(person.email)
      );
    }
  });

  if (c.recurrence) lines.push("RRULE:" + icsEscapeText(c.recurrence));

  c.reminders.forEach(function (minutes) {
    lines.push(
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "TRIGGER:-" + icsDuration(minutes),
      "DESCRIPTION:Reminder",
      "END:VALARM"
    );
  });

  lines.push("SEQUENCE:0");
  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");

  return lines.map(icsFold).join("\r\n") + "\r\n";
}

// iPhone/iPad need the calendar file opened as a real navigation. A data URI
// can get downloaded by newer mobile browsers, so use a temporary .ics URL.
function isAppleMobileDevice() {
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return true;
  return /Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1;
}

function openIcsFile(c) {
  const file = new File([buildIcs(c)], "fbla-event.ics", {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(file);
  window.location.href = url;
  setTimeout(function () {
    URL.revokeObjectURL(url);
  }, 60000);
}

// Google Calendar's pre-filled "save this event" page. Same info as the ics,
// just handed over as a web page instead of a file.
function googleCalendarUrl(c) {
  const params = new URLSearchParams();
  params.set("action", "TEMPLATE");
  params.set("text", c.title);
  if (c.allDay) {
    // Google wants the end date exclusive, same as the ics code above.
    const endDay = c.end ? new Date(c.end) : new Date(c.start);
    endDay.setDate(endDay.getDate() + 1);
    params.set("dates", icsDateOnly(c.start) + "/" + icsDateOnly(endDay));
  } else {
    params.set("dates", icsLocalStamp(c.start) + "/" + icsLocalStamp(c.end));
  }
  if (c.location) params.set("location", c.location);
  let details = c.description || "";
  if (c.url) details += (details ? "\n" : "") + c.url;
  if (details) params.set("details", details);
  return "https://calendar.google.com/calendar/render?" + params.toString();
}

// Sends the event to the user's calendar the native way for their device.
function openCalendarEvent(c) {
  if (isAppleMobileDevice()) {
    openIcsFile(c);
    return;
  }
  window.open(googleCalendarUrl(c), "_blank", "noopener");
}

// Adds an "Add to Calendar" button to a card when the item opts in via a
// `calendar` block and hasn't already happened.
function attachAddToCalendar(card, item) {
  const config = resolveCalendar(item);
  if (!config) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (config.start < today) return;

  const wrap = document.createElement("p");
  wrap.className = "card-actions";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "ics-button";
  button.textContent = "Add to Calendar";
  button.addEventListener("click", function () {
    openCalendarEvent(config);
  });

  wrap.appendChild(button);
  card.appendChild(wrap);
}
// COUNTDOWN

// Reusable countdown component. Creates a card that ticks every second and
// shows Days / Hours / Minutes / Seconds until the target date. When the date
// passes, it shows a clean "has passed" message instead of negative numbers.
// Computes the next occurrence of a recurring weekly event.
// dayOfWeek: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
// timeStr: "HH:MM" in 24h format, e.g. "14:20"
// skipDates: optional list of cancelled dates as "YYYY-MM-DD". If the next
// occurrence lands on one of those, it jumps ahead a week (so a cancelled
// meeting counts down to the following week's meeting instead).
function getNextWeeklyOccurrence(dayOfWeek, timeStr, skipDates) {
  const skip = Array.isArray(skipDates) ? skipDates : [];
  const dateKey = function (d) {
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  };
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

  // Walk past any cancelled dates (capped so a bad list can't loop forever).
  let guard = 0;
  while (skip.indexOf(dateKey(candidate)) !== -1 && guard < 52) {
    candidate.setDate(candidate.getDate() + 7);
    guard++;
  }
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
  const skipList = Array.isArray(item.skipDates) ? item.skipDates : [];
  const target = item.recurring === "weekly"
    ? getNextWeeklyOccurrence(item.dayOfWeek, item.time, skipList).getTime()
    : new Date(item.date).getTime();

  // While a cancelled date is still current (or still ahead), say so on the
  // card. Once the date passes, the note disappears on its own.
  let skipLine = "";
  if (item.recurring === "weekly" && skipList.length > 0) {
    const now = new Date();
    const upcomingSkip = skipList.find(function (d) {
      return new Date(d + "T23:59:59") >= now;
    });
    if (upcomingSkip) {
      skipLine =
        item.skipNote ||
        "No meeting " + formatDate(upcomingSkip) + " — cancelled";
    }
  }

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
    "</p>" +
    (skipLine
      ? '<p class="countdown-skip">' + escapeHtml(skipLine) + "</p>"
      : "");

  const values = {
    days: card.querySelector('[data-unit="days"]'),
    hours: card.querySelector('[data-unit="hours"]'),
    minutes: card.querySelector('[data-unit="minutes"]'),
    seconds: card.querySelector('[data-unit="seconds"]'),
  };

  attachAddToCalendar(card, item);

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
  attachAddToCalendar(card, event);
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
