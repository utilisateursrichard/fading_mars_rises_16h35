# 📐 Spécifications Générales — BetterSchool & Design System M3E Pro

Ce document détaille les spécifications fonctionnelles, ergonomiques et techniques de **BetterSchool**, ainsi que les fondements de son système de design : **M3E Pro** (l'alliance entre Google Material 3 Expressive et le style Pro Apple / Stripe).

---

## 1. Vision & Philosophie : Le Style Hybride « M3E Pro »

### 1.1. Pourquoi cette alliance ?
Les logiciels scolaires et ENT traditionnels souffrent généralement de deux écueils majeurs :
1. **L'austérité et la complexité administrative :** Des interfaces surchargées de tableaux denses, de menus labyrinthiques et de textes condensés, créant de la friction et de l'anxiété pour les élèves.
2. **L'infantilisation :** Des interfaces gadgetisées, trop colorées et peu fonctionnelles, qui manquent de sérieux et d'efficacité.

**M3E Pro** répond à cette problématique en combinant le meilleur de deux univers de référence :
* **Google Material 3 Expressive (M3E) :**
  * Chaleur humaine et accessibilité immédiate.
  * Formes douces et sculpturales (`rounded-3xl` / `28px`).
  * Palette tonale expressive et puces de statut vivantes.
  * Ergonomie tactile fluide avec micro-retours d'appui (`active:scale-[0.98]`).
* **Apple & Stripe Pro :**
  * Rigueur, clarté statutaire et sérénité visuelle.
  * Matériau en verre dépoli spéculaire (*frosted glass* `backdrop-blur-xl`).
  * Micro-bordures subpixel ultra-fines (`border-slate-200/70`).
  * Typographie millimétrée et hiérarchisée.
  * Indicateurs analytiques nets et métriques chiffrées précises.

> [!IMPORTANT]
> **Pas de demi-mesure fade (50/50) :**
> M3E Pro n'est pas une juxtaposition tiède de styles, mais une **fusion organique** : la structure spatiale et la typographie restent aussi calmes, sobres et nettes qu'une suite Apple ou Stripe, tandis que les surfaces d'interaction, les puces d'état et le feedback tactile adoptent la vitalité et la bienveillance de Google M3 Expressive.

---

## 2. Règle d'Or : Le Minimalisme Anti-Surcharge (*Zero Information Overflow*)

L'un des objectifs fondamentaux de la refonte est de **supprimer la surcharge cognitive** :
* **Priorité à l'immédiat :** L'interface ne bombarde pas l'élève de widgets superflus, de graphiques décoratifs ou de jauges anxiogènes.
* **Épuration des éléments parasites :**
  * Suppression des barres de progression superflues (notamment dans l'Espace Cours).
  * Suppression de la barre de recherche inutile dans l'en-tête global.
  * Suppression des boutons doublons (un seul bouton de bascule clair pour la barre latérale).
* **Lisibilité en 3 secondes :** En ouvrant l'application, l'élève sait immédiatement :
  1. Quel est son prochain cours, dans quelle salle et avec qui.
  2. Quels sont ses devoirs urgents et le temps estimé pour les réaliser.
  3. Où se situe sa moyenne générale.

---

## 3. Spécifications UX / UI & Design Tokens

### 3.1. Palette de Couleurs & Surfaces
* **Arrière-plan principal :** `#F8FAFC` (Slate 50 adouci), complété par des auras ambiantes diffuses de réfraction (*Indigo 100/40*, *Blue 100/35*, *Purple 100/25*) pour donner une profondeur aérienne sans distraction.
* **Surfaces Verre & Cartes :**
  * `.m3-glass` : Fond blanc opacifié à 75-80%, flou d'arrière-plan de 20px (`backdrop-blur-xl`), bordure subtile `border-slate-200/70`.
  * `.m3-card` : Surfaces en blanc pur `#FFFFFF` avec ombrage doux `shadow-subtle` (`0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)`).
* **Typographie :**
  * Police sans-serif moderne, nette et géométrique.
  * Graisses fortes pour les données clés (`font-extrabold`, `font-black`).
  * Textes secondaires calmes en `slate-400` et `slate-500`.
* **Codes Couleurs par Matière (Identité Tonale M3) :**
  * Mathématiques : `#0284c7` (Sky blue)
  * Science : `#6366f1` (Indigo vibrant)
  * Physique-Chimie : `#059669` (Emerald)
  * Philosophie / Kialuta : `#d97706` (Amber)
  * Histoire-Géographie : `#f97316` (Orange vif)
  * Anglais LV1 : `#ec4899` (Rose vif)
  * EPS : `#8b5cf6` (Purple)

### 3.2. Ergonomie & Navigation
* **Barre Supérieure (`Header`) :**
  * Hauteur compacte (`h-14 sm:h-16`), ancrée de façon fixe en haut de page avec flou d'arrière-plan.
  * Fil d'Ariane contextuel affichant le titre de la vue active et le badge de la semaine en cours (*Semaine A*).
  * Bouton d'action rapide `+ Devoir` ouvrant la modal d'ajout.
  * Centre de notifications avec badge et popover déroulant « Tout marquer lu ».
  * Accès direct à la messagerie avec compteur non-lu.
* **Barre Latérale Rétractable (`Sidebar`) :**
  * **Mode Déplié (`w-64`) :** Largeur confortable, libellés de navigation, badges de notification, informations de l'établissement et profil élève.
  * **Mode Rétracté / Slim Rail (`w-20`) :** Épuration maximale sous forme d'une colonne d'icônes centrées avec infobulles natives, badges compacts et avatar cliquable.
  * **Bascule Unique :** Déclenchable via le bouton `PanelLeft` situé dans l'en-tête et via le raccourci universel `Ctrl+B` (ou `Cmd+B`).
* **Conformité Système & Clavier :**
  * Remplacement systématique des symboles spécifiques macOS (`⌘`) par la notation standard `Ctrl`.

---

## 4. Spécifications des Vues & Fonctionnalités

### 4.1. 🏠 Tableau de Bord (`DashboardView`)
* **Salutation & Horloge :** En-tête personnalisé selon le moment de la journée (`Bonjour`, `Bon après-midi`, `Bonsoir Richard`).
* **Spotlight « Prochain cours » :**
  * Carte proéminente indiquant l'horaire, la salle, l'enseignant titulaire et le statut temps réel (*En direct maintenant* ou *Prochain cours*).
  * Clic direct pour ouvrir la modal de détail de séance ou envoyer un message au professeur.
* **Trio de Métriques Décisionnelles (Bento 3 KPI) :**
  1. *Moyenne Générale :* Note précise, comparaison avec la moyenne de classe et tendance par rapport au trimestre précédent.
  2. *Devoirs en attente :* Nombre d'exercices restants, temps de travail estimé (ex: 1h15) et niveau d'urgence.
  3. *Séances du jour :* Volume d'heures et heure exacte de fin de journée.
* **Double Colonne Opérationnelle :**
  * *Colonne gauche (Planning du jour) :* Déroulé chronologique des cours de la journée avec horaires, salles, enseignants et pastilles de couleur.
  * *Colonne droite (Devoirs prioritaires) :* Liste filtrée des devoirs non faits, cases à cocher interactives avec persistance instantanée et badges d'échéance.

### 4.2. 📅 Emploi du Temps (`AgendaView`)
* Bascule dynamique entre **vue Semaine** (grille complète du lundi au vendredi) et **vue Jour** (timeline détaillée heure par heure).
* Filtres rapides par matière et par typologie de séance (*Cours*, *TP*, *TD*, *DS*, *Oral*).
* Clic sur un événement : déclenche la modal d'approfondissement `CourseDetailModal` affichant les devoirs associés, le programme de cours et les supports téléchargeables.

### 4.3. 💬 Messagerie Scolaire (`MessagesView`)
* **Classification en 4 onglets :** *Tous*, *Professeurs*, *Vie Scolaire*, *Groupes de projet*.
* **Centralisation stricte des enseignants :** Tous les professeurs affichés correspondent rigoureusement au registre unique `TEACHERS`.
* **Messages Standardisés :** Tous les messages et réponses automatiques utilisent le format `"message placeholder XXX"` (numérotation aléatoire à 3 chiffres).
* Simulation réaliste de réponse automatique au bout de 1,5 seconde lors de l'envoi d'un nouveau message.
* Responsive mobile : bascule fluide entre la liste de discussions et la conversation plein écran avec bouton de retour.

### 4.4. 🏆 Notes & Résultats (`ResultsView`)
* Récapitulatif trimestriel complet avec calcul de la moyenne pondérée officielle par les coefficients.
* Détail par matière avec notes les plus hautes, moyennes de classe et appréciations officielles des professeurs.
* **Simulateur de moyenne interactif :** Permet à l'élève de saisir une note hypothétique pour évaluer instantanément son impact sur sa moyenne générale avant une évaluation.

### 4.5. 📚 Espace Cours (`CoursesView`)
* Grille claire des matières sans barres de progression superflues afin de maximiser la clarté et la sobriété.
* Vue détaillée par matière :
  * En-tête de matière avec nom officiel, salle habituelle, volume horaire et bouton direct pour contacter l'enseignant.
  * Système d'onglets segmentés :
    1. *Chapitres & Documents :* Supports de cours en PDF, fiches d'exercices et notebooks téléchargeables.
    2. *Devoirs & Rendu en ligne :* Suivi des consignes, barème et simulateur de téléversement de fichier.
    3. *Contact Enseignant :* Courriel académique et raccourci de messagerie instantanée.

---

## 5. Architecture Technique & Modèle de Données

### 5.1. Source de Vérité Unique (`TEACHERS`)
Pour éliminer les doublons et les incohérences de noms de professeurs entre les différentes pages, toutes les structures de données font référence au dictionnaire centralisé `TEACHERS` dans `src/data/mockData.ts` :
* **MATH :** `Imena` — Salle B204
* **HIST_GEO :** `mere terresa nollet / derriderrr` — Salle A102
* **SCI (Science) :** `nootends` — Labo Science
* **ANG :** `Mr. le gay` — Salle C105
* **PC :** `Dury` — Labo Chimie 2
* **PHILO :** `Pape Kialuta` — Salle B108 (Matière : *Kialuta*)
* **EPS :** `M. Bailleux qui baille bcp` — Gymnase
* **ADMIN :** `bot` — Vie Scolaire

### 5.2. Couche d'Abstraction API Découplée (`SchoolService`)
Tous les composants React consomment uniquement le contexte `SchoolContext`, qui interagit lui-même avec la classe d'abstraction `SchoolService` dans `src/services/api.ts` :
* Pour brancher un vrai backend (Supabase, Django, Node.js, FastAPI, etc.), il suffit de remplacer les appels de persistance dans `SchoolService` par des requêtes réseau (`fetch` ou `axios`).
* **Aucun composant graphique n'a besoin d'être modifié.**

### 5.3. Isolation et Versioning du Cache Local
Les données enregistrées côté client (devoirs cochés, nouveaux messages, etc.) exploitent des clés de stockage locales versionnées (`betterschool_v2_...`), empêchant tout télescopage avec d'anciennes données périmées dans le navigateur.

---

## 6. Synthèse des Bénéfices Utilisateur

| Critère | Approche Traditionnelle | Approche BetterSchool M3E Pro |
| :--- | :--- | :--- |
| **Charge visuelle** | Écrans saturés de tableaux et textes minuscules | Espaces aérés, 3 KPI clés, zéro overflow |
| **Compréhension** | Lecture fastidieuse des plannings | Carte spotlight immédiate du cours en direct / prochain |
| **Prise en main** | Menus rigides et navigation lente | Barre rétractable fluide, raccourci `Ctrl+B`, tactile M3E |
| **Messagerie** | Formulaires rigides sans statut | Fil direct avec les enseignants et réponses réactives |
| **Simplicité** | Barres et jauges partout sans valeur ajoutée | Retrait des indicateurs inutiles au profit de l'essentiel |

