# 📚 API Smartschool — Module Espace Cours (`getCourseConfig`)

Ce document détaille la requête HTTP, les en-têtes et la structure JSON de l'endpoint officiel Smartschool permettant de lister les cours auxquels l'élève est inscrit.

---

## 1. Requête HTTP

```http
POST /Topnav/getCourseConfig HTTP/2
Host: <ecole>.smartschool.be
Accept: */*
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
X-Requested-With: XMLHttpRequest
```

> [!NOTE]
> L'appel s'effectue sans corps (`Content-Length: 0` / `body: ''`) en **Same-Origin** via le pont `fetchSmartschool()` afin d'utiliser les cookies de session de l'élève connecté (`PHPSESSID`, `smscndc`, `pid`).

---

## 2. Format de Réponse JSON

L'API renvoie la configuration des filtres de cours, les listes de cours par catégorie (`own`, `titu`, `community`, `virtual`) et la liste des cours favoris.

### Exemple de Réponse Réelle :

```json
{
  "courseFilters": [
    {
      "title": "Cours",
      "type": "own",
      "icon": "folder_yellow"
    }
  ],
  "own": [
    {
      "id": 5139,
      "platformId": 4907,
      "name": "4 T1 History",
      "descr": "",
      "icon": "man_mage",
      "url": "/planner/course/courseID/5139/ssID/4907",
      "teacher": "Deridder DR"
    },
    {
      "id": 144,
      "platformId": 4907,
      "name": "4T1/T2 & 4T5 M5IM",
      "descr": "Math Immersion",
      "icon": "folder_aqua",
      "url": "/planner/course/courseID/144/ssID/4907",
      "teacher": "Nicolau NI"
    }
  ],
  "favourites": [
    {
      "type": "own",
      "courses": [
        { "platformId": 4907, "id": 2970 },
        { "platformId": 4907, "id": 1974 }
      ]
    },
    { "type": "titu", "courses": [] },
    { "type": "community", "courses": [] },
    { "type": "virtual", "courses": [] }
  ],
  "courseManagementLink": null
}
```

---

## 3. Dictionnaire des Champs

| Champ | Type | Description | Exemple |
| :--- | :--- | :--- | :--- |
| **`courseFilters`** | `Array` | Catégories de cours disponibles dans le menu supérieur. | `[{ "title": "Cours", "type": "own", "icon": "folder_yellow" }]` |
| **`own`** | `Array` | Liste des cours propres de l'élève (`id`, `platformId`, `name`, `descr`, `icon`, `url`, `teacher`). | `[{ "id": 5139, "name": "4 T1 History", ... }]` |
| **`id`** | `number` | Identifiant numérique du cours sur la plateforme. | `5139` |
| **`platformId`** | `number` | Identifiant de l'établissement Smartschool (`ssID`). | `4907` |
| **`name`** | `string` | Intitulé officiel du cours. | `"4 T1 History"` |
| **`descr`** | `string` | Sous-titre / description courte du cours (optionnel). | `"Math Immersion"` |
| **`icon`** | `string` | Nom de l'icône Smartschool associée au cours. | `"atom"`, `"schoolbord"`, `"man_mage"`, `"folder_aqua"` |
| **`url`** | `string` | Chemin relatif vers le cours sur Smartschool. | `"/planner/course/courseID/5139/ssID/4907"` |
| **`teacher`** | `string` | Nom et trigramme de l'enseignant responsable. | `"Deridder DR"` |
| **`favourites`** | `Array` | Cours épinglés en favoris par type (`own`, `titu`, `community`, `virtual`). | `[{ "type": "own", "courses": [{ "platformId": 4907, "id": 2970 }] }]` |

### Icônes SVG officielles (CDN Smartschool)

Chaque valeur du champ `icon` correspond à un SVG hébergé publiquement sur le CDN Smartschool (`GET`) :

```text
https://static2.smart-school.net/smsc/svg/{icon}/{icon}_24x24.svg
```

Exemple pour `icon = "atom"` :
`https://static2.smart-school.net/smsc/svg/atom/atom_24x24.svg`

---

## 4. Exploitation dans BetterSchool

1. **Récupération (`src/services/smartschoolApi.ts`) :** `fetchRealCourses()` appelle `POST /Topnav/getCourseConfig` via `fetchSmartschool()` et met le résultat en cache sous `betterschool_real_courses`.
2. **Parsing (`src/services/smartschoolParsers.ts`) :** `parseSmartschoolCourseConfig()` convertit la réponse en `SubjectCourse[]`, marque les favoris, sépare le trigramme enseignant, enrichit avec les professeurs/salles connus de l'agenda et déduit un code matière (`subjectCode`).
3. **Activation (`src/utils/featureFlags.ts`) :** `courses.isReadyInLive` est défini à `true`.
4. **Interface (`src/components/views/CoursesView.tsx`) :** Affiche la liste complète des cours avec recherche, filtre Favoris, vue Grille/Liste et fiche détaillée par cours.
