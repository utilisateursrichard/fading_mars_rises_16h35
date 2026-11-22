# ⌚ Documentation Technique & Guide d'Installation — BetterSchool Wear OS

Ce document décrit l'architecture, le protocole d'appairage inversé via **`betterschool.dino.icu`**, les appels directs aux API Smartschool en Kotlin, l'ergonomie de navigation horizontale et la procédure complète pour télécharger et installer l'application sur une montre **Wear OS** (Samsung Galaxy Watch 4/5/6/7/Ultra, Google Pixel Watch 1/2/3, OnePlus Watch 2, Xiaomi Watch 2, TicWatch Pro 5, etc.).

---

## 1. 🏗️ Architecture & Stack Technique

L'application Wear OS est située dans le dossier [`/wearos-app`](../wearos-app/) à la racine du dépôt :
* **Langage :** Kotlin 1.9+ (JVM Target 17)
* **UI Framework :** Jetpack Compose for Wear OS (`androidx.wear.compose:compose-material` & `compose-foundation`)
* **Design System :** **M3E Pro OLED** (fond noir `#090D16` pour économiser la batterie des écrans AMOLED ronds, cartes Bento `22.dp`, pastilles colorées par matière)
* **Client HTTP Direct :** `OkHttp 4.12` (aucune restriction CORS en natif Kotlin : la montre dialogue directement avec `https://<ecole>.smartschool.be`)
* **Génération QR Code sur Montre :** `ZXing Core 3.5` (`QRCodeWriter`)
* **Stockage Sécurisé :** `EncryptedSharedPreferences` (`AES256_GCM` via AndroidX Security Crypto)
* **Tuiles Système :** `androidx.wear.tiles:tiles` & `ProtoLayout` (`BetterSchoolTileService`)

---

## 2. 🔗 Protocole d'Appairage Inversé (`betterschool.dino.icu`)

Comme une montre connectée n'a pas de caméra pour scanner un écran d'ordinateur, **c'est la montre qui génère et affiche le QR Code** :

```
┌───────────────────────────┐         1. POST /api/wear-pair/create          ┌───────────────────────────────┐
│  ⌚ Montre Wear OS        │ ─────────────────────────────────────────────▶ │ 🌐 Serveur Relais Éphémère    │
│  (Affiche QR + Code 6 ch) │ ◀───────────────────────────────────────────── │ https://betterschool.dino.icu │
└─────────────┬─────────────┘         2. Poll /api/wear-pair/poll?code=...   └───────────────▲───────────────┘
              │                                                                              │
              │ 5. Requêtes Directes OkHttp                                                  │ 3. Scan du QR de la montre
              │    (Cookie: PHPSESSID, smscndc, pid)                                         │    POST /api/wear-pair/push
              ▼                                                                              │    (Zero-Retention : supprimé dès lecture)
┌───────────────────────────┐                                                ┌───────────────┴───────────────┐
│ 🏫 <ecole>.smartschool.be │                                                │ 💻/📱 BetterSchool Web        │
│ (/planner, /results, RPC) │                                                │ (Bouton ⌚ dans l'en-tête)    │
└───────────────────────────┘                                                └───────────────────────────────┘
```

### Endpoints du Relais d'Appairage (`vite.config.ts`)
1. **`POST /api/wear-pair/create`** : Crée un ticket éphémère à 6 caractères (TTL de 5 minutes) et renvoie `{ ok: true, code: "482915", pairUrl: "https://betterschool.dino.icu/?wearPair=482915" }`.
2. **`POST /api/wear-pair/push`** : Appelé par la modale Web (`WearPairingModal.tsx`) lorsque l'élève scanne le QR Code de sa montre ou entre le code à 6 chiffres. Transmet `host`, `userId`, `platformId` et les cookies de session Smartschool.
3. **`GET /api/wear-pair/poll?code=XXXXXX`** : Appelé toutes les 2 secondes par la montre pendant l'affichage du QR Code. Dès que la session est récupérée par la montre, **l'entrée est immédiatement détruite de la mémoire du serveur** (*Zero-Retention*).

---

## 3. ↔️ Navigation Horizontale (`HorizontalPager`)

L'interface de la montre s'articule sur **l'axe horizontal** (balayage gauche $\leftrightarrow$ droite) avec 5 écrans complémentaires, chacun disposant d'un scroll vertical (`ScalingLazyColumn` compatible avec la couronne rotative / lunette) :

