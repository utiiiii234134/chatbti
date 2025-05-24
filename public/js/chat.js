const socket = io();
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const email = localStorage.getItem('email') || prompt('Tu correo:');
localStorage.setItem('email', email);
socket.emit('join', email);

form.addEventListener('submit', e => {
    e.preventDefault();
    if (input.value) {
        socket.emit('chat message', input.value);
        input.value = '';
    }
});

socket.on('message', msg => addMessage(msg));
socket.on('history', data => data.forEach(addMessage));

function addMessage(msg) {
    const item = document.createElement('li');
    item.innerHTML = `<strong>${msg.user}:</strong> ${msg.text}`;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
}

document.getElementById('file').addEventListener('change', async e => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/upload', { method: 'POST', body: formData });
    const data = await res.json();
    socket.emit('chat message', '<a href="' + data.url + '" target="_blank">📎 Archivo</a>');
});

// Sticker support
document.querySelectorAll('.stickers img').forEach(img => {
    img.addEventListener('click', () => {
        socket.emit('chat message', '<img src="' + img.src + '" width="60">');
    });
});