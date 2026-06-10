# Documentation API — FoodCall Backend

Version 0.1.0

---

## Table des matieres

1. Introduction
2. Principes generaux
3. Environnements
4. Authentification
5. Modele utilisateur
6. Users API
7. Groupes
8. Restaurants
9. Reviews
10. Geolocalisation
11. Sessions de decision
12. Candidats d'une session
13. Votes
14. Calls
15. Scoring and Recommendations
16. Notifications futures
17. Moderation
18. Pagination
19. Format standard des reponses
20. Codes d'erreur
21. Permissions
22. Conventions de nommage
23. Exemples de parcours frontend
24. Contrats frontend importants
25. Roadmap API
26. Annexes

---

## 1. Introduction

FoodCall est une API REST destinee a aider des groupes d'utilisateurs a choisir un restaurant autour d'un point de depart configurable. Le backend gere les utilisateurs, les groupes, les restaurants, les sessions de decision, les votes, la selection explicite du restaurant final et les recommandations argumentees (calls).

Ce document decrit exhaustivement l'ensemble des endpoints exposes, les formats de requete et de reponse, les regles d'authentification, les permissions et les conventions adoptees par le backend. Il s'adresse aux developpeurs frontend et aux integrateurs qui consomment l'API.

Le backend est ecrit en TypeScript avec NestJS, persiste dans PostgreSQL avec PostGIS via Drizzle ORM, et utilise Redis pour le cache et le rate limiting.

---

## 2. Principes generaux

### 2.1 REST

L'API suit les principes REST. Chaque ressource est identifiee par une URL unique. Les verbes HTTP indiquent l'operation :

- GET : lecture
- POST : creation
- PATCH : mise a jour partielle
- DELETE : suppression logique ou physique

### 2.2 Base URL

Tous les endpoints sont prefixes par `/api/` sauf `/health` qui est expose a la racine.

Exemple :

```
GET https://api.foodcall.app/api/users/me
GET https://api.foodcall.app/health
```

### 2.3 Format des echanges

Toutes les requetes et reponses utilisent JSON avec l'encodage UTF-8. Les dates sont au format ISO 8601 avec timezone.

### 2.4 Pagination par curseur

Les listes paginees utilisent une pagination par curseur basee sur `createdAt`. Les parametres de requete acceptes sont :

- `cursor` : date ISO 8601 du dernier element de la page precedente
- `limit` : nombre d'elements par page, entre 1 et 50, valeur par defaut 20

### 2.5 Authentification

Les endpoints authentifies necessitent un header `Authorization: Bearer <accessToken>`. L'access token est un JWT. Le refresh token est un UUID v4 stocke en base sous forme hashee.

### 2.6 Rate limiting et en-tetes de securite

Le rate limiting global est applique par `@nestjs/throttler`. Les limites par defaut sont configurees par l'environnement :

- `THROTTLE_TTL_MS` : fenetre en millisecondes, valeur par defaut `60000`
- `THROTTLE_LIMIT` : nombre de requetes autorisees par fenetre, valeur par defaut `100`

Des limites plus specifiques peuvent aussi etre appliquees a certains endpoints :

- Auth register : 5 requetes par minute
- Auth login : 5 requetes par minute
- Auth refresh : 10 requetes par minute
- Geo geocode : 60 requetes par minute
- Geo route : 120 requetes par minute
- Restaurants nearby : 30 requetes par minute

Les en-tetes de securite HTTP sont appliques globalement par `helmet()` avant le traitement des routes.

### 2.7 CORS frontend

La configuration CORS globale autorise l'origine definie par `CORS_ORIGIN` (par defaut `http://localhost:5173` en test/local), active les credentials et accepte les methodes `GET`, `HEAD`, `PUT`, `PATCH`, `POST`, `DELETE`, `OPTIONS` avec les headers `Authorization` et `Content-Type`. Les preflights `OPTIONS` repondent `204` quand l'origine correspond a `CORS_ORIGIN`.

### 2.8 Health check

`GET /health` retourne l'etat global, un horodatage ISO 8601, et un objet `services`.

Chaque service expose uniquement :

- `status` : `up` ou `down`
- `latencyMs` : latence du check en millisecondes
- `error` : code d'erreur stable optionnel (`query_failed`, `redis_connect_failed`, `redis_ping_failed`)

Les reponses de sante ne retournent jamais d'URL de connexion, secret, SQL brut, detail Redis brut, ou message d'exception brut.

```json
{
  "status": "up",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "services": {
    "api": { "status": "up", "latencyMs": 0 },
    "postgres": { "status": "up", "latencyMs": 2 },
    "redis": { "status": "up", "latencyMs": 1 }
  }
}
```

---

## 3. Environnements

### 3.1 Local

```
Base URL : http://localhost:3000/api/
Health   : http://localhost:3000/health
```

Lance avec `npm run dev`. La base de donnees PostgreSQL et Redis sont demarrees via Docker Compose.

### 3.2 Staging

```
Base URL : https://staging-api.foodcall.app/api/
Health   : https://staging-api.foodcall.app/health
```

### 3.3 Production

```
Base URL : https://api.foodcall.app/api/
Health   : https://api.foodcall.app/health
```

---

## 4. Authentification

### 4.1 Overview

Le systeme d'authentification repose sur deux tokens :

- Access token (JWT) : court, environ 15 minutes, porte les claims `sub` (userId) et `email`
- Refresh token (UUID) : long, 30 jours, stocke en base sous forme de hash SHA-256

Le refresh token est rotaté a chaque utilisation : l'ancien est revoque et un nouveau est emis.

### 4.2 POST /api/auth/register

Cree un compte utilisateur et retourne une paire de tokens.

**Body :**

```json
{
  "email": "user@example.com",
  "password": "Str0ng!Pass12",
  "displayName": "Jean Dupont"
}
```

Contraintes :

- `email` : email valide
- `password` : minimum 12 caracteres, au moins une majuscule, une minuscule, un chiffre et un symbole
- `displayName` : entre 1 et 120 caracteres

**Reponse 201 :**

```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Erreurs possibles :**

- 409 Conflict : email deja enregistre
- 500 Internal Server Error : echec d'insertion

### 4.3 POST /api/auth/login

Authentifie un utilisateur existant.

**Body :**

```json
{
  "email": "user@example.com",
  "password": "Str0ng!Pass12"
}
```

**Reponse 200 :**

```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Erreurs possibles :**

- 401 Unauthorized : identifiants invalides

### 4.4 POST /api/auth/refresh

Emet un nouveau access token et un nouveau refresh token. Le refresh token precedent est revoque.

**Body :**

```json
{
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000"
}
```

Contrainte : `refreshToken` doit etre un UUID.

**Reponse 200 :**

```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
}
```

**Erreurs possibles :**

- 401 Unauthorized : refresh token invalide, revoque ou expire

### 4.5 POST /api/auth/logout

Revoque le refresh token fourni.

**Body :**

```json
{
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Reponse 204 No Content**

### 4.6 POST /api/auth/change-password

Change le mot de passe de l'utilisateur connecte. Cette operation revoque TOUS les refresh tokens actifs de l'utilisateur ; l'access token courant reste valide jusqu'a son expiration naturelle.

**Headers :** `Authorization: Bearer <accessToken>`

**Body :**

```json
{
  "currentPassword": "Str0ng!Pass12",
  "newPassword": "N3w!Passw0rd"
}
```

Contrainte : `newPassword` suit les memes regles que le mot de passe d'inscription.

**Reponse 204 No Content**

**Erreurs possibles :**

- 401 Unauthorized : mot de passe actuel incorrect

---

### 4.7 Exemples curl

```bash
# 1. Inscription
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Str0ng!Pass12","displayName":"Jean Dupont"}'

# 2. Connexion
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Str0ng!Pass12"}'

# 3. Requete authentifiee
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <accessToken>"

# 4. Refresh token
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'

# 5. Deconnexion
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

---

## 5. Modele utilisateur

### 5.1 Table users

| Colonne          | Type         | Contraintes             |
| ---------------- | ------------ | ----------------------- |
| id               | uuid         | PK, genere par defaut   |
| email            | varchar(255) | NOT NULL, unique        |
| password_hash    | text         | NOT NULL                |
| display_name     | varchar(120) | NOT NULL                |
| avatar_url       | text         | nullable                |
| reputation_score | integer      | NOT NULL, DEFAULT 0     |
| created_at       | timestamptz  | NOT NULL, DEFAULT now() |
| updated_at       | timestamptz  | NOT NULL, DEFAULT now() |
| deleted_at       | timestamptz  | nullable (soft delete)  |

### 5.2 Table refresh_tokens

| Colonne    | Type        | Contraintes                         |
| ---------- | ----------- | ----------------------------------- |
| id         | uuid        | PK                                  |
| user_id    | uuid        | FK vers users.id, ON DELETE CASCADE |
| token_hash | text        | NOT NULL, unique                    |
| expires_at | timestamptz | NOT NULL                            |
| created_at | timestamptz | NOT NULL, DEFAULT now()             |
| revoked_at | timestamptz | nullable                            |

Le refresh token n'est jamais retourne en dehors des endpoints auth/register, auth/login et auth/refresh. Le service ne retourne jamais la liste des refresh tokens d'un utilisateur.

### 5.3 Interface TypeScript exposee

```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  reputationScore: number;
  createdAt: string;
  updatedAt: string;
}
```

Le champ `passwordHash` est systematiquement exclu des reponses API.

---

## 6. Users API

Tous les endpoints de ce module necessitent un Bearer token valide.

### 6.1 GET /api/users/me

Retourne le profil de l'utilisateur connecte.

**Reponse 200 :**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "displayName": "Jean Dupont",
  "avatarUrl": null,
  "reputationScore": 0,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### 6.2 PATCH /api/users/me

Met a jour le profil de l'utilisateur connecte.

**Body :**

```json
{
  "email": "new@example.com",
  "displayName": "Jean D."
}
```

