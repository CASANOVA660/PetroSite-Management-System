const { google } = require('googleapis');
const readline = require('readline');
const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement depuis le fichier .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Utiliser les informations d'identification depuis le fichier .env
const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Générer l'URL à visiter dans le navigateur
// Inclure les scopes nécessaires pour Google Calendar et Google Meet
const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Force à afficher l'écran de consentement pour obtenir un refresh_token
    scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.settings.readonly',
        'https://www.googleapis.com/auth/calendar.events.readonly'
    ]
});

console.log('Autorisez cette application en visitant cette URL:\n', authUrl);

// Demander à l'utilisateur de coller le code du navigateur
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('\nEntrez le code de la page ici: ', async (code) => {
    rl.close();
    try {
        const { tokens } = await oAuth2Client.getToken(code);
        console.log('\n✅ Tokens récupérés avec succès!');
        console.log('🔑 Refresh Token:', tokens.refresh_token);
        console.log('💡 Vous pouvez maintenant sauvegarder ceci dans votre fichier .env en tant que GOOGLE_REFRESH_TOKEN');

        // Instructions supplémentaires
        console.log('\n📝 Instructions:');
        console.log('1. Copiez le refresh token ci-dessus');
        console.log('2. Ajoutez-le à votre fichier .env:');
        console.log(`   GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);

        // Si un access token est également présent
        if (tokens.access_token) {
            console.log('\n🔐 Access Token (expire après une heure):', tokens.access_token);
        }

        // Information sur l'expiration
        if (tokens.expiry_date) {
            console.log('\n⏰ Token expire le:', new Date(tokens.expiry_date).toLocaleString());
        }
    } catch (error) {
        console.error('❌ Erreur lors de la récupération du token d\'accès', error);
    }
}); 