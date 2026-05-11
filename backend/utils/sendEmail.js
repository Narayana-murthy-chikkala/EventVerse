const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  };
  await transporter.sendMail(mailOptions);
};

const welcomeEmailTemplate = (name) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#FFF7ED;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#D97706,#DC2626,#7C3AED);padding:40px 30px;text-align:center;">
      <h1 style="color:#FFFFFF;margin:0;font-size:28px;letter-spacing:1px;">🪔 SanskritiUtsav</h1>
      <p style="color:#FEF3C7;margin:8px 0 0;font-size:14px;">Celebrating India's Living Culture</p>
    </div>
    <div style="padding:30px;">
      <h2 style="color:#92400E;margin-top:0;">Namaste, ${name}! 🙏</h2>
      <p style="color:#57534E;line-height:1.6;">Welcome to <strong>SanskritiUtsav</strong> — your gateway to India's most vibrant cultural festivals, classical music concerts, folk dance performances, art exhibitions, and more!</p>
      <p style="color:#57534E;line-height:1.6;">Here's what you can do:</p>
      <ul style="color:#57534E;line-height:2;">
        <li>🎭 Discover festivals across 12 cultural categories</li>
        <li>🎫 Register and get instant QR-coded tickets</li>
        <li>📸 Explore stunning festival galleries</li>
        <li>🔔 Stay updated on upcoming events near you</li>
      </ul>
      <div style="text-align:center;margin:30px 0;">
        <a href="${process.env.CLIENT_URL}/events" style="background:linear-gradient(135deg,#D97706,#EA580C);color:#FFFFFF;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">Explore Festivals →</a>
      </div>
      <p style="color:#78716C;font-size:13px;text-align:center;">May every festival bring joy to your heart ✨</p>
    </div>
    <div style="background:#1C1917;padding:20px;text-align:center;">
      <p style="color:#A8A29E;margin:0;font-size:12px;">© ${new Date().getFullYear()} SanskritiUtsav. Made with ❤️ for Indian Culture</p>
    </div>
  </div>
</body>
</html>`;
};

const registrationConfirmTemplate = (name, eventTitle, eventDate, eventVenue, qrCodeDataUrl) => {
  const formattedDate = new Date(eventDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#FFF7ED;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#D97706,#DC2626);padding:40px 30px;text-align:center;">
      <h1 style="color:#FFFFFF;margin:0;font-size:24px;">🎫 Ticket Confirmed!</h1>
      <p style="color:#FEF3C7;margin:8px 0 0;font-size:14px;">SanskritiUtsav</p>
    </div>
    <div style="padding:30px;">
      <h2 style="color:#92400E;margin-top:0;">Namaste, ${name}!</h2>
      <p style="color:#57534E;line-height:1.6;">Your registration for the following event has been confirmed:</p>
      <div style="background:#FFFBEB;border-left:4px solid #D97706;padding:20px;border-radius:0 8px 8px 0;margin:20px 0;">
        <h3 style="color:#92400E;margin:0 0 10px;">${eventTitle}</h3>
        <p style="color:#78716C;margin:4px 0;">📅 <strong>${formattedDate}</strong></p>
        <p style="color:#78716C;margin:4px 0;">📍 <strong>${eventVenue}</strong></p>
      </div>
      <div style="text-align:center;margin:30px 0;">
        <p style="color:#57534E;font-weight:bold;margin-bottom:15px;">Your Entry QR Code:</p>
        <img src="${qrCodeDataUrl}" alt="QR Code" style="width:200px;height:200px;border:3px solid #D97706;border-radius:12px;padding:8px;background:#FFFFFF;" />
        <p style="color:#78716C;font-size:13px;margin-top:10px;">Show this QR code at the venue for entry</p>
      </div>
      <div style="text-align:center;margin:20px 0;">
        <a href="${process.env.CLIENT_URL}/dashboard" style="background:linear-gradient(135deg,#D97706,#EA580C);color:#FFFFFF;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">View My Tickets</a>
      </div>
    </div>
    <div style="background:#1C1917;padding:20px;text-align:center;">
      <p style="color:#A8A29E;margin:0;font-size:12px;">© ${new Date().getFullYear()} SanskritiUtsav. Made with ❤️ for Indian Culture</p>
    </div>
  </div>
</body>
</html>`;
};

const passwordResetTemplate = (name, otp) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#FFF7ED;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#7C3AED,#4F46E5);padding:40px 30px;text-align:center;">
      <h1 style="color:#FFFFFF;margin:0;font-size:24px;">🔐 Password Reset</h1>
      <p style="color:#E0E7FF;margin:8px 0 0;font-size:14px;">SanskritiUtsav</p>
    </div>
    <div style="padding:30px;">
      <h2 style="color:#3730A3;margin-top:0;">Hello, ${name}</h2>
      <p style="color:#57534E;line-height:1.6;">You requested a password reset. Use the OTP below to reset your password:</p>
      <div style="text-align:center;margin:30px 0;">
        <div style="background:#EEF2FF;display:inline-block;padding:20px 40px;border-radius:12px;border:2px dashed #6366F1;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#4F46E5;">${otp}</span>
        </div>
      </div>
      <p style="color:#DC2626;font-size:14px;text-align:center;font-weight:bold;">⏰ This OTP expires in 10 minutes</p>
      <p style="color:#78716C;font-size:13px;line-height:1.6;">If you didn't request this reset, please ignore this email. Your account remains secure.</p>
    </div>
    <div style="background:#1C1917;padding:20px;text-align:center;">
      <p style="color:#A8A29E;margin:0;font-size:12px;">© ${new Date().getFullYear()} SanskritiUtsav. Made with ❤️ for Indian Culture</p>
    </div>
  </div>
</body>
</html>`;
};

module.exports = {
  sendEmail,
  welcomeEmailTemplate,
  registrationConfirmTemplate,
  passwordResetTemplate,
};