Les deux champs sont optionnels. Si `email` est fourni et deja utilise par un autre compte actif, une erreur 409 est retournee.

**Reponse 200 :**

Retourne l'utilisateur mis a jour avec les memes champs que GET /users/me.

### 6.3 POST /api/users/me/avatar

Telecharge un avatar pour l'utilisateur connecte. L'upload se fait via un payload JSON base64, pas de multipart/form-data.

**Body :**

```json
{
  "filename": "avatar.jpg",
  "contentType": "image/jpeg",
  "base64": "/9j/4AAQSkZJRgABAQ..."
}
```

Contraintes :

- `filename` : entre 1 et 255 caracteres
- `contentType` : image/jpeg, image/png ou image/webp
- `base64` : contenu non vide, encode en base64

**Comportement :**

Le service decode le base64 en buffer. Si un avatar local existait (`/uploads/...`), il est supprime du stockage. Le nouvel avatar est stocke et l'URL est enregistree sur le profil.

**Reponse 201 :**

Retourne l'utilisateur mis a jour.

### 6.4 DELETE /api/users/me/avatar

Supprime l'avatar de l'utilisateur connecte. Si un avatar local existait, il est supprime du stockage. Le champ `avatarUrl` passe a `null`.

**Reponse 200 :**

Retourne l'utilisateur mis a jour.

---

## 7. Groupes

### 7.1 Modele de donnees

**Table groups :**

| Colonne                      | Type                  | Contraintes                     |
| ---------------------------- | --------------------- | ------------------------------- |
| id                           | uuid                  | PK                              |
| name                         | varchar(100)          | NOT NULL                        |
| description                  | text                  | nullable                        |
| created_by                   | uuid                  | FK users.id, ON DELETE RESTRICT |
| budget_max                   | numeric(10,2)         | nullable                        |
| default_start_address        | text                  | nullable                        |
| default_start_latitude       | numeric(9,6)          | nullable                        |
| default_start_longitude      | numeric(9,6)          | nullable                        |
| default_start_location       | geography(Point,4326) | nullable, index GIST            |
| default_search_radius_meters | integer               | nullable                        |
| created_at                   | timestamptz           | DEFAULT now()                   |
| updated_at                   | timestamptz           | DEFAULT now()                   |
| deleted_at                   | timestamptz           | nullable (soft delete)          |

Contraintes DB : `default_start_latitude` et `default_start_longitude` sont soit toutes deux nulles, soit toutes deux renseignees. `default_start_location` est nul si et seulement si les deux coordonnees sont nulles.

**Table group_members :**

| Colonne   | Type        | Contraintes                     |
| --------- | ----------- | ------------------------------- |
| id        | uuid        | PK                              |
| group_id  | uuid        | FK groups.id, ON DELETE CASCADE |
| user_id   | uuid        | FK users.id, ON DELETE CASCADE  |
| role      | group_role  | NOT NULL, DEFAULT 'member'      |
| joined_at | timestamptz | NOT NULL, DEFAULT now()         |

Unique sur (group_id, user_id).

**Table group_invites :**

| Colonne      | Type        | Contraintes                     |
| ------------ | ----------- | ------------------------------- |
| id           | uuid        | PK                              |
| group_id     | uuid        | FK groups.id, ON DELETE CASCADE |
| code         | varchar(8)  | NOT NULL, unique                |
| expires_at   | timestamptz | NOT NULL                        |
| max_uses     | integer     | nullable                        |
| current_uses | integer     | NOT NULL, DEFAULT 0             |
| created_at   | timestamptz | DEFAULT now()                   |

### 7.2 GET /api/groups

Liste les groupes dont l'utilisateur connecte est membre.

**Parametres de requete :**

- `cursor` : curseur provider opaque optionnel, string trimmee de 1 a 1000 caracteres. Le backend le transmet sans l'interpreter; Nominatim retourne actuellement `nextCursor: null`.
- `limit` : entier entre 1 et 50, defaut 20

**Reponse 200 :**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Equipe produit",
      "description": "Groupe de dejeuner du vendredi",
      "role": "owner",
      "budgetMax": "15.00",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "nextCursor": "2024-01-10T08:00:00.000Z"
  }
}
```

Note : `budgetMax` est retourne comme string car il s'agit d'un type `numeric` Drizzle. La liste ne retourne pas les champs de point de depart par defaut ; utiliser `GET /api/groups/:id` pour le contrat complet.

### 7.3 GET /api/groups/:id

Retourne les details d'un groupe. L'utilisateur doit en etre membre.

**Reponse 200 :**

Retourne l'objet groupe complet avec tous les champs de la table groups.

### 7.4 POST /api/groups

Cree un nouveau groupe. Le createur devient automatiquement membre avec le role `owner`.

**Body :**

```json
{
  "name": "Equipe produit",
  "description": "Groupe de dejeuner du vendredi",
  "budgetMax": 15,
  "defaultStartAddress": "10 rue de Rivoli, Paris",
  "defaultStartLatitude": 48.8566,
  "defaultStartLongitude": 2.3522,
  "defaultSearchRadiusMeters": 1500
}
```

Les champs `description`, `budgetMax`, `defaultStartAddress`, `defaultStartLatitude`, `defaultStartLongitude` et `defaultSearchRadiusMeters` sont optionnels. `budgetMax` est un nombre positif en entree, converti en numeric en base. Les coordonnees de depart doivent etre fournies ensemble ; passer les deux coordonnees a `null` lors d'un PATCH supprime le point PostGIS du groupe.

**Reponse 201 :**

Retourne le groupe cree.

### 7.5 POST /api/groups/:id/invites

Cree un code d'invitation de 8 caracteres pour un groupe. L'utilisateur doit etre membre du groupe.

**Comportement :**

Le code est genere avec `randomBytes(6).toString('base64url')`, nettoye et tronque a 8 caracteres alphanumeriques. Une collision entraine une nouvelle tentative (maximum 5). L'invite expire au bout de 7 jours.

**Reponse 201 :**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "groupId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "code": "aB3dE5fG",
  "expiresAt": "2024-01-22T10:30:00.000Z",
  "maxUses": null,
  "currentUses": 0,
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### 7.6 POST /api/groups/join

Rejoint un groupe via un code d'invitation.

**Body :**

```json
{
  "code": "aB3dE5fG"
}
```

Contrainte : `code` doit faire exactement 8 caracteres.

**Comportement :**

Verifie que le code existe, n'est pas expire, et que la limite d'utilisation n'est pas atteinte. Incremente `currentUses`. Si l'utilisateur est deja membre, retourne 409 Conflict.

**Reponse 201 :**

Retourne le membre cree.

### 7.7 PATCH /api/groups/:id

Met a jour un groupe. Seuls le owner et les admin peuvent modifier un groupe.

**Body :**

Meme schema que la creation, tous les champs optionnels. `defaultStartLatitude` et `defaultStartLongitude` doivent etre fournis ensemble. Pour retirer le point de depart par defaut, envoyer les deux valeurs a `null`.

**Reponse 200 :**

Retourne le groupe mis a jour.

### 7.8 DELETE /api/groups/:id

Supprime logiquement un groupe. Seul le owner peut supprimer un groupe.

**Reponse 200 :**

---

## 8. Restaurants

### 8.1 Modele de donnees

**Table restaurants :**

| Colonne      | Type         | Contraintes                     |
| ------------ | ------------ | ------------------------------- |
| id           | uuid         | PK                              |
| name         | varchar(200) | NOT NULL                        |
| description  | text         | nullable                        |
| address      | text         | NOT NULL                        |
| latitude     | numeric(9,6) | NOT NULL                        |
| longitude    | numeric(9,6) | NOT NULL                        |
| location     | geography    | NOT NULL (Point, 4326)          |
| external_id  | varchar(255) | nullable                        |
| phone        | varchar(50)  | nullable                        |
| website      | text         | nullable                        |
| cuisine_tags | jsonb        | NOT NULL, DEFAULT []            |
| photo_urls   | jsonb        | NOT NULL, DEFAULT []            |
| created_by   | uuid         | FK users.id, ON DELETE SET NULL |
| created_at   | timestamptz  | DEFAULT now()                   |
| updated_at   | timestamptz  | DEFAULT now()                   |
| deleted_at   | timestamptz  | nullable (soft delete)          |

Index GIST sur `location`. Unique sur (name, address).

### 8.2 GET /api/restaurants

Liste les restaurants avec possibilite de recherche textuelle.

Alias frontend compatible : `GET /api/restaurants/search` accepte les memes parametres de requete et retourne la meme enveloppe paginee que `GET /api/restaurants`.

**Parametres de requete :**

- `q` : chaine de recherche optionnelle, filtre sur le nom (case-insensitive, substring)
- `cursor` : date ISO 8601 optionnelle
- `limit` : entier entre 1 et 50, defaut 20

**Reponse 200 :**

Retourne une liste paginee d'objets restaurant. Les champs retournes sont : id, name, description, address, latitude, longitude, cuisineTags, photoUrls, createdAt.

Note : latitude et longitude sont retournes comme strings car elles sont stockees en numeric.

### 8.3 GET /api/restaurants/search

Alias frontend compatible de `GET /api/restaurants`. Cet endpoint expose le meme contrat de liste paginee afin que les clients frontend puissent appeler une route explicite de recherche.

**Parametres de requete :**

- `q` : chaine de recherche optionnelle, filtre sur le nom (case-insensitive, substring)
- `cursor` : date ISO 8601 optionnelle
- `limit` : entier entre 1 et 50, defaut 20

**Reponse 200 :**

Meme enveloppe paginee que `GET /api/restaurants` :

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Le Petit Bistrot",
      "description": "Bistrot traditionnel",
      "address": "12 rue de la Paix",
      "latitude": "48.856600",
      "longitude": "2.352200",
      "cuisineTags": ["francais", "bistrot"],
      "photoUrls": [],
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "meta": { "nextCursor": null }
}
```

