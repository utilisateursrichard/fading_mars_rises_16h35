# 👤 API Smartschool — Profil & Établissement

Ce document répertorie la méthode d'extraction de l'identité de l'élève (nom, prénom, classe, INE/ID, avatar) et du nom de l'établissement scolaire.

---

## 1. Données du Lycée / Établissement

- **En Mode Démo :** Affiche la donnée factice (ex: `Lycée Victor Hugo`).
- **En Mode Réel (Non connecté) :** Affiche `Lycée : inconnu`.
- **En Mode Réel (Connecté) :** Affiche directement le nom réel (ex: `Collège Jean XXIII`) sans préfixe.
- **Sources vérifiées :**
  - **API Planner :** `locations[0].platformName` renvoie fidèlement le nom complet de l'école (ex: `"Collège Jean XXIII"`).
  - **Sous-domaine :** `window.location.hostname` donne l'identifiant (ex: `jean23.smartschool.be` -> `jean23`).

---

## 2. Données de l'élève (Prénom, Nom, Classe, Identifiant)

- **Classe de l'élève :** `participants.groups[0].name` renvoie directement le code classe (ex: `"4T1"`).
- **Identifiant Unique :** Format `{ecoleId}_{userId}_{groupId}` (ex: `4907_5748_0`).
- **Nom et Prénom :** Trouvés dans le bandeau supérieur de Smartschool (`document.querySelector(...)`) ou via le profil utilisateur.

---

## 3. Système d'Avatar & Photos de Profil (CDN Smartschool)

### 3.1. Structure de l'URL CDN

```
https://userpicture20.smartschool.be/User/Userimage/hashimage/hash/{pictureHash}/plain/1/res/{size}
```

#### Décomposition des paramètres :
* **Hôte CDN :** `userpicture20.smartschool.be` (cluster de stockage d'images Smartschool).
* **`{pictureHash}` :** Identifiant unique du fichier image :
  - **Avec photo personnalisée :** `{platformId}_{UUIDv4}`  
    Exemple élève : `4907_a1b2c3d4-e5f6-4a8b-9c1d-1234567890ab`
  - **Sans photo (avatar initiales généré) :** `initials_{Lettres}`  
    Exemples profs : `initials_VD` (Véronique Dury), `initials_VV` (VL Verheylewegen), `initials_DD` (DI Didion).
* **`/plain/1` :** Format brut (PNG / JPEG sans wrapper HTML).
* **`/res/{size}` :** Résolution demandée en pixels carrés (ex: `res/128`, `res/64`, `res/256`, `res/512`).

---

### 3.2. Comment obtenir la photo de n'importe quel élève ou professeur ?

Le hash d'image (`705e859f-...`) étant un UUID aléatoire, il ne peut pas être deviné. En revanche, **Smartschool le fournit automatiquement dans toutes ses réponses d'API** dès qu'un utilisateur est mentionné :

1. **Pour l'élève connecté (Toi-même) :**
   - **Méthode instantanée DOM :** Le bandeau supérieur de Smartschool contient une balise `<img src="https://userpicture20.smartschool.be/...">`. Notre bookmarklet peut lire `document.querySelector('img[src*="userpicture"]')?.src` en 1 milliseconde.
   - **Méthode globale :** Dans l'objet JavaScript `window.smsc` ou `window.currentUser` présent sur la page.

2. **Pour les autres élèves d'une classe :**
   - L'API de l'annuaire de classe / trombinoscope (ex: dans les groupes de cours ou la messagerie) renvoie pour chaque élève un objet JSON contenant directement les champs `"pictureUrl"` et `"pictureHash"`.

3. **Pour les professeurs :**
   - L'API du planning (`/planner/api/v1/planned-elements/...`) renvoie déjà dans chaque cours l'objet `organisers.users[0]` avec `pictureUrl` et `pictureHash` !

