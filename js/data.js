// SITE CONTENT
// This is the ONLY file you need to edit to change the website's content.
// All pages load this file. Keep the structure (the shape of each item) the
// same and just fill in your own values.
//
// pls dont mess this up... it links up to everything
//
// ============================== ADD TO CALENDAR ==============================
// Any countdown or event can show an "Add to Calendar" button. On iPhone/iPad
// it opens Apple Calendar's own "Add to Calendar" screen; on Android and
// desktop it opens a pre-filled Google Calendar page (one tap to save).
// Add a `calendar: { ... }` block to an entry to turn it on. NO block = NO
// button (officer-only stuff should stay without one).
//
// EVERY field inside `calendar` is optional — skip whatever you don't need.
//
//   title            -> event name in the calendar file
//                       (default: the entry's name)
//   description      -> notes shown in the calendar app
//                       (default: the entry's description)
//   location         -> where it happens (default: the entry's location)
//   start            -> "YYYY-MM-DDTHH:MM:SS" start time
//                       (default: the entry's date)
//   end              -> "YYYY-MM-DDTHH:MM:SS" end time
//   durationMinutes  -> alternative to end: how long it lasts
//                       (default: 60 minutes if neither is given)
//   allDay           -> true = all-day event, ignores time
//                       (end then means the inclusive LAST day)
//   url              -> link attached to the event (default: the entry's link)
//   categories       -> tags, e.g. ["Meeting", "Chapter"]
//   status           -> "CONFIRMED" (default), "TENTATIVE", or "CANCELLED"
//   transparent      -> true = shows as "Free" instead of "Busy"
//   privacy          -> "PUBLIC" (default), "PRIVATE", or "CONFIDENTIAL"
//   priority         -> 0–9 (0 = none, 1 = highest, 9 = lowest)
//   geo              -> map coordinates "latitude;longitude",
//                       e.g. "33.3062;-111.6843"  (semicolon required)
//   color            -> color hint some apps use, e.g. "purple"
//   organizer        -> { name: "Ms. Adviser", email: "adviser@acp.org" }
//   attendees        -> list of { name: "...", email: "..." }
//   reminders        -> pop-up reminders BEFORE start, in minutes,
//                       e.g. [1440, 10] = 1 day and 10 minutes before
//   recurrence       -> raw repeat rule for repeating events,
//                       e.g. "FREQ=WEEKLY;BYDAY=WE" = every Wednesday
// =============================================================================