**Exemple curl :**

```bash
curl "https://api.foodcall.app/api/restaurants/search?q=bistrot&limit=20"
```

### 8.4 GET /api/restaurants/nearby

Recherche les restaurants dans un rayon donne autour d'un point GPS.

**Parametres de requete :**

- `lat` : latitude, entre -90 et 90
- `lng` : longitude, entre -180 et 180
- `radius` : rayon en metres, entre 100 et 50000, defaut 1000
- `limit` : entier entre 1 et 50, defaut 20
- `cursor` : date ISO 8601 optionnelle

**Reponse 200 :**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Le Petit Bistrot",
      "address": "12 rue de la Paix",
      "latitude": "48.856600",
      "longitude": "2.352200",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "distanceMeters": 450.5
    }
  ],
  "meta": {
    "nextCursor": null
  }
}
```

`meta.nextCursor` vaut le curseur opaque fourni par le provider quand celui-ci supporte une page suivante. `null` signifie qu'aucune page suivante n'est fournie par le provider courant.

Le champ `distanceMeters` est calcule par PostGIS (`ST_Distance`).

### 8.5 GET /api/restaurants/:id

Retourne les details d'un restaurant avec son aggregate rating interne issu des avis actifs stockes dans `restaurant_reviews`.

**Reponse 200 :**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Le Petit Bistrot",
  "description": "Bistrot traditionnel",
  "address": "12 rue de la Paix, Paris",
  "latitude": "48.856600",
  "longitude": "2.352200",
  "location": "0101000020E6100000...",
  "externalId": null,
  "phone": null,
  "website": null,
  "cuisineTags": ["francais", "bistrot"],
  "photoUrls": [],
  "createdBy": "user-uuid",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "deletedAt": null,
  "rating": {
    "average": 4.5,
    "count": 2
  }
}
```

`rating.average` vaut `null` quand `rating.count` vaut `0`. L'aggregate rating utilise seulement les avis actifs (`deletedAt = null`) de la table interne `restaurant_reviews`; il n'utilise ni metadata provider, ni scoring/recommandation de phase ulterieure.

### 8.6 POST /api/restaurants

Cree un restaurant. Necessite authentification.

**Body :**

```json
{
  "name": "Le Petit Bistrot",
  "description": "Bistrot traditionnel",
  "address": "12 rue de la Paix, Paris",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "cuisineTags": ["francais", "bistrot"],
  "photoUrls": ["https://example.com/photo.jpg"]
}
```

Contraintes :

- `name` : entre 1 et 200 caracteres
- `address` : au moins 1 caractere
- `latitude` : entre -90 et 90
- `longitude` : entre -180 et 180
- `cuisineTags` : tableau de strings optionnel
- `photoUrls` : tableau d'URLs valides optionnel

**Comportement :**

Verifie l'unicite (name, address). Convertit latitude et longitude en strings pour le stockage numeric. Cree un point PostGIS avec `ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography`.

**Reponse 201 :**

Retourne le restaurant cree.

### 8.7 PATCH /api/restaurants/:id

Met a jour un restaurant. Necessite authentification et seul le createur du restaurant peut le modifier dans le MVP.

**Body :**

Schema identique a la creation, tous les champs optionnels.

**Comportement :**

Verifie l'unicite du couple final `(name, address)` en excluant le restaurant courant. Recalcule le point PostGIS uniquement si `latitude` et `longitude` sont fournies ensemble.

**Reponse 200 :**

Retourne le restaurant mis a jour.

### 8.8 DELETE /api/restaurants/:id

Supprime logiquement un restaurant (soft delete). Necessite authentification et seul le createur du restaurant peut le supprimer dans le MVP.

**Reponse 200 :**

## External Restaurant Discovery

Provider-neutral external discovery endpoints. These routes expose normalized restaurant candidates and explicit import operations without making any provider identifier the FoodCall restaurant identity. Search, route enrichment, import, duplicate matching, failure taxonomy, and rollback behavior use stable provider-neutral contracts.

### GET /api/external-restaurants/search

Recherche des restaurants externes normalises autour de coordonnees GPS. Necessite authentification. Les resultats de recherche ne sont pas persistes automatiquement dans `restaurants` ni dans `restaurant_provider_sources`; search does not persist every result.

**Parametres de requete :**

- `lat` : latitude, entre -90 et 90, requis
- `lng` : longitude, entre -180 et 180, requis
- `radius` : rayon en metres, entier entre 100 et 50000, defaut 1000
- `limit` : entier entre 1 et 20, defaut 10
- `cursor` : curseur provider opaque optionnel, trimme, entre 1 et 1000 caracteres
- `q` : filtre texte optionnel, trimme, entre 1 et 200 caracteres
- `includeRoute` : booleen optionnel (`true`/`false`), defaut `false`. Si `true`, la recherche demande un enrichissement distance/duree via le provider de routage abstrait.
- `strictRoute` : booleen optionnel (`true`/`false`), defaut `false`. Si `true`, une erreur d'enrichissement route fait echouer la recherche avec une erreur stable. Si `false`, la recherche retourne les resultats de base sans champs route.

**Reponse 200 :**

```json
{
  "data": [
    {
      "provider": "nominatim",
      "providerPlaceId": "node:123",
      "name": "Le Botaniste",
      "address": "Le Botaniste, Paris, France",
      "latitude": 48.8566,
      "longitude": 2.3522,
      "phone": "+33 1 02 03 04 05",
      "website": "https://example.test",
      "cuisineTags": ["vegetarian"],
      "photoUrls": [],
      "distanceMeters": 450.5,
      "durationSeconds": 300,
      "routeSource": "osrm",
      "sourcePayload": { "osm_id": 123 }
    }
  ],
  "meta": {
    "nextCursor": null
  }
}
```

**Erreurs :**

- `401 Unauthorized` si le JWT est absent ou invalide.
- `400 Bad Request` si les coordonnees, le rayon, la limite, le curseur, `q`, `includeRoute` ou `strictRoute` ne respectent pas les contraintes.
- `504 Gateway Timeout` avec `message: "External places provider timeout"` et `details.code: "EXTERNAL_PROVIDER_TIMEOUT"` si le provider externe expire.
- `429 Too Many Requests` avec `message: "External places provider quota exceeded"` et `details.code: "EXTERNAL_PROVIDER_QUOTA_EXCEEDED"` si le quota provider est atteint.
- `502 Bad Gateway` avec `message: "External places provider returned malformed response"` et `details.code: "EXTERNAL_PROVIDER_MALFORMED_RESPONSE"` si le provider retourne un payload invalide.
- `503 Service Unavailable` avec `message: "External places provider unavailable"` et `details.code: "EXTERNAL_PROVIDER_UNAVAILABLE"` si le provider externe est indisponible.
- `504 Gateway Timeout` avec `message: "External route provider timeout"` et `details.code: "EXTERNAL_ROUTE_PROVIDER_TIMEOUT"` si `strictRoute=true` et que le provider de routage expire.
- `429 Too Many Requests` avec `message: "External route provider quota exceeded"` et `details.code: "EXTERNAL_ROUTE_PROVIDER_QUOTA_EXCEEDED"` si `strictRoute=true` et que le quota de routage est atteint.
- `502 Bad Gateway` avec `message: "External route provider returned malformed response"` et `details.code: "EXTERNAL_ROUTE_PROVIDER_MALFORMED_RESPONSE"` si `strictRoute=true` et que le provider de routage retourne une distance/duree/source invalide.
- `503 Service Unavailable` avec `message: "External route provider unavailable"` et `details.code: "EXTERNAL_ROUTE_PROVIDER_UNAVAILABLE"` si `strictRoute=true` et que le provider de routage est indisponible.

Les erreurs provider de recherche et de routage n'exposent pas le body brut, l'URL, ni les messages bas niveau du provider externe. Les champs `distanceMeters`, `durationSeconds` et `routeSource` sont presents seulement quand `includeRoute=true` et que l'enrichissement reussit avec des valeurs valides; la recherche reste non persistante dans tous les cas.

### POST /api/external-restaurants/import

Importe explicitement un resultat externe normalise dans le modele restaurant interne FoodCall. Necessite authentification. L'import est transactionnel : la creation/reutilisation du restaurant, l'ecriture de la source provider et l'ajout optionnel comme candidat de session reussissent ensemble ou sont annules ensemble.

**Identite et metadata :**

- `restaurants.id` reste l'identite FoodCall interne.
- `provider` et `providerPlaceId` sont conserves comme metadata dans `restaurant_provider_sources`.
- Les metadata provider sont auditables via `importedAt` et `sourcePayload` mais ne remplacent jamais l'identite restaurant interne.

**Body :**

```json
{
  "provider": "nominatim",
  "providerPlaceId": "node:123",
  "sessionId": "11111111-1111-4111-8111-111111111111"
}
```

**Contraintes body :**

- `provider` : `nominatim`, `google` ou `mapbox`, requis.
- `providerPlaceId` : string trimmee, 1 a 255 caracteres, requis.
- `sessionId` : UUID optionnel. Si fourni, le restaurant importe est ajoute comme candidat de session via les regles existantes de `VoteSessionsService.addCandidate`.

**Fournisseur de confiance :**

Le backend ne persiste jamais les champs normalises fournis par le client. Il effectue d'abord une resolution provider cote serveur via `PlacesSearchProvider.lookupRestaurant`, verifie que le resultat correspond a l'identite demandee, puis persiste les champs derives du provider (`name`, `address`, `latitude`, `longitude`, `phone`, `website`, `cuisineTags`, `photoUrls`, `sourcePayload`). Cette frontiere de confiance garantit que les donnees restaurant internes proviennent d'une source provider validee et non d'un payload client potentiellement falsifie.

**Regles de doublons :**

