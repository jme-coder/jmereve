# CardForge - Document de Planification Complet

## 1. Vision du Projet

CardForge est une application web de creation de jeux de cartes educatifs. Elle permet de concevoir des jeux de cartes avec un recto (cas d'usage / question) et un verso (reponse / explication), utilisables aussi bien en format digital qu'imprimes via export PDF.

### Deux types de jeux supportes

| Type | Principe | Exemple |
|------|----------|---------|
| **Categorisation** | Classer un cas d'usage dans la bonne categorie | 4 niveaux de risque de l'AI Act |
| **Vrai ou Faux** | Determiner si un enonce est vrai ou faux | Affirmations sur la reglementation RGPD |

### Structure d'une carte

**Recto (question)** :
- Enonce du cas d'usage
- Champs personnalisables : niveau de difficulte, niveau de certitude, source, etc.
- Indication du type de jeu (categoriser ou vrai/faux)

**Verso (reponse)** :
- La bonne reponse (categorie ou vrai/faux)
- Explication detaillee
- Feedback pedagogique

---

## 2. Gestion des Roles Utilisateurs

### 2.1 Les trois roles

| Role | Description | Acces |
|------|-------------|-------|
| **Participant** | Apprenant qui joue avec les cartes | Jouer, consulter ses scores |
| **Formateur** | Createur de contenu pedagogique | Tout du participant + creer/editer jeux, cartes, categories |
| **Administrateur** | Gestionnaire de la plateforme | Tout du formateur + gerer les utilisateurs et les roles |

### 2.2 Matrice des permissions detaillee

| Fonctionnalite | Participant | Formateur | Administrateur |
|----------------|:-----------:|:---------:|:--------------:|
| Voir la liste des jeux disponibles | ✓ | ✓ | ✓ |
| Jouer a un jeu (mode digital) | ✓ | ✓ | ✓ |
| Voir ses propres scores/historique | ✓ | ✓ | ✓ |
| Exporter un jeu en PDF | - | ✓ | ✓ |
| Creer un nouveau jeu | - | ✓ | ✓ |
| Editer un jeu existant (nom, description, parametres) | - | ✓ (ses jeux) | ✓ (tous) |
| Ajouter/editer/supprimer des cartes | - | ✓ (ses jeux) | ✓ (tous) |
| Gerer les categories d'un jeu | - | ✓ (ses jeux) | ✓ (tous) |
| Gerer les champs personnalises | - | ✓ (ses jeux) | ✓ (tous) |
| Dupliquer un jeu | - | ✓ | ✓ |
| Supprimer un jeu | - | ✓ (ses jeux) | ✓ (tous) |
| Voir les scores de tous les participants | - | ✓ (ses jeux) | ✓ (tous) |
| Gerer les utilisateurs | - | - | ✓ |
| Attribuer/modifier les roles | - | - | ✓ |
| Voir les statistiques globales | - | - | ✓ |
| Configurer l'application | - | - | ✓ |

---

## 3. Modele de Donnees

### 3.1 Schema des entites

```
User
├── id: string (UUID)
├── email: string (unique)
├── name: string
├── passwordHash: string
├── role: 'participant' | 'formateur' | 'admin'
├── avatar?: string
├── createdAt: Date
└── lastLoginAt: Date

Game
├── id: string (UUID)
├── name: string
├── description: string
├── type: 'category' | 'truefalse'
├── ownerId: string (ref User) ← le formateur createur
├── isPublished: boolean ← visible par les participants
├── categories: Category[]
├── customFields: CustomField[]
├── cards: Card[]
├── settings: GameSettings
├── createdAt: Date
└── updatedAt: Date

Category
├── id: string (UUID)
├── name: string
├── color: string (hex)
└── description: string

CustomField
├── id: string (UUID)
├── name: string
├── type: 'text' | 'number' | 'select' | 'rating'
├── options?: string[] (pour type 'select')
├── maxRating?: number (pour type 'rating', defaut 5)
├── showOnFront: boolean
└── showOnBack: boolean

Card
├── id: string (UUID)
├── order: number
├── front: CardFront
│   ├── useCase: string (l'enonce)
│   └── customFieldValues: Record<string, string | number>
└── back: CardBack
    ├── answer: string (ID de categorie ou 'true'/'false')
    ├── explanation: string
    └── feedback: string

GameSession (historique de jeu)
├── id: string (UUID)
├── gameId: string (ref Game)
├── userId: string (ref User)
├── score: number (pourcentage)
├── correctCount: number
├── totalCount: number
├── answers: SessionAnswer[]
├── startedAt: Date
└── completedAt: Date

SessionAnswer
├── cardId: string (ref Card)
├── userAnswer: string
├── correctAnswer: string
├── isCorrect: boolean
└── answeredAt: Date

GameSettings
├── cardWidth: number (en mm, defaut 63.5)
├── cardHeight: number (en mm, defaut 88.9)
├── primaryColor: string (hex, defaut '#2563eb')
├── secondaryColor: string (hex, defaut '#f59e0b')
└── fontFamily: string (defaut 'Helvetica')
```

### 3.2 Relations entre entites

```
User (1) ──── (N) Game          Un formateur possede plusieurs jeux
User (1) ──── (N) GameSession   Un participant a plusieurs sessions de jeu
Game (1) ──── (N) Card          Un jeu contient plusieurs cartes
Game (1) ──── (N) Category      Un jeu a plusieurs categories
Game (1) ──── (N) CustomField   Un jeu a plusieurs champs personnalises
Game (1) ──── (N) GameSession   Un jeu a plusieurs sessions
```

---

## 4. Architecture Technique

### 4.1 Stack technologique

| Couche | Technologie | Justification |
|--------|------------|---------------|
| **Frontend** | React 19 + TypeScript | Composants reactifs, typage fort |
| **Routing** | React Router v7 | Navigation SPA |
| **State management** | Zustand | Leger, simple, persistance localStorage |
| **Styles** | CSS vanilla (fichier unique) | Pas de dependance supplementaire |
| **PDF** | jsPDF | Generation cote client, pas de serveur |
| **IDs** | uuid v4 | Identifiants uniques |
| **Build** | Vite | Rapide, support TypeScript natif |
| **Deploiement** | GitHub Pages + GitHub Actions | Gratuit, automatise |

### 4.2 Structure des fichiers (version avec roles)

```
card-game-app/
├── public/
├── src/
│   ├── types/
│   │   └── index.ts              # Tous les types et interfaces
│   ├── store/
│   │   ├── useGameStore.ts       # Etat des jeux (CRUD)
│   │   ├── useAuthStore.ts       # Authentification et session utilisateur
│   │   └── useSessionStore.ts    # Historique des sessions de jeu
│   ├── components/
│   │   ├── Layout.tsx            # Barre de navigation avec menu utilisateur
│   │   ├── ProtectedRoute.tsx    # Garde de route selon le role
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx     # Formulaire de connexion
│   │   │   └── RegisterForm.tsx  # Formulaire d'inscription
│   │   ├── participant/
│   │   │   ├── GameCatalog.tsx   # Liste des jeux publies (vue participant)
│   │   │   ├── CardPlayer.tsx    # Mode jeu avec animation flip
│   │   │   └── MyScores.tsx      # Historique des scores personnels
│   │   ├── formateur/
│   │   │   ├── GameList.tsx      # Liste des jeux du formateur
│   │   │   ├── GameEditor.tsx    # Edition d'un jeu (onglets)
│   │   │   ├── CardEditor.tsx    # Edition d'une carte (recto/verso)
│   │   │   ├── CardList.tsx      # Liste des cartes avec actions
│   │   │   ├── CategoryManager.tsx # Gestion des categories
│   │   │   ├── FieldManager.tsx  # Gestion des champs personnalises
│   │   │   ├── PdfExport.tsx     # Options et generation PDF
│   │   │   └── GameStats.tsx     # Statistiques d'un jeu
│   │   └── admin/
│   │       ├── UserManager.tsx   # Liste et gestion des utilisateurs
│   │       ├── Dashboard.tsx     # Tableau de bord global
│   │       └── AppSettings.tsx   # Configuration de l'application
│   ├── hooks/
│   │   ├── useAuth.ts            # Hook d'authentification
│   │   └── usePermissions.ts     # Hook de verification des permissions
│   ├── utils/
│   │   ├── pdfGenerator.ts       # Generation PDF avec jsPDF
│   │   └── auth.ts               # Utilitaires auth (hash, tokens)
│   ├── App.tsx                   # Routes avec protection par role
│   ├── main.tsx                  # Point d'entree
│   └── index.css                 # Styles globaux
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 5. Description des Ecrans par Role

### 5.1 Ecrans Participant

#### Catalogue de jeux (`/games`)
- Grille de jeux publies par les formateurs
- Chaque carte-jeu affiche : nom, description, nombre de cartes, type (icone)
- Bouton "Jouer" pour lancer une session
- Filtre par type (categorie / vrai-faux)

#### Mode jeu (`/games/:id/play`)
- Barre de progression (carte X sur Y)
- Score en temps reel (bonnes / mauvaises reponses)
- Choix du mode : sequentiel ou aleatoire
- Carte recto avec :
  - Enonce du cas d'usage
  - Champs personnalises visibles (difficulte, etc.)
  - Boutons de reponse (categories ou vrai/faux)
- Animation de retournement 3D au clic sur une reponse
- Carte verso avec :
  - Badge de la bonne reponse (colore)
  - Indication bonne/mauvaise reponse
  - Explication detaillee
  - Feedback pedagogique
  - Bouton "Carte suivante"
- Ecran de fin : pourcentage, detail des scores, bouton rejouer

#### Mes scores (`/scores`)
- Historique des sessions jouees
- Pour chaque session : jeu, date, score, nombre de bonnes reponses
- Statistiques agregees par jeu

### 5.2 Ecrans Formateur

#### Mes jeux (`/formateur/games`)
- Liste des jeux crees par le formateur
- Bouton "Nouveau jeu" (modal de creation)
- Pour chaque jeu : nom, type, nombre de cartes, date de modification
- Actions : editer, jouer, exporter PDF, dupliquer, supprimer
- Toggle "publie" pour rendre visible aux participants

#### Editeur de jeu (`/formateur/games/:id`)
Quatre onglets :

**Onglet Cartes**
- Liste de toutes les cartes avec :
  - Numero d'ordre
  - Apercu de l'enonce (tronque)
  - Badge de la reponse
  - Boutons : editer (✏️), supprimer (🗑️)
- Bouton "Ajouter une carte"
- Possibilite de reordonner (drag & drop futur)

**Onglet Categories** (jeux de type "categorisation" uniquement)
- Formulaire d'ajout : nom, couleur (color picker), description
- Liste des categories existantes avec pastille de couleur
- Bouton supprimer par categorie

**Onglet Champs personnalises**
- Formulaire d'ajout :
  - Nom du champ
  - Type (texte, nombre, liste deroulante, notation etoiles)
  - Options (si liste deroulante) : valeurs separees par virgule
  - Valeur max (si notation etoiles) : entre 2 et 10
  - Cases a cocher : visible au recto / visible au verso
- Liste des champs avec type, options, visibilite

**Onglet Parametres**
- Nom et description du jeu
- Dimensions des cartes (largeur/hauteur en mm)
- Couleurs primaire et secondaire (color pickers)

#### Editeur de carte (`/formateur/games/:id/card/:cardId`)
Mise en page deux colonnes :

**Colonne gauche - Recto**
- Zone de texte : enonce du cas d'usage (obligatoire)
- Champs personnalises configures comme "visible au recto" :
  - Texte → champ texte
  - Nombre → champ numerique
  - Liste → menu deroulant
  - Notation → etoiles cliquables (★☆)

**Colonne droite - Verso**
- Selecteur de reponse :
  - Mode categorie → boutons colores pour chaque categorie
  - Mode vrai/faux → deux boutons (Vrai vert / Faux rouge)
- Zone de texte : explication
- Zone de texte : feedback
- Champs personnalises configures comme "visible au verso"

**Apercu en bas de page**
- Deux cartes cote a cote (recto et verso) montrant le rendu final
- Mise a jour en temps reel pendant l'edition

**Boutons d'action**
- Sauvegarder / Creer
- Annuler (retour a la liste)

#### Export PDF (`/formateur/games/:id/export`)
Mise en page deux colonnes :

**Options (gauche)**
- Case : inclure les versos (impression recto-verso)
- Case : inclure les reperes de decoupe
- Slider : nombre de cartes par ligne (1-5)
- Slider : marge de page (5-30 mm)
- Resume : nombre de cartes, pages necessaires
- Bouton "Generer le PDF"

**Apercu (droite)**
- Miniature de la mise en page d'une page A4
- Apercu des versos si option activee

### 5.3 Ecrans Administrateur

#### Tableau de bord (`/admin`)
- Nombre total d'utilisateurs (par role)
- Nombre total de jeux (publies / brouillons)
- Nombre total de sessions jouees
- Activite recente

#### Gestion des utilisateurs (`/admin/users`)
- Tableau des utilisateurs : nom, email, role, date d'inscription, derniere connexion
- Actions par utilisateur :
  - Changer le role (participant ↔ formateur ↔ admin)
  - Desactiver/reactiver un compte
  - Supprimer un compte
- Bouton "Inviter un utilisateur"

#### Configuration (`/admin/settings`)
- Nom de l'application
- Logo personnalise
- Categories par defaut pour les nouveaux jeux
- Parametres de carte par defaut

---

## 6. Guide d'Implementation

### Phase 1 : Base existante (actuel - fait)

L'application actuelle fonctionne deja avec :
- [x] Creation/edition/suppression de jeux
- [x] Deux types de jeux (categorie et vrai/faux)
- [x] Gestion des cartes (ajout, edition, suppression)
- [x] Gestion des categories
- [x] Champs personnalises (texte, nombre, select, rating)
- [x] Mode jeu digital avec animation flip et scoring
- [x] Export PDF avec rectos/versos et reperes de decoupe
- [x] Persistance localStorage
- [x] Deploiement GitHub Pages

**Fichiers existants :**

| Fichier | Role |
|---------|------|
| `src/types/index.ts` | Types TypeScript (Game, Card, Category, etc.) |
| `src/store/useGameStore.ts` | Store Zustand avec CRUD complet |
| `src/App.tsx` | Routing (6 routes) |
| `src/components/Layout.tsx` | Header et navigation |
| `src/components/GameList.tsx` | Page d'accueil - liste des jeux |
| `src/components/GameEditor.tsx` | Edition de jeu (4 onglets) |
| `src/components/CardEditor.tsx` | Edition de carte recto/verso |
| `src/components/CardPlayer.tsx` | Mode jeu interactif |
| `src/components/PdfExport.tsx` | Configuration et export PDF |
| `src/utils/pdfGenerator.ts` | Generation PDF (jsPDF) |
| `src/index.css` | Styles complets (~1300 lignes) |

### Phase 2 : Systeme d'authentification

#### 2.1 Ajouter les types utilisateur

```typescript
// Dans types/index.ts - ajouter :

export type UserRole = 'participant' | 'formateur' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string;
}
```

#### 2.2 Creer le store d'authentification

Creer `src/store/useAuthStore.ts` :

```typescript
// Store Zustand avec persistance
// Fonctions :
// - register(email, name, password, role) → creer un compte
// - login(email, password) → authentifier
// - logout() → deconnecter
// - getCurrentUser() → utilisateur connecte
// - hasPermission(permission) → verifier les droits
//
// Le premier utilisateur inscrit recoit automatiquement le role 'admin'
// Les suivants recoivent 'participant' par defaut
//
// Note : en version localStorage, le hash du mot de passe
// utilise une fonction simple (pas securise pour la production).
// Pour une version production, utiliser un backend avec bcrypt.
```

#### 2.3 Creer le composant de route protegee

Creer `src/components/ProtectedRoute.tsx` :

```typescript
// Composant wrapper qui :
// 1. Verifie si l'utilisateur est connecte
// 2. Verifie si son role est autorise
// 3. Redirige vers /login si non connecte
// 4. Affiche "Acces refuse" si role insuffisant
//
// Utilisation :
// <ProtectedRoute roles={['formateur', 'admin']}>
//   <GameEditor />
// </ProtectedRoute>
```

#### 2.4 Creer les formulaires auth

Creer `src/components/auth/LoginForm.tsx` et `RegisterForm.tsx` :
- Formulaire de connexion : email + mot de passe
- Formulaire d'inscription : nom + email + mot de passe + confirmation
- Validation des champs
- Messages d'erreur

#### 2.5 Modifier le Layout

Modifier `src/components/Layout.tsx` :
- Ajouter le nom de l'utilisateur connecte dans le header
- Menu deroulant : Mon profil, Deconnexion
- Liens de navigation selon le role :
  - Participant : "Jeux disponibles", "Mes scores"
  - Formateur : "Mes jeux", "Jeux disponibles"
  - Admin : "Mes jeux", "Utilisateurs", "Configuration"

### Phase 3 : Adaptation des vues par role

#### 3.1 Vue Participant

Modifier `src/components/GameList.tsx` → `src/components/participant/GameCatalog.tsx` :
- Afficher uniquement les jeux ou `isPublished === true`
- Retirer les boutons d'edition, suppression, duplication
- Garder uniquement le bouton "Jouer"
- Ajouter un filtre par type de jeu

Creer `src/components/participant/MyScores.tsx` :
- Lister les GameSession de l'utilisateur connecte
- Trier par date (plus recent en premier)
- Afficher : nom du jeu, date, score (%), bonnes reponses / total

#### 3.2 Vue Formateur

Les composants existants servent de base. Modifications :
- `GameList.tsx` : filtrer par `ownerId === currentUser.id`
- `GameEditor.tsx` : ajouter le toggle "Publier" dans l'onglet Parametres
- `CardEditor.tsx` : aucune modification structurelle necessaire

Creer `src/components/formateur/GameStats.tsx` :
- Pour chaque jeu du formateur :
  - Nombre de sessions jouees
  - Score moyen
  - Distribution des scores
  - Cartes les plus echouees

#### 3.3 Vue Admin

Creer `src/components/admin/UserManager.tsx` :
- Tableau des utilisateurs
- CRUD utilisateurs
- Changement de roles

Creer `src/components/admin/Dashboard.tsx` :
- Compteurs (utilisateurs, jeux, sessions)
- Graphiques simples si souhaite

### Phase 4 : Historique des sessions

#### 4.1 Creer le store de sessions

Creer `src/store/useSessionStore.ts` :

```typescript
// Store Zustand avec persistance
// Fonctions :
// - startSession(gameId, userId) → creer une session
// - recordAnswer(sessionId, cardId, answer, correctAnswer) → enregistrer une reponse
// - completeSession(sessionId) → terminer et calculer le score
// - getUserSessions(userId) → historique d'un utilisateur
// - getGameSessions(gameId) → toutes les sessions d'un jeu
```

#### 4.2 Modifier le CardPlayer

Modifier `src/components/CardPlayer.tsx` :
- A chaque reponse, appeler `recordAnswer()`
- En fin de partie, appeler `completeSession()`
- Stocker le detail de chaque reponse pour le review

### Phase 5 : Ameliorations de l'edition des cartes

#### 5.1 Edition inline depuis la liste

Dans l'onglet Cartes de `GameEditor.tsx`, permettre :
- Clic sur une carte → navigation vers `CardEditor` avec les donnees pre-remplies
- Le CardEditor detecte s'il s'agit d'une creation (`/card/new`) ou edition (`/card/:id`)
- En mode edition, le formulaire est pre-rempli avec les valeurs existantes
- Le bouton affiche "Sauvegarder" au lieu de "Creer"

> Note : cette fonctionnalite existe deja dans le code actuel.
> Le CardEditor verifie la presence de `cardId` dans les parametres d'URL
> et charge les donnees correspondantes pour l'edition.

#### 5.2 Duplication de carte

Ajouter un bouton "Dupliquer" sur chaque carte dans la liste :
- Copie tous les champs de la carte
- Ajoute " (copie)" a l'enonce
- Place la copie juste apres l'original

#### 5.3 Import/export de cartes

Fonctionnalite future :
- Export des cartes en JSON ou CSV
- Import depuis un fichier JSON/CSV
- Utile pour creer des jeux a partir de tableurs

---

## 7. Mise a jour du Routing

```typescript
// App.tsx - Routes avec protection par role

