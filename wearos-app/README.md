# ⌚ BetterSchool — Application Native Wear OS (Kotlin & Jetpack Compose)

Application native Android Wear OS pour **BetterSchool**, conçue en **Kotlin** avec **Jetpack Compose for Wear OS** (Design System **M3E Pro OLED**).

---

## 1. 🔗 Comment fonctionne l'Appairage (QR Code affiché sur la Montre)

Une montre Wear OS n'ayant pas de caméra, le flux d'appairage est inversé :
1. **Sur la montre** : Glissez vers la droite jusqu'à la page **Connexion & Tuile** et appuyez sur **« 📲 Afficher QR Code d'appairage »**.
2. La montre contacte `https://betterschool.dino.icu/api/wear-pair/create` et affiche un **QR Code net** sur son écran rond ainsi qu'un **code à 6 chiffres** (ex: `482915`).
3. **Sur votre appareil connecté à BetterSchool Web** : Cliquez sur l'icône Montre (`⌚`) dans la barre supérieure et **scannez le QR Code affiché sur la montre** (ou saisissez le code à 6 chiffres).
4. Le serveur `betterschool.dino.icu` transmet la session Smartschool (`host`, `userId`, `platformId`, cookies `PHPSESSID`, `smscndc`, `pid`) à la montre puis la supprime immédiatement de sa mémoire (Zero-Retention).
5. **Autonomie 100% directe** : La montre sauvegarde les jetons dans `EncryptedSharedPreferences` et effectue ensuite **toutes ses requêtes HTTP directement vers `<ecole>.smartschool.be` via `OkHttp`** (aucun blocage CORS en Kotlin natif).

---

## 2. ↔️ Navigation Horizontale (`HorizontalPager`)

Balayez de gauche à droite sur la montre pour parcourir les 5 écrans :
1. **💬 Dernier Message (`MessagesPage.kt`)** : Lecture directe du dernier message reçu (expéditeur, heure, sujet, contenu complet sans réponses pré-définies) + scroll vertical des messages précédents.
2. **🏆 Dernière Note (`GradesPage.kt`)** : Toute dernière évaluation Skore publiée (note fractionnaire, pourcentage, couleur Skore) + Moyenne générale pondérée + historique vertical.
3. **📅 Horaire & Prochain Cours (`SchedulePage.kt`)** : Cours en cours ou prochain cours avec salle en grand (`D21`), compte à rebours, barre de progression + timeline complète du jour.
4. **✅ Devoirs (`HomeworkPage.kt`)** : Checklist des devoirs cochables directement au poignet (`POST /planner/api/v1/planned-assignments/{platformId}/{assignmentId}/resolve`).
5. **📲 Connexion & Tuile (`PairingAndProfilePage.kt`)** : Affichage du QR Code d'appairage sur la montre, synchronisation directe, bascule Mode Réel / Mode Démo et choix de l'information affichée dans la Tuile Wear OS (`BetterSchoolTileService.kt`).

---

## 3. 🚀 Compilation & Installation sur Montre / Émulateur

1. Ouvrir Android Studio et sélectionner **Open** $\rightarrow$ choisir le dossier `wearos-app/`.
2. Laisser Gradle synchroniser les dépendances (`Wear Compose 1.3.1`, `OkHttp 4.12`, `ZXing 3.5.3`, `Wear Tiles 1.3`).
3. Lancer la configuration `app` sur un émulateur Wear OS 3/4/5 (API 30+) ou sur une montre connectée via ADB (`adb connect <ip_montre>:<port>`).