1. Recherche d'abord une source existante par `(provider, providerPlaceId)` dans `restaurant_provider_sources`.
2. Si cette source est deja liee a un restaurant interne non soft-deleted, reutilise ce restaurant et retourne `imported: false`, `matchedBy: "provider-source"`, `restaurantCreated: false`, `sourceAction: "reused"`.
3. Sinon, recherche un restaurant interne non soft-deleted par correspondance exacte `(name, address)`.
4. Si ce restaurant existe, le reutilise, cree/met a jour les metadata provider, et retourne `matchedBy: "name-address"`, `restaurantCreated: false`.
5. Sinon, cree un nouveau restaurant interne avec point PostGIS, cree les metadata provider, et retourne `matchedBy: "none"`, `restaurantCreated: true`.

**Ajout candidat optionnel :**

Si `sessionId` est fourni, l'import appelle les validations existantes d'ajout de candidat : appartenance au groupe de la session, statut `draft` ou `active`, restaurant non soft-deleted et absence de doublon candidat. Un conflit candidat conserve l'erreur stable `409 Candidate already added`.

**Champs d'audit d'import :**

| Champ               | Type    | Valeurs                                   | Description                                                                                       |
| ------------------- | ------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `matchedBy`         | string  | `provider-source`, `name-address`, `none` | Regle de correspondance qui a choisi le restaurant interne.                                       |
| `restaurantCreated` | boolean | `true` ou `false`                         | Indique si une nouvelle ligne `restaurants` a ete creee pendant l'import.                         |
| `sourceLinked`      | boolean | `true`                                    | Indique que la metadata provider est liee a un restaurant interne dans la transaction retournee.  |
| `sourceAction`      | string  | `created`, `updated`, `reused`            | Action effectuee sur `restaurant_provider_sources`.                                               |
| `candidateAdded`    | boolean | `true` ou `false`                         | Indique si l'ajout candidat optionnel a reussi dans la meme transaction.                          |
| `transactional`     | boolean | `true`                                    | Indique que restaurant, source provider et candidat optionnel sont executes dans une transaction. |

**Reponse 201 :**

```json
{
  "restaurant": {
    "id": "restaurant-uuid",
    "name": "Le Botaniste",
    "address": "Le Botaniste, Paris, France",
    "latitude": "48.856600",
    "longitude": "2.352200",
    "phone": "+33 1 02 03 04 05",
    "website": "https://example.test",
    "cuisineTags": ["vegetarian"],
    "photoUrls": [],
    "createdBy": "user-uuid"
  },
  "source": {
    "id": "source-uuid",
    "restaurantId": "restaurant-uuid",
    "provider": "nominatim",
    "providerPlaceId": "node:123",
    "name": "Le Botaniste",
    "address": "Le Botaniste, Paris, France",
    "latitude": "48.856600",
    "longitude": "2.352200",
    "sourcePayload": { "osm_id": 123 },
    "importedAt": "2026-05-17T00:00:00.000Z"
  },
  "imported": true,
  "candidate": null,
  "matchedBy": "none",
  "restaurantCreated": true,
  "sourceLinked": true,
  "sourceAction": "created",
  "candidateAdded": false,
  "transactional": true
}
```

`candidate` vaut `null` si aucun `sessionId` n'est fourni. Sinon, il contient le candidat cree selon la meme forme que `POST /api/sessions/:id/candidates`.

**Erreurs :**

- `400 Bad Request` si le body ne respecte pas le schema d'import.
- `401 Unauthorized` si le JWT est absent ou invalide.
- `403 Forbidden` si l'utilisateur n'est pas membre du groupe de la session ou n'a pas le droit d'ajouter le candidat via les regles existantes.
- `404 Not Found` si `sessionId` ne correspond a aucune session accessible ou si le restaurant cible devient indisponible pendant l'ajout candidat.
- `409 Conflict` avec `message: "Candidate already added"` si le restaurant est deja candidat de la session. Les conflits `(provider, providerPlaceId)` sont resolus par reutilisation de la source existante plutot que par creation d'un doublon.
- `503 Service Unavailable` avec `message: "External places provider unavailable"` si la resolution provider echoue (timeout, quota, reponse malformee, provider indisponible) ou si le resultat lookup ne correspond pas a l'identite demandee. Aucune reponse partielle `restaurant`, `source` ou `candidate` n'est retournee.
- `503 Service Unavailable` avec `message: "Restaurant source import unavailable"` si la creation ou mise a jour des metadata provider echoue. Aucune reponse partielle `restaurant`, `source` ou `candidate` n'est retournee.
- `503 Service Unavailable` avec `message: "Restaurant import unavailable"` si la creation du restaurant ou l'ajout candidat echoue avec une erreur inattendue. Les erreurs domaine existantes de candidat (`403`, `404`, `409`) restent exposees telles quelles.
- Les echecs provider de recherche/lookup utilisent la taxonomie stable `timeout`, `quota`, `malformed`, `strict`, `EXTERNAL_PROVIDER_TIMEOUT`, `EXTERNAL_PROVIDER_QUOTA_EXCEEDED`, `EXTERNAL_PROVIDER_MALFORMED_RESPONSE` ou `EXTERNAL_PROVIDER_UNAVAILABLE`; les echecs transactionnels d'import exposent une erreur HTTP stable et annulent les ecritures partielles.

**Rollback transactionnel :**

Toute erreur pendant la creation/reutilisation du restaurant, l'insertion/mise a jour de `restaurant_provider_sources`, ou l'ajout candidat optionnel rejette la transaction complete. La reponse d'erreur ne contient pas `restaurant`, `source`, `candidate`, `matchedBy`, `sourceAction`, ni autre champ de succes partiel.

---

## 9. Reviews

Reference des avis restaurant. Les routes Reviews exposent des notes post-repas creees par des utilisateurs pour des restaurants internes FoodCall. Les avis ciblent `restaurants.id`, jamais les identifiants de providers externes.

**Table restaurant_reviews :**

| Colonne       | Type      | Contraintes                                     |
| ------------- | --------- | ----------------------------------------------- |
| id            | uuid      | PK                                              |
| restaurant_id | uuid      | FK restaurants.id, ON DELETE RESTRICT           |
| user_id       | uuid      | FK users.id, ON DELETE CASCADE                  |
| session_id    | uuid      | FK vote_sessions.id, ON DELETE RESTRICT         |
| rating        | integer   | requis, entre 1 et 5                            |
| comment       | text      | nullable, longueur maximale API 2000 caracteres |
| created_at    | timestamp | auto                                            |
| updated_at    | timestamp | auto                                            |
| deleted_at    | timestamp | nullable, soft delete                           |

**Contraintes :**

- `rating` est un entier de `1` a `5`, valide par l'API et par `restaurant_reviews_rating_range_check`.
- `restaurant_reviews_restaurant_user_unique` impose un seul avis par couple `(restaurant_id, user_id)`.
- Le service verifie aussi l'absence d'avis actif avant insertion et retourne `409 Conflict` avec `message: "Review already exists"` en cas de doublon.
- La suppression est logique : `DELETE /api/reviews/:id` renseigne `deletedAt`; les listes et l'aggregate rating excluent les avis soft-deleted.
- L'aggregate rating de `GET /api/restaurants/:id` est derive a la lecture depuis `restaurant_reviews`, n'est pas stocke sur `restaurants`, et expose seulement `rating.average` et `rating.count`.

**Review response shape :**

```typescript
interface RestaurantReview {
  id: string;
  restaurantId: string;
  userId: string;
  sessionId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
```

### 9.1 GET /api/restaurants/:id/reviews

Liste les avis actifs d'un restaurant. Route publique, sans authentification.

**Parametres de requete :**

- `limit` : entier coercible entre 1 et 50, defaut 20.
- `cursor` : date ISO optionnelle; retourne les avis crees avant ce curseur.

**Comportement :**

Verifie que le restaurant existe et n'est pas soft-deleted. Retourne uniquement les avis dont `deletedAt` est `null`, tries par `createdAt` decroissant. La pagination utilise `limit + 1` et retourne `meta.nextCursor` quand une page suivante existe.

**Reponse 200 :**

```json
{
  "data": [
    {
      "id": "review-uuid",
      "restaurantId": "restaurant-uuid",
      "userId": "user-uuid",
      "sessionId": "session-uuid",
      "rating": 5,
      "comment": "Excellent dinner",
      "createdAt": "2026-01-03T10:00:00.000Z",
      "updatedAt": "2026-01-03T10:00:00.000Z",
      "deletedAt": null
    }
  ],
  "meta": { "nextCursor": null }
}
```

**Pagination :**

La reponse suit le format pagine standard `{ data, meta: { nextCursor } }`. `nextCursor` est `null` quand aucune page suivante n'existe.

**Erreurs :**

- `400 Bad Request` si `limit` ou `cursor` ne respecte pas le schema.
- `404 Not Found` avec `message: "Restaurant not found"` si le restaurant n'existe pas ou est soft-deleted.

### 9.2 POST /api/restaurants/:id/reviews

Cree un avis pour un restaurant. Necessite authentification.

**Headers :** `Authorization: Bearer <accessToken>`

**Body :**

```json
{
  "sessionId": "session-uuid",
  "rating": 5,
  "comment": "Excellent dinner"
}
```

`rating` est un entier entre 1 et 5. `comment` est optionnel, trimme, longueur maximale 2000 caracteres.

**Comportement :**

L'utilisateur doit etre membre du groupe de la session terminee. Le restaurant cible doit etre le `selectedRestaurantId` de la session terminee ; un restaurant qui n'etait que candidat de la session ne peut pas etre avise via cette session. Un utilisateur ne peut avoir qu'un avis actif par restaurant.

**Reponse 201 :** retourne l'avis cree au format `RestaurantReview`.

**Erreurs :**

- `400 Bad Request` si le body ne respecte pas le schema.
- `401 Unauthorized` si le JWT est absent ou invalide.
- `403 Forbidden` avec `message: "User cannot review this restaurant from this session"` si les regles de session ne permettent pas l'avis.
- `404 Not Found` avec `message: "Restaurant not found"` si le restaurant n'existe pas ou est soft-deleted.
- `409 Conflict` avec `message: "Review already exists"` si un avis actif existe deja pour ce couple utilisateur/restaurant.

