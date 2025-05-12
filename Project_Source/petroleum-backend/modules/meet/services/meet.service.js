const Meeting = require('../models/meet.model');
const { google } = require('googleapis');
const { OAuth2 } = google.auth;
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const logger = require('../../../utils/logger');

dotenv.config();

// Configure email transporter
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

// Configure Google OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Set credentials if refresh token exists
const setGoogleCalendarCredentials = () => {
    if (process.env.GOOGLE_REFRESH_TOKEN) {
        oAuth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });
        return true;
    }
    return false;
};

class MeetingService {
    /**
     * Get all meetings
     */
    async getAllMeetings() {
        return await Meeting.find()
            .populate('creator', 'firstName lastName email profilePicture')
            .populate('participants', 'firstName lastName email profilePicture')
            .populate('projectId', 'name');
    }

    /**
     * Get upcoming meetings
     */
    async getUpcomingMeetings() {
        const now = new Date();
        return await Meeting.find({ date: { $gte: now } })
            .sort({ date: 1 })
            .populate('creator', 'firstName lastName email profilePicture')
            .populate('participants', 'firstName lastName email profilePicture')
            .populate('projectId', 'name');
    }

    /**
     * Get past meetings
     */
    async getPastMeetings() {
        const now = new Date();
        return await Meeting.find({ date: { $lt: now } })
            .sort({ date: -1 })
            .populate('creator', 'firstName lastName email profilePicture')
            .populate('participants', 'firstName lastName email profilePicture')
            .populate('projectId', 'name');
    }

    /**
     * Get meeting by ID
     */
    async getMeetingById(id) {
        return await Meeting.findById(id)
            .populate('creator', 'firstName lastName email profilePicture')
            .populate('participants', 'firstName lastName email profilePicture')
            .populate('projectId', 'name');
    }

