const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');

router.post('/register', async (req, res) => {
    const { usuario, correo, password } = req.body;

    try {
        const [results] = await db.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
        if (results.length > 0) return res.status(400).json({ error: 'El usuario ya existe' });

        const hash = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO usuarios (usuario, correo, password) VALUES (?, ?, ?)',
            [usuario, correo, hash]
        );
        res.json({ mensaje: 'Registro exitoso' });

    } catch (err) {
        console.error('Error en /register:', err);
        res.status(500).json({ error: 'Error en servidor' });
    }
});

router.post('/login', async (req, res) => {
    const { usuario, password } = req.body;

    try {
        const [results] = await db.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
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

    } catch (err) {
        console.error('Error en /login:', err);
        res.status(500).json({ error: 'Error en servidor' });
    }
});

module.exports = router;