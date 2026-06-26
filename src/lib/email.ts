import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendRegistrationConfirmation(to: string, name: string) {
  await transporter.sendMail({
    from: `"LFF Youth Convention" <${process.env.SMTP_USER}>`,
    to,
    subject: "Registration Confirmed – LFF Youth Convention",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;background:#f9f9f9;border-radius:8px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#7c3aed;margin:0;">LFF Youth Convention</h1>
        </div>
        <div style="background:#fff;padding:24px;border-radius:8px;border:1px solid #e5e7eb;">
          <h2 style="color:#1f2937;">Hello ${name}! 🎉</h2>
          <p style="color:#4b5563;font-size:16px;line-height:1.6;">
            Your registration for the <strong>LFF Youth Convention</strong> has been received and confirmed.
          </p>
          <p style="color:#4b5563;font-size:16px;line-height:1.6;">
            We are excited to have you join us. Please keep this email for your records.
          </p>
          <div style="margin:24px 0;padding:16px;background:#ede9fe;border-left:4px solid #7c3aed;border-radius:4px;">
            <p style="margin:0;color:#5b21b6;font-weight:bold;">What's next?</p>
            <p style="margin:8px 0 0;color:#6d28d9;">
              You will receive further details about the convention schedule and venue via email. Stay tuned!
            </p>
          </div>
          <p style="color:#4b5563;font-size:14px;">
            If you have any questions, please contact us at <a href="mailto:${process.env.SMTP_USER}" style="color:#7c3aed;">${process.env.SMTP_USER}</a>.
          </p>
          <p style="color:#9ca3af;font-size:12px;margin-top:32px;border-top:1px solid #e5e7eb;padding-top:16px;">
            God bless you. — LFF Youth Convention Team
          </p>
        </div>
      </div>
    `,
  });
}
