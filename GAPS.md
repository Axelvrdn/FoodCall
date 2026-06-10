# FoodCall Frontend/API Gap Reference

Reference documentation for scaffold boundaries. These features appear in the product direction or prototypes but do not have P1 API backing, so the scaffold uses placeholders and does not invent endpoints.

| Feature | DA reference | API status | Scaffold workaround |
| --- | --- | --- | --- |
| Reviews | Avis page and review cards | P2, no P1 endpoint | `/avis` is a placeholder shell |
| Favorites | Profil favorites section | No API | Static placeholder only |
| Badges and levels | Gamification sections | No API beyond `reputationScore` | Static badges in profile/calls shells |
| Leaderboards | Member rankings | No ranking endpoint | Mock-only display rows |
| Onboarding endpoint | Onboarding future page | No endpoint | Authenticated shell, no multi-step API logic |
| Notifications | Bell and settings toggles | P7/no API | Static bell and local toggles only |
| Moderation | Future safety workflows | P7/no API | No service, no route |
| Recommendations | Restaurant recommendation logic | P6/no API | No service; discover uses restaurant search mocks |
| Global search | Future global search page | No unified search API | No route beyond restaurant services |
| Group departure address | Group settings concept | Group model has no address/lat/lng | Documented only; absent from profile/settings |
| Forgot password | Auth UX | No reset endpoint | Page explains support/contact path, no API call |
| Real-time votes | Live session UX | REST only | TanStack Query/refetch-ready services, no WebSocket/SSE |
| Restaurant creation UI | API supports restaurants create | No DA page in MVP | No form shell |
