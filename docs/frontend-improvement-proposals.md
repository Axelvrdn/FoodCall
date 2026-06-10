# FoodCall Frontend Improvement Proposals

Type: Explanation

This report proposes frontend improvements for FoodCall without implementing them. The goal is to keep the current product direction intact while identifying focused upgrades that can make the app feel warmer, clearer, and more premium.

## ReactBits References Consulted

| Reference | Relevance | Decision |
| --- | --- | --- |
| ReactBits Aurora, `https://reactbits.dev/backgrounds/aurora` | Soft color-ramp motion and atmospheric background direction. | Adapted conceptually for the global FoodCall hero background, but did not copy the WebGL/OGL implementation or add a dependency. |
| ReactBits Spotlight Card, `https://reactbits.dev/components/spotlight-card` | Useful for subtle focus on restaurant or group cards. | Proposal only. The MCP source was a placeholder pointing to the site, so no code was copied. |
| ReactBits Tilted Card, `https://reactbits.dev/components/tilted-card` | Useful for rare, high-value card affordances where depth communicates interactivity. | Proposal only. Avoid broad use to prevent motion fatigue. |
| ReactBits Pixel Card, `https://reactbits.dev/components/pixel-card` | Interesting texture pattern, but less aligned with FoodCall's warm food direction. | Not recommended for core flows. |

## Proposals

| Idea | Reference | Where in FoodCall | Why useful | Technical approach | Impact | Difficulty | Risks |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Add a subtle spotlight treatment to interactive restaurant cards | ReactBits Spotlight Card | `Découvrir`, restaurant result cards, restaurant detail entry points | Helps users understand which card is active without adding more UI chrome. | Use CSS variables updated on pointer move, gated behind `@media (hover: hover) and (pointer: fine)`. Keep a static border on touch and reduced-motion devices. | Medium | Medium | Pointer tracking can be overused; keep it local to card hover only. |
| Introduce skeleton loading states shaped like the real discover results | No matching ReactBits component found via MCP for skeletons | `Découvrir`, `Avis`, `Mes calls`, group lists | Replaces sudden layout shifts and generic waiting with clearer perceived progress. | Build small Tailwind skeleton primitives matching card dimensions; animate opacity/background-position only and disable animation under reduced motion. | High | Medium | Skeletons must match final layouts closely or they feel dishonest. |
| Add a warm map-empty state with route-line illustration | ReactBits Light Rays / abstract backgrounds were found but not copied | `Découvrir` map panel and any provider-failure map state | Makes provider failures and unavailable location states feel intentional rather than broken. | CSS-only line drawing or static SVG using FoodCall orange/yellow palette; no external animation library. | Medium | Medium | Avoid implying route data exists when the backend returned none. |
| Use restrained tilted-card depth only for featured group/session cards | ReactBits Tilted Card | Group detail hero side panel, active session summary | Adds tactility to rare high-value cards without making daily scanning harder. | CSS `transform` on hover only, with `perspective`, capped rotation under 3 degrees, disabled on touch/reduced motion. | Low to Medium | Low | Too much 3D motion can feel gimmicky; never apply to dense lists. |
| Add a compact command-style quick action surface | No matching ReactBits command component found via MCP | Top navigation for actions like create group, join group, start call | Reduces navigation friction for returning users while keeping primary nav simple. | Build a custom lightweight dialog using existing React/router patterns; keyboard accessible; no animation on repeated keyboard toggles. | High | High | Needs careful accessibility and focus management; should not duplicate existing nav. |
| Add consistent empty-state illustrations for social profile sections | ReactBits Aurora/soft-background direction only | `/profil` tabs for reviews, calls, favorites, groups, badges | Keeps backend-honest unavailable sections from feeling unfinished. | Reuse a shared `EmptyState` component with static FoodCall shapes and precise copy per missing endpoint. | Medium | Low | Copy must stay explicit about unavailable backend contracts, not imply hidden data. |
| Add tactile active states to all primary pressable controls | Emil design-engineering principle, no ReactBits dependency | Buttons and card actions across auth, groups, discover, settings | Makes the app feel responsive with minimal visual change. | Standardize `active:scale-[0.98]` or `active:translate-y-px`, exact transition properties, and focus-visible styles. | Medium | Low | Broad styling changes can cause visual drift if applied without component boundaries. |
| Add route-aware micro-transitions for page content entry | Aurora motion direction, not code | Main app route content below `TopBar` | Softens navigation between dense app sections. | CSS-only opacity/translate entry on route wrapper, short duration under 220ms, disabled for reduced motion. | Medium | Medium | Repeated navigation animations can feel slow; keep them brief and non-blocking. |

## Recommended Order

1. Skeleton loading states for data-heavy pages.
2. Shared empty-state component for honest unavailable or empty backend data.
3. Spotlight card treatment for restaurant discovery.
4. Compact quick action surface after navigation behavior is stable.
5. Optional tilted-card treatment only on rare featured surfaces.

This order prioritizes clarity and trust before decorative motion.