    /**
     * Create a new meeting
     */
    async createMeeting(meetingData) {
        try {
            // Generate Google Meet link through Calendar API
            const calendarResult = await this.createGoogleCalendarEvent(meetingData);

            if (calendarResult) {
                meetingData.meetLink = calendarResult.meetLink || meetingData.meetLink;
                meetingData.calendarEventId = calendarResult.calendarEventId;
                meetingData.calendarLink = calendarResult.htmlLink;
            } else if (!meetingData.meetLink) {
                // Fallback if Google Calendar integration fails
                meetingData.meetLink = `https://meet.google.com/${Math.random().toString(36).substring(2, 10)}`;
            }

            const meeting = new Meeting(meetingData);
            await meeting.save();

            const populatedMeeting = await Meeting.findById(meeting._id)
                .populate('creator', 'firstName lastName email profilePicture')
                .populate('participants', 'firstName lastName email profilePicture')
                .populate('projectId', 'name');

            // Send email notifications to participants
            await this.sendMeetingInvitations(populatedMeeting);

            return populatedMeeting;
        } catch (error) {
            logger.error(`Error creating meeting: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update a meeting
     */
    async updateMeeting(id, updateData) {
        try {
            const meeting = await Meeting.findById(id)
                .populate('creator', 'firstName lastName email profilePicture')
                .populate('participants', 'firstName lastName email profilePicture')
                .populate('projectId', 'name');

            if (!meeting) {
                return null;
            }

            // Update Google Calendar event if it exists
            if (meeting.calendarEventId) {
                await this.updateGoogleCalendarEvent(meeting.calendarEventId, {
                    ...meeting.toObject(),
                    ...updateData
                });
            }

            const updatedMeeting = await Meeting.findByIdAndUpdate(id, updateData, { new: true })
                .populate('creator', 'firstName lastName email profilePicture')
                .populate('participants', 'firstName lastName email profilePicture')
                .populate('projectId', 'name');

            // Send update notifications to participants if significant changes
            if (updateData.date || updateData.title || updateData.meetLink) {
                await this.sendMeetingUpdateNotifications(updatedMeeting);
            }

            return updatedMeeting;
        } catch (error) {
            logger.error(`Error updating meeting: ${error.message}`);
            throw error;
        }
    }

    /**
     * Delete a meeting
     */
    async deleteMeeting(id) {
        try {
            const meeting = await Meeting.findById(id)
                .populate('creator', 'firstName lastName email profilePicture')
                .populate('participants', 'firstName lastName email profilePicture');

            if (!meeting) {
                return null;
            }

            // Delete from Google Calendar if event exists
            if (meeting.calendarEventId) {
                await this.removeFromGoogleCalendar(meeting.calendarEventId);
            }

            // Send cancellation notifications
            await this.sendMeetingCancellationNotifications(meeting);

            return await Meeting.findByIdAndDelete(id);
        } catch (error) {
            logger.error(`Error deleting meeting: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create Google Calendar event and get Meet link
     */
    async createGoogleCalendarEvent(meetingData) {
        try {
            if (!setGoogleCalendarCredentials()) {
                logger.warn('Google Calendar credentials not set');
                return null;
            }

            const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

            // Prepare attendees list
            const attendees = [];

            // Add internal participants
            if (meetingData.participants && meetingData.participants.length > 0) {
                for (const participantId of meetingData.participants) {
                    // If we have the participant as a populated object
                    if (typeof participantId === 'object' && participantId.email) {
                        attendees.push({
                            email: participantId.email,
                            responseStatus: 'needsAction'
                        });
                    } else if (typeof participantId === 'string') {
                        // If we just have the ID, try to find the user
                        try {
                            const User = require('../../users/models/User');
                            const user = await User.findById(participantId);
                            if (user && user.email) {
                                attendees.push({
                                    email: user.email,
                                    responseStatus: 'needsAction'
                                });
                            }
                        } catch (err) {
                            logger.warn(`Could not resolve participant email: ${err.message}`);
                        }
                    }
                }
            }

            // Add external participants
            if (meetingData.externalParticipants && meetingData.externalParticipants.length > 0) {
                for (const external of meetingData.externalParticipants) {
                    if (external.email) {
                        attendees.push({
                            email: external.email,
                            displayName: external.name,
                            responseStatus: 'needsAction'
                        });
                    }
                }
            }

            // Calculate end time based on duration
            const startDateTime = new Date(meetingData.date);
            const endDateTime = new Date(startDateTime.getTime() + (meetingData.duration || 60) * 60000);

            // Prepare project name if available
            let projectName = '';
            if (meetingData.projectId) {
                if (typeof meetingData.projectId === 'object' && meetingData.projectId.name) {
                    projectName = meetingData.projectId.name;
                } else if (typeof meetingData.projectId === 'string') {
                    // Try to fetch project name if we only have the ID
                    try {
                        const Project = require('../../projects/models/Project');
                        const project = await Project.findById(meetingData.projectId);
                        if (project) {
                            projectName = project.name;
                        }
                    } catch (err) {
                        logger.warn(`Could not resolve project name: ${err.message}`);
                    }
                }
            }

            // Create event configuration
            const event = {
                summary: meetingData.title,
                description: meetingData.description + (projectName ? `\n\nProjet: ${projectName}` : ''),
                start: {
                    dateTime: startDateTime.toISOString(),
                    timeZone: 'Europe/Paris',
                },
                end: {
                    dateTime: endDateTime.toISOString(),
                    timeZone: 'Europe/Paris',
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
                        { method: 'email', minutes: 24 * 60 }, // 1 day before
                        { method: 'popup', minutes: 30 }, // 30 minutes before
                    ],
                },
                // Add this to make sure Google Calendar creates a fully-functional event
                guestsCanSeeOtherGuests: true,
                guestsCanInviteOthers: false,
                guestsCanModify: false,
                transparency: 'opaque',
                visibility: 'default'
            };

            logger.info(`Creating Google Calendar event with ${attendees.length} attendees`);

            const response = await calendar.events.insert({
                calendarId: 'primary',
                resource: event,
                conferenceDataVersion: 1,
                sendNotifications: false, // We'll handle notifications ourselves
                supportsAttachments: true
            });

            logger.info(`Google Calendar event created: ${response.data.htmlLink}`);

            if (!response.data.hangoutLink) {
                logger.warn('Google Meet link was not generated for the event');
            }

            return {
                calendarEventId: response.data.id,
                meetLink: response.data.hangoutLink || null,
                htmlLink: response.data.htmlLink || null
            };
        } catch (error) {
            logger.error(`Error creating Google Calendar event: ${error.message}`);
            if (error.errors) {
                logger.error(`Google API errors: ${JSON.stringify(error.errors)}`);
            }
            return null;
        }
    }

    /**
     * Update Google Calendar event
     */
    async updateGoogleCalendarEvent(eventId, meetingData) {
        try {
            if (!setGoogleCalendarCredentials()) {
                logger.warn('Google Calendar credentials not set');
                return false;
            }

            const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

            // Get existing event
            const existingEvent = await calendar.events.get({
                calendarId: 'primary',
                eventId: eventId
            });

            if (!existingEvent.data) {
                logger.warn(`Event ${eventId} not found in Google Calendar`);
                return false;
            }

            // Calculate end time based on duration
            const startDateTime = new Date(meetingData.date);
            const endDateTime = new Date(startDateTime.getTime() + (meetingData.duration || 60) * 60000);

            // Update event properties
            const updatedEvent = {
                summary: meetingData.title,
                description: meetingData.description,
                start: {
                    dateTime: startDateTime.toISOString(),
                    timeZone: 'Europe/Paris',
                },
                end: {
                    dateTime: endDateTime.toISOString(),
                    timeZone: 'Europe/Paris',
                },
            };

            // Update the event
            await calendar.events.patch({
                calendarId: 'primary',
                eventId: eventId,
                resource: updatedEvent,
                sendUpdates: 'none' // We'll handle notifications ourselves
            });

            logger.info(`Google Calendar event updated: ${eventId}`);
            return true;
        } catch (error) {
            logger.error(`Error updating Google Calendar event: ${error.message}`);
            return false;
        }
    }

    /**
     * Remove event from Google Calendar
     */
    async removeFromGoogleCalendar(eventId) {
        try {
            if (!setGoogleCalendarCredentials()) {
                logger.warn('Google Calendar credentials not set');
                return false;
            }

            const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

            await calendar.events.delete({
                calendarId: 'primary',
                eventId: eventId,
                sendUpdates: 'none' // We'll handle notifications ourselves
            });

            logger.info(`Google Calendar event deleted: ${eventId}`);
            return true;
        } catch (error) {
            logger.error(`Error deleting Google Calendar event: ${error.message}`);
            return false;
        }
    }

    /**
     * Send meeting invitations to all participants
     */
    async sendMeetingInvitations(meeting) {
        try {
            const recipients = this.collectParticipantEmails(meeting);
            if (recipients.length === 0) {
                logger.warn('No recipients found for meeting invitations');
                return false;
            }

            const meetingDate = new Date(meeting.date).toLocaleString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const endTime = new Date(new Date(meeting.date).getTime() + (meeting.duration * 60000));
            const endTimeFormatted = endTime.toLocaleString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            });

            const duration = meeting.duration ? `${meeting.duration} minutes` : '1 heure';
            const projectName = meeting.projectId && typeof meeting.projectId === 'object' ? meeting.projectId.name : '';

            // Format the date for display in the calendar-style box
            const monthShort = new Date(meeting.date).toLocaleString('fr-FR', { month: 'short' });
            const day = new Date(meeting.date).getDate();
            const dayOfWeek = new Date(meeting.date).toLocaleString('fr-FR', { weekday: 'short' });

            // Build email HTML with calendar style design
            const htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 5px; overflow: hidden;">
                    <!-- Header -->
                    <div style="background-color: #4285F4; color: white; padding: 15px; text-align: center;">
                        <h2 style="margin: 0; font-size: 20px;">Invitation à une réunion PetroConnect</h2>
                    </div>
                    
                    <!-- Main content with meeting details -->
                    <div style="display: flex; flex-direction: row;">
                        <!-- Calendar block -->
                        <div style="width: 100px; background-color: #f8f8f8; padding: 10px; text-align: center; border-right: 1px solid #e0e0e0;">
                            <div style="background-color: #4285F4; color: white; padding: 5px; font-weight: bold; border-radius: 5px 5px 0 0;">
                                ${monthShort}
                            </div>
                            <div style="font-size: 32px; font-weight: bold; padding: 10px 0;">
                                ${day}
                            </div>
                            <div style="text-transform: capitalize;">
                                ${dayOfWeek}
                            </div>
                        </div>
                        
                        <!-- Meeting details -->
                        <div style="flex: 1; padding: 15px;">
                            <h3 style="margin-top: 0; color: #4285F4;">${meeting.title}</h3>
                            
                            <div style="margin-bottom: 15px;">
                                <div><strong>Quand:</strong> ${meetingDate} - ${endTimeFormatted}</div>
                                <div><strong>Qui:</strong> PetroConnect, Participants${meeting.participants.length > 0 ? ' *' : ''}</div>
                                ${projectName ? `<div><strong>Projet:</strong> ${projectName}</div>` : ''}
                            </div>
                            
                            ${meeting.description ? `
                            <div style="margin-bottom: 15px; padding: 10px; background-color: #f9f9f9; border-radius: 5px;">
                                <strong>Description:</strong><br>
                                ${meeting.description.replace(/\n/g, '<br>')}
                            </div>` : ''}
                            
                            <!-- View on Google Calendar link -->
                            <div style="margin-bottom: 15px;">
                                <a href="${meeting.calendarLink || 'https://calendar.google.com/calendar'}" style="color: #4285F4; text-decoration: none; font-size: 13px;">
                                    Voir sur Google Calendar
                                </a>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Agenda section -->
                    <div style="display: flex; flex-direction: row; border-top: 1px solid #e0e0e0;">
                        <div style="flex: 1; padding: 15px;">
                            <h3 style="margin-top: 0; color: #4285F4;">Agenda</h3>
                            <div style="color: #777; font-size: 14px;">${meetingDate}</div>
                            
                            <div style="margin: 15px 0; color: #777; font-size: 14px;">Pas d'événements antérieurs</div>
                            
                            <div style="display: flex; margin: 10px 0;">
                                <div style="width: 60px; text-align: right; padding-right: 15px;">
                                    ${new Date(meeting.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h')}
                                </div>
                                <div>
                                    <strong>${meeting.title}</strong>
                                </div>
                            </div>
                            
                            <div style="margin: 15px 0; color: #777; font-size: 14px;">Pas d'événements ultérieurs</div>
                        </div>
                    </div>
                    
                    <!-- Meeting link and join information -->
                    <div style="padding: 20px; border-top: 1px solid #e0e0e0;">
                        <h3 style="margin-top: 0;">Informations de connexion</h3>
                        
                        <!-- Google Meet button -->
                        ${meeting.meetLink ? `
                        <div style="margin: 20px 0; text-align: center;">
                            <a href="${meeting.meetLink}" 
                               style="background-color: #4285F4; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                                Rejoindre avec Google Meet
                            </a>
                        </div>
                        
                        <!-- Meeting link text -->
                        <div style="margin: 15px 0;">
                            <div style="font-weight: bold; margin-bottom: 5px;">Lien de la réunion</div>
                            <div style="color: #4285F4; word-break: break-all;">
                                <a href="${meeting.meetLink}" style="color: #4285F4; text-decoration: none;">
                                    ${meeting.meetLink}
                                </a>
                            </div>
                        </div>` : ''}
                        
                        <!-- Join by phone information -->
                        <div style="margin: 15px 0; border-top: 1px solid #e0e0e0; padding-top: 15px;">
                            <div style="font-weight: bold; margin-bottom: 5px;">Rejoindre par téléphone</div>
                            <div style="color: #555;">
                                <p>(FR) +33 1 87 40 21 90</p>
                                <p>PIN: ${Math.floor(10000000 + Math.random() * 90000000)}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="padding: 15px; background-color: #f8f8f8; border-top: 1px solid #e0e0e0; font-size: 12px; color: #777;">
                        <p>Pour toute question, veuillez contacter l'organisateur de la réunion.</p>
                        <p>Cette invitation a été envoyée par PetroConnect.</p>
                    </div>
                </div>
            `;

            // Create iCalendar attachment for email
            const icalData = this.generateICalendarData(meeting);

            const mailOptions = {
                from: `"PetroConnect" <${process.env.EMAIL_USER}>`,
                subject: `Invitation: ${meeting.title} @ ${new Date(meeting.date).toLocaleString('fr-FR', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}`,
                to: recipients.join(', '),
                html: htmlContent,
                headers: {
                    'X-Priority': '1', // High priority
                    'X-MSMail-Priority': 'High',
                    'Importance': 'High'
                },
                icalEvent: {
                    filename: 'invite.ics',
                    method: 'REQUEST',
                    content: icalData
                }
            };

            const info = await transporter.sendMail(mailOptions);
            logger.info(`Meeting invitation emails sent: ${info.messageId}`);
            return true;
        } catch (error) {
            logger.error(`Error sending meeting invitations: ${error.message}`);
            return false;
        }
    }

    /**
     * Generate iCalendar data for meeting
     */
    generateICalendarData(meeting) {
        try {
            // Calculate end time
            const startDate = new Date(meeting.date);
            const endDate = new Date(startDate.getTime() + (meeting.duration * 60000));

            // Format dates in iCalendar format (UTC)
            const formatDate = (date) => {
                return date.toISOString().replace(/-|:|\.\d+/g, '').slice(0, -1);
            };

            const organizerEmail = meeting.creator && meeting.creator.email
                ? meeting.creator.email
                : process.env.EMAIL_USER;

            const organizerName = meeting.creator && meeting.creator.firstName && meeting.creator.lastName
                ? `${meeting.creator.firstName} ${meeting.creator.lastName}`
                : 'PetroConnect';

            // Generate a unique ID for the meeting
            const uid = `meeting-${meeting._id}@petroconnect.com`;

            // Generate attendees list
            let attendees = '';
            if (meeting.participants && meeting.participants.length > 0) {
                meeting.participants.forEach(participant => {
                    if (participant.email) {
                        attendees += `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${participant.firstName} ${participant.lastName}:mailto:${participant.email}\n`;
                    }
                });
            }

            if (meeting.externalParticipants && meeting.externalParticipants.length > 0) {
                meeting.externalParticipants.forEach(external => {
                    if (external.email) {
                        attendees += `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${external.name}:mailto:${external.email}\n`;
                    }
                });
            }

            // Build iCalendar data
            const iCalData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PetroConnect//FR
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
DTSTART:${formatDate(startDate)}Z
DTEND:${formatDate(endDate)}Z
DTSTAMP:${formatDate(new Date())}Z
ORGANIZER;CN=${organizerName}:mailto:${organizerEmail}
UID:${uid}
${attendees}
DESCRIPTION:${meeting.description ? meeting.description.replace(/\n/g, '\\n') : ''}
SUMMARY:${meeting.title}
SEQUENCE:0
STATUS:CONFIRMED
${meeting.meetLink ? `URL:${meeting.meetLink}\nLOCATION:${meeting.meetLink}` : ''}
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Reminder
TRIGGER:-PT15M
END:VALARM
END:VEVENT
END:VCALENDAR`;

            return iCalData;
        } catch (error) {
            logger.error(`Error generating iCalendar data: ${error.message}`);
            return '';
        }
    }

    /**
     * Send meeting update notifications
     */
    async sendMeetingUpdateNotifications(meeting) {
        try {
            const recipients = this.collectParticipantEmails(meeting);
            if (recipients.length === 0) {
                logger.warn('No recipients found for meeting update notifications');
                return false;
            }

            const meetingDate = new Date(meeting.date).toLocaleString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const projectName = meeting.projectId && typeof meeting.projectId === 'object' ? meeting.projectId.name : '';

            // Build email HTML
            const htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #4A90E2;">Mise à jour de réunion: ${meeting.title}</h2>
                    <p>Les détails de la réunion suivante ont été mis à jour:</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p><strong>Date:</strong> ${meetingDate}</p>
                        ${meeting.description ? `<p><strong>Description:</strong> ${meeting.description}</p>` : ''}
                        ${projectName ? `<p><strong>Projet:</strong> ${projectName}</p>` : ''}
                    </div>
                    
                    ${meeting.meetLink ? `
                        <p style="margin: 20px 0;">
                            <a href="${meeting.meetLink}" 
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
                subject: `Mise à jour de réunion: ${meeting.title}`,
                html: htmlContent
            };

            const info = await transporter.sendMail(mailOptions);
            logger.info(`Meeting update notification emails sent: ${info.messageId}`);
            return true;
        } catch (error) {
            logger.error(`Error sending meeting update notifications: ${error.message}`);
            return false;
        }
    }

    /**
     * Send meeting cancellation notifications
     */
    async sendMeetingCancellationNotifications(meeting) {
        try {
            const recipients = this.collectParticipantEmails(meeting);
            if (recipients.length === 0) {
                logger.warn('No recipients found for meeting cancellation notifications');
                return false;
            }

            const meetingDate = new Date(meeting.date).toLocaleString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Build email HTML
            const htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #E53935;">Annulation de réunion: ${meeting.title}</h2>
                    <p>La réunion suivante a été annulée:</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p><strong>Date:</strong> ${meetingDate}</p>
                        ${meeting.description ? `<p><strong>Description:</strong> ${meeting.description}</p>` : ''}
                    </div>
                    
                    <p>Cet événement a été retiré de votre calendrier Google.</p>
                    
                    <p style="font-size: 12px; color: #777; margin-top: 30px;">
                        Ce message est automatique, merci de ne pas y répondre directement.
                    </p>
                </div>
            `;

            const mailOptions = {
                from: `"PetroConnect" <${process.env.EMAIL_USER}>`,
                to: recipients.join(', '),
                subject: `Annulation de réunion: ${meeting.title}`,
                html: htmlContent
            };

            const info = await transporter.sendMail(mailOptions);
            logger.info(`Meeting cancellation notification emails sent: ${info.messageId}`);
            return true;
        } catch (error) {
            logger.error(`Error sending meeting cancellation notifications: ${error.message}`);
            return false;
        }
    }

    /**
     * Helper method to collect all participant emails
     */
    collectParticipantEmails(meeting) {
        const emails = [];

        // Add internal participants
        if (meeting.participants && meeting.participants.length > 0) {
            meeting.participants.forEach(participant => {
                if (participant.email) {
                    emails.push(participant.email);
                }
            });
        }

        // Add creator if not already included
        if (meeting.creator && meeting.creator.email && !emails.includes(meeting.creator.email)) {
            emails.push(meeting.creator.email);
        }

        // Add external participants
        if (meeting.externalParticipants && meeting.externalParticipants.length > 0) {
            meeting.externalParticipants.forEach(participant => {
                if (participant.email) {
                    emails.push(participant.email);
                }
            });
        }

        return emails;
    }

    /**
     * Get meetings by project ID
     */
    async getMeetingsByProject(projectId) {
        try {
            return await Meeting.find({ projectId })
                .sort({ date: -1 })
                .populate('creator', 'firstName lastName email profilePicture')
                .populate('participants', 'firstName lastName email profilePicture')
                .populate('projectId', 'name');
        } catch (error) {
            logger.error(`Error fetching meetings by project: ${error.message}`);
            throw error;
        }
    }
}

// Test SMTP connection on startup
(async () => {
    try {
        await transporter.verify();
        logger.info('SMTP connection for meeting emails established successfully');
    } catch (error) {
        logger.error(`SMTP connection error for meeting emails: ${error.message}`);
    }
})();

module.exports = MeetingService; 