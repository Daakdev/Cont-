const fetch = require('node-fetch'); // npm i node-fetch si no está

async function crearCuentaDev(usuario, correo, password, devSecret = 'dev123') {
  const url = 'https://cont-backend.onrender.com/api/auth/register-dev';
  const body = { usuario, correo, password, dev_secret: devSecret };
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    console.log('✅ Cuenta dev creada:', data);
    console.log('Usuario:', data.usuario);
    console.log('Token (guarda en localStorage):', data.token || 'Login required');
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

// Uso: node crear_dev_account.js
if (require.main === module) {
  crearCuentaDev('devoloper', 'devoloper@contplus.com', 'contdev2026', 'dev_cont_2026');
}