### 9.3 PATCH /api/reviews/:id

Met a jour l'avis actif de l'utilisateur authentifie. Necessite authentification et ownership de l'avis.

**Headers :** `Authorization: Bearer <accessToken>`

**Body :**

```json
{
  "rating": 4,
  "comment": "Still great"
}
```

Au moins un champ parmi `rating` et `comment` est requis. `rating` reste un entier entre `1` et `5`; `comment` reste optionnel, trimme, et limite a 2000 caracteres. Aucun autre champ de l'avis n'est modifiable.

**Reponse 200 :** retourne l'avis mis a jour au format `RestaurantReview`.

**Erreurs :**

- `400 Bad Request` si le body ne respecte pas le schema.
- `401 Unauthorized` si le JWT est absent ou invalide.
- `403 Forbidden` avec `message: "Only the review author can modify this review"` si l'utilisateur n'est pas l'auteur.
- `404 Not Found` avec `message: "Review not found"` si l'avis n'existe pas ou est soft-deleted.

### 9.4 DELETE /api/reviews/:id

Supprime logiquement l'avis actif de l'utilisateur authentifie en renseignant `deletedAt`. Necessite authentification et ownership de l'avis.

**Headers :** `Authorization: Bearer <accessToken>`

**Reponse 200 :** corps vide.

**Erreurs :**

- `401 Unauthorized` si le JWT est absent ou invalide.
- `403 Forbidden` avec `message: "Only the review author can modify this review"` si l'utilisateur n'est pas l'auteur.
- `404 Not Found` avec `message: "Review not found"` si l'avis n'existe pas ou est deja soft-deleted.

---

## 10. Geolocalisation

### 10.1 GET /api/geo/geocode

Convertit une adresse textuelle en coordonnees GPS.

**Parametres de requete :**

- `q` : adresse a geocoder, entre 2 et 200 caracteres

**Comportement :**

Utilise le provider configure (`MAP_PROVIDER=nominatim` actuellement). Les resultats sont mis en cache Redis pendant 24 heures. Respecte un delai minimum de 1 seconde entre les requetes Nominatim.

**Reponse 200 :**

Retourne le payload brut du provider de geocodage (format Nominatim par defaut).

**Erreurs possibles :**

- 503 Service Unavailable : provider non configure ou indisponible

### 10.2 GET /api/geo/route

Calcule la distance et la duree entre deux points.

**Parametres de requete :**

- `fromLat` : latitude de depart, entre -90 et 90
- `fromLng` : longitude de depart, entre -180 et 180
- `toLat` : latitude d'arrivee, entre -90 et 90
- `toLng` : longitude d'arrivee, entre -180 et 180

**Comportement :**

Utilise le provider configure (`ROUTING_PROVIDER=osrm` actuellement). Les resultats sont mis en cache Redis pendant 1 heure. Les Docker Compose du repository ne demarrent pas d'instance OSRM ni ne fournissent de donnees routieres : il faut lancer OSRM separement et configurer `OSRM_BASE_URL`. En developpement Docker, `docker-compose.yml` pointe par defaut vers `http://host.docker.internal:5000`. En production, `OSRM_BASE_URL` doit etre fourni explicitement.

**Reponse 200 :**

```json
{
  "distance": 1250,
  "duration": 180
}
```

- `distance` : metres
- `duration` : secondes

**Erreurs possibles :**

- 503 Service Unavailable : provider non configure ou indisponible

---

## 11. Sessions de decision

### 11.1 Modele de donnees

**Table vote_sessions :**

| Colonne                | Type                  | Contraintes                           |
| ---------------------- | --------------------- | ------------------------------------- |
| id                     | uuid                  | PK                                    |
| group_id               | uuid                  | FK groups.id, ON DELETE CASCADE       |
| name                   | varchar(200)          | NOT NULL                              |
| description            | text                  | nullable                              |
| status                 | session_status        | NOT NULL, DEFAULT 'draft'             |
| vote_type              | vote_type             | NOT NULL, DEFAULT 'approval'          |
| created_by             | uuid                  | FK users.id, ON DELETE RESTRICT       |
| deadline               | timestamptz           | nullable                              |
| start_address          | text                  | nullable                              |
| start_latitude         | numeric(9,6)          | nullable                              |
| start_longitude        | numeric(9,6)          | nullable                              |
| start_location         | geography(Point,4326) | nullable, index GIST                  |
| search_radius_meters   | integer               | nullable                              |
| budget_max             | numeric(10,2)         | nullable                              |
| selected_restaurant_id | uuid                  | nullable, FK restaurants.id, RESTRICT |
| completed_at           | timestamptz           | nullable                              |
| created_at             | timestamptz           | DEFAULT now()                         |
| updated_at             | timestamptz           | DEFAULT now()                         |

Contraintes DB : `start_latitude` et `start_longitude` sont soit toutes deux nulles, soit toutes deux renseignees. `start_location` est nul si et seulement si les deux coordonnees sont nulles. Les valeurs de depart, de rayon et de budget sont snapshottees a la creation depuis le groupe si elles ne sont pas fournies explicitement.

**Valeurs de session_status :**

- `draft`
- `active`
- `voting`
- `completed`
- `cancelled`

**Valeurs de vote_type :**

- `approval`
- `ranking`
- `stars`

### 11.2 Machine a etats

```
draft --[activate]--> active
active --[start-voting]--> voting
draft --[start-voting]--> voting
voting --[select-restaurant]--> voting
voting --[complete, selectedRestaurantId present]--> completed

* --[cancel]--> cancelled  (sauf completed et cancelled)
```

Seul le createur d'une session peut declencher les transitions d'etat et selectionner le restaurant final. Le vote donne un classement ; il ne complete jamais automatiquement la session.

### 11.3 POST /api/groups/:groupId/sessions

Cree une session de decision dans un groupe.

**Body :**

```json
{
  "name": "Dejeuner du 15 janvier",
  "description": "Ou mange-t-on ce midi ?",
  "deadline": "2024-01-15T12:00:00.000Z",
  "startAddress": "10 rue de Rivoli, Paris",
  "startLatitude": 48.8566,
  "startLongitude": 2.3522,
  "searchRadiusMeters": 1500,
  "budgetMax": 15
}
```

Les champs `description`, `deadline`, `startAddress`, `startLatitude`, `startLongitude`, `searchRadiusMeters` et `budgetMax` sont optionnels. A la creation, les champs de depart, rayon et budget sont snapshotes depuis le groupe quand ils ne sont pas fournis explicitement. Les changements ulterieurs du groupe ne modifient pas la session.

**Reponse 201 :**

Retourne la session creee.

### 11.4 GET /api/groups/:groupId/sessions

Liste les sessions d'un groupe.

**Parametres de requete :**

- `cursor` : date ISO 8601 optionnelle
- `limit` : entier entre 1 et 50, defaut 20

**Reponse 200 :**

Liste paginee de sessions.

### 11.5 GET /api/sessions/:id

Retourne les details d'une session. L'utilisateur doit etre membre du groupe.

**Reponse 200 :**

Retourne la session complete.

### 11.6 PATCH /api/sessions/:id

Met a jour une session. Seul le createur peut modifier. Impossible si la session est dans un etat autre que `draft` ou `active`.

**Body :**

Meme schema que la creation, tous les champs optionnels.

**Reponse 200 :**

Retourne la session mise a jour.

### 11.7 POST /api/sessions/:id/activate

Passe une session de `draft` a `active`.

**Reponse 201 :**

Retourne la session mise a jour.

### 11.8 POST /api/sessions/:id/start-voting

Passe une session de `draft` ou `active` a `voting`. Necessite au moins un candidat.

**Reponse 201 :**

Retourne la session mise a jour.

### 11.9 POST /api/sessions/:id/select-restaurant

Selectionne explicitement le restaurant final d'une session. Seul le createur de la session peut appeler cet endpoint. La session doit etre en etat `voting` et le restaurant doit deja etre candidat de la session.

**Body :**

