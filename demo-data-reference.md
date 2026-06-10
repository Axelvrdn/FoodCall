# Demo Data Reference

> **⚠️ LOCAL / DEVELOPMENT ONLY**  
> All credentials, commands, and data described in this document are intended **exclusively for local development and testing**. They must never be used in production environments. Demo accounts use a shared, well-known password hash and fixed emails that are not secure for real deployments.

---

## Reference

### Demo Accounts

All 6 demo accounts share the same password: `Password123!`.

| Email               | Display Name | Role in Groups                                          |
| ------------------- | ------------ | ------------------------------------------------------- |
| `alice@example.com` | Alice        | Owner of Lille Lunch Crew; member of Lyon Weekend Bites |
| `ben@example.com`   | Ben          | Admin of Lille Lunch Crew                               |
| `chloe@example.com` | Chloe        | Member of Lille Lunch Crew; owner of Paris Dinner Club  |
| `david@example.com` | David        | Member of Lille Lunch Crew; admin of Paris Dinner Club  |
| `emma@example.com`  | Emma         | Member of Paris Dinner Club                             |
| `frank@example.com` | Frank        | Owner of Lyon Weekend Bites                             |

### Demo Groups

| Name               | Center                                              | Budget Max | Search Radius | Members                                                    |
| ------------------ | --------------------------------------------------- | ---------- | ------------- | ---------------------------------------------------------- |
| Lille Lunch Crew   | Place du Général de Gaulle, Lille (50.6292, 3.0573) | €20.00     | 2000 m        | Alice (owner), Ben (admin), Chloe (member), David (member) |
| Paris Dinner Club  | 10 Rue de Rivoli, Paris (48.8566, 2.3522)           | €35.00     | 3000 m        | Chloe (owner), David (admin), Emma (member)                |
| Lyon Weekend Bites | Place Bellecour, Lyon (45.7640, 4.8357)             | (none)     | (none)        | Frank (owner), Alice (member)                              |

### Restaurants of Interest

| Name                         | Location      | Cuisine             | Est. Cost | Avg Review           | Notable Scenario                               |
| ---------------------------- | ------------- | ------------------- | --------- | -------------------- | ---------------------------------------------- |
| Lille Kebab Express          | 50.632, 3.06  | fast-food, kebab    | €8.50     | —                    | Within-budget, close                           |
| Le Petit Bistrot Lillois     | 50.628, 3.055 | french, bistro      | €14.00    | —                    | Within-budget, close                           |
| Chez Marcel Sandwich         | 50.630, 3.058 | fast-food, sandwich | €9.00     | **1.33** (3 reviews) | **Close-but-poorly-reviewed**                  |
| La Table de Lille            | 50.631, 3.054 | french, fine-dining | €45.00    | —                    | Over-budget, close                             |
| Au Vieux Lille Gastronomique | 50.645, 3.07  | french, gastronomic | €38.00    | **5.00** (2 reviews) | **Farther-but-highly-rated**                   |
| Quick Burger Lille Sud       | 50.610, 3.04  | fast-food, burger   | €12.00    | —                    | Within-budget, far                             |
| Frites Factory               | 50.633, 3.062 | belgian, fast-food  | €10.00    | —                    | Within-budget, close                           |
| Sakura Sushi Paris           | 48.860, 2.340 | japanese, sushi     | €22.00    | —                    | Over-budget (for Lille), mid-range (for Paris) |
| Trattoria Roma               | 48.855, 2.360 | italian, pasta      | €25.00    | 4.00 (2 reviews)     | History-signal for Lyon group                  |
| Le Burger Atelier            | 48.850, 2.345 | american, burger    | €18.00    | —                    | Within-budget, Paris                           |
| L'Ambroisie                  | 48.855, 2.358 | french, fine-dining | €60.00    | —                    | Over-budget, Paris                             |
| Quick L'Opéra                | 48.870, 2.332 | fast-food, burger   | €11.00    | —                    | Within-budget, Paris                           |

### Seeded Sessions

