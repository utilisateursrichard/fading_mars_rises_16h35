# 🏛️ M3E Pro — Spécification Technique Fermée & Design System
### *La synthèse de Google Material 3 Expressive et du design Pro Apple & Stripe*
#### Version 2.0 • Référence Développeur, Intégrateur & Designer pour BetterSchool

---

## 1. 🌟 Manifeste & Fondations Architecturables

### 1.1. L'Origine et le Parti Pris Esthétique
**M3E Pro** résout le conflit historique des ENT et logiciels scolaires : l'austérité administrative d'un côté (tableaux surchargés, friction anxiogène) et l'infantilisation de l'autre (gadgets criards sans efficacité).

La fusion repose sur deux piliers d'égale rigueur :
* **Google Material 3 Expressive (M3E) :** Formes douces et sculpturales, géométrie de conteneur Bento (`28px`), pastilles tonales vivantes, et ergonomie tactile réactive.
* **Apple & Stripe Pro :** Structure spatiale rigide, calme statutaire, matériau en verre dépoli spéculaire (*frosted glass* `backdrop-blur-xl`), micro-bordures subpixel (`border-slate-200/70`), et typographie millimétrée.

> [!IMPORTANT]
> **Règle de Non-Ambiguïté :**
> Ce document est une **spécification fermée**. Tout token, composant, rayon de courbure ou comportement responsive non expressément décrit ici est considéré comme non conforme. Trois développeurs recevant cette spécification doivent produire **trois interfaces pixel-perfect indiscernables**.

---

### 1.2. Les 4 Axiomes Fondateurs

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│   AXIOME 1 : ZERO INFORMATION OVERFLOW (Lisibilité en 3 secondes)      │
│   AXIOME 2 : TACTILE VITALITY (Micro-ressort & inertie physique)       │
│   AXIOME 3 : LAYERED ATMOSPHERE (Verre dépoli & réfraction ambiante)   │
│   AXIOME 4 : EXECUTIVE CALM (Données sobres, accents ciblés)           │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Axiome 1 : Zero Information Overflow (Anti-surcharge) :** L'interface ne bombarde jamais l'élève de widgets secondaires. En ouvrant l'application, l'élève comprend en **3 secondes** : son prochain cours, ses devoirs prioritaires et sa moyenne.
2. **Axiome 2 : Tactile Vitality (Physique tactile) :** Tout élément interactif réagit avec une micro-compression élastique (`active:scale-[0.97]`) et une courbe de décélération naturelle.
3. **Axiome 3 : Layered Atmosphere (Profondeur optique) :** Aucune surface n'est un aplat blanc mort. La profondeur naît de la superposition de 3 couches de matériaux et d'auras spéculaires de réfraction.
4. **Axiome 4 : Executive Calm (Rigueur statutaire) :** Les données d'interface restent calmes (`slate-500` / `slate-600`). Les couleurs saturées sont réservées aux **signaux d'action et aux pastilles de matières**.

---

## 2. 📦 Configuration Tailwind CSS Clé en Main

