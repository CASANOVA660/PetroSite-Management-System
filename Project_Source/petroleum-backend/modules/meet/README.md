# Module Meet pour PetroConnect

Ce module gère l'intégration avec Google Meet et Google Calendar pour la création et la gestion des réunions dans l'application PetroConnect.

## Fonctionnalités

- Création de réunions avec génération automatique de liens Google Meet
- Envoi d'invitations par email aux participants
- Ajout d'événements dans Google Calendar avec notifications
- Gestion complète des réunions (CRUD)
- Support pour les notes et pièces jointes de réunion
- Routes spécifiques pour les réunions liées à des projets

## Configuration requise

### 1. Installation des dépendances

Assurez-vous que les dépendances suivantes sont installées:

```bash
npm install googleapis nodemailer
```

### 2. Configuration de l'API Google

Pour utiliser ce module, vous devez configurer les informations d'authentification Google API dans votre fichier `.env`:

```env
# Google API credentials
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
GOOGLE_REFRESH_TOKEN=your_refresh_token_here
```

### 3. Obtention du GOOGLE_REFRESH_TOKEN

Pour obtenir un `GOOGLE_REFRESH_TOKEN`, suivez les étapes ci-dessous:

#### 3.1. Créer un projet sur Google Cloud Console

1. Accédez à la [Console Google Cloud](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google Calendar dans le menu "Bibliothèque API"

#### 3.2. Configurer OAuth 2.0

1. Dans le menu, allez à "APIs & Services" > "Credentials"
2. Cliquez sur "Create Credentials" > "OAuth client ID"
3. Sélectionnez "Web application" comme type d'application
4. Donnez un nom à votre application
5. Ajoutez `http://localhost:5000/api/auth/google/callback` dans les URIs de redirection autorisés
6. Cliquez sur "Create" et notez votre Client ID et Client Secret

#### 3.3. Utiliser le script pour obtenir le Refresh Token

Un script `getGoogleToken.js` est fourni dans le dossier `scripts` du projet. Exécutez-le avec la commande suivante:

```bash
node scripts/getGoogleToken.js
```

Suivez les instructions affichées:
1. Copiez l'URL générée et ouvrez-la dans votre navigateur
2. Connectez-vous avec votre compte Google et autorisez l'application
3. Vous serez redirigé vers une URL avec un code dans les paramètres
4. Copiez ce code et collez-le dans le terminal lorsque demandé
5. Le script affichera votre Refresh Token
6. Ajoutez ce token dans votre fichier `.env` comme `GOOGLE_REFRESH_TOKEN`

## Structure du module

```
modules/meet/
├── controllers/
│   └── meetController.js
├── models/
│   └── meet.model.js
├── routes/
│   ├── meetRoutes.js
│   └── projectMeetRoutes.js
├── services/
│   ├── meetService.js
│   └── meetEmailService.js
└── index.js
```

## API Endpoints

### Réunions générales

- `POST /api/meetings` - Créer une nouvelle réunion
- `GET /api/meetings` - Récupérer les réunions de l'utilisateur connecté
- `GET /api/meetings/:id` - Récupérer une réunion par son ID
- `PUT /api/meetings/:id` - Mettre à jour une réunion
- `DELETE /api/meetings/:id` - Supprimer une réunion
- `PATCH /api/meetings/:id/cancel` - Annuler une réunion
- `POST /api/meetings/:id/generate-meet-link` - Générer un lien Google Meet
- `POST /api/meetings/:id/notes` - Ajouter une note à une réunion
- `POST /api/meetings/:id/attachments` - Ajouter une pièce jointe à une réunion

### Réunions liées aux projets

- `GET /api/projects/:projectId/meetings` - Récupérer les réunions d'un projet

## Dépannage

### Problèmes d'authentification Google

Si vous rencontrez des problèmes d'authentification avec l'API Google:

1. Vérifiez que les URIs de redirection dans Google Cloud Console correspondent exactement à votre configuration
2. Assurez-vous que les API nécessaires sont activées (Google Calendar API)
3. Vérifiez que le Refresh Token n'est pas expiré (les Refresh Tokens peuvent expirer si non utilisés pendant une longue période)
4. Si le Refresh Token ne fonctionne pas, générez-en un nouveau avec le script `getGoogleToken.js`

### Problèmes d'envoi d'emails

Si les emails ne sont pas envoyés correctement:

1. Vérifiez que vos informations SMTP sont correctes dans le fichier `.env`
2. Assurez-vous que l'adresse email utilisée autorise l'accès aux applications moins sécurisées ou utilise un mot de passe d'application

## Contribution

Pour contribuer à ce module, veuillez suivre les conventions de code existantes et ajouter des tests pour les nouvelles fonctionnalités. 