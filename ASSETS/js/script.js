window.addEventListener('load', () => {
    setTimeout(() => {
        document.querySelector('.register').classList.remove('no-transition');
    }, 100);
});

function showRegister() {
    const container = document.getElementById('container');
    container.classList.remove('was-register');
    container.classList.add('show-register');
}

function showLogin() {
    const container = document.getElementById('container');
    container.classList.remove('show-register');
    container.classList.add('was-register');
}

function iniciarSesion() {
    const usuario = document.getElementById('usuario-login').value.trim();
    const password = document.getElementById('password').value.trim();

    const datosGuardados = JSON.parse(localStorage.getItem("usuarioRegistrado"));

    if (!datosGuardados) {
        alert("No hay ningún usuario registrado");
        return;
    }

    if (usuario === datosGuardados.usuario && password === datosGuardados.password) {

        // Redirige solo si coincide
        window.location.replace("/users.html");

    } else {
        alert("Usuario o contraseña incorrectos");
    }
}

function registrarse() {
    const usuario = document.getElementById('usuario-register').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const password = document.getElementById('password-register').value.trim();
    const confirmar = document.getElementById('confirmar-password').value.trim();

    if (!usuario || !correo || !password || !confirmar) {
        mostrarError('Por favor llena todos los campos');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
        mostrarError('El correo no es válido');
        return;
    }

    if (password.length < 8) {
        mostrarError('La contraseña debe tener al menos 8 caracteres');
        return;
    }

    if (password !== confirmar) {
        mostrarError('Las contraseñas no coinciden');
        return;
    }

    document.getElementById('usuario-register').value = '';
    document.getElementById('correo').value = '';
    document.getElementById('password-register').value = '';
    document.getElementById('confirmar-password').value = '';

    const usuarioGuardado = {
        usuario: usuario,
        correo: correo,
        password: password
    };

    localStorage.setItem("usuarioRegistrado", JSON.stringify(usuarioGuardado));

    alert("Registro exitoso ✅");

    showLogin();
}   

function mostrarError(mensaje) {
    const error = document.getElementById('error-register');
    error.textContent = mensaje;
    error.style.opacity = '1';

    setTimeout(() => {
        error.style.opacity = '0';
    }, 3000);
}