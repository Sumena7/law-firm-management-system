const nodemailer = require('nodemailer');
const path = require('path');

// Configure your email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',  // Use Gmail
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS        
    }
});

/**
 * Send email notification
 * @param {string} to - recipient email
 * @param {string} subject - email subject
 * @param {string} text - email body
 * @param {string} [attachmentPath] - optional path to a file to attach
 */
async function sendEmail({to, subject, text, attachmentPath = null}) {
    try {
        const mailOptions = {
            from: `"Everest Law Chamber" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text
        };

        if (attachmentPath) {
            mailOptions.attachments = [
                {
                    filename: path.basename(attachmentPath),
                    path: attachmentPath
                }
            ];
        }

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Email error:', error);
    }
}

module.exports = { sendEmail };
