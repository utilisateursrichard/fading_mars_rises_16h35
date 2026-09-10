# 🤖 Guide Développeur & Agent — BetterSchool

Ce document recense l'architecture, les conventions et les mécanismes clés de **BetterSchool**, notamment la gestion du **Mode Démo vs Mode Réel**, l'intégration avec **Smartschool**, et les consignes pour les futurs développements.

---

## 1. 🏗️ Architecture Globale

- **Framework :** React 18 + TypeScript + Vite 6
- **Styles :** Tailwind CSS 3 (Design System **M3E Pro** : alliance entre Material 3 Expressive et Apple/Stripe frosted glass)
- **Icônes :** Lucide React
- **Gestion d'état :** React Context API (`src/context/SchoolContext.tsx`)
- **Couche de données :** Abstraction de services (`src/services/api.ts`)

---

## 2. 🎭 Mode Démo vs Mode Réel (`isDemoMode`)

### 2.1. Philosophie
Pour permettre aux utilisateurs de visualiser l'ensemble de la vision du projet sans confusion avec leurs données réelles :
1. **Mode Démo (`isDemoMode = true`, par défaut) :** Affiche l'intégralité de la maquette interactive avec les données factices (`mockData.ts`).
2. **Mode Réel (`isDemoMode = false`) :** Masque toutes les fausses données. N'affiche que ce qui est réellement branché sur l'API Smartschool. Tant qu'un module n'est pas prêt, un état vide propre (`LiveModeEmptyState.tsx`) est affiché.

### 2.2. Le Bouton Toggle dans l'En-tête
- Situé dans `src/components/layout/Header.tsx` juste à côté du bouton `+ Devoir`.
- Affiche une pastille avec retour visuel immédiat :
  - 🟡 **Mode Démo** (fond ambre, point pulsant)
  - 🟢 **Mode Réel** (fond émeraude, point fixe)
- L'état est persisté dans `localStorage` sous la clé `betterschool_demo_mode`.

### 2.3. Comment débloquer un module en Mode Réel (Anti-code mort)
Le fichier `src/utils/featureFlags.ts` contient le registre des fonctionnalités :

```typescript
export const FEATURES_REGISTRY: Record<FeatureKey, FeatureConfig> = {
  agenda: {
    id: 'agenda',
    label: "Emploi du temps",
    description: "Planning dynamique, cours et horaires",
    isReadyInLive: false, // 👈 Passer à true dès que l'API réelle est connectée !
  },
  // ...
};
```

> [!IMPORTANT]
> **Règle anti-code mort :** Le booléen `isReadyInLive?: boolean` est **facultatif**. 
> - Quand un module est relié aux vraies API Smartschool, passez simplement `isReadyInLive: true`.
> - Quand tout le projet sera terminé, nous pourrons simplement passer `isDemoMode = false` par défaut sans aucune modification de structure dans les composants.

### 2.4. Visibilité des Menus en Mode Réel
- En **Mode Démo** : Tous les onglets sont visibles (Accueil, Agenda, Messages, Notes, Cours, Tuteur IA) pour montrer l'étendue complète du projet.
- En **Mode Réel** : Les modules non faits (`isReadyInLive: false`, ex: Tuteur IA) sont **invisibles** à gauche dans la barre de navigation et dans le menu mobile. Ils apparaissent automatiquement dès qu'ils sont marqués comme fonctionnels.

