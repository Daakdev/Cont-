function showRegister() {
    document.getElementById('container').classList.add('show-register');
}
function showLogin() {
    document.getElementById('container').classList.remove('show-register');
}

window.addEventListener('load', () => {
    setTimeout(() => {
        document.querySelector('.register').classList.remove('no-transition');
    }, 100);
});

function showRegister() {
    document.getElementById('container').classList.remove('was-register');
    document.getElementById('container').classList.add('show-register');
}

function showLogin() {
    document.getElementById('container').classList.remove('show-register');
    document.getElementById('container').classList.add('was-register');
}