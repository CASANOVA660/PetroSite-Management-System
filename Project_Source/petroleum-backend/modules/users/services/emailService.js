const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Create transporter using Gmail
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  },
  debug: true // Enable debug logs
});

const sendActivationEmail = async (email, token, tempPassword) => {
  console.log('Email configuration:', {
    host: 'smtp.gmail.com',
    user: process.env.EMAIL_USER,
    hasPassword: !!process.env.EMAIL_APP_PASSWORD
  });

  const activationLink = `${process.env.FRONTEND_URL}/activate?token=${token}`;

  const mailOptions = {
    from: `"PetroConnect" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Activez votre compte PetroConnect',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bienvenue sur PetroConnect!</h2>
        <p>Votre compte a été créé avec succès. Voici vos informations temporaires:</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mot de passe temporaire:</strong> ${tempPassword}</p>
        <p>Pour activer votre compte et définir votre nouveau mot de passe, cliquez sur le lien ci-dessous:</p>
        <p>
          <a href="${activationLink}" 
             style="background-color: #4CAF50; color: white; padding: 10px 20px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Activer mon compte
          </a>
        </p>
        <p>Ce lien expirera dans 1 heure.</p>
        <p>Si vous n'avez pas demandé ce compte, veuillez ignorer cet email.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send activation email');
  }
};

// Test the email configuration on startup
(async () => {
  try {
    await transporter.verify();
    console.log('SMTP connection successful');
  } catch (error) {
    console.error('SMTP connection error:', error);
  }
})();

module.exports = { sendActivationEmail }; 