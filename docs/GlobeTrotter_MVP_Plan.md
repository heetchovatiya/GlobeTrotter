# GlobeTrotter — Full MVP Build Plan
*(Production-shaped, hackathon-timed. We're not cutting corners, just cutting scope.)*

---

## 0. Reconciling the two documents

The PDF gives you the *why* (13 feature screens, business logic). The Excalidraw gives you the *how it looks* (12 numbered screens + wiring). They don't number-match 1:1, so here's the merge table — this is your source of truth from now on, not either file individually.

| # | Screen (final name) | PDF ref | Wireframe ref |
|---|---|---|---|
| 1 | Login | Screen 1 | Screen 1 |
| 2 | Registration | (implied by "Signup link") | Screen 2 |
| 3 | Dashboard / Landing | Screen 2 | Screen 3 |
| 4 | Create Trip | Screen 3 | Screen 4 |
| 5 | Build Itinerary | Screen 5 | Screen 5 |
| 6 | My Trips (list) | Screen 4 | Screen 6 |
| 7 | User Profile / Settings | Screen 12 | Screen 7 |
| 8 | City/Activity Search | Screens 7, 8 | Screen 8 |
| 9 | Itinerary View + Budget | Screens 6, 9 | Screen 9 |
| 10 | Community Tab | *not in PDF* | Screen 10 |
| 11 | Calendar / Timeline View | Screen 10 | Screen 11 |
| 12 | Admin Panel | Screen 13 (optional) | Screen 12 |
| — | Shared/Public Itinerary | Screen 11 | *not drawn, still required* |

Two things worth flagging before you write code:
- **Community Tab** exists only in the wireframe. It's a genuinely new scope item (public trip sharing + social discovery), not just a reskin of "Shared Itinerary View" from the PDF. Treat it as its own build item, not a freebie.
- **Shared/Public Itinerary View** exists only in the PDF. The wireframe never drew it, probably because "public read-only page" is the same template as the normal Itinerary View with edit buttons removed. Build it that way — don't design a new screen from scratch.

---

## 1. Data Model (PostgreSQL, relational — this is non-negotiable per the brief)

```
users
  id PK, name, email UNIQUE, password_hash, profile_photo_url,
  language_pref, phone_number, city, country, role ENUM('user','admin'),
  created_at

trips
  id PK, user_id FK->users, name, start_date, end_date,
  description, cover_photo_url, status ENUM('planning','ongoing','completed'),
  is_public BOOLEAN default false, created_at, updated_at

stops
  id PK, trip_id FK->trips, city_id FK->cities, order_index INT,
  arrival_date, departure_date

cities
  id PK, name, country, cost_index NUMERIC, popularity_score INT,
  image_url

activities
  id PK, city_id FK->cities, name, type ENUM('sightseeing','food','adventure','culture','nightlife'),
  cost NUMERIC, duration_mins INT, description, image_url

trip_sections
  -- maps directly to wireframe's "Section 1 / Section 2 / Section 3" in Build Itinerary
  id PK, stop_id FK->stops, title, type ENUM('travel','stay','activity','other'),
  date_range_start, date_range_end, budget NUMERIC, notes, order_index

trip_activities
  id PK, section_id FK->trip_sections, activity_id FK->activities NULLABLE,
  scheduled_date, scheduled_time, cost_override NUMERIC, custom_label

expenses
  -- backs the Budget screen's pie/bar charts
  id PK, trip_id FK->trips, category ENUM('transport','stay','activities','meals','other'),
  amount NUMERIC, section_id FK->trip_sections NULLABLE

shared_trips
  id PK, trip_id FK->trips, public_slug UNIQUE, created_at

community_posts
  -- backs the Community Tab
  id PK, user_id FK->users, trip_id FK->trips NULLABLE, content TEXT,
  image_url, created_at

community_comments
  id PK, post_id FK->community_posts, user_id FK->users, content, created_at
```

**Why `trip_sections` instead of jamming everything into `trip_activities`:** the Build Itinerary wireframe literally shows "Section 1 / Section 2 / Section 3," each with its own date range and its own budget, and each section can be "travel, hotel, or any other activity" per the sticky note on the drawing. That's a distinct entity, not a flavor of activity. Model it as one or you'll be retrofitting this table at 3am.

---

## 2. Screen-by-screen: UI, data needed, API calls

### 1. Login
- **UI:** Username, Password, Login button, link to Register.
- **Data in:** `POST /auth/login {email, password}` → JWT.
- **Data out:** none.

### 2. Registration
- **UI:** First Name, Last Name, Email, Phone, City, Country, Photo upload, Additional Info.
- **API:** `POST /auth/register` (multipart if photo included) → JWT + user object.

### 3. Dashboard / Landing
- **UI:** Search bar, "Top Regional Selections," "Previous Trips" carousel.
- **Data needed:**
  - `GET /cities?sort=popularity&limit=8` → Top Regional Selections
  - `GET /trips?user_id=me&status=completed&limit=5` → Previous Trips
- Search bar hits the same endpoint as City Search (§8), just with a smaller result preview.

### 4. Create Trip
- **UI:** Trip name, Start Date, End Date, Description, cover photo, Save.
- **API:** `POST /trips {name, start_date, end_date, description, cover_photo}` → returns `trip_id`, redirect straight into Build Itinerary for that trip. Don't make the user hunt for it afterward.

### 5. Build Itinerary
- **UI:** Repeating "Section" blocks (travel/stay/activity), each with date range + budget, "Add another Section" button.
- **API:**
  - `POST /trips/:id/stops` (city + dates) when adding a new stop
  - `POST /trips/:id/stops/:stopId/sections {title, type, date_range, budget}` per section
  - `PATCH /sections/:id` for edits, `DELETE /sections/:id` for removal
  - This screen is write-heavy — debounce autosave on the frontend so users aren't losing 20 minutes of section-building to a refresh.

### 6. My Trips (List)
- **UI:** Tabs — Ongoing / Upcoming / Completed. Group by, Filter, Sort by. Trip cards with "Short Overview."
- **API:** `GET /trips?user_id=me&status=ongoing|upcoming|completed&sort=&group_by=`
- Status is derived server-side from `start_date`/`end_date` vs `NOW()` — don't make the client compute this, it'll drift out of sync across timezones.

### 7. User Profile / Settings
- **UI:** User image, editable details, "Preplanned Trips" and "Previous Trips" with "View" links.
- **API:** `GET /users/me`, `PATCH /users/me`, `GET /trips?user_id=me&status=planning` (Preplanned), `GET /trips?user_id=me&status=completed` (Previous).

### 8. City Search / Activity Search
- **UI:** Search bar, Results grid, Filter, Sort by, Group by. Wireframe explicitly shows a search example ("Paragliding").
- **API:**
  - `GET /cities?q=&country=&sort=`
  - `GET /activities?q=&city_id=&type=&max_cost=&sort=`
- Debounce the search input (300ms) — don't fire a query per keystroke against a live DB in a demo.

### 9. Itinerary View + Budget
- **UI:** Day 1 / Day 2 (expandable), "Itinerary for a selected place," expense panel, group/filter/sort.
- **API:**
  - `GET /trips/:id/itinerary` → day-grouped sections + activities (this is a joined/aggregated read, build it as one endpoint, not five round trips from the frontend)
  - `GET /trips/:id/budget` → sum of `expenses` grouped by category, plus `estimated vs actual` per day for the "overbudget" alerts the PDF calls out
- This is your most expensive query. Precompute the day-grouping server-side; don't ship raw rows and make React do date-bucketing in a render loop.

### 10. Community Tab
- **UI:** Feed of shared trip experiences, search/group/filter/sort.
- **API:**
  - `GET /community/posts?sort=recent|popular`
  - `POST /community/posts {trip_id?, content, image}`
  - `POST /community/posts/:id/comments`
- Scope guard: for MVP, this can just be "publish your public trip as a post + comment thread." Don't build likes, follows, or a ranking algorithm unless you have hours to spare — you won't.

### 11. Calendar / Timeline View
- **UI:** Full calendar grid, expandable days, drag-to-reorder.
- **API:** Same data as §9 (`GET /trips/:id/itinerary`), different rendering only. Reuse the endpoint — do not build a second one that returns the same data shaped differently.
- Drag-to-reorder → `PATCH /sections/:id {order_index}` on drop.

### 12. Admin Panel
- **UI:** Manage Users, Popular Cities, Popular Activities, User Trends & Analytics.
- **API:**
  - `GET /admin/users` (+ suspend/delete actions)
  - `GET /admin/analytics/cities` → top cities by trip count
  - `GET /admin/analytics/activities` → top activities by booking count
  - `GET /admin/analytics/trends` → trips created over time, active users
- Gate all `/admin/*` routes with a role check server-side. Not "hide the button in the UI" — actually check the JWT role claim. This is the one screen where a demo shortcut becomes a real vulnerability if it ever leaves the hackathon.

### 13. Shared/Public Itinerary View
- **UI:** Same as §9, read-only, no auth wall, "Copy Trip" button.
- **API:** `GET /public/:slug` (no JWT required) → same shape as `/trips/:id/itinerary` but scoped through `shared_trips.public_slug`.
- `POST /public/:slug/copy` (requires auth) → clones the trip + stops + sections into the requesting user's account. This is the one feature every judge will click, so don't leave it for "if we have time."

---

## 3. Frontend architecture

**Stack:** React + Vite, Tailwind, React Router, Zustand or Context for trip-builder state (it's genuinely stateful — sections/dates/budgets edited across multiple screens), Recharts for budget visuals, react-big-calendar (or a lean custom grid if you want fewer dependencies) for §11.

**Routing:**
```
/login  /register
/                          → Dashboard
/trips                     → My Trips
/trips/new                 → Create Trip
/trips/:id/build           → Build Itinerary
/trips/:id                 → Itinerary View + Budget
/trips/:id/calendar        → Calendar View
/search                    → City/Activity Search
/community                 → Community Tab
/profile                   → User Profile
/admin                     → Admin Panel (role-gated route)
/t/:slug                   → Public shared itinerary (no auth)
```

**Responsive breakpoints** (mobile-first, since every screen in the wireframe is drawn as a single vertical column — that's already a mobile layout, good instinct to preserve):
- `< 640px`: single column, stacked cards, bottom nav bar instead of top nav
- `640–1024px`: two-column for lists (My Trips, Search Results), single-column detail views
- `> 1024px`: sidebar nav + main content, budget charts move from stacked to side-by-side

Build mobile-first CSS, then widen — matches the wireframe's native shape and saves you a redesign pass later.

---

## 4. Build order (priority-ranked, not screen-numbered)

1. DB schema + migrations + seed data (15 cities, ~5 activities each) — **do this first, everything blocks on it**
2. Auth (Login, Register) + JWT middleware
3. Create Trip → Build Itinerary (the actual product, get this working end-to-end before touching polish)
4. My Trips list + Dashboard
5. City/Activity Search
6. Itinerary View + Budget aggregation
7. Calendar View (reuses §6's data)
8. Public Share + Copy Trip
9. Community Tab
10. Profile/Settings
11. Admin Panel — cut this first if you're short on time, it's explicitly "(Optional)" in the PDF

---

## 5. Cursor-ready prompt #1 — backend + schema

```
Build a Node/Express + PostgreSQL backend for a travel planning app called GlobeTrotter.

Create these tables with proper FKs, indexes, and timestamps:
users, trips, stops, cities, activities, trip_sections, trip_activities,
expenses, shared_trips, community_posts, community_comments

Schema details:
- users: id, name, email UNIQUE, password_hash, profile_photo_url, language_pref,
  phone_number, city, country, role ENUM('user','admin'), created_at
- trips: id, user_id FK, name, start_date, end_date, description, cover_photo_url,
  status ENUM('planning','ongoing','completed'), is_public BOOLEAN, created_at, updated_at
- stops: id, trip_id FK, city_id FK, order_index, arrival_date, departure_date
- cities: id, name, country, cost_index NUMERIC, popularity_score INT, image_url
- activities: id, city_id FK, name, type ENUM('sightseeing','food','adventure','culture','nightlife'),
  cost NUMERIC, duration_mins INT, description, image_url
- trip_sections: id, stop_id FK, title, type ENUM('travel','stay','activity','other'),
  date_range_start, date_range_end, budget NUMERIC, notes, order_index
- trip_activities: id, section_id FK, activity_id FK NULLABLE, scheduled_date,
  scheduled_time, cost_override NUMERIC, custom_label
- expenses: id, trip_id FK, category ENUM('transport','stay','activities','meals','other'),
  amount NUMERIC, section_id FK NULLABLE
- shared_trips: id, trip_id FK, public_slug UNIQUE, created_at
- community_posts: id, user_id FK, trip_id FK NULLABLE, content, image_url, created_at
- community_comments: id, post_id FK, user_id FK, content, created_at

Use Prisma as the ORM. Include JWT auth middleware with a role check for admin routes.

Scaffold these REST endpoints:
- POST /auth/register, POST /auth/login
- GET/PATCH /users/me
- CRUD /trips (scoped to authenticated user), auto-derive status from dates server-side
- CRUD /trips/:id/stops
- CRUD /trips/:id/stops/:stopId/sections
- GET /trips/:id/itinerary (day-grouped, joined read: stops + sections + activities)
- GET /trips/:id/budget (aggregate expenses by category, plus per-day estimated vs actual)
- GET /cities?q=&country=&sort=
- GET /activities?q=&city_id=&type=&max_cost=&sort=
- POST /trips/:id/share (creates shared_trips row, returns public_slug)
- GET /public/:slug (no auth, returns itinerary shape)
- POST /public/:slug/copy (auth required, clones trip into requesting user)
- GET/POST /community/posts, POST /community/posts/:id/comments
- GET /admin/users, GET /admin/analytics/cities, GET /admin/analytics/activities,
  GET /admin/analytics/trends (all role-gated)

Add input validation (zod) and a seed script with 15 cities and 5 activities per city.
```

## 6. Cursor-ready prompt #2 — frontend scaffold

```
Build a React + Vite + Tailwind frontend for GlobeTrotter, mobile-first responsive.

Set up React Router with these routes:
/login /register / /trips /trips/new /trips/:id/build /trips/:id
/trips/:id/calendar /search /community /profile /admin /t/:slug

Use Zustand for trip-builder state (sections, dates, budgets being edited across screens).
Use Recharts for budget breakdown (pie chart by category, bar chart by day).
Use a lightweight calendar/timeline component for /trips/:id/calendar with
expandable day cells and drag-to-reorder (persist reorder via PATCH on drop).

Breakpoints: single column stacked cards under 640px with bottom nav bar,
two-column lists 640-1024px, sidebar nav + side-by-side charts above 1024px.

Build the Build Itinerary screen (/trips/:id/build) as repeating "Section" cards
(travel/stay/activity/other), each with a title, date range, budget, and notes,
plus an "Add another Section" button. Debounce autosave (1.5s) on section edits
against PATCH /sections/:id.

Gate /admin behind a role check reading the JWT claim, redirect non-admins to /.
```

---

## 7. Cut-scope notes (say this out loud before demo day, not during)

- Community Tab: post + comment only, no likes/follows/algorithmic feed.
- Admin Panel: read-only analytics + basic user suspend, no bulk actions.
- Photo uploads: local/S3-compatible bucket, skip image processing/resizing for MVP.
- No real payment/booking integration anywhere — costs are estimates, not transactions. The PDF never asks for booking, don't invent it.
