// supabase/functions/send-email/index.ts

// Using full URLs to be explicit
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { Resend } from 'npm:resend';

// No changes below this line, but including for completeness
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

if (!RESEND_API_KEY) {
  console.error("RESEND_API_KEY is not set.");
}

const resend = new Resend(RESEND_API_KEY);

serve(async (req: Request) => {
  const { to, subject, html } = await req.json();

  if (!to || !subject || !html) {
    return new Response('Missing required fields', { status: 400 });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Acing Maths <onboarding@resend.dev>', // Replace with your verified domain
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error({ error });
      return new Response(JSON.stringify(error), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err: any) {
    console.error({ err });
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
