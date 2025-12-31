import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const data = await resend.emails.send({
      from: 'Goal Planner <hello@yourdomain.com>', // Use your verified domain
      to: [to],
      subject,
      html,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}

// Email templates
export function welcomeEmail(firstName: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Welcome to Goal Planner Pro! 🎯</h1>
      <p>Hi ${firstName},</p>
      <p>We're excited to help you turn your goals into achievements.</p>
      <p>Here's what you can do next:</p>
      <ul>
        <li>Create your first goal</li>
        <li>Set up your profile</li>
        <li>Explore community goals for inspiration</li>
      </ul>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
         style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
        Get Started
      </a>
    </div>
  `;
}

export function dailyCheckInEmail(firstName: string, goalTitle: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hey ${firstName}, how's it going? 💪</h2>
      <p>Just checking in on your goal: <strong>${goalTitle}</strong></p>
      <p>How are you feeling about your progress today?</p>
      <div style="margin: 24px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/check-in?mood=great" style="display: inline-block; background: #22c55e; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; margin: 4px;">✅ On Track</a>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/check-in?mood=struggling" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; margin: 4px;">😕 Struggling</a>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/check-in?mood=paused" style="display: inline-block; background: #6b7280; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; margin: 4px;">⏸️ Paused</a>
      </div>
    </div>
  `;
}