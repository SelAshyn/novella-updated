/**
 * Custom Email Service for Novella
 *
 * This uses a custom email template instead of Firebase's default emails.
 * You can use services like Resend, SendGrid, or Mailgun.
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Get verification email HTML template
 */
export function getVerificationEmailTemplate(params: {
  userName: string;
  verificationUrl: string;
}): { html: string; text: string } {
  const { userName, verificationUrl } = params;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email - Novella</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f9fafb;
      color: #111827;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 32px;
      text-align: center;
    }
    .logo {
      font-size: 32px;
      font-weight: 600;
      color: white;
      margin: 0;
      font-family: Georgia, serif;
    }
    .content {
      padding: 40px 32px;
    }
    h1 {
      margin: 0 0 16px;
      font-size: 24px;
      font-weight: 600;
      color: #111827;
    }
    p {
      margin: 0 0 16px;
      line-height: 1.6;
      color: #4b5563;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin: 24px 0;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .divider {
      margin: 32px 0;
      border: 0;
      border-top: 1px solid #e5e7eb;
    }
    .footer {
      padding: 32px;
      text-align: center;
      background: #f9fafb;
      color: #6b7280;
      font-size: 14px;
      line-height: 1.6;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .info-box {
      background: #f3f4f6;
      border-left: 4px solid #667eea;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .info-box p {
      margin: 0;
      font-size: 14px;
      color: #374151;
    }
    .link-text {
      word-break: break-all;
      font-size: 12px;
      color: #6b7280;
      background: #f9fafb;
      padding: 12px;
      border-radius: 4px;
      margin: 16px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1 class="logo">📚 Novella</h1>
      </div>

      <div class="content">
        <h1>Welcome to Novella${userName ? `, ${userName}` : ''}! 👋</h1>

        <p>
          Thank you for creating your Novella account. We're excited to help you
          build your reading library, track vocabulary, and remember every book you read.
        </p>

        <p>
          To get started, please verify your email address by clicking the button below:
        </p>

        <div style="text-align: center;">
          <a href="${verificationUrl}" class="button">
            Verify Email Address
          </a>
        </div>

        <div class="info-box">
          <p>
            <strong>This link expires in 3 days.</strong> After that, you'll need to
            request a new verification email from your account settings.
          </p>
        </div>

        <hr class="divider">

        <p style="font-size: 14px; color: #6b7280;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <div class="link-text">${verificationUrl}</div>

        <hr class="divider">

        <p style="font-size: 14px; color: #6b7280;">
          If you didn't create a Novella account, you can safely ignore this email.
        </p>
      </div>

      <div class="footer">
        <p>
          <strong>Novella</strong> - Your Reading Companion<br>
          <a href="https://novella.app">Visit our website</a> ·
          <a href="https://novella.app/support">Get support</a>
        </p>
        <p style="margin-top: 16px; font-size: 12px;">
          © ${new Date().getFullYear()} Novella. All rights reserved.<br>
          You're receiving this because you signed up for Novella.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Welcome to Novella${userName ? `, ${userName}` : ''}!

Thank you for creating your Novella account. We're excited to help you build your reading library, track vocabulary, and remember every book you read.

To get started, please verify your email address by clicking the link below:

${verificationUrl}

This link expires in 3 days. After that, you'll need to request a new verification email from your account settings.

If you didn't create a Novella account, you can safely ignore this email.

---
Novella - Your Reading Companion
Visit our website: https://novella.app
Get support: https://novella.app/support

© ${new Date().getFullYear()} Novella. All rights reserved.
  `.trim();

  return { html, text };
}

/**
 * Get welcome email template (sent after verification)
 */
export function getWelcomeEmailTemplate(params: {
  userName: string;
}): { html: string; text: string } {
  const { userName } = params;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Novella</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f9fafb;
      color: #111827;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 32px;
      text-align: center;
    }
    .logo {
      font-size: 32px;
      font-weight: 600;
      color: white;
      margin: 0;
      font-family: Georgia, serif;
    }
    .content {
      padding: 40px 32px;
    }
    h1 {
      margin: 0 0 16px;
      font-size: 24px;
      font-weight: 600;
      color: #111827;
    }
    p {
      margin: 0 0 16px;
      line-height: 1.6;
      color: #4b5563;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin: 24px 0;
    }
    .feature-list {
      list-style: none;
      padding: 0;
      margin: 24px 0;
    }
    .feature-list li {
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: start;
    }
    .feature-list li:last-child {
      border-bottom: none;
    }
    .feature-icon {
      margin-right: 12px;
      font-size: 20px;
    }
    .footer {
      padding: 32px;
      text-align: center;
      background: #f9fafb;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1 class="logo">📚 Novella</h1>
      </div>

      <div class="content">
        <h1>You're all set, ${userName}! 🎉</h1>

        <p>
          Your email has been verified and your Novella account is ready to use.
          Here's what you can do now:
        </p>

        <ul class="feature-list">
          <li>
            <span class="feature-icon">📖</span>
            <div>
              <strong>Add Books</strong><br>
              Build your reading library with up to 10 books on the free plan
            </div>
          </li>
          <li>
            <span class="feature-icon">✍️</span>
            <div>
              <strong>Track Vocabulary</strong><br>
              Save words you're learning with definitions and examples
            </div>
          </li>
          <li>
            <span class="feature-icon">💭</span>
            <div>
              <strong>Capture Quotes</strong><br>
              Highlight memorable passages from your books
            </div>
          </li>
          <li>
            <span class="feature-icon">📊</span>
            <div>
              <strong>Review & Progress</strong><br>
              Spaced repetition system to help you remember vocabulary
            </div>
          </li>
        </ul>

        <div style="text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://novella.app'}/dashboard" class="button">
            Go to Dashboard
          </a>
        </div>

        <p style="margin-top: 32px; font-size: 14px; color: #6b7280;">
          Need help getting started? Check out our
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://novella.app'}/guide" style="color: #667eea;">quick start guide</a>.
        </p>
      </div>

      <div class="footer">
        <p>
          Happy reading!<br>
          <strong>The Novella Team</strong>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
You're all set, ${userName}!

Your email has been verified and your Novella account is ready to use. Here's what you can do now:

📖 Add Books - Build your reading library with up to 10 books on the free plan
✍️ Track Vocabulary - Save words you're learning with definitions and examples
💭 Capture Quotes - Highlight memorable passages from your books
📊 Review & Progress - Spaced repetition system to help you remember vocabulary

Get started: ${process.env.NEXT_PUBLIC_APP_URL || 'https://novella.app'}/dashboard

Need help? Check our guide: ${process.env.NEXT_PUBLIC_APP_URL || 'https://novella.app'}/guide

Happy reading!
The Novella Team
  `.trim();

  return { html, text };
}

/**
 * Send email via Gmail SMTP using Nodemailer.
 * Requires GMAIL_USER and GMAIL_APP_PASSWORD in your .env.local.
 * Generate an App Password at: https://myaccount.google.com/apppasswords
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn("⚠️  GMAIL_USER or GMAIL_APP_PASSWORD not set — email skipped.");
    console.warn("   To:", options.to, "| Subject:", options.subject);
    return true; // Don't block the app in dev if not configured
  }

  try {
    // Lazy-import so it only loads server-side (never bundled into the client)
    const nodemailer = await import("nodemailer");

    const transporter = nodemailer.default.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"Novella" <${user}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

/**
 * Send verification email with custom template
 */
export async function sendVerificationEmail(params: {
  to: string;
  userName: string;
  verificationUrl: string;
}): Promise<boolean> {
  const { html, text } = getVerificationEmailTemplate({
    userName: params.userName,
    verificationUrl: params.verificationUrl,
  });

  return sendEmail({
    to: params.to,
    subject: "Verify your email - Novella",
    html,
    text,
  });
}

/**
 * Send welcome email after verification
 */
export async function sendWelcomeEmail(params: {
  to: string;
  userName: string;
}): Promise<boolean> {
  const { html, text } = getWelcomeEmailTemplate({
    userName: params.userName,
  });

  return sendEmail({
    to: params.to,
    subject: "Welcome to Novella! 🎉",
    html,
    text,
  });
}


/**
 * Get OTP verification email HTML template
 */
export function getOTPEmailTemplate(params: {
  userName: string;
  otp: string;
}): { html: string; text: string } {
  const { userName, otp } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://novella-library.vercel.app';
  const digits = otp.split('');

  // Inline SVG logo badge (works in all email clients)
  const logoBadgeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 80 80" role="img" aria-label="Novella" style="display:block;">
    <rect fill="#1c1917" width="80" height="80" rx="22"/>
    <g stroke="#fbf9f5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(22,22) scale(1.5)">
      <path d="M12 5v16"/>
      <path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z"/>
    </g>
  </svg>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your verification code — Novella</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f3ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f5f3ef;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;">

          <!-- Logo header -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">${logoBadgeSvg}</td>
                  <td style="vertical-align:middle;">
                    <span style="font-family:Georgia,'Times New Roman',Cambria,serif;font-size:28px;font-weight:700;color:#1c1917;letter-spacing:-0.5px;">Novella</span><br>
                    <span style="font-family:'Courier New','Lucida Console',monospace;font-size:10px;color:#78716c;letter-spacing:2px;text-transform:uppercase;">Reading Notebook</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07),0 1px 4px rgba(0,0,0,0.04);">

              <!-- Amber top bar -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr><td style="height:5px;background:linear-gradient(90deg,#f59e0b,#d97706);border-radius:20px 20px 0 0;font-size:0;">&nbsp;</td></tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:40px 40px 32px;">
                <tr>
                  <td>
                    <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:600;color:#1c1917;line-height:1.3;">
                      ${userName ? `Hey ${userName} 👋` : 'Hey there 👋'}
                    </p>
                    <p style="margin:0 0 32px;font-size:15px;color:#57534e;line-height:1.7;">
                      Here's your Novella verification code. Enter it in the app to confirm your email address. It's valid for <strong style="color:#1c1917;">10 minutes</strong>.
                    </p>

                    <!-- OTP digits -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
                      <tr>
                        <td align="center">
                          <table cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              ${digits.map(d => `<td style="padding:0 5px;"><div style="width:52px;height:64px;background:#fefce8;border:2px solid #fcd34d;border-radius:12px;font-family:'Courier New','Lucida Console',monospace;font-size:30px;font-weight:800;color:#92400e;text-align:center;line-height:64px;">${d}</div></td>`).join('')}
                            </tr>
                          </table>
                          <p style="margin:12px 0 0;font-size:12px;color:#a8a29e;font-family:'Courier New',monospace;">⏱ Expires in 10 minutes</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Security note -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
                      <tr>
                        <td style="background:#fef9c3;border:1px solid #fde68a;border-left:4px solid #f59e0b;border-radius:10px;padding:14px 16px;">
                          <p style="margin:0;font-size:13px;color:#78350f;line-height:1.6;">
                            🔒 <strong>Never share this code.</strong> Novella staff will never ask for it. If you didn't request this, your account is safe — just ignore this email.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0;font-size:13px;color:#a8a29e;line-height:1.6;">
                      Not sure why you got this? You can safely ignore it.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-top:1px solid #f0ece6;padding:20px 40px 24px;background:#fafaf9;border-radius:0 0 20px 20px;">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 6px;font-family:Georgia,serif;font-size:14px;font-weight:700;color:#1c1917;">Novella</p>
                    <p style="margin:0 0 4px;font-size:12px;color:#a8a29e;">
                      <a href="${appUrl}" style="color:#d97706;text-decoration:none;">${appUrl.replace(/^https?:\/\//, '')}</a>
                    </p>
                    <p style="margin:0;font-size:11px;color:#c4bdb7;">© ${new Date().getFullYear()} Novella. All rights reserved.</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `
Your Novella verification code${userName ? ` — ${userName}` : ''}

${otp}

Enter this code to verify your email. It expires in 10 minutes.

Never share this code with anyone. If you didn't request it, ignore this email.

---
Novella — Reading Notebook
${appUrl}
  `.trim();

  return { html, text };
}

/**
 * Send a 6-digit OTP verification email
 */
export async function sendOTPEmail(params: {
  to: string;
  userName: string;
  otp: string;
}): Promise<boolean> {
  const { html, text } = getOTPEmailTemplate({
    userName: params.userName,
    otp: params.otp,
  });

  return sendEmail({
    to: params.to,
    subject: `${params.otp} is your Novella verification code`,
    html,
    text,
  });
}

/**
 * Get password reset OTP email HTML template
 */
export function getPasswordResetOTPTemplate(params: {
  userName: string;
  otp: string;
}): { html: string; text: string } {
  const { userName, otp } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://novella-library.vercel.app';
  const digits = otp.split('');

  const logoBadgeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 80 80" role="img" aria-label="Novella" style="display:block;">
    <rect fill="#1c1917" width="80" height="80" rx="22"/>
    <g stroke="#fbf9f5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(22,22) scale(1.5)">
      <path d="M12 5v16"/>
      <path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z"/>
    </g>
  </svg>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password — Novella</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f3ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f5f3ef;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;">

          <!-- Logo header -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">${logoBadgeSvg}</td>
                  <td style="vertical-align:middle;">
                    <span style="font-family:Georgia,'Times New Roman',Cambria,serif;font-size:28px;font-weight:700;color:#1c1917;letter-spacing:-0.5px;">Novella</span><br>
                    <span style="font-family:'Courier New','Lucida Console',monospace;font-size:10px;color:#78716c;letter-spacing:2px;text-transform:uppercase;">Reading Notebook</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07),0 1px 4px rgba(0,0,0,0.04);">

              <!-- Red top bar -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr><td style="height:5px;background:linear-gradient(90deg,#ef4444,#dc2626);border-radius:20px 20px 0 0;font-size:0;">&nbsp;</td></tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:40px 40px 32px;">
                <tr>
                  <td>
                    <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:600;color:#1c1917;line-height:1.3;">
                      ${userName ? `Hi ${userName},` : 'Hi there,'}
                    </p>
                    <p style="margin:0 0 8px;font-size:15px;color:#57534e;line-height:1.7;">
                      We received a request to reset your Novella password. Use the code below — it's valid for <strong style="color:#1c1917;">10 minutes</strong>.
                    </p>
                    <p style="margin:0 0 32px;font-size:13px;color:#a8a29e;line-height:1.6;">
                      If you didn't request a password reset, you can safely ignore this email. Your password will not change.
                    </p>

                    <!-- OTP digits -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
                      <tr>
                        <td align="center">
                          <table cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              ${digits.map(d => `<td style="padding:0 5px;"><div style="width:52px;height:64px;background:#fef2f2;border:2px solid #fca5a5;border-radius:12px;font-family:'Courier New','Lucida Console',monospace;font-size:30px;font-weight:800;color:#991b1b;text-align:center;line-height:64px;">${d}</div></td>`).join('')}
                            </tr>
                          </table>
                          <p style="margin:12px 0 0;font-size:12px;color:#a8a29e;font-family:'Courier New',monospace;">⏱ Expires in 10 minutes</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Warning note -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="background:#fef2f2;border:1px solid #fca5a5;border-left:4px solid #ef4444;border-radius:10px;padding:14px 16px;">
                          <p style="margin:0;font-size:13px;color:#991b1b;line-height:1.6;">
                            ⚠️ <strong>Never share this code.</strong> Novella staff will never ask for your reset code. If you didn't request this, your password remains unchanged.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-top:1px solid #f0ece6;padding:20px 40px 24px;background:#fafaf9;border-radius:0 0 20px 20px;">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 6px;font-family:Georgia,serif;font-size:14px;font-weight:700;color:#1c1917;">Novella</p>
                    <p style="margin:0 0 4px;font-size:12px;color:#a8a29e;">
                      <a href="${appUrl}" style="color:#d97706;text-decoration:none;">${appUrl.replace(/^https?:\/\//, '')}</a>
                    </p>
                    <p style="margin:0;font-size:11px;color:#c4bdb7;">© ${new Date().getFullYear()} Novella. All rights reserved.</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `
Reset your Novella password${userName ? ` — ${userName}` : ''}

Your password reset code is:

${otp}

This code expires in 10 minutes.

Never share this code with anyone. If you didn't request a password reset, ignore this email — your account is safe.

---
Novella — Reading Notebook
${appUrl}
  `.trim();

  return { html, text };
}

/**
 * Send a password reset OTP email
 */
export async function sendPasswordResetOTPEmail(params: {
  to: string;
  userName: string;
  otp: string;
}): Promise<boolean> {
  const { html, text } = getPasswordResetOTPTemplate({
    userName: params.userName,
    otp: params.otp,
  });

  return sendEmail({
    to: params.to,
    subject: `${params.otp} is your Novella password reset code`,
    html,
    text,
  });
}


/**
 * Get report/feedback notification email template (sent to the admin inbox).
 */
export function getReportNotificationEmailTemplate(params: {
  reportType: string;
  title: string;
  description: string;
  area?: string | null;
  severity?: string | null;
  deviceInfo?: string | null;
  submittedBy: { name: string; email: string };
  createdAt: Date;
}): { html: string; text: string } {
  const {
    reportType,
    title,
    description,
    area,
    severity,
    deviceInfo,
    submittedBy,
    createdAt,
  } = params;

  // User-supplied content is interpolated into HTML, so escape it.
  const escape = (s: string): string =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const TYPE_LABELS: Record<string, string> = {
    glitch: "Glitch / Bug",
    feedback: "Feedback",
    feature: "Feature Appeal",
    other: "Other",
  };
  const typeLabel = TYPE_LABELS[reportType] ?? "Other";

  const severityLabel = severity
    ? severity.charAt(0).toUpperCase() + severity.slice(1)
    : null;

  const formattedDate = createdAt.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const descHtml = escape(description).replace(/\n/g, "<br>");
  const descText = description;

  // ── Meta rows (Area / Severity / Submitted by / Submitted at) ──────────
  const metaRowsHtml: string[] = [];
  const metaRowsText: string[] = [];

  metaRowsHtml.push(
    `<div class="receipt-row"><span class="receipt-label">Type</span><span class="receipt-value">${escape(typeLabel)}</span></div>`,
  );
  metaRowsText.push(`Type: ${typeLabel}`);

  if (area) {
    metaRowsHtml.push(
      `<div class="receipt-row"><span class="receipt-label">Area</span><span class="receipt-value">${escape(area)}</span></div>`,
    );
    metaRowsText.push(`Area: ${area}`);
  }
  if (severityLabel) {
    metaRowsHtml.push(
      `<div class="receipt-row"><span class="receipt-label">Severity</span><span class="receipt-value">${escape(severityLabel)}</span></div>`,
    );
    metaRowsText.push(`Severity: ${severityLabel}`);
  }
  metaRowsHtml.push(
    `<div class="receipt-row"><span class="receipt-label">Submitted by</span><span class="receipt-value">${escape(submittedBy.name)} &lt;${escape(submittedBy.email)}&gt;</span></div>`,
  );
  metaRowsText.push(`Submitted by: ${submittedBy.name} <${submittedBy.email}>`);

  metaRowsHtml.push(
    `<div class="receipt-row"><span class="receipt-label">Submitted at</span><span class="receipt-value">${escape(formattedDate)}</span></div>`,
  );
  metaRowsText.push(`Submitted at: ${formattedDate}`);

  const diagnosticsHtml = deviceInfo
    ? `<div class="link-text">${escape(deviceInfo)}</div>`
    : "";
  const diagnosticsText = deviceInfo ? `\nDiagnostics: ${deviceInfo}` : "";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escape(title)} — Novella Report</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0f4ff; color: #111827; }
    .outer { padding: 48px 16px; }
    .container { max-width: 580px; margin: 0 auto; }
    .card { background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(102,126,234,0.10), 0 1px 4px rgba(0,0,0,0.06); }

    /* Header */
    .header { background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%); padding: 36px 32px 32px; }
    .header-top { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    .brand { font-size: 22px; font-weight: 700; color: #fff; font-family: Georgia, serif; margin: 0; }
    .header-badge { display: inline-flex; align-items: center; gap: 7px; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.28); border-radius: 999px; padding: 5px 14px; font-size: 12.5px; font-weight: 600; color: #fff; letter-spacing: 0.3px; }
    .header-title { font-size: 20px; font-weight: 700; color: #fff; margin: 0 0 4px; line-height: 1.3; }
    .header-desc { font-size: 14px; color: rgba(255,255,255,0.75); margin: 0; }

    /* Body */
    .body { padding: 36px 36px 28px; }

    /* Meta grid */
    .meta-grid { border: 1px solid #e8edf8; border-radius: 14px; overflow: hidden; margin: 0 0 28px; }
    .meta-row { display: flex; align-items: baseline; padding: 13px 18px; border-bottom: 1px solid #f0f4ff; }
    .meta-row:last-child { border-bottom: none; }
    .meta-row:nth-child(even) { background: #f8faff; }
    .meta-label { font-size: 11.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: #94a3b8; width: 110px; flex-shrink: 0; }
    .meta-value { font-size: 14px; color: #1e293b; font-weight: 500; flex: 1; word-break: break-word; }

    /* Severity chips */
    .chip { display: inline-flex; align-items: center; gap: 5px; border-radius: 999px; padding: 3px 10px; font-size: 12.5px; font-weight: 600; }
    .chip-low    { background: #dcfce7; color: #166534; }
    .chip-medium { background: #fef9c3; color: #854d0e; }
    .chip-high   { background: #ffedd5; color: #9a3412; }
    .chip-critical { background: #fee2e2; color: #991b1b; }

    /* Type chips */
    .chip-glitch   { background: #fef2f2; color: #dc2626; }
    .chip-feedback { background: #eff6ff; color: #1d4ed8; }
    .chip-feature  { background: #f0fdf4; color: #15803d; }
    .chip-other    { background: #f8faff; color: #4f46e5; }

    /* Description */
    .section-heading { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; margin: 0 0 10px; }
    .description-box { background: #f8faff; border: 1px solid #e8edf8; border-radius: 12px; padding: 18px 20px; font-size: 14.5px; line-height: 1.7; color: #1e293b; white-space: pre-wrap; word-break: break-word; margin: 0 0 24px; }

    /* Diagnostics */
    .diagnostics-box { background: #1e1e2e; border-radius: 10px; padding: 14px 16px; font-size: 12px; font-family: 'SF Mono', 'Fira Code', monospace; color: #a5b4fc; line-height: 1.6; word-break: break-all; margin: 0 0 24px; }

    /* Footer */
    .footer { background: #f8faff; border-top: 1px solid #e8edf8; padding: 20px 32px; text-align: center; }
    .footer-brand { font-size: 14px; font-weight: 700; color: #4f46e5; font-family: Georgia, serif; }
    .footer-note { font-size: 12.5px; color: #94a3b8; margin: 6px 0 0; }
    .footer-copy { font-size: 11.5px; color: #c4cad8; margin: 6px 0 0; }
  </style>
</head>
<body>
  <div class="outer">
    <div class="container">
      <div class="card">

        <div class="header">
          <div class="header-top">
            <span style="font-size:22px;">📚</span>
            <p class="brand">Novella</p>
            <span class="header-badge">${reportType === 'glitch' ? '🐛' : reportType === 'feedback' ? '💬' : reportType === 'feature' ? '✨' : '📋'} ${escape(typeLabel)}</span>
          </div>
          <p class="header-title">${escape(title)}</p>
          <p class="header-desc">Submitted ${escape(formattedDate)} by ${escape(submittedBy.name)}</p>
        </div>

        <div class="body">

          <div class="meta-grid">
            <div class="meta-row">
              <span class="meta-label">Type</span>
              <span class="meta-value"><span class="chip chip-${reportType}">${escape(typeLabel)}</span></span>
            </div>
            ${area ? `
            <div class="meta-row">
              <span class="meta-label">Area</span>
              <span class="meta-value">${escape(area)}</span>
            </div>` : ''}
            ${severityLabel ? `
            <div class="meta-row">
              <span class="meta-label">Severity</span>
              <span class="meta-value"><span class="chip chip-${severity}">${escape(severityLabel)}</span></span>
            </div>` : ''}
            <div class="meta-row">
              <span class="meta-label">Submitted by</span>
              <span class="meta-value">${escape(submittedBy.name)} &lt;${escape(submittedBy.email)}&gt;</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Date</span>
              <span class="meta-value">${escape(formattedDate)}</span>
            </div>
          </div>

          <p class="section-heading">Description</p>
          <div class="description-box">${descHtml}</div>

          ${deviceInfo ? `
          <p class="section-heading">Diagnostics</p>
          <div class="diagnostics-box">${escape(deviceInfo)}</div>
          ` : ''}

        </div>

        <div class="footer">
          <p class="footer-brand">📚 Novella</p>
          <p class="footer-note">Automated notification from the Report &amp; Feedback system</p>
          <p class="footer-copy">© ${new Date().getFullYear()} Novella. All rights reserved.</p>
        </div>

      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
New ${typeLabel} report — Novella

Title: ${title}

${metaRowsText.join("\n")}

Details:
${descText}
${diagnosticsText}

---
Novella — Your Reading Companion
This is an automated notification from the Report & Feedback dashboard.
© ${new Date().getFullYear()} Novella. All rights reserved.
  `.trim();

  return { html, text };
}

/**
 * Send a report/feedback notification to the admin inbox.
 */
export async function sendReportNotificationEmail(params: {
  to: string;
  reportType: string;
  title: string;
  description: string;
  area?: string | null;
  severity?: string | null;
  deviceInfo?: string | null;
  submittedBy: { name: string; email: string };
  createdAt: Date;
}): Promise<boolean> {
  const { html, text } = getReportNotificationEmailTemplate({
    reportType: params.reportType,
    title: params.title,
    description: params.description,
    area: params.area,
    severity: params.severity,
    deviceInfo: params.deviceInfo,
    submittedBy: params.submittedBy,
    createdAt: params.createdAt,
  });

  // Keep the subject concise — titles can be up to 200 chars.
  const subjectTitle = params.title.length > 80 ? `${params.title.slice(0, 77)}…` : params.title;
  const typeLabel =
    params.reportType === "glitch" ? "Bug" :
    params.reportType === "feedback" ? "Feedback" :
    params.reportType === "feature" ? "Feature" :
    "Report";

  return sendEmail({
    to: params.to,
    subject: `[Novella ${typeLabel}] ${subjectTitle}`,
    html,
    text,
  });
}
