const nodemailer = require('nodemailer');

// Configure your email transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.example.com', // Replace with your SMTP host
    port: 587,                // Replace with your SMTP port
    secure: false,            // true for 465, false for other ports
    auth: {
        user: 'your-email@example.com', // Replace with your email
        pass: 'your-email-password'     // Replace with your email password or app password
    }
});

/**
 * Send email notification
 * @param {string} to - recipient email
 * @param {string} subject - email subject
 * @param {string} text - email body
 */
async function sendEmail(to, subject, text) {
    try {
        await transporter.sendMail({
            from: '"Law Firm" <your-email@example.com>',
            to,
            subject,
            text
        });
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Email error:', error);
    }
}

module.exports = { sendEmail };