```json
{
  "restaurantId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Reponse 201 :**

Retourne la session mise a jour avec `selectedRestaurantId`.

**Dependances runtime :**

Cette operation est database-only : elle lit la session, verifie le candidat et met a jour `selectedRestaurantId` dans PostgreSQL. Elle ne depend pas de Redis ; une indisponibilite Redis n'empeche pas cette selection explicite tant que PostgreSQL est disponible.

**Erreurs possibles :**

- 400 Bad Request : restaurant non candidat ou session pas en etat `voting`
- 403 Forbidden : utilisateur non createur
- 404 Not Found : restaurant soft-deleted (`Restaurant not found`)

### 11.10 POST /api/sessions/:id/complete

Passe une session de `voting` a `completed`. `selectedRestaurantId` doit etre renseigne au prealable via `POST /api/sessions/:id/select-restaurant`.

**Reponse 201 :**

Retourne la session mise a jour.

### 11.11 POST /api/sessions/:id/cancel

Annule une session. Impossible si deja `completed` ou `cancelled`.

**Reponse 201 :**

Retourne la session mise a jour.

---

## 12. Candidats d'une session

### 12.1 Modele de donnees

**Table session_candidates :**

| Colonne       | Type        | Contraintes                            |
| ------------- | ----------- | -------------------------------------- |
| id            | uuid        | PK                                     |
| session_id    | uuid        | FK vote_sessions.id, ON DELETE CASCADE |
| restaurant_id | uuid        | FK restaurants.id, ON DELETE RESTRICT  |
| added_by      | uuid        | FK users.id, ON DELETE RESTRICT        |
| created_at    | timestamptz | DEFAULT now()                          |

Unique sur (session_id, restaurant_id).

### 12.2 GET /api/sessions/:id/candidates

Liste les candidats d'une session avec les details du restaurant associe. L'utilisateur doit etre membre de la session.

**Comportement :**

- Retourne tous les candidats visibles pour la session.
- Les candidats dont le restaurant est soft-deleted sont omis.
- Tri deterministe : par `createdAt` ascendant, puis par `restaurantId` ascendant en cas d'egalite.

**Reponse 200 :**

```json
[
  {
    "id": "session-candidate-id",
    "sessionId": "session-id",
    "restaurantId": "restaurant-id",
    "addedBy": "user-id",
    "createdAt": "2026-05-16T12:00:00.000Z",
    "restaurant": {
      "id": "restaurant-id",
      "name": "Restaurant name",
      "address": "Street address",
      "latitude": 48.8566,
      "longitude": 2.3522,
      "cuisineTags": ["french"],
      "photoUrls": ["https://example.test/photo.jpg"]
    }
  }
]
```

Note : `latitude` et `longitude` sont retournes comme nombres dans cette route (convertis depuis le stockage numeric), contrairement aux autres endpoints restaurant qui les retournent en strings.

### 12.3 POST /api/sessions/:id/candidates

Ajoute un restaurant candidat a une session. Possible uniquement en etat `draft` ou `active`.

**Body :**

```json
{
  "restaurantId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Reponse 201 :**

Retourne le candidat cree.

**Erreurs possibles :**

- 404 Not Found : restaurant inexistant ou soft-deleted (`Restaurant not found`)
- 409 Conflict : candidat deja ajoute (`Candidate already added`)

### 12.4 DELETE /api/sessions/:id/candidates/:candidateId

Retire un candidat d'une session. Seul le createur de la session peut retirer un candidat. Possible uniquement en etat `draft` ou `active`.

**Reponse 200 :**

**Erreurs possibles :**

- 404 Not Found : candidat inexistant ou n'appartenant pas a cette session

---

## 13. Votes

### 13.1 Modele de donnees

**Table votes :**

| Colonne      | Type        | Contraintes                                 |
| ------------ | ----------- | ------------------------------------------- |
| id           | uuid        | PK                                          |
| session_id   | uuid        | FK vote_sessions.id, ON DELETE CASCADE      |
| candidate_id | uuid        | FK session_candidates.id, ON DELETE CASCADE |
| user_id      | uuid        | FK users.id, ON DELETE CASCADE              |
| value        | integer     | NOT NULL, DEFAULT 1                         |
| created_at   | timestamptz | DEFAULT now()                               |

Unique sur (session_id, candidate_id, user_id).

Actuellement, seul le vote d'approbation est implemente. La valeur est toujours 1.

### 13.2 POST /api/sessions/:id/votes

Vote pour un candidat. Possible uniquement si la session est en etat `voting` et que la deadline n'est pas passee.

**Body :**

```json
{
  "candidateId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Reponse 201 :**

Retourne le vote cree.

### 13.3 GET /api/sessions/:id/votes

Liste les votes d'une session.

**Comportement :**

- Si la session est en etat `voting` : l'utilisateur ne voit que ses propres votes
- Si la session est en etat `completed` : l'utilisateur voit tous les votes

**Parametres de requete :**

- `cursor` : date ISO 8601 optionnelle
- `limit` : entier entre 1 et 50, defaut 20

**Reponse 200 :**

Liste paginee de votes.

### 13.4 DELETE /api/sessions/:id/votes/:voteId

Annule un vote. Possible uniquement si la session est en etat `voting`. Un utilisateur ne peut annuler que son propre vote.

**Reponse 200 :**

### 13.5 GET /api/sessions/:id/results

Retourne le classement des candidats apres completion. L'endpoint est disponible uniquement quand la session est en etat `completed`. Il n'effectue pas de selection automatique : le restaurant final est celui stocke dans `vote_sessions.selected_restaurant_id`.

**Reponse 200 :**

```json
[
  {
    "candidateId": "550e8400-e29b-41d4-a716-446655440000",
    "restaurantId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "restaurantName": "Le Petit Bistrot",
    "votes": 5,
    "creatorApproved": true
  }
]
```

Le tri actuel est : nombre de votes decroissant, approbation du createur, puis date d'ajout du candidat.

---

## 14. Calls

### 14.1 Modele de donnees

**Table food_calls :**

| Colonne       | Type        | Contraintes                            |
| ------------- | ----------- | -------------------------------------- |
| id            | uuid        | PK                                     |
| session_id    | uuid        | FK vote_sessions.id, ON DELETE CASCADE |
| restaurant_id | uuid        | FK restaurants.id, ON DELETE RESTRICT  |
| user_id       | uuid        | FK users.id, ON DELETE CASCADE         |
| pitch         | text        | NOT NULL                               |
| created_at    | timestamptz | DEFAULT now()                          |

Unique sur (session_id, restaurant_id, user_id).

**Table call_feedback :**

| Colonne    | Type        | Contraintes                         |
| ---------- | ----------- | ----------------------------------- |
| id         | uuid        | PK                                  |
| call_id    | uuid        | FK food_calls.id, ON DELETE CASCADE |
| user_id    | uuid        | FK users.id, ON DELETE CASCADE      |
| rating     | integer     | NOT NULL                            |
| comment    | text        | nullable                            |
| created_at | timestamptz | DEFAULT now()                       |

Unique sur (call_id, user_id).

### 14.2 POST /api/sessions/:id/calls

Cree un call (recommandation argumentee) dans une session. Possible uniquement en etat `active` ou `voting`. Le restaurant cible doit exister, ne pas etre soft-deleted, et etre candidat de la session.

**Body :**

```json
{
  "restaurantId": "550e8400-e29b-41d4-a716-446655440000",
  "pitch": "Je call ce burger, c'est pas cher, rapide, et on peut tous y aller a pied."
}
```

**Reponse 201 :**

Retourne le call cree.

**Erreurs possibles :**

- 400 Bad Request : restaurant non candidat de la session (`Food call restaurant must be a session candidate`)
- 404 Not Found : restaurant inexistant ou soft-deleted (`Restaurant not found`)
- 409 Conflict : call deja existant pour cet utilisateur et ce restaurant (`Food call already exists`)

### 14.3 GET /api/sessions/:id/calls

Liste les calls d'une session.

**Parametres de requete :**

- `cursor` : date ISO 8601 optionnelle
- `limit` : entier entre 1 et 50, defaut 20

**Reponse 200 :**

Liste paginee de calls.

### 14.4 DELETE /api/calls/:id

Supprime un call. L'utilisateur ne peut supprimer que son propre call. Impossible si la session est deja `completed`.

**Reponse 200 :**

---

## Scoring and Recommendations

Reference des scores et recommandations. Les recommandations sont consultatives : elles ne selectionnent pas de restaurant, ne terminent pas une session (`does not select or complete sessions`) et ne modifient pas l'etat de vote.

### Cache semantics

`score_cache` peut servir des payloads de score non expires pour les scores utilisateur et restaurant. Les tables sources restent autoritatives : `call_feedback`, `food_calls`, `restaurant_reviews`, `restaurants`, `groups`, `vote_sessions` et les relations de membership permettent toujours de recomputer les scores. Une ligne de cache expiree est remplacee par un calcul frais.

Les cles de cache deterministes sont `restaurant-score:{restaurantId}` et `user-reliability:{userId}`. Les operations suivantes invalident (invalidate) precisement les lignes de cache concernees :

- Creation, mise a jour ou suppression d'un avis restaurant (`restaurant_reviews`) -> invalidate `restaurant-score:{restaurantId}` pour le restaurant concerne.
- Creation d'un feedback de call (`call_feedback`) -> invalidate `user-reliability:{userId}` pour l'auteur du call (pas pour l'auteur du feedback).

En l'absence d'invalidation explicite, le cache continue de servir les payloads non expires selon leur TTL.

### Components and formula fields

Chaque recommandation contient `explanation.summary` et `explanation.components[]`. Les composants standards sont :

| key               | Weight | Source                                                                      |
| ----------------- | ------ | --------------------------------------------------------------------------- |
| `restaurantScore` | 0.50   | Score restaurant dampened depuis les reviews actives.                       |
| `distance`        | 0.30   | Distance entre le restaurant et le point de depart session/groupe.          |
| `budget`          | 0.15   | Compatibilite entre `estimatedCostPerPerson` et `budgetMax`.                |
| `history`         | 0.05   | Avis actif utilisateur ou selection passee dans un groupe de l'utilisateur. |

Le score de fiabilite utilisateur (`user reliability`) reste disponible comme metrique autonome via les scores utilisateur, mais il n'est pas injecte comme composant identique dans chaque candidat d'une recommandation. Cela preserve la differenciation entre candidats a l'interieur d'une meme reponse.

Chaque composant expose `score`, `weight`, `contribution` et `reason`. Les raisons restent agregees et n'exposent pas les commentaires bruts d'avis ou de feedback.

### 15.1 GET /api/sessions/:id/recommendations

Retourne un classement explique des restaurants deja candidats de la session.

**Authentification :** JWT requis.

**Permission :** l'utilisateur doit etre membre du groupe de la session. Le backend verifie l'acces via les regles de membership de session.

**Parametres de requete :**

- `limit` : entier coercible entre 1 et 50, defaut 10

**Reponse 200 :**

```json
{
  "data": [
    {
      "restaurantId": "550e8400-e29b-41d4-a716-446655440000",
      "restaurant": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Le Petit Bistrot",
        "address": "12 rue de la Paix",
        "latitude": 48.8566,
        "longitude": 2.3522,
        "estimatedCostPerPerson": 18
      },
      "rank": 1,
      "score": 87.5,
      "explanation": {
        "summary": "Compatibility score 87.5/100 from restaurant quality, distance, budget, and history signals.",
        "components": [
          {
            "key": "restaurantScore",
            "score": 90,
            "weight": 0.5,
            "contribution": 45,
            "reason": "Restaurant quality score is 90/100 from active review signals."
          }
        ]
      }
    }
  ]
}
```

**Erreurs possibles :**

- 400 Bad Request : `limit` hors plage ou non coercible
- 401 Unauthorized : JWT absent ou invalide
- 403 Forbidden : membership session/groupe requis
- 404 Not Found : session inexistante

### 15.2 GET /api/groups/:id/recommendations

Retourne un classement explique des restaurants internes actifs situes autour du point de depart par defaut du groupe.

**Authentification :** JWT requis.

**Permission :** l'utilisateur doit etre membre du groupe. Le backend verifie l'acces via `GroupsService.getById(groupId, userId)` avant de lire les restaurants.

**Parametres de requete :**

- `limit` : entier coercible entre 1 et 50, defaut 10

**Comportement du pool candidat (bounded pool) :**

Le backend interroge un pool borne de restaurants proches avant de les scorer et de les trier. La taille du pool est `Math.min(Math.max(limit * 3, 25), 100)`. Tous les restaurants du pool sont scores, puis tries par score decroissant, puis tronques a `limit`. Ce comportement garantit qu'un restaurant plus eloigne mais de meilleure qualite peut remonter dans le top `limit` apres scoring, au lieu d'etre elimine par la limite de distance initiale.

**Reponse 200 :** meme forme que `GET /api/sessions/:id/recommendations`. `data[]` contient `restaurantId`, `restaurant`, `rank`, `score`, `explanation.summary` et `explanation.components[]`.

**Erreurs possibles :**

- 400 Bad Request : `limit` hors plage ou non coercible
- 400 Bad Request : `Group default start location is required for recommendations`
- 401 Unauthorized : JWT absent ou invalide
- 403 Forbidden : membership groupe requis
- 404 Not Found : groupe inexistant

### 15.3 Future recommendation routes

Endpoint prevu mais pas encore implemente :

- GET /api/restaurants/:id/similar

---

## 16. Notifications futures

**NON IMPLÉMENTÉ**

Les notifications in-app, email et push sont prevues pour P7. Le backend ne dispose actuellement d'aucun endpoint de notification.

---

## 17. Moderation

**NON IMPLÉMENTÉ**

La moderation est prevue pour P7. Les endpoints planifies sont :

- POST /api/reports
- GET /api/moderation/reports
- POST /api/moderation/actions

Les tables `reports` et `moderation_actions` sont definies dans le plan mais pas encore implementees.

---

## 18. Pagination

### 18.1 Format du curseur

Toutes les listes paginees utilisent le meme format :

```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    nextCursor: string | null;
  };
}
```

Le curseur est une date ISO 8601 correspondant au `createdAt` du dernier element de la page. Pour obtenir la page suivante, transmettre cette valeur dans le parametre `cursor`.

### 18.2 Logique cote serveur

Le serveur recupere `limit + 1` elements. Si le nombre d'elements recupere est superieur a `limit`, une page suivante existe et `nextCursor` contient le `createdAt` du dernier element retourne. Sinon, `nextCursor` est `null`.

Les elements sont toujours tries par `createdAt` decroissant.

### 18.3 Exemple de parcours

```
GET /api/groups?limit=2
-> { data: [A, B], meta: { nextCursor: "2024-01-10T08:00:00.000Z" } }

