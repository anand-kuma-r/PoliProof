import express, { application, Request, Response } from 'express';
import session, { SessionData } from 'express-session';
import bodyParser from 'body-parser';

import http from 'http';
import { WebSocket } from 'ws';

import { initDB } from './init_db';
import { login, signup, logout } from './userManager';
import { getQuiz, eloUpdate, getDynamicQuiz, getAllQuizzes } from './quizServer';
import { handleWebSocketConnection, endGame } from './webRTC';
import { MatchmakingManager } from './matchmakingManager';

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

const matchmakingManager = new MatchmakingManager();

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

app.delete('/end-game', endGame);

app.post('/joinMatchmaking', (req: Request, res: Response) => {
    if (!req.body || !req.body.username) {
        res.status(400).send('No username provided');
        return;
    }
    matchmakingManager.addToQueue(req.body.username);
    res.status(200).send('Matchmaking joined');
});

/**
 * Get token for a user to connect to the game
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @returns {Response}
 * 200: Token is sent
 * 400: No username is provided
 * 202: Match not made yet, token is not sent
 */
app.patch('/getToken', (req: Request, res: Response) => {
    if (!req.body || !req.body.username) {
        res.status(400).send('No username provided');
        return;
    }
    const token = matchmakingManager.getToken(req.body.username);
    if (!token) {
        res.status(202).send('Match not made yet');
        return;
    }
    res.status(200).send(token);
});

// MAKE SURE TO LEAVE MATCHMAKING BEFORE STARTING GAME
app.delete('/leaveMatchmaking', (req: Request, res: Response) => {
    if (!req.body || !req.body.username) {
        res.status(400).send('No username provided');
        return;
    }
    matchmakingManager.clearToken(req.body.username);
    res.status(200).send('Token cleared');
});

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

wss.on('connection', handleWebSocketConnection);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
