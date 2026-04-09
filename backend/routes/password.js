const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendResetCode } = require('../config/mailer');
const Usuario = require('../models/usuario');
const router = express.Router();

const resetCodes = new Map();

// POST /api/password/forgot
router.post('/forgot', async (req, res) => {
  try {
    const { correo } = req.body; // ← tu campo se llama "correo", no "email"

    const usuario = await Usuario.findOne({ where: { correo } }); // ← Sequelize usa "where"

    if (!usuario) {
      return res.json({ message: 'Si el correo existe, recibirás un código.' });
    }

    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000;

    resetCodes.set(correo, { code, expiresAt });
    await sendResetCode(correo, code);

    res.json({ message: 'Si el correo existe, recibirás un código.' });
  } catch (error) {
    console.error('Error en forgot:', error);
    res.status(500).json({ error: 'Error al enviar el correo.' });
  }
});

// POST /api/password/verify
router.post('/verify', (req, res) => {
  const { correo, code } = req.body;
  const record = resetCodes.get(correo);

  if (!record) return res.status(400).json({ error: 'Código inválido o expirado.' });
  if (Date.now() > record.expiresAt) {
    resetCodes.delete(correo);
    return res.status(400).json({ error: 'El código expiró. Solicita uno nuevo.' });
  }
  if (record.code !== code) return res.status(400).json({ error: 'Código incorrecto.' });

  const token = crypto.randomBytes(32).toString('hex');
  resetCodes.set(correo, { ...record, token, verified: true });

  res.json({ token });
});

// POST /api/password/reset
router.post('/reset', async (req, res) => {
  try {
    const { correo, token, newPassword } = req.body;
    const record = resetCodes.get(correo);

    if (!record || !record.verified || record.token !== token) {
      return res.status(400).json({ error: 'Solicitud inválida.' });
    }
    if (Date.now() > record.expiresAt) {
      resetCodes.delete(correo);
      return res.status(400).json({ error: 'La sesión expiró. Vuelve a intentarlo.' });
    }

    const hash = await bcrypt.hash(newPassword, 10);

    // ← Sequelize: update con where
    await Usuario.update(
      { password: hash },
      { where: { correo } }
    );

    resetCodes.delete(correo);
    res.json({ message: 'Contraseña actualizada exitosamente.' });
  } catch (error) {
    console.error('Error en reset:', error);
    res.status(500).json({ error: 'Error al actualizar la contraseña.' });
  }
});

module.exports = router;