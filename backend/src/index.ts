import express, { Request, Response } from 'express';
import session, { SessionData } from 'express-session';
import bodyParser from 'body-parser';

import http from 'http';
import { WebSocket } from 'ws';

import { initDB } from './init_db';
import { login, signup, logout } from './userManager';
import { getQuiz, eloUpdate, getDynamicQuiz, getAllQuizzes } from './quizServer';
import { handleWebSocketConnection } from './webRTC';

require('dotenv').config();

const greet = (name: string): string => {
    return `'Ello, ${name}!`
};

console.log(greet("Bruv"));

initDB();

// Route handlers
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

if (!process.env.LOGIN_KEY) {
    throw new Error('Login key environment variable is not set');
}

app.use(
    session({
        secret: process.env.LOGIN_KEY,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
    })
);


app.all('/', (req: Request, res: Response) => {
    res.send('Hello World!');
});

// Login route to authenticate user
app.post('/login', login);

app.all('/iii', (req: Request, res: Response) => {res.send('CHECKEMEMEME');});

app.post('/signup', signup);

app.post('/logout', logout);

app.get('/get-quiz', getQuiz);

app.get('/get-dynamic-quiz', getDynamicQuiz);

app.get('/get-all-quizzes', getAllQuizzes);

app.put('/elo-update', eloUpdate);

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

wss.on('connection', handleWebSocketConnection);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
