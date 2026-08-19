# FBLA-IT website

this is the website for FBLA-IT at ACP High School. It has 3 pages: home, events, and resources.

Written in HTML, CSS and Javascript

## Website Execution

Just open index.html in your browser. that's it. no installs, no setup.

(Or run this in the folder: `python -m http.server 8080` and go to http://localhost:8080)

## Where to modify

Most edits can be done by changing one file: `js/data.js`, you'll never need to touch the other files unless you're changing how the site looks or works.

## Adding events

Go to js/data.js, find the `EVENTS` part, copy one of the existing events, paste it, and change the data. it looks like this:

```js
{
  name: "event name",
  date: "2026-09-10T00:00:00",
  time: "3:30 PM",
  location: "room 101",
  description: "what this event is",
  type: "meeting",
  link: "",
},
```

- `type` decides the little colored tag. options: meeting, deadline, competition, conference, fundraiser, service, testing
- Ff you don't know the date yet, put `date: ""` and add `dateTbd: true` and it'll show "date: tbd"
- `link` is optional. leave it `""` if there's no link

## Changing Announcements

Find the `ANNOUNCEMENTS` part in js/data.js. add new ones at the TOP. the newest one shows first.

```js
{
  title: "announcement title",
  date: "2026-08-20",
  description: "what it says",
  link: "",
  linkText: "",
  priority: 1,
},
```

## Adding Countdowns

Find the `COUNTDOWNS` part in js/data.js. copy an entry, change the name and date. the date has to be like `"2026-09-10T15:30:00"`.

If the date is tbd, put `date: ""` and add `tbd: true`.

## Adding Resources

Find the `RESOURCES` part in js/data.js. copy an entry and change it. `category` is either `"national"` (national fbla) or `"arizona"` (arizona fbla).

## Replacing Logos

Placeholder logos can be found in the `images` folder: acp-logo.svg and fbla-logo.svg. replace those files with the real logos. Keep the same file names so the site keeps working.

## Color

The ACP purple is set at the top of `css/styles.css`. look for `--acp-purple`. change the hex code there if you get the real color.

## the files

```
index.html       the home page
events.html      the events page
resources.html   the resources page
css/styles.css   all the styling
js/data.js       ALL the content. edit this one.
js/site.js       the code that puts stuff on the page. you probably won't touch this.
images/          logos and the little browser icon
```

## Things to know

- The 2026-27 competitive event stuff comes out around sept 1, 2026. when it does, update the "2026-2027 high school competitive events" card in js/data.js
- A bunch of the event dates are placeholders for now. they're marked with comments like `// placeholder`. swap them for the real dates when you have them.
- No login, no accounts, no database. that's on purpose. keep it that way.
