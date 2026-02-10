window.addEventListener("load", () => {
    const background = document.querySelector(".background");
    const login = document.querySelector(".login");

    background.classList.add("show");

    setTimeout(() => {
        login.classList.add("show");
    }, 400);
});

// Mostrar formulario de registro
const showRegisterBtn = document.getElementById('showRegister');
const showLoginBtn = document.getElementById('showLogin');
const loginSection = document.querySelector('.login');
const registerSection = document.querySelector('.register');

showRegisterBtn.addEventListener('click', function(e) {
    e.preventDefault();
    
    // Deslizar login hacia la izquierda
    loginSection.classList.add('slide-left');
    loginSection.classList.remove('slide-back');
    
    // Deslizar registro hacia adentro
    registerSection.classList.add('slide-in');
    registerSection.classList.remove('slide-out');
});

// Mostrar formulario de login
showLoginBtn.addEventListener('click', function(e) {
    e.preventDefault();
    
    // Deslizar registro hacia la derecha (fuera)
    registerSection.classList.add('slide-out');
    registerSection.classList.remove('slide-in');
    
    // Deslizar login de vuelta
    loginSection.classList.add('slide-back');
    loginSection.classList.remove('slide-left');
});