GET /api/groups?limit=2&cursor=2024-01-10T08:00:00.000Z
-> { data: [C, D], meta: { nextCursor: null } }
```

---

## 19. Format standard des reponses

### 19.1 Reponse de succes

Les reponses de succes retournent directement l'objet ou la liste sans envelope supplementaire, sauf pour les listes paginees qui incluent `meta`.

Exemples :

- 200 OK : objet JSON
- 201 Created : objet JSON
- 204 No Content : corps vide

### 19.2 Reponse d'erreur

Toutes les erreurs suivent le format defini par `HttpExceptionFilter` :

```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Bad Request",
  "details": { ... }
}
```

Champs :

- `statusCode` : code HTTP numerique
- `message` : message d'erreur (string ou tableau de strings)
- `error` : label de l'erreur (ex. "Bad Request", "Not Found")
- `details` : informations supplementaires optionnelles (objet d'erreurs de validation par exemple)

En cas d'exception non HTTP, le serveur retourne systematiquement :

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## 20. Codes d'erreur

| Code HTTP | Label                 | Contextes typiques                                                                                |
| --------- | --------------------- | ------------------------------------------------------------------------------------------------- |
| 400       | Bad Request           | Validation Zod, transition d'etat invalide, deadline passee                                       |
| 401       | Unauthorized          | JWT manquant ou invalide, credentials incorrects                                                  |
| 403       | Forbidden             | Membre non autorise, owner requis, vote d'un autre user                                           |
| 404       | Not Found             | Ressource inexistante, invite invalide                                                            |
| 409       | Conflict              | Email duplique, membre deja present, vote deja cast                                               |
| 422       | Unprocessable Entity  | Regle metier violee (transition d'etat invalide, deadline passee, tentative de vote hors periode) |
| 500       | Internal Server Error | Erreur serveur inattendue                                                                         |
| 503       | Service Unavailable   | Provider geo non configure ou indisponible                                                        |

### 20.1 Messages specifiques par module

**Auth :**

- "Email already registered" (409)
- "Invalid credentials" (401)
- "Invalid refresh token" (401)
- "User registration failed" (500)

**Groups :**

- "Group not found" (404)
- "Group membership required" (403)
- "Owner role required" (403)
- "Admin role required" (403)
- "Owner cannot be removed" (403)
- "Owner role cannot be changed" (403)
- "Invite not found" (404)
- "Invite expired" (403)
- "Invite usage limit reached" (403)
- "Already a group member" (409)

**Restaurants :**

- "Restaurant not found" (404)
- "Restaurant already exists" (409)

**Vote Sessions :**

- "Session not found" (404)
- "Only creator can update session" (403)
- "Only creator can activate session" (403)
- "Only creator can start voting" (403)
- "Only creator can complete session" (403)
- "Only creator can cancel session" (403)
- "Only creator can remove candidates" (403)
- "Only creator can select the final restaurant" (403)
- "Cannot update session in X state" (400)
- "Cannot transition session from X to Y" (400)
- "Session needs at least one candidate" (400)
- "Session is not accepting candidates" (400)
- "Session is not accepting candidate changes" (400)
- "Restaurant not found" (404)
- "Candidate already added" (409)
- "Selected restaurant must be a session candidate" (400)
- "Session must be in voting state to select a restaurant" (400)

**Votes :**

- "Session is not in voting state" (400)
- "Voting deadline has passed" (400)
- "Candidate not found" (404)
- "Vote already cast" (409)
- "Votes are not visible for this session state" (400)
- "Cannot delete another user vote" (403)
- "Session is not completed" (400)

**Food Calls :**

- "Session is not accepting calls" (400)
- "Food call restaurant must be a session candidate" (400)
- "Restaurant not found" (404)
- "Food call already exists" (409)
- "Food call not found" (404)
- "Cannot delete another user food call" (403)
- "Completed session calls cannot be deleted" (400)
- "Cannot leave feedback on own call" (403)
- "Session is not completed" (400)
- "Feedback already exists" (409)

**Users :**

- "User not found" (404)
- "Avatar payload is empty" (400)

---

## 21. Permissions

### 21.1 Roles de groupe

| Role   | Description                                                        |
| ------ | ------------------------------------------------------------------ |
| owner  | Cree le groupe, peut tout modifier, supprimer et gerer les roles   |
| admin  | Peut modifier le groupe, ne peut pas supprimer ni changer le owner |
| member | Peut voir le groupe, rejoindre les sessions, voter                 |

### 21.2 Matrice des permissions

| Action                                | Owner | Admin | Member |
| ------------------------------------- | ----- | ----- | ------ |
| Voir un groupe                        | Oui   | Oui   | Oui    |
| Modifier un groupe                    | Oui   | Oui   | Non    |
| Supprimer un groupe                   | Oui   | Non   | Non    |
| Creer une invite                      | Oui   | Oui   | Oui    |
| Voir les membres                      | Oui   | Oui   | Oui    |
| Changer le role d'un membre           | Oui   | Non   | Non    |
| Retirer un membre (autre)             | Oui   | Non   | Non    |
| Retirer un membre (soi-meme)          | Oui   | Oui   | Oui    |
| Retirer un admin                      | Oui   | Non   | Non    |
| Creer une session                     | Oui   | Oui   | Oui    |
| Modifier une session                  | Oui   | Non   | Non    |
| Activer / Voter / Completer / Annuler | Oui   | Non   | Non    |
| Ajouter / Retirer des candidats       | Oui   | Non   | Non    |

---

## 22. Conventions de nommage

### 22.1 API

- Les endpoints utilisent kebab-case : `/start-voting`, `/vote-sessions`
- Les parametres de route utilisent camelCase : `:groupId`, `:candidateId`
- Les parametres de requete utilisent camelCase : `fromLat`, `candidateId`
- Les champs JSON utilisent camelCase : `displayName`, `budgetMax`, `avatarUrl`

### 22.2 Base de donnees

- Les tables utilisent snake_case : `vote_sessions`, `group_members`
- Les colonnes utilisent snake_case : `created_by`, `reputation_score`
- Les enums PostgreSQL utilisent snake_case : `session_status`, `group_role`

### 22.3 Identifiants

Tous les identifiants sont des UUID v4 generees par defaut cote base de donnees.

### 22.4 Dates

Toutes les dates sont au format ISO 8601 avec timezone (ex. `2024-01-15T10:30:00.000Z`).

### 22.5 Coordonnees GPS

En entree : nombres flottants (ex. `48.8566`).
En sortie : strings car stockees en `numeric` PostgreSQL (ex. `"48.856600"`).

### 22.6 Montants

En entree : nombres flottants (ex. `15`).
En sortie : strings car stockees en `numeric(10,2)` PostgreSQL (ex. `"15.00"`).

---

## 23. Exemples de parcours frontend

### 23.1 Parcours 1 : inscription, creation de groupe et session

```
POST /api/auth/register
  Body: { email, password, displayName }
  -> { accessToken, refreshToken }

