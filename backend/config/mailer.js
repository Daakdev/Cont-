const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendResetCode(to, code) {
  await resend.emails.send({
    from: 'Mi App <onboarding@resend.dev>',
    to,
    subject: 'Tu código para restablecer contraseña',
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:auto">
        <h2>Restablecer contraseña</h2>
        <p>Tu código de verificación es:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:12px;
                    text-align:center;padding:20px;background:#f5f5f5;border-radius:8px">
          ${code}
        </div>
        <p style="color:#888;font-size:13px">
          Expira en 15 minutos. Si no solicitaste esto, ignora este correo.
        </p>
      </div>
    `,
  });
}

module.exports = { sendResetCode };