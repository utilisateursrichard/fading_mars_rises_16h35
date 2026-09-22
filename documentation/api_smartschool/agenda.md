# 📅 API Smartschool — Module Agenda (Planner)

Ce document détaille les requêtes HTTP, en-têtes et formats de données associés au module **Agenda / Emploi du temps** (`planner`) de Smartschool.

---

## 1. Chargement de la page principale (`GET /planner`)

Cette requête initialise le module d'agenda dans la session de l'élève.

### 🌐 Requête HTTP

```http
GET /planner HTTP/2
Host: <ecole>.smartschool.be
Referer: https://<ecole>.smartschool.be/
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8
Accept-Language: fr-BE,fr;q=0.9,en-US;q=0.8
Cookie: PHPSESSID=...; smscndc=...; pid=...
Sec-Fetch-Dest: document
Sec-Fetch-Mode: navigate
Sec-Fetch-Site: same-origin
```

### 📥 En-têtes de réponse remarquables

```http
HTTP/2 200 OK
content-type: text/html; charset=UTF-8
smsc-module: planner
cache-control: max-age=0, must-revalidate, no-store, private
content-security-policy: frame-ancestors 'self' https://*; frame-src 'self' https://*; ...
```

#### 💡 Observations clés :
1. **`smsc-module: planner`** : Confirme que le serveur identifie ce module sous la clé interne `planner`.
2. **`frame-ancestors 'self' https://*;`** et **`frame-src 'self' https://*;`** : Smartschool autorise explicitement l'affichage et l'intégration dans des iframes sécurisées (`https://*`), ce qui permet au bookmarklet BetterSchool de fonctionner sans aucun blocage d'iframe !
3. **`cache-control: no-store`** : Les pages et données de planning ne sont pas mises en cache localement par le navigateur, garantissant que les modifications de cours ou devoirs ajoutés sont fraîches.

---

## 2. Endpoints REST API v1 Découverts

Smartschool utilise une véritable API REST moderne versionnée sous `/planner/api/v1/` qui renvoie du **JSON pur** !

---

### Endpoint 2.1 : Emploi du temps de la semaine (Cours & Salles)

Récupère l'intégralité des cours, horaires, professeurs et salles pour une plage de dates donnée (généralement du lundi 00:00 au dimanche 23:59).

```http
GET /planner/api/v1/planned-elements/user/{userId}?from={dateDebut}&to={dateFin}&includes=icon,courses,locations,upload-folders HTTP/2
Host: <ecole>.smartschool.be
```

#### Paramètres :
* **`{userId}`** : Identifiant unique de l'élève (ex: `4907_5748_0` au format `{ecoleID}_{userID}_{groupID}`).
* **`from`** : Début de la période au format ISO 8601 encodé (ex: `2026-09-21T00:00:00+02:00` -> `2026-09-21T00%3A00%3A00%2B02%3A00`).
* **`to`** : Fin de la période au format ISO 8601 encodé (ex: `2026-09-27T23:59:59+02:00` -> `2026-09-27T23%3A59%3A59%2B02%3A00`).
* **`includes`** :
  - `icon` : Icône de la matière
  - `courses` : Détails de la matière (nom, couleur)
  - `locations` : Salles de classe
  - `upload-folders` : Dossiers de devoirs / dépôts de fichiers

---

### Endpoint 2.2 : Devoirs et Tâches planifiées (`types=...`)

Récupère les devoirs à faire, interrogations planifiées et travaux pour une période plus large (ex: sur un mois complet).

```http
GET /planner/api/v1/planned-elements/user/{userId}?from={dateDebut}&to={dateFin}&includes=icon,courses,locations,upload-folders&types=planned-to-dos,planned-lesson-cluster-assignments,planned-assignments HTTP/2
Host: <ecole>.smartschool.be
```

#### Types de devoirs récupérés :
* `planned-to-dos` : Tâches à faire personnelles ou listes de devoirs
* `planned-lesson-cluster-assignments` : Devoirs liés à un groupe de cours
* `planned-assignments` : Devoirs officiels assignés par les professeurs

---

### Endpoint 2.3 : Éléments épinglés (`pinned`)

Récupère les devoirs prioritaires, annonces urgentes ou éléments mis en avant par l'école ou l'élève.

```http
GET /planner/api/v1/planned-elements/pinned?includes=icon,courses,locations,upload-folders HTTP/2
Host: <ecole>.smartschool.be
```

---

### Endpoint 2.4 : Résolution d'un devoir officiel (`resolve`)

Marque un devoir assigné par un professeur comme « terminé / résolu » dans l'agenda Smartschool.

