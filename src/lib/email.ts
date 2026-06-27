import nodemailer from "nodemailer";
import type { House } from "@/lib/models/Registration";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const HOUSE_COLORS: Record<House, { bg: string; text: string; emoji: string }> = {
  FIRE: { bg: "#fef2f2", text: "#b91c1c", emoji: "🔥" },
  WATER: { bg: "#eff6ff", text: "#1d4ed8", emoji: "💧" },
  WIND: { bg: "#f0fdf4", text: "#15803d", emoji: "🌬️" },
  ICE: { bg: "#f0f9ff", text: "#0369a1", emoji: "❄️" },
};

export async function sendRegistrationConfirmation(
  to: string,
  name: string,
  house: House
) {
  const houseStyle = HOUSE_COLORS[house];

  await transporter.sendMail({
    from: `"LFF Youth Convention" <${process.env.SMTP_USER}>`,
    to,
    subject: `Registration Confirmed – You're in House ${house}! | LFF Youth Convention`,
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

          <div style="margin:24px 0;padding:20px;background:${houseStyle.bg};border:2px solid ${houseStyle.text};border-radius:12px;text-align:center;">
            <p style="margin:0 0 8px;color:#6b7280;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Your House Assignment</p>
            <p style="margin:0;font-size:36px;">${houseStyle.emoji}</p>
            <p style="margin:8px 0 0;color:${houseStyle.text};font-size:28px;font-weight:900;letter-spacing:2px;">HOUSE ${house}</p>
          </div>

          <p style="color:#4b5563;font-size:16px;line-height:1.6;">
            You have been assigned to <strong style="color:${houseStyle.text};">House ${house}</strong>.
            Get ready to represent your house with pride at the convention!
          </p>

          <div style="margin:24px 0;padding:16px;background:#ede9fe;border-left:4px solid #7c3aed;border-radius:4px;">
            <p style="margin:0;color:#5b21b6;font-weight:bold;">What's next?</p>
            <p style="margin:8px 0 0;color:#6d28d9;">
              You will receive further details about the convention schedule and venue via email. Stay tuned!
            </p>
          </div>

          <p style="color:#4b5563;font-size:14px;">
            If you have any questions, please contact us at
            <a href="mailto:${process.env.SMTP_USER}" style="color:#7c3aed;">${process.env.SMTP_USER}</a>.
          </p>
          <p style="color:#9ca3af;font-size:12px;margin-top:32px;border-top:1px solid #e5e7eb;padding-top:16px;">
            God bless you. — LFF Youth Convention Team
          </p>
        </div>
      </div>
    `,
  });
}