Pour éliminer tout décalage d'intégration, voici la configuration officielle et unique à copier dans `tailwind.config.js` :

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        'sub': '8px',       // Micro-badges, infobulles
        'input': '12px',    // Formulaires, avatars, boutons standards
        'card': '16px',     // Cartes enfants, devoirs, messages
        '3xl': '24px',      // Modales standards, conteneurs secondaires
        'm3': '28px',       // Cartes Bento majeures M3E Pro
        'bento': '28px',    // Alias explicite pour conteneurs Bento
        '4xl': '32px',      // Grandes modales immersives
        'pill': '9999px',   // Boutons capsules, commutateurs
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 8px 24px -4px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 12px -2px rgba(0, 0, 0, 0.06), 0 16px 32px -6px rgba(0, 0, 0, 0.08)',
        'modal': '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
        'glow': '0 0 24px -4px rgba(99, 102, 241, 0.28)',
        'float': '0 10px 30px -10px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
      },
      transitionTimingFunction: {
        'm3-spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}
```

Et les styles de base injectés dans `src/index.css` :

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
    -webkit-tap-highlight-color: transparent;
  }
  body {
    @apply bg-[#F8FAFC] dark:bg-[#090D16] text-slate-900 dark:text-slate-100 min-h-screen overflow-x-hidden antialiased font-sans;
  }
}

/* Couches de surfaces M3E Pro */
.m3-glass {
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(226, 232, 240, 0.85);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.06), 0 2px 8px -2px rgba(0, 0, 0, 0.04), inset 0 1px 0.5px rgba(255, 255, 255, 0.95);
}

.dark .m3-glass {
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(51, 65, 85, 0.7);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.3), inset 0 1px 0.5px rgba(255, 255, 255, 0.05);
}

.m3-card {
  border-radius: 28px;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.85);
  box-shadow: 0 2px 10px -2px rgba(15, 23, 42, 0.04), 0 12px 28px -6px rgba(15, 23, 42, 0.045);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease;
}

.dark .m3-card {
  background: #0f172a;
  border: 1px solid rgba(51, 65, 85, 0.8);
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.3);
}

.m3-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px -3px rgba(15, 23, 42, 0.06), 0 20px 36px -8px rgba(79, 70, 229, 0.07);
  border-color: rgba(199, 210, 254, 0.9);
}

/* Micro-interaction haptique visuelle */
.m3-press {
  transition: transform 0.12s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s ease;
}
.m3-press:active {
  transform: scale(0.97);
}
```

---

## 3. 📐 Architecture Spatiale & Rayons de Courbure

### 3.1. Règle Définitive sur les Rayons de Courbure
Pour éliminer toute ambiguïté :
* `rounded-bento` (ou `rounded-m3`) vaut **exactement 28px** (`1.75rem`). C'est le rayon emblématique de Google Material 3 Expressive pour les grandes cartes.
* `rounded-3xl` vaut **24px** (valeur par défaut de Tailwind). Réservé aux sous-conteneurs et modales moyennes.
* `rounded-2xl` vaut **16px**. Réservé aux cartes de listes (devoirs, messages, matières).
* `rounded-xl` vaut **12px**. Réservé aux inputs, boutons et avatars.
* `rounded-sub` vaut **8px**. Réservé aux puces et infobulles.
* `rounded-full` vaut **9999px**. Réservé aux badges de statut et boutons CTA circulaires.

### 3.2. Échelle des Marges et Espacements (Soft Grid 4pt / 8pt)

| Token Tailwind | Valeur Exacte | Règle d'usage M3E Pro |
| :--- | :--- | :--- |
| `p-1` / `gap-1` | **4px** | Micro-gaps internes (pastille de statut + texte). |
| `p-2` / `gap-2` | **8px** | Espacement des badges, padding vertical boutons compacts. |
| `p-3` / `gap-3` | **12px** | Gap entre icônes et intitulés, barres de navigation compactes. |
| `p-4` / `gap-4` | **16px** | Padding interne standard des cartes sur mobile, gap de listes. |
| `p-6` / `gap-6` | **24px** | Padding interne des cartes Bento et modales desktop. |
| `p-8` / `gap-8` | **32px** | Gouttières principales de page (`main.max-w-7xl`). |

---

## 4. 🔤 Spécifications Typographiques Exhaustives

M3E Pro utilise une séparation stricte :
* **`font-display` (`Plus Jakarta Sans`) :** Pour tous les titres, notes clés et chiffres décisionnels.
* **`font-sans` (`Inter`) :** Pour tout le texte courant, les labels, métadonnées, heures et formulaires.
* **`font-mono` (`JetBrains Mono`) :** Pour les identifiants techniques (INE, numéros de copie).

### 4.1. Tableau Typographique avec Hauteurs de Ligne (`line-height`)

| Rôle Typographique | Police | Taille (`font-size`) | Hauteur de Ligne (`line-height`) | Graisse (`weight`) | Interlettrage (`letter-spacing`) | Combinaison Tailwind Prête à l'Emploi |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display 1 (Note géante)**| Display | `32px` (2.0rem) | **`38px` (1.18)** | `900` (Black) | `-0.03em` | `font-display text-[32px] leading-[38px] font-black tracking-tight` |
| **Headline (Titre vue)** | Display | `24px` (1.5rem) | **`30px` (1.25)** | `800` (ExtraBold) | `-0.025em`| `font-display text-2xl leading-[30px] font-extrabold tracking-tight` |
| **Title Medium (Bento)** | Display | `18px` (1.125rem) | **`24px` (1.33)** | `700` (Bold) | `-0.02em` | `font-display text-lg leading-6 font-bold tracking-tight` |
| **Title Small (Devoirs)** | Display | `15px` (0.9375rem)| **`20px` (1.33)** | `700` (Bold) | `-0.015em`| `font-display text-[15px] leading-5 font-bold tracking-tight` |
| **Body (Corps)** | Sans | `14px` (0.875rem) | **`20px` (1.43)** | `500` (Medium) | `0` | `font-sans text-sm leading-5 font-medium` |
| **Caption (Détails prof)**| Sans | `12px` (0.75rem) | **`16px` (1.33)** | `500` (Medium) | `+0.01em` | `font-sans text-xs leading-4 font-medium` |
| **Label Sub (Badges)** | Sans | `11px` (0.6875rem)| **`14px` (1.27)** | `700` (Bold) | `+0.02em` | `font-sans text-[11px] leading-[14px] font-bold uppercase tracking-wider` |
| **Code (INE / IDs)** | Mono | `11px` (0.6875rem)| **`14px` (1.27)** | `600` (SemiBold)| `0` | `font-mono text-[11px] leading-[14px] font-semibold` |

---

## 5. 🎨 Couleurs, Matériaux & Accessibilité WCAG

### 5.1. Réfraction Ambiante (Mode Clair & Mode Sombre)
Le fond d'écran intègre des auras lumineuses fixes :
* **Mode Clair (`#F8FAFC`) :**
  - Aura 1 (Haut Droite) : `w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl`
  - Aura 2 (Milieu Gauche) : `w-80 h-80 bg-blue-100/35 rounded-full blur-3xl`
  - Aura 3 (Bas Droite) : `w-96 h-96 bg-purple-100/25 rounded-full blur-3xl`
* **Mode Sombre (`#090D16`) :**
  - Aura 1 : `w-96 h-96 bg-indigo-950/25 rounded-full blur-3xl`
  - Aura 2 : `w-80 h-80 bg-blue-950/20 rounded-full blur-3xl`
  - Aura 3 : `w-96 h-96 bg-purple-950/15 rounded-full blur-3xl`

---

### 5.2. Spécification d'Accessibilité WCAG Réaliste (AA vs AAA)
Pour garantir la conformité sans ambiguïté :
* **Norme WCAG AA (Obligatoire pour tout le texte standard < 18pt) :** Ratio minimal de **4.5:1**.
* **Norme WCAG AAA (Contraste renforcé) :** Ratio minimal de **7.0:1** pour texte standard, et **4.5:1** pour texte gras >= 14pt (18.5px).

#### Matrice Officielle des Badges de Matières :

| Matière | Couleur Fond | Texte Recommandé (WCAG AAA >= 7:1) | Ratio Réel | Texte Standard (WCAG AA >= 4.5:1) | Ratio Réel |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Mathématiques** | `bg-sky-50` (`#f0f9ff`) | `text-sky-950` (`#082f49`) | **13.2:1** | `text-sky-800` (`#075985`) | **6.4:1** |
| **Sciences** | `bg-indigo-50` (`#eef2ff`) | `text-indigo-950` (`#1e1b4b`) | **14.1:1** | `text-indigo-700` (`#4338ca`) | **5.8:1** |
| **Physique-Chimie**| `bg-emerald-50` (`#ecfdf5`) | `text-emerald-950` (`#022c22`) | **14.8:1** | `text-emerald-800` (`#065f46`) | **6.1:1** |
| **Philosophie** | `bg-amber-50` (`#fffbeb`) | `text-amber-950` (`#451a03`) | **13.5:1** | `text-amber-800` (`#92400e`) | **5.5:1** |
| **Histoire-Géo** | `bg-orange-50` (`#fff7ed`) | `text-orange-950` (`#431407`) | **13.9:1** | `text-orange-800` (`#9a3412`) | **5.3:1** |
| **Langues (Anglais)**| `bg-rose-50` (`#fff1f2`) | `text-rose-950` (`#4c0519`) | **14.2:1** | `text-rose-800` (`#9f1239`) | **5.7:1** |
| **EPS / Sport** | `bg-purple-50` (`#faf5ff`) | `text-purple-950` (`#3b0764`) | **14.0:1** | `text-purple-800` (`#6b21a8`) | **5.9:1** |

> [!TIP]
> **Règle d'implémentation :** Les badges M3E Pro utilisent la combinaison **WCAG AA** (`text-*-800`) pour les puces informatives légères de petite taille, et la combinaison **WCAG AAA** (`text-*-950`) dès que le badge véhicule une alerte statutaire critique.

---

### 5.3. Système de Fallback Universel pour les Matières
Si une matière n'est pas dans les 7 disciplines historiques (ex: *Allemand, SES, NSI, Musique, Arts Plastiques, Droit*), appliquer l'algorithme d'attribution suivant :

```typescript
export interface SubjectTheme {
  bgLight: string;
  textLight: string;
  borderLight: string;
  dotColor: string;
  bgDark: string;
  textDark: string;
  borderDark: string;
}

export const getSubjectTheme = (subjectName: string): SubjectTheme => {
  const normalized = subjectName.toLowerCase().trim();

  // 1. Détection sémantique par mot-clé
  if (normalized.includes('math')) {
    return { bgLight: 'bg-sky-50', textLight: 'text-sky-800', borderLight: 'border-sky-200', dotColor: 'bg-sky-600', bgDark: 'bg-sky-950/50', textDark: 'text-sky-300', borderDark: 'border-sky-800/60' };
  }
  if (normalized.includes('physiq') || normalized.includes('chimi') || normalized.includes('nsi') || normalized.includes('techno')) {
    return { bgLight: 'bg-emerald-50', textLight: 'text-emerald-800', borderLight: 'border-emerald-200', dotColor: 'bg-emerald-600', bgDark: 'bg-emerald-950/50', textDark: 'text-emerald-300', borderDark: 'border-emerald-800/60' };
  }
  if (normalized.includes('hist') || normalized.includes('géo') || normalized.includes('ses') || normalized.includes('éco')) {
    return { bgLight: 'bg-orange-50', textLight: 'text-orange-800', borderLight: 'border-orange-200', dotColor: 'bg-orange-600', bgDark: 'bg-orange-950/50', textDark: 'text-orange-300', borderDark: 'border-orange-800/60' };
  }
  if (normalized.includes('angl') || normalized.includes('espag') || normalized.includes('allem') || normalized.includes('ital') || normalized.includes('lang')) {
    return { bgLight: 'bg-rose-50', textLight: 'text-rose-800', borderLight: 'border-rose-200', dotColor: 'bg-rose-600', bgDark: 'bg-rose-950/50', textDark: 'text-rose-300', borderDark: 'border-rose-800/60' };
  }
  if (normalized.includes('sport') || normalized.includes('eps') || normalized.includes('art') || normalized.includes('musiq')) {
    return { bgLight: 'bg-purple-50', textLight: 'text-purple-800', borderLight: 'border-purple-200', dotColor: 'bg-purple-600', bgDark: 'bg-purple-950/50', textDark: 'text-purple-300', borderDark: 'border-purple-800/60' };
  }

  // 2. Fallback neutre Pro pour toute autre discipline
  return {
    bgLight: 'bg-slate-100',
    textLight: 'text-slate-800',
    borderLight: 'border-slate-200',
    dotColor: 'bg-slate-600',
    bgDark: 'bg-slate-800/60',
    textDark: 'text-slate-200',
    borderDark: 'border-slate-700'
  };
};
```

---

## 6. 📱 Architecture Responsive & Comportement Multi-Écrans

### 6.1. Grille de Breakpoints Officielle

```
[ MOBILE (< 640px) ]          ──> Colonne 100%, Bottom Bar fixe, Tiroir glissant
[ TABLETTE (640px - 1023px) ] ──> Grille Bento 2 colonnes, Header compact
[ DESKTOP (>= 1024px) ]       ──> Sidebar rétractable (80px / 256px), Bento 3 colonnes
```

| Breakpoint | Largeur Min | Navigation | Grille Bento KPI | Layout Contenu |
| :--- | :--- | :--- | :--- | :--- |
| **Mobile (`default`)** | `< 640px` | Barre basse fixe (`h-16`) + Tiroir Menu | Pile verticale 1 colonne (`grid-cols-1`) | `p-4 pb-20` |
| **Tablette (`sm:`/`md:`)** | `640px` — `1023px` | Barre basse fixe ou Tiroir glissant | 2 colonnes (`grid-cols-2`) | `p-6 pb-20` |
| **Desktop (`lg:`)** | `1024px` | Sidebar rétractable (`w-20` ou `w-64`) | 3 colonnes (`grid-cols-3`) | `p-8 max-w-7xl` |

---

### 6.2. Navigation Mobile (Barre Basse & Tiroir)

1. **La Barre de Navigation Basse Fixe (`MobileNav`) :**
   - Visible uniquement sur écrans `< 1024px` (`lg:hidden`).
   - Hauteur fixe : `h-16` (64px).
   - Fond : `bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80`.
   - Contient 5 actions immédiates (Accueil, Agenda, Messages, Notes, Cours).
   - Chaque icône possède un retour d'appui tactile et un point indicateur de l'onglet actif.

2. **Le Tiroir Glissant Latéral (*Slide-Over Drawer*) :**
   - Déclenché par le bouton hamburger de l'en-tête.
   - Largeur : `w-80 max-w-[85vw]`.
   - Animation : `slide-in-from-left duration-200`.
   - Affiche : profil complet de l'élève (photo, classe, numéro INE), toutes les vues secondaires (Tuteur IA, Paramètres, Déconnexion), et actions rapides.

---

## 7. 🧩 Bibliothèque des Composants d'Interaction

### 7.1. Champs de Formulaires & Saisie (Inputs)
Tous les champs respectent un style épuré, sans ombres superflues :

```tsx
// Input Standard M3E Pro
<div className="space-y-1.5 w-full">
  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
    Intitulé du devoir
  </label>
  <input
    type="text"
    placeholder="Ex: Exercices 12 à 15 page 84"
    className="w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-input px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
  />
</div>

// État d'Erreur Input
<input
  className="w-full bg-rose-50/30 border border-rose-400 rounded-input px-3.5 py-2.5 text-sm text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
/>
<p className="text-xs text-rose-600 font-semibold mt-1">Ce champ est obligatoire.</p>

// État Désactivé
<input
  disabled
  className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200/60 rounded-input px-3.5 py-2.5 text-sm text-slate-400 cursor-not-allowed select-none"
/>
```

---

### 7.2. Navigation au Clavier & Accessibilité (`:focus-visible`)
Tout élément interactif (bouton, lien, switch, case à cocher) doit comporter un anneau de focalisation net pour les élèves naviguant au clavier :

```css
/* Token Focus-Visible officiel M3E Pro */
.focus-ring {
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-950;
}
```

---

### 7.3. Modales & Boîtes de Dialogue
* **Fond d'occultation (*Backdrop*) :** `fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150`
* **Conteneur :** `bg-white dark:bg-slate-900 rounded-bento (28px) border border-slate-200/80 dark:border-slate-800 shadow-modal max-w-lg w-full p-6 sm:p-8 animate-in zoom-in-95 duration-200`
* **Fermeture universelle :** Touche <kbd>Échap</kbd> et clic sur le fond d'arrière-plan.

---

### 7.4. États de Chargement (*Skeletons & Shimmer*)
Pour éviter tout sursaut de mise en page (*layout shift*) pendant le chargement des données :

```tsx
<div className="animate-pulse space-y-4">
  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3" />
  <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-card w-full" />
  <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-input w-2/3" />
</div>
```

---

## 8. ⚡ Physique du Mouvement & Micro-Interactions

### 8.1. La Courbe Ressort Apple / M3
La transition universelle utilise la courbe décélérée à inertie :

```css
transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
```

### 8.2. Échelle des Durées
* **Micro (100ms — 120ms) :** Clic de bouton, case à cocher (`.m3-press`), retour tactile.
* **Standard (150ms — 200ms) :** Survol de carte, ouverture de popover, apparition de tooltip.
* **Structurel (250ms — 300ms) :** Dépliage de la barre latérale, transition de route, ouverture de modale.

---

## 9. 🚫 Anti-Patterns : Ce qui est STRICTEMENT Interdit

| ❌ STRICTEMENT INTERDIT | ✅ RÈGLE OBLIGATOIRE M3E PRO |
| :--- | :--- |
| `rounded-none` ou angles vifs à 90° sur des cartes | Arrondis sculpturaux hiérarchisés (`16px` cartes, `28px` bento) |
| Ombres noires lourdes (`box-shadow: 0 10px 20px black`) | Ombres diffuses colorées multicouches (`shadow-card`) |
| Bordures épaisses de 2px ou contrastées | Micro-bordures subpixel `border-slate-200/70` |
| Fond d'écran blanc pur `#FFFFFF` intégral | Fond atmosphérique `#F8FAFC` avec auras de réfraction floutées |
| Multiples boutons de bascule de la barre latérale | Un seul bouton clair dans l'en-tête et le raccourci `Ctrl+B` |
| Raccourci noté exclusivement Mac `⌘B` | Notation standard universelle inclusive <kbd>Ctrl + B</kbd> |
| Formulations infantilisantes (*« Bravo champion ! »*) | Ton d'adulte autonome, calme et respectueux |

---

## 10. 📋 Checklist de Conformité Développeur

Avant de soumettre un nouveau composant dans **BetterSchool**, validez cette liste :

- [ ] La typographie utilise `font-display` pour les titres et `font-sans` pour le corps.
- [ ] Les hauteurs de ligne (`leading-[...]`) sont explicitement définies.
- [ ] Le rayon de courbure est de `rounded-card` (16px) pour les sous-éléments ou `rounded-bento` (28px) pour les grandes cartes.
- [ ] Tout élément cliquable possède la classe tactile `.m3-press` et le focus clavier `.focus-ring`.
- [ ] Le contraste du texte sur badge respecte au minimum **WCAG AA** (>= 4.5:1).
- [ ] L'élément est testé et lisible sur écran mobile de 390px sans débordement horizontal.
- [ ] Le composant supporte le Mode Clair (`#F8FAFC`) et le Mode Sombre (`#090D16`).

---

*BetterSchool Design System Specifications • Version 2.0 Fermée • 2026*
