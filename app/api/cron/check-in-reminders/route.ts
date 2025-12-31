import { sendDailyCheckInReminders } from '@/lib/email/check-in-reminders';


export async function GET(req: Request) {
  // Verify this is from a cron job (Vercel provides a secret)
  const authHeader = req.headers.get('authorization');
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await sendDailyCheckInReminders();
    
    return new Response(
      JSON.stringify({ success: true, message: 'Reminders sent' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Cron job error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send reminders' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}