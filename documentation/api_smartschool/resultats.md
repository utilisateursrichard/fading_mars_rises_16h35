# 📊 API Smartschool — Module Résultats (Skore)

Ce document répertorie les requêtes HTTP, en-têtes, formats de données et logiques de calcul associés au module **Résultats / Notes scolaires** (`results` / Skore) de Smartschool.

---

## 1. Vue d'Ensemble & Identification de l'Élève

L'identifiant d'une évaluation dans Skore adopte un format standardisé à 5 segments :
`{platformId}_{userId}_{accountIndex}_{type}_{evaluationId}`

*Exemple :* `4907_5748_0_project_11632` ou `4907_5748_0_normal_58116`

| Segment | Exemple | Rôle |
| :--- | :--- | :--- |
| **`platformId`** | `4907` | Identifiant de l'école (ex: `jean23`). |
| **`userId`** | `5748` | Identifiant unique de l'élève. |
| **`accountIndex`** | `0` | `0` = compte élève principal (`1` ou `2` pour parents/délégués). |
| **`type`** | `normal` / `project` | Nature de l'évaluation (`normal` = note chiffrée, `project` = compétences / LPD). |
| **`evaluationId`** | `58116` / `11632` | Identifiant unique de l'évaluation en base Skore. |

---

## 2. Endpoints REST API Découverts

### Endpoint 2.1 : Liste des évaluations de l'élève

Récupère la liste paginée de toutes les évaluations publiées ou programmées pour l'élève.

```http
GET /results/api/v1/evaluations/?pageNumber=1&itemsOnPage=50 HTTP/2
Host: <ecole>.smartschool.be
Accept: application/json, text/plain, */*
```

#### Exemple de Réponse JSON (`type: "normal"`) :
```json
{
  "identifier": "4907_5748_0_normal_58116",
  "type": "normal",
  "name": "EndOfUnit Vectors",
  "graphic": {
    "type": "percentage",
    "color": "green",
    "value": 89,
    "description": "35,5/40"
  },
  "date": "2026-09-14T00:00:00+02:00",
  "gradebookOwner": {
    "id": "4907_872_0",
    "name": {
      "startingWithFirstName": "NI Nicolau",
      "startingWithLastName": "Nicolau NI"
    },
    "pictureUrl": "https://userpicture20.smartschool.be/..."
  },
  "component": {
    "id": 13,
    "name": "Travail sommatif",
    "abbreviation": "S"
  },
  "courses": [
    {
      "id": 472,
      "name": "Math. Imm. (5h)",
      "graphic": { "type": "icon", "value": "drawing_utensils" }
    }
  ],
  "period": {
    "id": 360,
    "name": "Septembre - Décembre",
    "isActive": true
  },
  "feedback": [],
  "feedbacks": [],
  "availabilityDate": "2026-09-22T08:00:00+02:00",
  "isPublished": true,
  "doesCount": true
}
```

---

### Endpoint 2.2 : Détail d'une évaluation (`type: "project"`)

Pour les évaluations basées sur des objectifs d'apprentissage (LPD / *Leerplandoel*), l'endpoint de liste renvoie `graphic.value = "target_lpd_steel"` et `graphic.description = null`. La note chiffrée se récupère via cet endpoint de détail :

```http
GET /results/api/v1/evaluations/{identifier} HTTP/2
Host: <ecole>.smartschool.be
Accept: application/json, text/plain, */*
```

*Exemple d'appel :*  
`GET /results/api/v1/evaluations/4907_5748_0_project_11632`

#### Objet enrichi dans la réponse :
```json
{
  "identifier": "4907_5748_0_project_11632",
  "type": "project",
  "name": "Test T.P. 1-40 (Sommatif)",
  "details": {
    "projectGoals": [
      {
        "goal": {
          "goalId": "35684299-ce6f-54f4-b417-1dd60c208074",
          "leerplanKey": "mini-db-skore"
        },
        "graphic": {
          "type": "percentage",
          "color": "yellow",
          "value": 60,
          "description": "3/5"
        },
        "feedback": [],
        "feedbacks": []
      }
    ],
    "scales": [
      { "type": "percentage", "color": "red", "value": 0 },
      { "type": "percentage", "color": "orange", "value": 40 },
      { "type": "percentage", "color": "yellow", "value": 50 },
      { "type": "percentage", "color": "mint", "value": 65 },
      { "type": "percentage", "color": "green", "value": 80 },
      { "type": "percentage", "color": "aqua", "value": 90 }
    ]
  }
}
```

---

## 3. Logique Métier & Calcul des Moyennes

### 3.1. Prédicat d'Éligibilité (Sommatif vs Formatif)
Un devoir est comptabilisé dans la moyenne si et seulement si :
1. `isPublished !== false` (le devoir est publié).
2. `doesCount !== false` (non neutralisé par l'enseignant).
3. **Non formatif :** `component.abbreviation !== 'F'` et pas de mention "formatif".
4. **Composants sommatifs admis :** `S` (Sommatif), `TJ` (Travail Journalier), `EX` (Examen), `B` (Bilan).
5. Possède une note exploitable (format `X/Y`).

### 3.2. Moyenne d'une Matière (Points bruts cumulés)
$$\text{Moyenne Matière (\%)} = \frac{\sum \text{Points Obtenus (Sommatifs)}}{\sum \text{Points Totaux (Sommatifs)}} \times 100$$

### 3.3. Moyenne Générale (Pondération horaire)
Chaque cours est pondéré par son nombre d'heures par semaine extrait de son nom (ex: `Math. Imm. (5h)` $\to 5$, `Sciences (8h)` $\to 8$, `Néerlandais (4h)` $\to 4$).
$$\text{Moyenne Générale (\%)} = \frac{\sum (\text{Moyenne Cours }_i \times \text{Heures }_i)}{\sum \text{Heures }_i}$$