### 2.5. Affichage Dynamique de l'Établissement
Dans la barre latérale et le tiroir mobile, le nom de l'école est géré par `getDisplaySchoolName()` :
- **Mode Démo :** Affiche la donnée factice (`student?.schoolName || 'Mon Lycée'`).
- **Mode Réel (Non connecté / inconnu) :** Affiche explicitement **`"Lycée : inconnu"`**.
- **Mode Réel (Quand l'établissement sera extrait de Smartschool) :** Afficher **directement le nom** de l'établissement (ex: `"Lycée Victor Hugo"`), **sans** ajouter de préfixe `"Lycée : "`.

---

## 3. 🌐 Intégration Smartschool & Bookmarklet Chrome

### 3.1. Comment fonctionne le Bookmarklet
- **Sur Smartschool connecté (`<ecole>.smartschool.be`) :** L'intranet scolaire autorise l'intégration d'iframes.
- Le bookmarklet Chrome (`javascript:...`) crée un overlay plein écran sans conflit CSS qui charge l'interface BetterSchool par-dessus Smartschool.
- **Transformation du Favicon et Titre :** À l'activation, le bookmarklet remplace l'icône de l'onglet par le favicon BetterSchool (chapeau de diplômé indigo en SVG data URI) et renomme l'onglet en *"BetterSchool — Smartschool"*.
- **Restauration complète :** Dès la fermeture (touche <kbd>Échap</kbd>, bouton *« ✕ Quitter BetterSchool »* ou re-clic sur le favori), le titre et le favicon d'origine de Smartschool sont fidèlement restaurés.
- **Sécurité encodage :** Le code du bookmarklet utilise des couleurs `rgb(...)` au lieu de `#...` pour éviter toute troncature d'URL fragment dans l'omnibox Chrome.

### 3.2. Route `/book` (Page d'installation)
- Accessible sur `{site}/book` (ex: `https://betterschool.dino.icu/book`).
- Propose un bouton glisser-déposer vers la barre de favoris Chrome et la copie 1-clic du code JavaScript.
- S'adapte automatiquement à l'adresse de déploiement (`window.location.origin`).

### 3.3. Détection de contexte (`src/utils/platform.ts`)
- `isInsideSmartschool()` détecte automatiquement si BetterSchool tourne dans une iframe ou sur Smartschool.
- **Règle ergonomique :** Quand l'utilisateur est déjà sur Smartschool, l'onglet **« Bookmarklet » est automatiquement masqué** de la barre latérale et du menu mobile (inutile de proposer d'installer le bookmarklet si l'élève est déjà dedans).

---

## 4. 🔌 Connexion aux Vraies Données Smartschool (Feuille de Route)

### 4.1. Pourquoi les requêtes doivent venir du client (Client-side)
Pour éviter le **rate-limiting par IP** :
- Si un serveur centralisé faisait les requêtes pour tous les élèves, Smartschool bannirait l'IP du serveur sous 10 minutes.
- En exécutant les requêtes depuis le navigateur ou l'extension de chaque élève, les requêtes proviennent de l'IP personnelle de chaque utilisateur, éliminant tout risque de blocage global.

### 4.2. Le Pont Same-Origin (`src/services/smartschoolBridge.ts`)
Pour contourner la politique CORS sans passer par un serveur tiers à risque de blocage :
- L'iframe BetterSchool appelle `fetchSmartschool(url, options)`.
- La requête est transmise via `postMessage` au code du bookmarklet dans l'onglet Smartschool hôte.
- Le bookmarklet exécute le `fetch()` en **Same-Origin** (avec les cookies de l'élève) et renvoie le JSON/HTML à l'iframe.
- L'IP utilisée est celle de l'élève, aucun proxy serveur n'est nécessaire.

### 4.3. Remplacement des services
Toutes les méthodes de récupération de données sont centralisées dans `src/services/api.ts`.
Pour brancher une vraie route Smartschool :
1. Remplacer le retour de données factices dans la méthode correspondante de `src/services/api.ts` par un appel `await fetchSmartschool('/chemin/api')`.
2. Passer `isReadyInLive: true` dans `src/utils/featureFlags.ts`.
3. Aucun composant graphique n'a besoin d'être modifié !

---

## 5. 🛠️ Commandes Utiles

| Commande | Action |
| :--- | :--- |
| `npm run dev` | Démarre le serveur Vite de développement sur le port 3000 |
| `npm run build` | Vérifie les types TypeScript et compile pour la production (`dist/`) |
| `npm run preview` | Prévisualise la version compilée de production |
| `npm run bookmarklet` | Génère le code du bookmarklet et la page `public/bookmarklet.html` |

