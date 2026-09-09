# 🎓 BetterSchool — Espace Élève & Tableau de Bord Scolaire

**BetterSchool** est une application web moderne (UI/UX soignée, réactive et 100% fonctionnelle) conçue pour permettre aux élèves de suivre leur vie scolaire : agenda/emploi du temps interactif, devoirs à rendre, messagerie en direct avec les professeurs, suivi des résultats scolaires avec simulateur de moyenne, et espace de cours complet.

Elle adopte le design system **M3E Pro** (hybride Google Material 3 Expressive & Apple/Stripe Pro), garantissant une interface minimaliste, chaleureuse et sans surcharge d'informations.

👉 **Consultez les spécifications complètes du design system et de la plateforme dans [SPECIFICATIONS.md](./SPECIFICATIONS.md)**.

---

## 🚀 Démarrage Rapide

### Prérequis
- **Node.js** (v18 ou supérieur)
- **npm** (ou yarn / pnpm)

### Installation & Lancement
```bash
# 1. Accéder au dossier du projet
cd "better school"

# 2. Installer les dépendances (si ce n'est pas déjà fait)
npm install

# 3. Lancer le serveur de développement local
npm run dev
```

L'application s'ouvrira par défaut sur `http://localhost:3000` (ou port indiqué dans le terminal).

Pour compiler pour la production :
```bash
npm run build
npm run preview
```

---

## 📱 Fonctionnalités Incluses

### 1. 🏠 Tableau de Bord (Dashboard)
- **Bannière d'accueil dynamique** : date en temps réel, prochain cours en direct avec salle et enseignant.
- **Indicateurs clés (KPI)** : Moyenne générale (+évolution), devoirs en attente, programme du jour, assiduité/présence.
- **Emploi du temps du jour** : Timeline chronologique avec statuts en direct (*En cours*, *À venir*, *Terminé*).
- **Checklist des devoirs** : Cocher un devoir le marque immédiatement comme fait avec persistance locale (`localStorage`).
- **Dernières notes** : Synthèse des évaluations récentes avec moyenne de classe et coefficients.
- **Accès rapide** pour envoyer un message à un enseignant en 1 clic.

### 2. 📅 Agenda & Emploi du Temps
- **Double vue** :
  - **Semaine** : Grille hebdomadaire interactive (Lundi au Vendredi).
  - **Jour** : Vue chronologique détaillée heure par heure.
- **Filtres intégrés** : Par matière (Maths, NSI, Philo, etc.) et par type (Cours, DS, TP, TD).
- **Modale de cours enrichie** : Au clic sur une séance, affichage de la salle, du professeur, des devoirs associés, des documents de cours et lien direct de contact.
- **Ajout de devoirs** : Formulaire d'ajout rapide de devoirs ou rappels personnels.

### 3. 💬 Messagerie Interactive (100% Fonctionnelle)
- **Canaux classés** : *Professeurs*, *Vie Scolaire / Administration*, *Groupes de projet*.
- **Envoi de messages en temps réel** : Saisie de message avec affichage instantané dans le fil de discussion.
- **Réponses automatiques simulées** : Réception d'une réponse contextuelle après 1.5s pour illustrer la réactivité.
- **Statut en ligne** et compteurs de messages non lus.
- **Responsive mobile** : Sur smartphone, bascule automatique entre la liste des conversations et le chat plein écran avec bouton retour.

### 4. 🏆 Résultats & Notes
- **Synthèse globale** : Moyenne générale sur 20, comparaison avec la moyenne de classe, note la plus haute et la plus basse.
- **Sélecteur de trimestre** : T1 (en cours), T2, T3.
- **Détail par matière** : Coefficients officiels, moyenne élève vs classe, appréciations officielles des professeurs.
- **Accordéon d'évaluations** : Détail de chaque note (DS, DM, TP, Oral), date, coefficient et remarques du professeur.
- **⚡ Simulateur de moyenne interactif** : L'élève peut sélectionner une matière, entrer une note hypothétique (ex: 18/20 avec coef. 2) et voir instantanément l'impact exact sur sa moyenne générale.

### 5. 📚 Espace Cours & Ressources
- **Grille des matières** épurée et minimaliste (sans barres de progression superflues).
- **Vue détaillée par matière** :
  - **Chapitres & Documents** : Fiches de cours, notebooks Python, synthèses téléchargeables.
  - **Devoirs & Dépôts en ligne** : Suivi des devoirs avec simulateur de téléversement de fichier.
  - **Coordonnées enseignant** : Email académique et contact direct en un clic.

### 6. 📱 Compatibilité Mobile & Ergonomie
- **Mobile First** : Barre de navigation inférieure fixe (*Bottom Nav Bar*) sur smartphone avec badges de notification.
- **Menu Tiroir (Drawer)** : Menu coulissant pour accéder au profil, actions rapides et vie scolaire.
- **Desktop Sidebar** : Navigation latérale structurée avec raccourcis et profil élève.

---

## 🛠️ Architecture & Remplacement par de Vraies Données

L'application respecte le principe de séparation des responsabilités (**Separation of Concerns**) :

```
src/
├── types/
│   └── school.ts              # Modèles et interfaces TypeScript stricts
├── data/
│   └── mockData.ts            # Données réalistes de démonstration
├── services/
│   └── api.ts                 # Couche d'abstraction API (SchoolService)
├── context/
│   └── SchoolContext.tsx       # Gestion d'état global réactif + persistance
├── components/
│   ├── layout/                # Sidebar, Header, MobileNav
│   ├── views/                 # Dashboard, Agenda, Messages, Results, Courses
│   └── modals/                # CourseDetailModal, NewHomeworkModal
├── App.tsx
├── main.tsx
└── index.css
```

### Comment brancher votre vraie API Backend ?

Toute la logique de récupération de données passe par [`src/services/api.ts`](./src/services/api.ts).

Exemple pour brancher un vrai backend REST :
```typescript
// Dans src/services/api.ts :

class SchoolService {
  async getAgendaEvents(): Promise<CourseEvent[]> {
    // Remplacer le mock par :
    const response = await fetch('/api/v1/agenda');
    return response.json();
  }

  async sendMessage(conversationId: string, content: string) {
    const response = await fetch(`/api/v1/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    return response.json();
  }
}
```
👉 **Aucun composant graphique (`DashboardView`, `AgendaView`, `MessagesView`, etc.) n'a besoin d'être modifié !** Ils consomment tous les mêmes contrats d'interfaces définis dans `types/school.ts`.

---

## 🎨 Technologies Utilisées

- **React 18** avec Hooks & Context API
- **TypeScript** pour la robustesse et l'autocomplétion
- **Vite** pour un outillage ultra-rapide
- **Tailwind CSS** pour le design system moderne
- **Lucide Icons** pour des icônes vectorielles cohérentes

