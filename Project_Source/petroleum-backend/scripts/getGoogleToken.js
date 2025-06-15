const { google } = require('googleapis');
const readline = require('readline');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Check if required environment variables are set
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
    console.error('Error: Missing required environment variables.');
    console.error('Please make sure the following variables are set in your .env file:');
    console.error('- GOOGLE_CLIENT_ID');
    console.error('- GOOGLE_CLIENT_SECRET');
    console.error('- GOOGLE_REDIRECT_URI');
    process.exit(1);
}

// Configure OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Define scopes needed for Google Calendar and Meet
const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
];

// Generate authorization URL
const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Force to get refresh token
});

console.log('=== Google OAuth2 Token Generator ===');
console.log('\n1. Visit the following URL in your browser:');
console.log('\n' + authUrl + '\n');
console.log('2. Log in with your Google account and authorize the application');
console.log('3. You will be redirected to a page with a code in the URL');
console.log('4. Copy that code and paste it below\n');

// Get authorization code from user
rl.question('Enter the authorization code: ', async (code) => {
    try {
        // Exchange code for tokens
        const { tokens } = await oAuth2Client.getToken(code);

        console.log('\n=== Success! ===\n');
        console.log('Your refresh token is:');
        console.log('\n' + tokens.refresh_token + '\n');
        console.log('Add this token to your .env file as GOOGLE_REFRESH_TOKEN');

        if (!tokens.refresh_token) {
            console.warn('\nWARNING: No refresh token was returned!');
            console.warn('This usually happens when:');
            console.warn('1. You\'ve already generated a token for this client/user combination');
            console.warn('2. You didn\'t include "prompt: consent" in the authorization URL');
            console.warn('\nTry revoking access at https://myaccount.google.com/permissions and run this script again');
        }
    } catch (error) {
        console.error('\nError getting tokens:', error.message);
        if (error.response && error.response.data) {
            console.error('API Error Details:', error.response.data);
        }
    } finally {
        rl.close();
    }
}); 