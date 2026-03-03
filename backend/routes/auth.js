const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');

router.post('/register', async (req, res) => {
    const { usuario, correo, password } = req.body;

    db.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Error en servidor' });
        if (results.length > 0) return res.status(400).json({ error: 'El usuario ya existe' });

        const hash = await bcrypt.hash(password, 10);
        db.query(
            'INSERT INTO usuarios (usuario, correo, password) VALUES (?, ?, ?)',
            [usuario, correo, hash],
            (err) => {
                if (err) return res.status(500).json({ error: 'Error al registrar' });
                res.json({ mensaje: 'Registro exitoso' });
            }
        );
    });
});

router.post('/login', (req, res) => {
    const { usuario, password } = req.body;

    db.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Error en servidor' });
        if (results.length === 0) return res.status(400).json({ error: 'Usuario no encontrado' });

        const user  = results[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: 'Contraseña incorrecta' });

        const token = jwt.sign(
            { id: user.id, usuario: user.usuario },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        res.json({ token, usuario: user.usuario });
    });
});

module.exports = router;