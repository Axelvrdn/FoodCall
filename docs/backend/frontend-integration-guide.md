# How to integrate the frontend with FoodCall Backend

This guide shows frontend developers how to connect a client application to the FoodCall Backend. It covers the main integration flows in the recommended order. For exact request shapes, response fields, and error codes, see [`docs/api-documentation.md`](./api-documentation.md).

---

## Prerequisites

- A running FoodCall Backend instance (local, staging, or production)
- Base URL and health endpoint:
  - Local: `http://localhost:3000`
  - Staging: `https://staging-api.foodcall.app`
  - Production: `https://api.foodcall.app`
- `Authorization: Bearer <accessToken>` header for authenticated endpoints

Verify the backend is healthy before integration work:

```bash
curl https://api.foodcall.app/health
```

Expected response:

```json
{
  "status": "up",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "services": {
    "api": { "status": "up" },
    "postgres": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

---

## Authentication expectations

FoodCall uses a two-token system:

1. **Access token** — short-lived JWT (~15 minutes), sent in the `Authorization: Bearer <token>` header
2. **Refresh token** — long-lived UUID (~30 days), sent in the request body to `/api/auth/refresh`

### Recommended token handling

1. Store the access token in memory (do not persist in `localStorage` if you can avoid it)
2. Store the refresh token securely (e.g., `httpOnly` cookie or secure storage)
3. On 401 responses, attempt a silent refresh:
   ```
   POST /api/auth/refresh
   Body: { "refreshToken": "..." }
   ```
4. If refresh fails, redirect to the login screen

### Key auth behaviors

- `POST /api/auth/change-password` revokes **all** refresh tokens for the user. Existing access tokens expire naturally.
- The refresh token is a UUID, not a JWT. Do not try to decode it client-side.
- Register and login both return a fresh `{ accessToken, refreshToken }` pair.

See [`docs/api-documentation.md`](./api-documentation.md#4-authentification) for exact request bodies, constraints, and error responses.

---

## Recommended API call order

For a first-time user, the typical flow is:

1. **Register or login** → obtain tokens
2. **Fetch profile** → `GET /api/users/me`
3. **Create or join a group**
4. **Create a decision session** inside the group
5. **Add candidates** (internal restaurants or external search + import)
6. **Activate and start voting**
7. **Cast votes**
8. **Select the final restaurant** (creator only)
9. **Complete the session** (creator only)
10. **Leave a review** for the selected restaurant
11. **Browse recommendations** for future sessions

The following sections break down each area with the recommended call sequence and important business rules.

---

## Group setup

### Create a group

```
POST /api/groups
Headers: Authorization: Bearer <token>
Body: { "name": "Lunch Crew", "budgetMax": 15, ... }
```

The creator automatically becomes the group `owner`.

### Invite members

```
POST /api/groups/:id/invites
```

This generates an 8-character alphanumeric code valid for 7 days.

### Join a group

```
POST /api/groups/join
Body: { "code": "aB3dE5fG" }
```

Joining via code makes the user a `member`. Roles (`owner`, `admin`, `member`) determine who can modify the group, create sessions, and manage candidates.

### Group defaults

A group can have a `defaultStartAddress`, `defaultStartLatitude`, `defaultStartLongitude`, `defaultSearchRadiusMeters`, and `budgetMax`. These values are **snapshotted** into new sessions at creation time. Changing the group later does not affect existing sessions.

See [`docs/api-documentation.md`](./api-documentation.md#7-groupes) for exact fields, permissions, and member management.

---

## Session lifecycle

A session moves through a state machine:

```
draft --[activate]--> active
active --[start-voting]--> voting
draft --[start-voting]--> voting
voting --[select-restaurant]--> voting
voting --[complete]--> completed