// --- Routes publiques ---
// /login              → LoginForm
// /register           → RegisterForm

// --- Routes Participant (tous les connectes) ---
// /games              → GameCatalog (jeux publies)
// /games/:id/play     → CardPlayer
// /scores             → MyScores

// --- Routes Formateur ---
// /formateur/games              → GameList (mes jeux)
// /formateur/games/:id          → GameEditor
// /formateur/games/:id/card/new → CardEditor (creation)
// /formateur/games/:id/card/:cardId → CardEditor (edition)
// /formateur/games/:id/export   → PdfExport
// /formateur/games/:id/stats    → GameStats

// --- Routes Admin ---
// /admin              → Dashboard
// /admin/users        → UserManager
// /admin/settings     → AppSettings
```

---

## 8. Generation PDF - Details Techniques

### 8.1 Fonctionnement actuel

Le generateur PDF (`src/utils/pdfGenerator.ts`) utilise jsPDF pour dessiner les cartes directement en coordonnees sur un document A4 (210 x 297 mm).

**Recto d'une carte :**
1. Bordure arrondie (roundedRect)
2. Barre de couleur en haut (couleur primaire du jeu)
3. Label du type de jeu ("CATEGORISER" ou "VRAI OU FAUX ?")
4. Numero de carte (#1, #2, etc.)
5. Texte de l'enonce avec retour a la ligne automatique
6. Champs personnalises en bas de carte
7. Noms des categories en pied de carte (jeux categorisation)

**Verso d'une carte :**
1. Bordure arrondie
2. Barre de couleur (couleur secondaire)
3. Label "REPONSE"
4. Badge colore de la reponse (categorie ou vrai/faux)
5. Section "Explication" avec texte
6. Section "Feedback" avec texte
7. Champs personnalises (ceux configures "visible au verso")
8. Nom du jeu en pied de carte

### 8.2 Alignement recto-verso

Les versos sont imposes en miroir horizontal par rapport aux rectos. Cela permet, quand on imprime en recto-verso et qu'on decoupe, que chaque verso soit bien derriere son recto correspondant.

### 8.3 Reperes de decoupe

Des lignes fines (0.1mm, gris clair) sont tracees autour de la grille de cartes pour guider la decoupe au massicot ou au cutter.

---

## 9. Styles et UI

### 9.1 Design system actuel

L'application utilise un design system CSS epure base sur des variables CSS :

```css
--color-bg: #f8fafc         /* fond de page */
--color-surface: #ffffff     /* fond des cartes/panneaux */
--color-border: #e2e8f0      /* bordures */
--color-text: #1e293b        /* texte principal */
--color-primary: #2563eb     /* actions principales */
--color-danger: #ef4444      /* suppression/erreur */
--color-success: #22c55e     /* succes/vrai */
--color-warning: #f59e0b     /* etoiles/avertissement */
```

### 9.2 Composants CSS notables

- **Flip card** : animation 3D CSS avec `perspective`, `transform-style: preserve-3d`, `backface-visibility: hidden` et `rotateY(180deg)`
- **Score circle** : `conic-gradient` pour le cercle de pourcentage en fin de partie
- **Rating stars** : boutons stylises avec toggle actif/inactif
- **Responsive** : media queries pour mobile (< 640px) et tablette (< 768px)

---

## 10. Considerations pour la Production

### 10.1 Limites de la version localStorage

La version actuelle stocke tout dans le localStorage du navigateur :
- Les donnees sont liees a un seul navigateur
- Pas de partage entre utilisateurs
- Limite de stockage (~5-10 MB)
- Pas de securite reelle pour l'authentification

### 10.2 Evolution vers un backend (futur)

Pour une version multi-utilisateurs reelle, il faudrait :

| Composant | Option recommandee | Alternative |
|-----------|-------------------|-------------|
| Backend | Supabase (BaaS) | Node.js + Express |
| Base de donnees | PostgreSQL (via Supabase) | SQLite |
| Authentification | Supabase Auth | JWT maison |
| Stockage fichiers | Supabase Storage | S3 |
| Hebergement | Vercel / Netlify | VPS |

Supabase est recommande car :
- Gratuit pour les petits projets
- PostgreSQL inclus
- Authentification integree
- API REST auto-generee
- Compatible avec le frontend React existant

### 10.3 Migration localStorage → Supabase

Les stores Zustand actuels n'auraient besoin que de remplacer les appels `set()` par des appels API Supabase. La structure des composants React resterait identique.

---

## 11. Recapitulatif des Fichiers a Creer/Modifier

### Fichiers a creer

| Fichier | Description |
|---------|-------------|
| `src/store/useAuthStore.ts` | Store d'authentification |
| `src/store/useSessionStore.ts` | Store des sessions de jeu |
| `src/components/ProtectedRoute.tsx` | Garde de route par role |
| `src/components/auth/LoginForm.tsx` | Formulaire de connexion |
| `src/components/auth/RegisterForm.tsx` | Formulaire d'inscription |
| `src/components/participant/GameCatalog.tsx` | Catalogue de jeux (participant) |
| `src/components/participant/MyScores.tsx` | Historique des scores |
| `src/components/formateur/GameStats.tsx` | Statistiques d'un jeu |
| `src/components/admin/Dashboard.tsx` | Tableau de bord admin |
| `src/components/admin/UserManager.tsx` | Gestion des utilisateurs |
| `src/components/admin/AppSettings.tsx` | Configuration application |
| `src/hooks/usePermissions.ts` | Hook de verification des droits |

### Fichiers a modifier

| Fichier | Modifications |
|---------|--------------|
| `src/types/index.ts` | Ajouter User, UserRole, GameSession, SessionAnswer, isPublished |
| `src/store/useGameStore.ts` | Ajouter filtrage par owner, isPublished |
| `src/App.tsx` | Reorganiser les routes par role avec ProtectedRoute |
| `src/components/Layout.tsx` | Menu utilisateur, navigation par role |
| `src/components/CardPlayer.tsx` | Enregistrement des sessions de jeu |
| `src/components/GameEditor.tsx` | Toggle publication, bouton dupliquer carte |
| `src/index.css` | Styles pour auth, admin, scores |
