const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

// Cargar historial de mensajes
let history = [];
const historyFile = './data/messages.json';
if (fs.existsSync(historyFile)) {
    history = JSON.parse(fs.readFileSync(historyFile));
}

// Almacenar mensajes por socket
let users = {};

io.on('connection', socket => {
    socket.emit('history', history);

    socket.on('join', email => {
        users[socket.id] = email;
        const msg = { user: 'Servidor', text: email + ' se ha unido.' };
        history.push(msg);
        io.emit('message', msg);
        saveHistory();
    });

    socket.on('chat message', msg => {
        const user = users[socket.id] || 'Anónimo';
        const message = { user, text: msg };
        history.push(message);
        io.emit('message', message);
        saveHistory();
    });

    socket.on('disconnect', () => {
        const user = users[socket.id];
        if (user) {
            const msg = { user: 'Servidor', text: user + ' se ha ido.' };
            history.push(msg);
            io.emit('message', msg);
            saveHistory();
        }
        delete users[socket.id];
    });
});

function saveHistory() {
    fs.writeFileSync(historyFile, JSON.stringify(history.slice(-100)));
}

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
    res.json({ url: '/uploads/' + req.file.filename });
});

http.listen(PORT, () => {
    console.log('Servidor escuchando en puerto', PORT);
});