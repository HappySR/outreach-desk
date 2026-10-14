# Outreach Desk

A SvelteKit app that finds local businesses every day, ranks them by how likely they are to say yes,
sorts them by the service they need (QR menu, booking website, business website, catalogue, app,
Google Business Profile), drafts the message and price for you, and tracks replies and follow-ups.

You approve each message. Approving opens WhatsApp (or your mail app) with the message pre-filled,
and you press send. The app never sends anything on its own.

## What is automatic and what is not

| Automatic | Manual |
|---|---|
| Daily search of Google Maps listings (server-side, Google Places API) | Pressing send in WhatsApp or email |
| Detecting businesses with no website | Pasting a customer's reply into the thread |
| Dropping chains, closed and duplicate listings | Building the demo and customised sites |
| Ranking, service labels, drafts, pricing, follow-up dates | Checking prices against the local market |

WhatsApp replies cannot be read automatically. Cold messages to unknown numbers are not allowed on the
official WhatsApp Business API, so this app uses click-to-chat links instead.

## Setup (about 10 minutes)

1. **Google Places API key**
   - Open Google Cloud Console, create a project and enable billing.
   - Enable **Places API (New)** and create an API key. Restrict it to that API.
   - Google requires a billing account (a payment method on file) before the API works, even though
     light use stays inside the free allowance. Set a budget alert in Google Cloud, and add a daily quota
     on the Places API so a bug can never run up a bill.
   - This app asks for phone numbers and websites, which Google bills as "Text Search Enterprise".
     At the time of writing that has a free allowance of 1,000 requests a month, then a per-request charge.
     One search uses about (cities x business types x 2) requests, and the Discover page shows how many you
     have used this month. Check current prices on Google's pricing page.
2. **Install and configure**
   ```bash
   npm install
   cp .env.example .env      # then edit .env
   ```
   Set `GOOGLE_PLACES_API_KEY`, `APP_PASSWORD`, `SESSION_SECRET` and (optionally) `AUTO_DISCOVER_TIME`.
3. **Run it**
   ```bash
   npm run dev               # development at http://localhost:5173
   # or for real use
   npm run build && npm start
   ```
4. Open the app, sign in, go to **Discover**, enter your cities and business types, and press
   **Find leads now**. Then work through **Today's queue**.

## Running it every day

* **On your own computer or a VPS (Node running all day):** set `AUTO_DISCOVER_TIME=08:30` in `.env`.
  The app searches once a day at that IST time.
* **On a host that sleeps (free tiers, serverless):** set `CRON_SECRET` and have a cron service
  (cron-job.org, GitHub Actions) call
  `GET https://your-app/api/cron/discover` with the header `Authorization: Bearer <CRON_SECRET>`.
* The database is a single SQLite file (`DB_PATH`). Put it on a persistent disk and back it up.
  Do not deploy to a host with no persistent disk, or you will lose your leads on every restart.

## Getting more leads in the same day

After you approve or skip everything in **Today's queue**, press **Find more leads** (top of the queue,
you choose how many). The app searches again, digs deeper with other wordings of the query when the
first results are used up, and adds only businesses you have not seen before.

## Daily routine

1. Open **Conversations** and handle follow-ups that are due.
2. Open **Today's queue**, check the website field on promising leads, and approve up to 20 messages.
3. When someone replies, paste it into the thread. The app drafts the next message for each stage.

## Project layout

```
src/lib/shared/catalog.js   services, scoring, pricing, message drafting (pure functions)
src/lib/server/db.js        SQLite storage
src/lib/server/places.js    Google Places API (New) client
src/lib/server/discover.js  daily lead search, filtering and ranking
src/lib/server/actions.js   approve / reply / send / stage rules
src/lib/server/scheduler.js built-in daily scheduler
src/routes/                 pages and JSON API
scripts/test.js             end-to-end test with a fake Places server (npm run build && npm test)
```

## Compliance notes

* Only contact numbers businesses have published for enquiries, send one message plus two follow-ups,
  and use **Do not contact again** whenever someone asks you to stop.
* Pricing ranges and the "agencies charge more" line are your own estimates. Verify them locally.
* Ask a CA about GST and income tax for freelance income.
