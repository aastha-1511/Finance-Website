import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

// Creates a live SMTP transporter.
// If EMAIL_USER / EMAIL_PASS are not set, falls back to Ethereal (dev-only catch-all preview)
const getTransporter = async () => {
    if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your_gmail@gmail.com') {
        // Production: Gmail with App Password
        return nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });
    }
    // Development fallback: Ethereal (messages are viewable at ethereal.email, not truly sent)
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
        host: 'smtp.ethereal.email', port: 587, secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass }
    });
};

router.post('/contact', async (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const transporter = await getTransporter();
        const recipientEmail = process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your_gmail@gmail.com'
            ? process.env.EMAIL_USER
            : 'u23cs121@coed.svnit.ac.in'; // fallback — change once real email is set

        // 1. Notify admin
        const adminInfo = await transporter.sendMail({
            from: `"FinanceHub Contact" <${process.env.EMAIL_USER || 'noreply@financehub.com'}>`,
            to: 'u23cs121@coed.svnit.ac.in',
            subject: `New Contact Message from ${name}`,
            html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
          <h2 style="color:#4f46e5;margin-bottom:4px">New Message — FinanceHub</h2>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin-bottom:20px"/>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Message:</strong></p>
          <div style="background:#f9fafb;padding:16px;border-radius:8px;color:#374151;white-space:pre-wrap">${message}</div>
          <p style="margin-top:20px;font-size:12px;color:#9ca3af">Submitted via FinanceHub Contact Form</p>
        </div>
      `
        });

        // 2. Auto-reply to sender
        await transporter.sendMail({
            from: `"FinanceHub Team" <${process.env.EMAIL_USER || 'noreply@financehub.com'}>`,
            to: email,
            subject: `We received your message, ${name}!`,
            html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;background:#f8faff;border-radius:16px">
          <div style="background:linear-gradient(135deg,#6366f1,#818cf8);padding:28px 32px;border-radius:12px;margin-bottom:24px">
            <h1 style="margin:0;color:#fff;font-size:24px">Thank you, ${name}!</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">We've received your query and will get back to you shortly.</p>
          </div>
          <div style="background:#fff;padding:24px;border-radius:12px;border:1px solid #e5e7eb">
            <p style="color:#374151;font-size:14px;line-height:1.7"><strong>Your message:</strong></p>
            <div style="background:#f9fafb;padding:14px;border-radius:8px;color:#6b7280;font-size:13px;white-space:pre-wrap">${message}</div>
            <p style="color:#6b7280;font-size:13px;margin-top:20px">
              Our team typically responds within <strong>24–48 hours</strong>. In the meantime, feel free to explore the FinanceHub dashboard and community.
            </p>
          </div>
          <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px">FinanceHub · Building smarter investors</p>
        </div>
      `
        });

        // Log preview URL for Ethereal
        if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_gmail@gmail.com') {
            console.log('📧 Email preview (Ethereal):', nodemailer.getTestMessageUrl(adminInfo));
        }

        res.json({ success: true, message: 'Message sent! We\'ve also emailed a confirmation to you.' });
    } catch (error) {
        console.error('Email error:', error.message);
        res.json({ success: true, message: 'Message received. We will get back to you soon.' });
    }
});

export default router;
