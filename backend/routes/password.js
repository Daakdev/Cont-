const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const router = express.Router();

const resetCodes = new Map();

// POST /api/password/forgot - Solicitar código de reset por correo (sin email real)
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email requerido" });
    }

    // Buscar usuario por email (campo correo)
    const usuario = await Usuario.findOne({ where: { correo: email } });

    if (!usuario) {
      return res.json({ message: "Si el email existe, código enviado (simulado)" });
    }

    // Generar código 6 dígitos, expira 15min
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000;

    resetCodes.set(email, { code, expiresAt, userId: usuario.id, empresaId: usuario.empresa_id });

    // Simular envío (sin mailer/Resend)
    console.log(`Código generado para ${email}: ${code} (expira ${new Date(expiresAt)})`);

    res.json({ message: "Código de recuperación generado (use /verify)", codeSent: true });
  } catch (error) {
    console.error('Error forgot:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

// POST /api/password/verify - Verificar código
router.post('/verify', (req, res) => {
  const { email, code } = req.body;
  const record = resetCodes.get(email);

  if (!record) return res.status(400).json({ error: 'Código inválido' });
  if (Date.now() > record.expiresAt) {
    resetCodes.delete(email);
    return res.status(400).json({ error: 'Código expirado' });
  }
  if (record.code !== code) return res.status(400).json({ error: 'Código incorrecto' });

  res.json({ verified: true, message: 'Código válido' });
});

// POST /api/password/reset - Reset con código verificado
router.post('/reset', async (req, res) => {
  try {
    const { email, code, password } = req.body;
    const record = resetCodes.get(email);

    if (!record || record.code !== code || Date.now() > record.expiresAt) {
      return res.status(400).json({ error: 'Código inválido/expirado' });
    }

    if (password.length < 6) return res.status(400).json({ error: 'Password muy corto' });

    const hash = await bcrypt.hash(password, 10);
    const usuario = await Usuario.findByPk(record.userId);

    if (!usuario) return res.status(400).json({ error: 'Usuario no encontrado' });

    await usuario.update({ password: hash });
    resetCodes.delete(email);

    res.json({ message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    console.error('Error reset:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