* --[cancel]--> cancelled  (except completed and cancelled)
```

### Creator-only transitions

Only the session creator can:

- `POST /api/sessions/:id/activate`
- `POST /api/sessions/:id/start-voting` (requires at least one candidate)
- `POST /api/sessions/:id/select-restaurant` (restaurant must already be a candidate)
- `POST /api/sessions/:id/complete` (requires `selectedRestaurantId` to be set)
- `POST /api/sessions/:id/cancel`

### Frontend state mapping

| UI state           | Backend state | Allowed actions                                                              |
| ------------------ | ------------- | ---------------------------------------------------------------------------- |
| Setting up         | `draft`       | Add/remove candidates, update session fields, activate, start voting, cancel |
| Open for proposals | `active`      | Add candidates, create calls, start voting, cancel                           |
| Voting             | `voting`      | Cast/withdraw votes, select final restaurant, cancel                         |
| Done               | `completed`   | View results, leave reviews, leave call feedback                             |
| Abandoned          | `cancelled`   | Read-only                                                                    |

### Session snapshots

At creation, the session copies the group's start location, search radius, and budget if not provided explicitly. These values are frozen for the session lifetime to preserve historical context.

See [`docs/api-documentation.md`](./api-documentation.md#11-sessions-de-decision) for exact endpoints, constraints, and error messages.

---

## External search and import

FoodCall can search external restaurant providers (Nominatim by default) and import results into the internal restaurant model.

### Search external restaurants

```
GET /api/external-restaurants/search?lat=48.8566&lng=2.3522&radius=1000&limit=10
```

Results are **not persisted automatically**. Each result contains:

- `provider` and `providerPlaceId` — the external identity
- Normalized fields: `name`, `address`, `latitude`, `longitude`, `phone`, `website`, `cuisineTags`, `photoUrls`
- Optional route enrichment: `distanceMeters`, `durationSeconds`, `routeSource` (when `includeRoute=true`)

### Import an external result

To persist an external result and optionally add it as a session candidate:

```
POST /api/external-restaurants/import
Body: {
  "provider": "nominatim",
  "providerPlaceId": "node:123",
  "sessionId": "optional-session-uuid"
}
```

**Trust boundary:** the backend resolves the provider identity server-side, validates the place, and persists trusted fields. The frontend sends only `provider` + `providerPlaceId` (plus optional `sessionId`). Never send normalized restaurant fields in the import body.

**Duplicate handling:** if the provider place was already imported, the backend reuses the internal restaurant and returns `matchedBy: "provider-source"`.

See [`docs/api-documentation.md`](./api-documentation.md#external-restaurant-discovery) for the full import response shape, audit fields, error taxonomy, and rollback behavior.

---

## Candidates, voting, selection, and completion

### Add candidates

```
POST /api/sessions/:id/candidates
Body: { "restaurantId": "..." }
```

Allowed only in `draft` or `active` state. A restaurant can be added only once per session.

### Start voting

```
POST /api/sessions/:id/start-voting
```

Requires at least one candidate. Transitions to `voting`.

### Cast votes

```
POST /api/sessions/:id/votes
Body: { "candidateId": "..." }
```

Allowed only in `voting` state and before the deadline. Currently only approval voting (`value: 1`) is implemented.

### Vote visibility

- During `voting`: users see only their own votes
- After `completed`: all votes are visible

### Select the final restaurant

```
POST /api/sessions/:id/select-restaurant
Body: { "restaurantId": "..." }
```

**Creator only.** The restaurant must already be a candidate. This does **not** complete the session — it only sets `selectedRestaurantId`.

### Complete the session

```
POST /api/sessions/:id/complete
```

**Creator only.** Requires `selectedRestaurantId` to be set. Transitions to `completed`.

### View results

```
GET /api/sessions/:id/results
```

Available only after `completed`. Returns candidates sorted by vote count, with a `creatorApproved` flag.

> **Important:** votes are decision support, not automatic final authority. The creator must explicitly select and complete.

See [`docs/api-documentation.md`](./api-documentation.md#12-candidats-dune-session) and [`docs/api-documentation.md`](./api-documentation.md#13-votes) for exact shapes and errors.

---

## Selected-restaurant review flow

After a session is `completed`, members can leave a review for the **selected restaurant only**.

### Create a review

```
POST /api/restaurants/:id/reviews
Body: { "sessionId": "...", "rating": 5, "comment": "..." }
```

**Rules:**

- The user must be a member of the group that completed the session
- The session status must be `completed`
- The restaurant must be the session's `selectedRestaurantId`
- One active review per user per restaurant (duplicate returns 409)

### Update or delete your review

```
PATCH /api/reviews/:id
DELETE /api/reviews/:id
```

Only the review author can modify or delete. Deletion is logical (soft delete).

### Restaurant aggregate rating

`GET /api/restaurants/:id` includes:

```json
{
  "rating": {
    "average": 4.5,
    "count": 2
  }
}
```

Derived from active reviews only.

See [`docs/api-documentation.md`](./api-documentation.md#9-reviews) for exact constraints and error messages.

---

## Recommendation flow

Recommendations are **advisory only** — they do not select restaurants or complete sessions.

### Session recommendations

```
GET /api/sessions/:id/recommendations?limit=10
```

Ranks existing session candidates by a compatibility score. Each result includes:

```json
{
  "restaurantId": "...",
  "restaurant": { "name": "...", "address": "...", ... },
  "rank": 1,
  "score": 87.5,
  "explanation": {
    "summary": "Compatibility score 87.5/100 from restaurant quality, distance, budget, and history signals.",
    "components": [
      { "key": "restaurantScore", "score": 90, "weight": 0.5, "contribution": 45, "reason": "..." },
      { "key": "distance", "score": 80, "weight": 0.3, "contribution": 24, "reason": "..." },
      { "key": "budget", "score": 70, "weight": 0.15, "contribution": 10.5, "reason": "..." },
      { "key": "history", "score": 60, "weight": 0.05, "contribution": 3, "reason": "..." }
    ]
  }
}
```

### Group recommendations

```
GET /api/groups/:id/recommendations?limit=10
```

Scores a **bounded pool** of nearby restaurants (`Math.min(Math.max(limit * 3, 25), 100)`) before sorting and trimming to `limit`. This ensures a high-quality distant restaurant can outrank a mediocre close one.

### Component interpretation

| Component         | Weight | What it measures                                     |
| ----------------- | ------ | ---------------------------------------------------- |
| `restaurantScore` | 0.50   | Quality from active reviews (dampened average)       |
| `distance`        | 0.30   | Proximity to session/group start point               |
| `budget`          | 0.15   | Fit between `estimatedCostPerPerson` and `budgetMax` |
| `history`         | 0.05   | Past user reviews or group selections                |

User reliability score is available as a standalone metric but is **not** injected into every candidate (it would be non-differentiating).

See [`docs/api-documentation.md`](./api-documentation.md#scoring-and-recommendations) for exact endpoint behavior and error responses.

---

## Expected error categories

| Category   | HTTP        | When it happens                                                                   | Frontend handling                                       |
| ---------- | ----------- | --------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Validation | 400         | Bad request body, invalid state transition, deadline passed                       | Show field-level or form-level errors from `details`    |
| Auth       | 401         | Missing/invalid JWT, bad credentials                                              | Redirect to login or trigger silent refresh             |
| Permission | 403         | Not a member, not owner, not creator, wrong role                                  | Show access-denied UI                                   |
| Not found  | 404         | Resource missing or soft-deleted                                                  | Show 404 page or empty state                            |
| Conflict   | 409         | Duplicate email, already a member, candidate already added, review already exists | Show contextual message; offer retry or navigation      |
| Provider   | 502/503/504 | External provider timeout, quota, malformed response, unavailable                 | Show retry button; optionally fall back to manual input |
| Server     | 500         | Unexpected server error                                                           | Show generic error; log for support                     |

All errors follow the standard shape:

```json
{
  "statusCode": 400,
  "message": "...",
  "error": "Bad Request",
  "details": { ... }
}
```

See [`docs/api-documentation.md`](./api-documentation.md#20-codes-derreur) for the full error code table and module-specific messages.

---

## Priority frontend endpoints and pages

### Auth pages

| Page     | Endpoints                                                  |
| -------- | ---------------------------------------------------------- |
| Register | `POST /api/auth/register`                                  |
| Login    | `POST /api/auth/login`                                     |
| Profile  | `GET /api/users/me`, `PATCH /api/users/me`                 |
| Avatar   | `POST /api/users/me/avatar`, `DELETE /api/users/me/avatar` |

### Group pages

| Page         | Endpoints                                            |
| ------------ | ---------------------------------------------------- |
| Group list   | `GET /api/groups`                                    |
| Group detail | `GET /api/groups/:id`, `GET /api/groups/:id/members` |
| Create group | `POST /api/groups`                                   |
| Invite       | `POST /api/groups/:id/invites`                       |
| Join group   | `POST /api/groups/join`                              |

### Session pages

| Page           | Endpoints                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Session list   | `GET /api/groups/:groupId/sessions`                                                                                         |
| Session detail | `GET /api/sessions/:id`                                                                                                     |
| Create session | `POST /api/groups/:groupId/sessions`                                                                                        |
| Candidates     | `GET /api/sessions/:id/candidates`, `POST /api/sessions/:id/candidates`, `DELETE /api/sessions/:id/candidates/:candidateId` |
| Voting         | `POST /api/sessions/:id/votes`, `DELETE /api/sessions/:id/votes/:voteId`, `GET /api/sessions/:id/votes`                     |
| Results        | `GET /api/sessions/:id/results`                                                                                             |

### Restaurant pages

| Page              | Endpoints                                                               |
| ----------------- | ----------------------------------------------------------------------- |
| Restaurant list   | `GET /api/restaurants`, `GET /api/restaurants/nearby`                   |
| Restaurant detail | `GET /api/restaurants/:id`                                              |
| External search   | `GET /api/external-restaurants/search`                                  |
| Import            | `POST /api/external-restaurants/import`                                 |
| Reviews           | `GET /api/restaurants/:id/reviews`, `POST /api/restaurants/:id/reviews` |

### Recommendation pages

| Page                    | Endpoints                               |
| ----------------------- | --------------------------------------- |
| Session recommendations | `GET /api/sessions/:id/recommendations` |
| Group recommendations   | `GET /api/groups/:id/recommendations`   |

### Geo utilities

| Page           | Endpoints                                                        |
| -------------- | ---------------------------------------------------------------- |
| Address search | `GET /api/geo/geocode?q=...`                                     |
| Route preview  | `GET /api/geo/route?fromLat=...&fromLng=...&toLat=...&toLng=...` |

See [`docs/api-documentation.md`](./api-documentation.md#24-contrats-frontend-importants) for the full page-to-endpoint mapping.

---

## Rate limits and headers

The backend applies global rate limiting via `@nestjs/throttler`:

- Default: 100 requests per 60-second window
- Auth register/login: 5 per minute
- Auth refresh: 10 per minute
- Geo geocode: 60 per minute
- Geo route: 120 per minute
- Restaurants nearby: 30 per minute

If you exceed a limit, the response is `429 Too Many Requests`.

---

## Environment-specific notes

| Environment | Base URL                           | Notes                                                                  |
| ----------- | ---------------------------------- | ---------------------------------------------------------------------- |
| Local       | `http://localhost:3000`            | PostgreSQL + Redis via Docker Compose; OSRM must be started separately |
| Staging     | `https://staging-api.foodcall.app` | Full provider stack                                                    |
| Production  | `https://api.foodcall.app`         | Full provider stack                                                    |

For local development, ensure `OSRM_BASE_URL` is configured if you need route enrichment.

---

## Next steps

1. Pick a page from the priority table above
2. Find the exact request/response shapes in [`docs/api-documentation.md`](./api-documentation.md)
3. Implement the flow using the call order and business rules in this guide
4. Handle the expected error categories with appropriate UX
5. Test against a local backend with `npm run dev`

For questions about backend behavior, consult the API reference first, then check the backend source or open an issue in the backend repository.
