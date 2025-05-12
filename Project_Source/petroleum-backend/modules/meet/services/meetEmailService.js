const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const dotenv = require('dotenv');
const logger = require('../../../utils/logger');

dotenv.config();

// Configuration du transporteur avec les mêmes informations que l'emailService existant
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    },
    debug: true
});

// Configuration de l'API Google Calendar
const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Fonction pour décoder un token si nécessaire
const setGoogleCalendarCredentials = () => {
    if (process.env.GOOGLE_REFRESH_TOKEN) {
        oAuth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });
        return true;
    }
    logger.warn('Google Calendar refresh token not set in environment variables');
    return false;
};

/**
 * Crée un événement dans Google Calendar et retourne l'ID de l'événement
 * @param {Object} meetData - Données de la réunion
 * @returns {Promise<string|null>} ID de l'événement Google Calendar
 */
const createGoogleCalendarEvent = async (meetData) => {
    try {
        if (!setGoogleCalendarCredentials()) {
            logger.warn('Google Calendar credentials not set');
            return null;
        }

        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

        // Préparation des attendees (participants)
        const attendees = [];

        // Ajout des participants internes avec leur adresse email
        if (meetData.participants && meetData.participants.length > 0) {
            for (const participant of meetData.participants) {
                if (participant.email) {
                    attendees.push({
                        email: participant.email,
                        responseStatus: 'needsAction'
                    });
                }
            }
        }

        // Ajout des participants externes
        if (meetData.externalParticipants && meetData.externalParticipants.length > 0) {
            for (const external of meetData.externalParticipants) {
                attendees.push({
                    email: external.email,
                    displayName: external.name,
                    responseStatus: 'needsAction'
                });
            }
        }

        // Calcul de la date de fin (date de début + durée)
        const startDateTime = new Date(meetData.date);
        const endDateTime = new Date(startDateTime.getTime() + (meetData.duration * 60000));

        // Création de l'événement
        const event = {
            summary: meetData.title,
            description: meetData.description || '',
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: 'Europe/Paris', // À adapter selon la timezone de l'application
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: 'Europe/Paris', // À adapter selon la timezone de l'application
            },
            attendees: attendees,
            conferenceData: {
                createRequest: {
                    requestId: `meet-${Date.now()}`,
                    conferenceSolutionKey: {
                        type: 'hangoutsMeet'
                    }
                }
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 }, // 1 jour avant
                    { method: 'popup', minutes: 30 }, // 30 minutes avant
                ],
            },
        };

        // Si un projet est associé, ajouter son nom dans la description
        if (meetData.projectName) {
            event.description += `\n\nProjet: ${meetData.projectName}`;
        }

        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            conferenceDataVersion: 1,
            sendNotifications: true
        });

        logger.info(`Event created: ${response.data.htmlLink}`);
        return {
            calendarEventId: response.data.id,
            meetLink: response.data.hangoutLink || null
        };
    } catch (error) {
        logger.error(`Error creating Google Calendar event: ${error.message}`);
        return null;
    }
};

/**
 * Envoie un email d'invitation à la réunion
 * @param {Object} meetData - Données de la réunion
 * @param {Array} recipients - Liste des destinataires
 * @returns {Promise<boolean>} - Succès de l'envoi
 */