| Name              | Group              | Status        | Candidates                                                       | Selected Restaurant          | Votes                            | Calls |
| ----------------- | ------------------ | ------------- | ---------------------------------------------------------------- | ---------------------------- | -------------------------------- | ----- |
| Monday Team Lunch | Lille Lunch Crew   | **completed** | 4 (Kebab, Chez Marcel, Frites, Petit Bistrot)                    | Chez Marcel Sandwich         | 6 (unanimous for Chez Marcel)    | 3     |
| Friday Dinner     | Lille Lunch Crew   | **voting**    | 5 (Petit Bistrot, Kebab, Au Vieux Lille, Quick Burger, La Table) | —                            | 6 (split)                        | —     |
| Weekend Brunch    | Paris Dinner Club  | **active**    | 4 (Sakura, Trattoria, Burger Atelier, Quick Opéra)               | —                            | —                                | —     |
| Impromptu Snack   | Paris Dinner Club  | **draft**     | —                                                                | —                            | —                                | —     |
| Lyon Celebration  | Lyon Weekend Bites | **completed** | 3 (Trattoria, Sakura, L'Ambroisie)                               | Trattoria Roma               | 3 (split, Trattoria wins)        | 2     |
| Sunday Gourmet    | Lille Lunch Crew   | **completed** | 3 (Au Vieux Lille, La Table, Petit Bistrot)                      | Au Vieux Lille Gastronomique | 2 (unanimous for Au Vieux Lille) | —     |
| Cancelled Outing  | Lille Lunch Crew   | **cancelled** | —                                                                | —                            | —                                | —     |

### Frontend Scenarios

The following table maps frontend pages and features to the demo data needed to exercise them.

| Frontend Feature / Page        | Demo Data to Use                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Group list                     | Log in as any user; groups are returned by membership                                                               |
| Group detail                   | `Lille Lunch Crew` (4 members, full start point) or `Paris Dinner Club` (3 members)                                 |
| Session list for a group       | `Lille Lunch Crew` → shows Monday, Friday, Sunday, Cancelled                                                        |
| Session detail (draft)         | `Impromptu Snack` — no candidates, editable by creator                                                              |
| Session detail (active)        | `Weekend Brunch` — has candidates, can start voting                                                                 |
| Session detail (voting)        | `Friday Dinner` — has candidates and votes, can select restaurant                                                   |
| Session detail (completed)     | `Monday Team Lunch` — has selected restaurant, votes, calls, feedback, reviews                                      |
| Candidate list                 | Any active/voting/completed session with candidates                                                                 |
| Vote approval UI               | `Friday Dinner` or `Monday Team Lunch`                                                                              |
| Restaurant selection           | `Friday Dinner` → select `Au Vieux Lille Gastronomique`                                                             |
| Restaurant detail with reviews | `Chez Marcel Sandwich` (3 reviews) or `Trattoria Roma` (2 reviews)                                                  |
| Call list                      | `Monday Team Lunch` (3 calls) or `Lyon Celebration` (2 calls)                                                       |
| Call feedback                  | Feedback exists for calls in `Monday Team Lunch` and `Lyon Celebration`                                             |
| Session recommendations        | `Friday Dinner` (Lille, voting) or `Weekend Brunch` (Paris, active)                                                 |
| Group recommendations          | `Lille Lunch Crew` (has history signals and varied scores)                                                          |
| Over-budget filtering          | `Monday Team Lunch` budget €18; `La Table de Lille` (€45) and `Au Vieux Lille` (€38) are over                       |
| Nearby search                  | `Lille Lunch Crew` center; restaurants within 500m–2km                                                              |
| History signal                 | `Lille Lunch Crew` group recommendations surface `Chez Marcel Sandwich` and `Au Vieux Lille` as previously selected |

---

## How-to Guide

### Reset and Reseed the Development Database

#### Prerequisites

1. PostgreSQL with PostGIS extension is running and accessible.
2. `DATABASE_URL` is set, or the default local connection works:
   ```bash
   postgresql://foodcall:foodcall@localhost:5432/foodcall
   ```
3. The `drizzle-orm` schema migrations have been applied to the target database.

#### Step 1: Reset all seeded data

```bash
npm run db:seed:reset
```

This truncates all business tables in foreign-key-safe order using `CASCADE`. It does **not** drop the schema or re-run migrations.

#### Step 2: Seed fresh demo data

```bash
npm run db:seed
```

This runs `src/db/seeds/index.ts` inside a Drizzle transaction and inserts:

- 6 users
- 3 groups with 9 memberships
- 12 restaurants
- 7 sessions
- 19 candidates
- 16 votes
- 5 calls with 6 feedback entries
- 7 reviews

The script aborts immediately if `NODE_ENV === 'production'`.

#### Step 3: One-shot reset + seed

```bash
npm run db:seed:demo
```

This runs `db:seed:reset` followed by `db:seed` in a single command.

#### Step 4: Verify determinism

After seeding, you should see a JSON summary with consistent counts on every run. The seed is deterministic: running `db:seed:reset` then `db:seed` twice should produce identical row counts.

---

## Explanation

### Why this data shape?

The demo dataset is designed to exercise the core FoodCall decision engine without requiring external APIs or production secrets.

**Lille Lunch Crew** is the primary scenario group. It is centered on Place du Général de Gaulle because that point has a realistic density of restaurants at varied distances and price points. The group includes four members with owner/admin/member roles, so permission tests can use real group membership data.

**Paris Dinner Club** exists to test a different geography and a higher budget (€35). It includes mid-range and fine-dining restaurants so over-budget filtering can be demonstrated independently from the Lille group.

**Lyon Weekend Bites** is a minimal group with only two members and no explicit budget or radius. It exists to test the edge case where a session has no group default values and must rely on explicit session parameters.

**Restaurant cost spread** (€8.50 to €60.00) was chosen so that every session budget produces both within-budget and over-budget candidates. `La Table de Lille` (€45) and `L'Ambroisie` (€60) are deliberately expensive so the recommendation engine must visibly down-rank or filter them.

**Review ratings** were tuned specifically for recommendation scenario coverage:

- `Chez Marcel Sandwich` received poor reviews (1, 1, 2 → avg 1.33) because it is only ~105m from the Lille center. This creates a clear **close-but-poorly-reviewed** case.
- `Au Vieux Lille Gastronomique` received excellent reviews (5, 5 → avg 5.00) because it is ~2km from the Lille center. This creates a clear **farther-but-highly-rated** case.
- `Trattoria Roma` received mixed reviews (5, 3 → avg 4.00) to produce a moderate restaurant score signal.

**Session states** cover all five lifecycle states so frontend developers can test every UI phase: draft creation, active candidate addition, voting, explicit restaurant selection, completion, and cancellation.

**Call and feedback data** produce varied reliability scores. Alice's call for Chez Marcel received positive feedback (5, 4), while Ben's call for Lille Kebab Express received negative feedback (2, 1). This diversity is intentional so the reliability score formula can be inspected with real inputs.