1. **💬 Page 1 — Dernier Message (`MessagesPage.kt`)**
   - Affiche directement le **dernier message reçu** (expéditeur, heure, sujet et texte complet nettoyé du HTML), sans boutons de réponses pré-définies.
   - En scrollant vers le bas : accès aux messages précédents de la boîte de réception (`POST /?module=Messages&file=dispatcher`).
2. **🏆 Page 2 — Dernière Note Skore & Moyenne (`GradesPage.kt`)**
   - Affiche la **toute dernière évaluation publiée** (`35,5/40`, pourcentage `89%`, couleur officielle Skore) ainsi que la **Moyenne Générale pondérée**.
   - En scrollant vers le bas : historique des notes précédentes (`GET /results/api/v1/evaluations/`).
3. **📅 Page 3 — Prochain Cours & Horaire (`SchedulePage.kt`)**
   - Carte Héro avec statut en direct (`🟢 EN COURS` ou `⏳ DANS X MIN`), **numéro de salle en grand** (ex: `D21`), barre de progression et enseignant.
   - En scrollant vers le bas : emploi du temps complet de la journée (`GET /planner/api/v1/planned-elements/user/{userId}`).
4. **✅ Page 4 — Checklist des Devoirs (`HomeworkPage.kt`)**
   - Liste des devoirs et interrogations à venir.
   - Un tap sur un devoir le coche ou le décoche directement sur Smartschool (`POST /planner/api/v1/planned-assignments/{platformId}/{assignmentId}/resolve`).
5. **📲 Page 5 — Appairage QR, Profil & Configuration Tuile (`PairingAndProfilePage.kt`)**
   - Affiche le **QR Code d'appairage** et le code à 6 chiffres directement sur la montre.
   - Permet de forcer une synchronisation, de basculer entre **Mode Réel** et **Mode Démo**, et de choisir quelle information afficher dans la **Tuile Wear OS** (`BetterSchoolTileService.kt`).

---

## 4. 📥 Comment Télécharger et Installer l'Application sur votre Montre Wear OS

### Étape 1 : Générer ou Télécharger l'APK (`betterschool-wearos.apk`)

#### Option A — Via le script automatique en 1 commande (Recommandé sur votre machine)
Un script de compilation est inclus dans le projet et copie automatiquement l'APK compilé dans `public/betterschool-wearos.apk` (téléchargeable ensuite directement depuis le bouton **« Télécharger l'APK Wear OS »** dans la modale `⌚` de BetterSchool Web) :
```bash
npm run build:wear
```

#### Option B — Via Android Studio
1. Ouvrez **Android Studio**.
2. Cliquez sur **Open** et sélectionnez le dossier `wearos-app/`.
3. Dans le menu supérieur, cliquez sur **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. L'APK est généré dans `wearos-app/app/build/outputs/apk/debug/app-debug.apk`.

---

### Étape 2 : Installer l'APK sur votre Montre (Sans câble, en Wi-Fi)

Sur votre montre Wear OS :
1. Allez dans **Paramètres > Système > À propos** et appuyez **7 fois** sur **Numéro de build** pour activer les *Options pour les développeurs*.
2. Allez dans **Paramètres > Options pour les développeurs** et activez **Débogage ADB** puis **Débogage sans fil (Wi-Fi)**.
3. Notez l'adresse IP, le port et le code d'association affichés sur la montre.

#### Installation depuis votre PC (Linux / Windows / macOS) :
```bash
# 1. Associer la montre (une seule fois)
adb pair <IP_MONTRE>:<PORT_PAIRING> <CODE_6_CHIFFRES>

# 2. Se connecter à la montre
adb connect <IP_MONTRE>:<PORT_CONNEXION>

# 3. Installer BetterSchool Wear OS
adb install -r public/betterschool-wearos.apk
```

#### Installation depuis votre Téléphone Android (sans PC) :
1. Téléchargez `betterschool-wearos.apk` depuis la modale `⌚` de `https://betterschool.dino.icu` sur votre téléphone.
2. Utilisez l'application gratuite **Wear Installer 2** ou **Bugjaeger Mobile ADB** sur le Play Store pour envoyer l'APK vers l'adresse IP de votre montre en 1 clic.