const sendMeetingInvitation = async (meetData, recipients) => {
    try {
        const meetingDate = new Date(meetData.date).toLocaleString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const duration = meetData.duration ? `${meetData.duration} minutes` : '1 heure';

        // Construction du HTML pour l'email
        const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4A90E2;">Invitation à une réunion: ${meetData.title}</h2>
        <p>Vous êtes invité(e) à participer à une réunion.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Date:</strong> ${meetingDate}</p>
          <p><strong>Durée:</strong> ${duration}</p>
          ${meetData.description ? `<p><strong>Description:</strong> ${meetData.description}</p>` : ''}
          ${meetData.projectName ? `<p><strong>Projet:</strong> ${meetData.projectName}</p>` : ''}
        </div>
        
        ${meetData.meetLink ? `
          <p style="margin: 20px 0;">
            <a href="${meetData.meetLink}" 
               style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Rejoindre la réunion
            </a>
          </p>
        ` : ''}
        
        <p>Les détails de cette réunion ont également été ajoutés à votre calendrier Google.</p>
        
        <p style="font-size: 12px; color: #777; margin-top: 30px;">
          Ce message est automatique, merci de ne pas y répondre directement.
        </p>
      </div>
    `;

        const mailOptions = {
            from: `"PetroConnect" <${process.env.EMAIL_USER}>`,
            to: recipients.join(', '),
            subject: `Invitation à une réunion: ${meetData.title}`,
            html: htmlContent,
            headers: {
                'X-Priority': '1', // Haute priorité
                'X-MSMail-Priority': 'High',
                'Importance': 'High'
            }
        };

        // Ajout de l'invitation au calendrier (format iCal) comme pièce jointe
        if (meetData.icalEvent) {
            mailOptions.icalEvent = {
                method: 'REQUEST',
                content: meetData.icalEvent
            };
        }

        const info = await transporter.sendMail(mailOptions);
        logger.info(`Meeting invitation email sent: ${info.messageId}`);
        return true;
    } catch (error) {
        logger.error(`Error sending meeting invitation email: ${error.message}`);
        return false;
    }
};

/**
 * Envoie un email de notification pour les modifications de réunion
 * @param {Object} meetData - Données de la réunion
 * @param {Array} recipients - Liste des destinataires
 * @param {string} type - Type de notification (update, cancel)
 * @returns {Promise<boolean>} - Succès de l'envoi
 */
const sendMeetingUpdateNotification = async (meetData, recipients, type = 'update') => {
    try {
        const meetingDate = new Date(meetData.date).toLocaleString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        let subject, headerText, actionText;

        if (type === 'cancel') {
            subject = `Annulation de réunion: ${meetData.title}`;
            headerText = 'Annulation de réunion';
            actionText = 'La réunion suivante a été annulée:';
        } else {
            subject = `Mise à jour de réunion: ${meetData.title}`;
            headerText = 'Mise à jour de réunion';
            actionText = 'Les détails de la réunion suivante ont été mis à jour:';
        }

        const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4A90E2;">${headerText}: ${meetData.title}</h2>
        <p>${actionText}</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Date:</strong> ${meetingDate}</p>
          ${meetData.description ? `<p><strong>Description:</strong> ${meetData.description}</p>` : ''}
          ${meetData.projectName ? `<p><strong>Projet:</strong> ${meetData.projectName}</p>` : ''}
        </div>
        
        ${type !== 'cancel' && meetData.meetLink ? `
          <p style="margin: 20px 0;">
            <a href="${meetData.meetLink}" 
               style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Rejoindre la réunion
            </a>
          </p>
        ` : ''}
        
        <p>Votre calendrier Google a été mis à jour automatiquement.</p>
        
        <p style="font-size: 12px; color: #777; margin-top: 30px;">
          Ce message est automatique, merci de ne pas y répondre directement.
        </p>
      </div>
    `;

        const mailOptions = {
            from: `"PetroConnect" <${process.env.EMAIL_USER}>`,
            to: recipients.join(', '),
            subject: subject,
            html: htmlContent
        };

        // Ajout de l'invitation au calendrier mise à jour
        if (meetData.icalEvent) {
            mailOptions.icalEvent = {
                method: type === 'cancel' ? 'CANCEL' : 'REQUEST',
                content: meetData.icalEvent
            };
        }

        const info = await transporter.sendMail(mailOptions);
        logger.info(`Meeting ${type} notification email sent: ${info.messageId}`);
        return true;
    } catch (error) {
        logger.error(`Error sending meeting ${type} notification email: ${error.message}`);
        return false;
    }
};

// Test de la configuration SMTP au démarrage
(async () => {
    try {
        await transporter.verify();
        logger.info('SMTP connection for meeting emails successful');
    } catch (error) {
        logger.error(`SMTP connection error for meeting emails: ${error.message}`);
    }
})();

module.exports = {
    createGoogleCalendarEvent,
    sendMeetingInvitation,
    sendMeetingUpdateNotification
}; 