// COUNTDOWNS
// Each entry shows a live countdown on the Home page until its date passes.
//   name  -> the label shown above the timer
//   date  -> target date/time, format "YYYY-MM-DDTHH:MM:SS" (local time)
//   note  -> optional short line under the label
//
// To add another countdown (registration deadline, competition, conference...),
// copy an entry and change the values.
const COUNTDOWNS = [
  {
    name: "FBLA-IT Officer Meeting",
    recurring: "weekly",
    dayOfWeek: 3, // 0=Sun, 1=Mon, 2=Tue, 3=Wed, ...
    time: "14:20", // 2:20 PM in 24h
    note: "Officers only",
    // no calendar block — officers only, so no Add to Calendar button
  },
  {
    name: "Next FBLA-IT Meeting",
    date: "2026-09-15T09:12:00",
    note: "Kickoff meeting · Cafeteria",
    calendar: {
      title: "FBLA-IT Kickoff Meeting",
      location: "Cafeteria",
      durationMinutes: 45,
      categories: ["Meeting", "Chapter"],
      status: "CONFIRMED",
      reminders: [1440, 10],
      description:
        "First chapter meeting of the 2026–2027 school year. Open to all members.",
    },
  },

];
// ANNOUNCEMENTS
// The Home page shows the newest announcement first, so add new announcements
// to the TOP of this list. Only the first (latest) one is featured.
//   title       -> headline
//   date        -> date shown with the announcement, e.g. "2026-08-20"
//   description -> body text
//   link        -> optional URL (omit or set to "" for no link)
//   linkText    -> optional text for the link button
//   priority    -> optional number; higher numbers are shown first
const ANNOUNCEMENTS = [
  {
    title: "Website is ready!",
    date: "",
    description: "Srihan and Gabriel have successfully completed building the ACPHS FBLA Website!"
  }
];
// EVENTS
// Shown chronologically on the Events page (upcoming first, past events below).
//   name        -> event title
//   date        -> "YYYY-MM-DD"
//   time        -> optional, e.g. "3:30 PM" (leave "" if not applicable)
//   location    -> optional, e.g. "Room 112" (leave "" if not applicable)
//   description -> short description
//   type        -> one of: meeting, deadline, competition, conference,
//                  fundraiser, service, testing  (controls the colored badge)
//   link        -> optional external URL (leave "" for none)
//   calendar    -> optional block that adds an "Add to Calendar" button.
//                  See the big ADD TO CALENDAR section at the top of this
//                  file for every option. Only add it to member events —
//                  officer-only stuff shouldn't have one.
//
// PLACEHOLDER NOTE: several dates/descriptions below are placeholders for the
// 2026–2027 school year. Replace them with the real chapter schedule.
const EVENTS = [
  {
    name: "Club Fair",
    date: "2026-08-12T00:00:00",
    time: "8:40 AM",
    location: "",
    description:
      "FBLA-IT table at the ACP High School Club Fair.",
    type: "meeting",
    link: "",
  },
  {
    name: "FBLA-IT Kickoff Meeting",
    date: "2026-09-15T00:00:00",
    time: "9:12 AM",
    location: "Cafeteria",
    description:
      "First chapter meeting of the 2026–2027 school year. Open to all members.",
    type: "meeting",
    link: "",
    calendar: {
      start: "2026-09-15T09:12:00",
      durationMinutes: 45,
      categories: ["Meeting", "Chapter"],
      reminders: [1440, 10],
    },
  },
  {
    name: "Regional Competitive Events",
    date: "",  // TBD
    dateTbd: true,
    time: "",
    location: "",
    description:
      "Arizona FBLA regional competitive events. Details announced closer to the date.",
    type: "competition",
    link: "https://www.azfbla.org/competitive-events/4594001338",
  },
  {
    name: "Arizona State Leadership Conference",
    date: "2027-04-07T00:00:00",
    time: "TBD",
    location: "Tucson Convention Center · Tucson, AZ",
    description:
      "Arizona FBLA's annual state leadership conference · April 7–9, 2027. Qualifiers from regionals compete here.",
    type: "conference",
    link: "https://www.azfbla.org/",
  },
  {
    name: "FBLA National Leadership Conference",
    date: "2027-06-23T00:00:00",
    time: "TBD",
    location: "Greater Columbus Convention Center · Columbus, OH",
    description:
      "The National Leadership Conference for qualifying members · June 23–26, 2027.",
    type: "conference",
    link: "https://www.fbla.org/nlc-ms-hs/",
  },
];
// RESOURCES
// Shown as cards on the Resources page, grouped by category.
//   title       -> card title
//   description -> short description
//   url         -> official link
//   category    -> "national" (National FBLA) or "arizona" (Arizona FBLA)
//
// When the 2026–2027 competitive-event guidelines are released (expected around
// September 1, 2026), update the "2026–2027 High School Competitive Events" card
// below — just edit its title/description/url.
const RESOURCES = [
  // ---- National FBLA ----
  {
    title: "FBLA High School",
    description:
      "The official home of FBLA for high school members — learn what FBLA is and how to get involved.",
    url: "https://www.fbla.org/high-school/",
    category: "national",
  },
  {
    title: "High School Membership",
    description:
      "Membership benefits, how to join, and what FBLA offers high school students.",
    url: "https://www.fbla.org/high-school/membership/",
    category: "national",
  },
  {
    title: "High School Competitive Events",
    description:
      "Overview of FBLA's high school competitive-event program and how competitions work.",
    url: "https://www.fbla.org/high-school/competitive-events/",
    category: "national",
  },
  {
    title: "2026–2027 High School Competitive Events",
    description:
      "This year's competitive events, guidelines, topics, and rating sheets. New materials are expected around September 1, 2026.",
    url: "https://www.fbla.org/hs-ce-26-27/",
    category: "national",
  },
  {
    title: "Education Programs",
    description:
      "Academic programs and learning resources available to high school members.",
    url: "https://www.fbla.org/high-school/education-programs/",
    category: "national",
  },
  {
    title: "Scholarships & Financial Aid",
    description:
      "Scholarships and financial aid opportunities for FBLA members.",
    url: "https://www.fbla.org/high-school/hs-scholarships-aid/",
    category: "national",
  },
  {
    title: "National Leadership Conference",
    description:
      "Information about the annual National Leadership Conference for middle school and high school members.",
    url: "https://www.fbla.org/nlc-ms-hs/",
    category: "national",
  },
  {
    title: "NLC Conference Programming",
    description:
      "NLC events, programming, and schedules for the National Leadership Conference.",
    url: "https://www.fbla.org/nlc-ms-hs/programming/",
    category: "national",
  },
  {
    title: "FBLA Brand Center",
    description:
      "Official FBLA logos, colors, and brand guidelines.",
    url: "https://www.fbla.org/brand-center/",
    category: "national",
  },
  {
    title: "Adviser Resources",
    description:
      "Resources and tools for chapter advisers.",
    url: "https://www.fbla.org/adviser-resources/",
    category: "national",
  },
  // ---- Arizona FBLA ----
  {
    title: "Arizona FBLA",
    description:
      "The official Arizona FBLA state association — state events, deadlines, and news.",
    url: "https://www.azfbla.org/",
    category: "arizona",
  },
  {
    title: "Arizona FBLA Competitive Events",
    description:
      "Arizona's competitive-event information for high school members, including regional registration.",
    url: "https://www.azfbla.org/competitive-events/4594001338",
    category: "arizona",
  },
];
