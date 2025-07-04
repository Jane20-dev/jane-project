import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth:{
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
});

export const emailAdapter = {
    async sendEmail(email: string,subject: string, htmlContent: string): Promise<void>{
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: email,
                subject: subject,
                html: htmlContent,
            });
            console.log(`Email sent to ${email} with subject: ${subject}`);
        } catch (error) {
            console.error(`Error sending email to ${email}:`, error);

            throw new Error('Failed to send email');
        }
    }
}