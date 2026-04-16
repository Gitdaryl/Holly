// POST /api/contact
// Accepts: { firstName, lastName, email, phone, message }
// Sends email to Holly via Resend

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, email, phone, message } = req.body || {};

  if (!firstName || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.HOLLY_CONTACT_EMAIL || 'admin@yetigroove.com';

  if (!apiKey) {
    console.error('RESEND_API_KEY not set');
    return res.status(500).json({ error: 'Email service not configured.' });
  }

  const fullName = [firstName, lastName].filter(Boolean).join(' ');

  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a2332; margin-bottom: 4px;">New Contact Form Submission</h2>
      <p style="color: #6b7a8d; font-size: 14px; margin-top: 0;">From your Irish Hills Lakes website</p>
      <hr style="border: none; border-top: 1px solid #e8e4df; margin: 20px 0;" />
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #1a2332; width: 120px;">Name</td>
          <td style="padding: 8px 0; color: #4a5568;">${fullName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #1a2332;">Email</td>
          <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #e84393;">${email}</a></td>
        </tr>
        ${phone ? `<tr>
          <td style="padding: 8px 0; font-weight: 600; color: #1a2332;">Phone</td>
          <td style="padding: 8px 0;"><a href="tel:${phone}" style="color: #e84393;">${phone}</a></td>
        </tr>` : ''}
      </table>
      <hr style="border: none; border-top: 1px solid #e8e4df; margin: 20px 0;" />
      <h3 style="color: #1a2332; margin-bottom: 8px;">Message</h3>
      <p style="color: #4a5568; line-height: 1.7; white-space: pre-wrap;">${message}</p>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Holly Site <noreply@yetigroove.com>',
        to: [toEmail],
        reply_to: email,
        subject: `New inquiry from ${fullName} - Irish Hills Lakes`,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Failed to send message. Please call Holly directly.' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Contact form error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
