# System Design, Data Flows

Diagrams for the flows that are not obvious from the route list alone. Read `ARCHITECTURE.md` first, this file goes one level deeper into the flows most likely to trip someone up.

---

## Flow 1: Creating a trip and building the itinerary

```
User                Frontend                 Backend                  DB
 |                      |                        |                     |
 | fills Create Trip     |                        |                     |
 |--------------------->|                        |                     |
 |                      | POST /trips             |                     |
 |                      |----------------------->|                     |
 |                      |                        | INSERT trips row    |
 |                      |                        |------------------->|
 |                      |                        | <-- trip_id --------|
 |                      | <-- 201, trip_id -------|                     |
 |  redirected to        |                        |                     |
 |  /trips/:id/build      |                        |                     |
 |                      |                        |                     |
 | adds a Section         |                        |                     |
 |--------------------->|                        |                     |
 |                      | POST /trips/:id/stops   |                     |
 |                      | (if new city)           |                     |
 |                      |----------------------->|                     |
 |                      |                        | INSERT stops row    |
 |                      |                        |------------------->|
 |                      | POST .../sections       |                     |
 |                      |----------------------->|                     |
 |                      |                        | INSERT trip_sections|
 |                      |                        |------------------->|
 |                      | <-- 201, section --------|                     |
```

Key decision: the frontend never batches "create trip, create stop, create three sections" into one request. Each write is its own call, so a network drop mid-build loses at most one section, not the whole trip. This is why the Build Itinerary page needs debounced autosave per section, not a single "Save Trip" button at the bottom.

---

## Flow 2: Loading the itinerary view (the expensive read)

```
Frontend                          Backend                              DB
   |                                  |                                  |
   | GET /trips/:id/itinerary          |                                  |
   |-------------------------------->|                                  |
   |                                  | SELECT stops JOIN sections        |
   |                                  | JOIN trip_activities JOIN         |
   |                                  | activities WHERE trip_id = :id    |
   |                                  |--------------------------------->|
   |                                  | <-- joined rows -------------------|
   |                                  |                                  |
   |                                  | group rows by day server-side     |
   |                                  | (one pass, not per-row queries)   |
   |                                  |                                  |
   | <-- { days: [ {date, sections:[]} ] } |                              |
```

Do not let this become N+1 queries (one query per section to fetch its activities). Use Prisma's `include` to fetch the full tree in one round trip, then group by date in application code. If this page feels slow in testing, that is the first place to look.

---

## Flow 3: Budget aggregation

```
Frontend                          Backend                              DB
   |                                  |                                  |
   | GET /trips/:id/budget             |                                  |
   |-------------------------------->|                                  |
   |                                  | SELECT category, SUM(amount)      |
   |                                  | FROM expenses WHERE trip_id = :id |
   |                                  | GROUP BY category                 |
   |                                  |--------------------------------->|
   |                                  | <-- category totals ---------------|
   |                                  |                                  |
   |                                  | also compute per-day estimated    |
   |                                  | vs actual (join expenses to       |
   |                                  | section date ranges)              |
   |                                  |                                  |
   | <-- { by_category: [], by_day: [], overbudget_days: [] } |          |
```

`expenses` rows are written whenever a section or activity with a cost is created or updated, not computed live from `trip_sections.budget` at read time. This keeps the budget query a simple aggregation instead of a recursive walk through the itinerary tree every time someone opens the Budget tab.

---

## Flow 4: Public share and copy

```
Owner                Frontend              Backend                    DB
 |                       |                     |                       |
 | clicks Share            |                     |                       |
 |---------------------->|                     |                       |
 |                       | POST /trips/:id/share |                       |
 |                       |-------------------->|                       |
 |                       |                     | INSERT shared_trips   |
 |                       |                     | (generates slug)      |
 |                       |                     |--------------------->|
 |                       | <-- public_slug ------|                       |
 |                       |                     |                       |

Visitor (no login)       Frontend              Backend                    DB
 |                       |                     |                       |
 | opens /t/:slug          |                     |                       |
 |---------------------->|                     |                       |
 |                       | GET /public/:slug     |                       |
 |                       | (no JWT sent)         |                       |
 |                       |-------------------->|                       |
 |                       |                     | look up shared_trips  |
 |                       |                     | by slug, fetch trip   |
 |                       |                     | via same itinerary    |
 |                       |                     | query as Flow 2       |
 |                       |                     |--------------------->|
 |                       | <-- itinerary data ---|                       |
 |                       |                     |                       |
 | clicks Copy Trip         |                     |                       |
 |  (forced to log in first if not authenticated) |                       |
 |---------------------->|                     |                       |
 |                       | POST /public/:slug/copy |                     |
 |                       | (JWT required)         |                     |
 |                       |-------------------->|                       |
 |                       |                     | clone trip, stops,    |
 |                       |                     | sections into new     |
 |                       |                     | trip owned by         |
 |                       |                     | requesting user       |
 |                       |                     |--------------------->|
 |                       | <-- new trip_id --------|                       |
```

`GET /public/:slug` reuses the same joined query as the authenticated itinerary view (Flow 2), just entered through a different route with no auth middleware. Do not write a second, separate query for this, it will drift out of sync with the authenticated version the first time someone changes the schema.

---

## Adding a new flow to this doc

When you build a route that involves more than one table or an external call (object storage, a third-party API), add a short diagram here in the same style. Keep it to what the next person needs to not get surprised, not a full sequence diagram with every field.
