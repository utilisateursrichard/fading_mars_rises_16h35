# 🪪 API Smartschool — Module Profil & Carte d'Élève (Studentcard)

Ce document détaille les requêtes HTTP, en-têtes et structures de données associés au module officiel de **profil et carte d'élève** (`Studentcard`) de Smartschool.

---

## 1. Vue d'Ensemble

L'endpoint `/Studentcard/Student/getStudents` est la **source de vérité officielle** de Smartschool pour identifier avec précision :
* L'identité de l'élève connecté (`userID`, `name`, `surname`, `fullName`, `fullNameBIN`).
* La **vraie classe scolaire** (`class`, ex: `"4T1"`), éliminant tout risque de faux positif avec les groupes généraux (comme `"Tout le monde"`).
* La photo de profil haute résolution (`photoUrl`).
* La liste des **professeurs titulaires** de la classe (`titu`).
* L'intitulé administratif officiel du cursus (`adminName`).

---

## 2. Requête HTTP

```http
POST /Studentcard/Student/getStudents HTTP/2
Host: <ecole>.smartschool.be
Accept: application/json, text/plain, */*
X-Requested-With: XMLHttpRequest
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
```

---

## 3. Format de Réponse JSON

L'API renvoie un tableau d'objets élèves (utile notamment en cas de comptes multiples ou parents avec plusieurs enfants).

### Exemple de Réponse Réelle :

```json
[
  {
    "userID": 5748,
    "name": "Richard",
    "surname": "De Gandt",
    "fullName": "De Gandt Richard",
    "fullNameBIN": "Richard De Gandt",
    "class": "4T1 ",
    "adminName": "2e année 2e degré LANGUE MODERNE I NEERLANDAIS",
    "titu": [
      {
        "userID": 910,
        "name": "Catherine",
        "surname": "Tondeur",
        "fullName": "Tondeur TC",
        "fullNameBIN": "TC Tondeur"
      }
    ],
    "photoUrl": "https://userpicture20.smartschool.be/User/Userimage/hashimage/hash/4907_a96a6549-09ac-4372-920d-ecec6bfe0e4a/plain/1/res/128",
    "currentAccount": 0,
    "status": 1,
    "accountID": 0,
    "isCurrentUser": true
  }
]
```

---

## 4. Dictionnaire des Champs

| Champ | Type | Description | Exemple |
| :--- | :--- | :--- | :--- |
| **`userID`** | `number` | Identifiant numérique unique de l'élève dans l'école. | `5748` |
| **`name`** | `string` | Prénom de l'élève. | `"Richard"` |
| **`surname`** | `string` | Nom de famille de l'élève. | `"De Gandt"` |
| **`fullName`** | `string` | Nom complet format Nom Prénom. | `"De Gandt Richard"` |
| **`fullNameBIN`** | `string` | Nom complet format Prénom Nom. | `"Richard De Gandt"` |
| **`class`** | `string` | **Classe officielle de l'élève** (nécessite simplement un `.trim()`). | `"4T1 "` → `"4T1"` |
| **`adminName`** | `string` | Intitulé officiel de la section / option d'études. | `"2e année 2e degré LANGUE MODERNE I NEERLANDAIS"` |
| **`titu`** | `Array` | Liste des professeurs titulaires de la classe. | `[{ "userID": 910, "name": "Catherine", ... }]` |
| **`photoUrl`** | `string` | URL directe de la photo de profil (Userimage). | `https://userpicture20.smartschool.be/...` |
| **`isCurrentUser`** | `boolean` | Indique si cet enregistrement correspond à la session active. | `true` |
| **`currentAccount`** | `number` | Index du compte courant (0 = compte élève principal). | `0` |

---

## 5. Exploitation dans BetterSchool

Dans `src/services/smartschoolApi.ts`, la fonction `fetchRealStudentcardProfile()` appelle cet endpoint prioritairement :
1. Elle effectue la requête POST `/Studentcard/Student/getStudents`.
2. Elle sélectionne le compte correspondant à `isCurrentUser === true` (ou le premier compte actif).
3. Elle extrait immédiatement `firstName`, `lastName`, `avatar`, `studentClass` (`class.trim()`), et sauvegarde le profil en cache local.