```http
POST /planner/api/v1/planned-assignments/{platformId}/{assignmentId}/resolve HTTP/2
Host: <ecole>.smartschool.be
Content-Type: application/json
Accept: application/json, text/plain, */*
X-Requested-With: XMLHttpRequest
```

#### Paramètres :
* **`{platformId}`** : Identifiant numérique de l'établissement (ex: `4907` pour Collège Jean XXIII).
* **`{assignmentId}`** : UUIDv4 unique du devoir planifié (ex: `4ab22089-ead4-4606-b52b-69960a62fc38`).

*(Optionnel) Décochage : l'endpoint symétrique `POST /planner/api/v1/planned-assignments/{platformId}/{assignmentId}/unresolve` permet d'annuler la complétion.*

---

## 3. Comment BetterSchool exploite ces endpoints

Depuis le frontend BetterSchool via notre pont `smartschoolBridge.ts` :

```typescript
import { fetchSmartschool } from '../services/smartschoolBridge';

// Exemple : Récupérer les cours de la semaine
export async function getWeeklyCourses(userId: string, fromDateISO: string, toDateISO: string) {
  const url = `/planner/api/v1/planned-elements/user/${userId}?from=${encodeURIComponent(fromDateISO)}&to=${encodeURIComponent(toDateISO)}&includes=icon,courses,locations,upload-folders`;
  
  const res = await fetchSmartschool(url);
  if (res.ok && res.body) {
    const rawEvents = JSON.parse(res.body);
    return rawEvents; // Tableau JSON des cours et devoirs !
  }
  throw new Error(res.error || 'Erreur lors du chargement de l\'agenda');
}
```

---

## 4. Structure JSON & Schémas Réels

### 4.1. Exemple de Cours (`planned-placeholders`)

```json
{
  "id": "025ba09b-40a9-519f-8857-305f9601e73c",
  "period": {
    "dateTimeFrom": "2026-09-28T15:30:00+02:00",
    "dateTimeTo": "2026-09-28T16:20:00+02:00",
    "wholeDay": false,
    "deadline": false
  },
  "organisers": {
    "users": [
      {
        "id": "4907_6050_0",
        "pictureUrl": "https://userpicture20.smartschool.be/...",
        "name": {
          "startingWithFirstName": "VL Verheylewegen",
          "startingWithLastName": "Verheylewegen VL"
        }
      }
    ]
  },
  "courses": [
    {
      "id": "919d4b8f-5c9b-4c8f-85a8-909f39e0b1df",
      "name": "Anglais",
      "scheduleCodes": ["ANG2", "ANG4"],
      "icon": "flag_great_britain",
      "courseCluster": { "name": "Anglais" }
    }
  ],
  "locations": [
    {
      "title": "D21",
      "platformName": "Collège Jean XXIII"
    }
  ],
  "color": "aqua-200"
}
```

### 4.2. Exemple de Devoir / Évaluation (`planned-assignments`)

```json
{
  "id": "81c03373-9411-4a93-8ede-bdc23665af7d",
  "name": "interro de calorimétrie",
  "assignmentType": {
    "name": "Interrogation",
    "abbreviation": "IN",
    "weight": 2
  },
  "period": {
    "dateTimeFrom": "2026-10-08T13:50:00+02:00",
    "dateTimeTo": "2026-10-08T14:40:00+02:00",
    "deadline": true
  },
  "courses": [
    {
      "name": "Sciences Naturelles",
      "courseCluster": { "name": "Sciences" }
    }
  ],
  "locations": [{ "title": "A52" }],
  "plannedElementType": "planned-assignments",
  "resolvedStatus": "unresolved",
  "color": "green-500"
}
```

---

## 5. Table de Correspondance vers BetterSchool (`CourseEvent` & `Homework`)

| Champ Smartschool | Propriété BetterSchool | Exemple |
| :--- | :--- | :--- |
| `id` | `id` | `"025ba09b-..."` |
| `courses[0].name` | `subject` | `"Anglais"` |
| `courses[0].scheduleCodes[0]` | `subjectCode` | `"ANG2"` |
| `organisers.users[0].name.startingWithFirstName` | `teacher` | `"VL Verheylewegen"` |
| `locations[0].title` | `room` | `"D21"` |
| `period.dateTimeFrom` (heure) | `startTime` | `"15:30"` |
| `period.dateTimeTo` (heure) | `endTime` | `"16:20"` |
| `period.dateTimeFrom` (date) | `date` | `"2026-09-28"` |
| `color` | `color` | Nuance BetterSchool correspondante |
| `assignmentType.name` | `description` (ou type) | `"Interrogation"` |
| `resolvedStatus === 'resolved'` | `isCompleted` | `false` |
| `locations[0].platformName` | `student.schoolName` | `"Collège Jean XXIII"` |
| `participants.groups[0].name` | `student.studentClass` | `"4T1"` |