GET /api/users/me
  Headers: Authorization: Bearer <accessToken>
  -> { id, email, displayName, ... }

POST /api/groups
  Headers: Authorization: Bearer <accessToken>
  Body: { name: "Dejeuner M1", budgetMax: 15 }
  -> { id, name, budgetMax, ... }

POST /api/groups/:id/invites
  -> { code: "aB3dE5fG" }

POST /api/groups/:groupId/sessions
  Body: { name: "Ou mange-t-on ?", deadline: "..." }
  -> { id, name, status: "draft", ... }
```

### 23.2 Parcours 2 : rejoindre un groupe, voter et completer

```
POST /api/auth/login
  -> { accessToken, refreshToken }

POST /api/groups/join
  Body: { code: "aB3dE5fG" }
  -> { groupId, userId, role: "member" }

GET /api/groups/:groupId/sessions
  -> { data: [ { id, name, status } ] }

POST /api/sessions/:id/votes
  Body: { candidateId: "..." }
  -> { id, candidateId, userId, value: 1 }

GET /api/sessions/:id/votes
  -> { data: [ ... ] }  // seuls ses propres votes si voting

POST /api/sessions/:id/select-restaurant  // par le createur
  Body: { restaurantId: "..." }
  -> { id, selectedRestaurantId: "..." }

POST /api/sessions/:id/complete  // par le createur, apres selection
  -> { id, status: "completed" }

GET /api/sessions/:id/results
  -> [ { candidateId, restaurantName, votes, creatorApproved } ]
```

### 23.3 Parcours 3 : call et feedback post-session

```
POST /api/sessions/:id/calls
  Body: { restaurantId: "...", pitch: "..." }
  -> { id, pitch, ... }

GET /api/sessions/:id/calls
  -> { data: [ { id, pitch, userId } ] }

POST /api/calls/:id/feedback  // session completed obligatoire
  Body: { rating: 5, comment: "..." }
  -> { id, rating, comment }

GET /api/calls/:id/feedback
  -> { data: [ { id, rating, comment, userId } ] }
```

---

## 24. Contrats frontend importants

### 24.1 Mapping par page

| Page / Ecran          | Endpoints utilises                                     |
| --------------------- | ------------------------------------------------------ |
| Inscription           | POST /api/auth/register                                |
| Connexion             | POST /api/auth/login                                   |
| Profil                | GET /api/users/me, PATCH /api/users/me                 |
| Avatar                | POST /api/users/me/avatar, DELETE /api/users/me/avatar |
| Liste des groupes     | GET /api/groups                                        |
| Detail groupe         | GET /api/groups/:id, GET /api/groups/:id/members       |
| Creation groupe       | POST /api/groups                                       |
| Inviter au groupe     | POST /api/groups/:id/invites                           |
| Rejoindre groupe      | POST /api/groups/join                                  |
| Gestion membres       | PATCH /api/groups/:id/members/:userId/role             |
|                       | DELETE /api/groups/:id/members/:userId                 |
| Liste restaurants     | GET /api/restaurants                                   |
| Recherche restaurants | GET /api/restaurants/search                            |
| Recherche proche      | GET /api/restaurants/nearby                            |
| Detail restaurant     | GET /api/restaurants/:id                               |
| Ajout restaurant      | POST /api/restaurants                                  |
| Liste sessions        | GET /api/groups/:groupId/sessions                      |
| Detail session        | GET /api/sessions/:id                                  |
| Candidats session     | GET /api/sessions/:id/candidates                       |
|                       | POST /api/sessions/:id/candidates                      |
|                       | DELETE /api/sessions/:id/candidates/:candidateId       |
| Voter                 | POST /api/sessions/:id/votes                           |
| Annuler vote          | DELETE /api/sessions/:id/votes/:voteId                 |
| Resultats             | GET /api/sessions/:id/results                          |
| Selection finale      | POST /api/sessions/:id/select-restaurant               |
| Calls                 | POST /api/sessions/:id/calls                           |
|                       | GET /api/sessions/:id/calls                            |
| Feedback              | POST /api/calls/:id/feedback                           |
|                       | GET /api/calls/:id/feedback                            |
| Geocodage             | GET /api/geo/geocode                                   |
| Itineraire            | GET /api/geo/route                                     |
| Health check          | GET /health                                            |

### 24.2 Points de vigilance

- Le refresh token est un UUID, pas un JWT. Ne pas essayer de le decoder cote client.
- `change-password` revoque tous les refresh tokens. Les access tokens deja emis expirent naturellement ; l'utilisateur devra se reconnecter pour obtenir de nouveaux refresh tokens.
- L'avatar s'upload en base64 JSON, pas en multipart.
- Les coordonnees GPS et les montants sont des strings en sortie.
- La visibility des votes change selon l'etat de la session.
- Les resultats ne sont accessibles qu'apres completion.
- `POST /api/sessions/:id/complete` exige un `selectedRestaurantId`; les resultats de vote restent un classement et ne choisissent pas automatiquement le restaurant final.

---

## 25. Roadmap API

### P1 — Authentification et utilisateurs (implémente)

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- POST /api/auth/change-password
- GET /api/users/me
- PATCH /api/users/me
- POST /api/users/me/avatar
- DELETE /api/users/me/avatar

### P2 — Groupes (implémente)

- CRUD groupes
- Membres et roles
- Invitations par code

### P3 — Restaurants et geo MVP (implémente)

- CRUD restaurants
- Recherche nearby via PostGIS
- Geocodage Nominatim
- Routing OSRM

### P4 — Sessions et votes (implémente)

- Sessions avec machine a etats
- Candidats
- Votes simples (approval)
- Resultats et selection explicite du restaurant final

### P5 — Calls et feedback (implémente)

- Calls argumentes
- Feedbacks post-session

### P6 — Recommandations (prevu)

- Scores de compatibilite
- Suggestions automatiques

### P7 — Moderation et notifications (prevu)

- Signalements
- Actions de moderation
- Notifications in-app

### P8 — Production hardening (prevu)

- Backups
- Rate limiting avance
- Observabilite

---

## 26. Annexes

### 26.1 Liste des enums PostgreSQL

**group_role :**

- `owner`
- `admin`
- `member`

**session_status :**

- `draft`
- `active`
- `voting`
- `completed`
- `cancelled`

**vote_type :**

- `approval`
- `ranking`
- `stars`

### 26.2 Exemples JSON complets

**Utilisateur complet :**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "jean.dupont@example.com",
  "displayName": "Jean Dupont",
  "avatarUrl": "/uploads/avatars/abc123.jpg",
  "reputationScore": 42,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-06-20T14:22:00.000Z"
}
```

**Groupe complet :**

```json
{
  "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "name": "Equipe produit",
  "description": "Groupe de dejeuner",
  "createdBy": "550e8400-e29b-41d4-a716-446655440000",
  "budgetMax": "15.00",
  "defaultStartAddress": "10 rue de Rivoli, Paris",
  "defaultStartLatitude": "48.856600",
  "defaultStartLongitude": "2.352200",
  "defaultStartLocation": null,
  "defaultSearchRadiusMeters": 1500,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "deletedAt": null
}
```

**Restaurant complet :**

```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "name": "Le Petit Bistrot",
  "description": "Cuisine traditionnelle",
  "address": "12 rue de la Paix, 75002 Paris",
  "latitude": "48.856600",
  "longitude": "2.352200",
  "location": null,
  "externalId": null,
  "phone": "+33123456789",
  "website": "https://petitbistrot.example.com",
  "cuisineTags": ["francais", "bistrot"],
  "photoUrls": ["https://example.com/photo1.jpg"],
  "createdBy": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "deletedAt": null
}
```

**Session complete :**

```json
{
  "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "groupId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "name": "Dejeuner du lundi",
  "description": "Ou mange-t-on ce midi ?",
  "status": "voting",
  "voteType": "approval",
  "createdBy": "550e8400-e29b-41d4-a716-446655440000",
  "deadline": "2024-01-15T12:00:00.000Z",
  "startAddress": "10 rue de Rivoli, Paris",
  "startLatitude": "48.856600",
  "startLongitude": "2.352200",
  "startLocation": null,
  "searchRadiusMeters": 1500,
  "budgetMax": "15.00",
  "selectedRestaurantId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "completedAt": null,
  "createdAt": "2024-01-15T09:00:00.000Z",
  "updatedAt": "2024-01-15T09:00:00.000Z"
}
```

### 26.3 Exemple de fichier .env

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://user:password@localhost:5432/foodcall
REDIS_URL=redis://localhost:6379

JWT_ACCESS_SECRET=change-me-in-production
JWT_ACCESS_EXPIRES_IN=15m

MAP_PROVIDER=nominatim
NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org

ROUTING_PROVIDER=osrm
# Le repository ne demarre pas OSRM. Fournir une instance externe ou lancer OSRM localement.
OSRM_BASE_URL=http://localhost:5000

CORS_ORIGIN=http://localhost:5173
```

### 26.4 Notes Swagger

L'API est documentee avec `@nestjs/swagger`. Les tags suivants sont disponibles dans l'interface Swagger :

- `auth` : authentification
- `users` : profils utilisateurs
- `groups` : groupes et membres
- `restaurants` : restaurants
- `geo` : geocodage et routing
- `vote-sessions` : sessions de decision
- `votes` : votes et resultats
- `food-calls` : calls et feedbacks
- `health` : sante du systeme

Les endpoints authentifies portent l'annotation `@ApiBearerAuth()` et necessitent le header `Authorization: Bearer <token>`.

Le schema Swagger reflete fidelement les DTO Zod utilises dans le code. Les champs optionnels sont marques comme tels. Les types de donnees correspondent aux types TypeScript inferes.

---

_Fin de la documentation API FoodCall._
