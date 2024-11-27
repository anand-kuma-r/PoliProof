import express, { Request, Response } from 'express';
import session, { SessionData } from 'express-session';
import bodyParser from 'body-parser';

import { initDB } from './init_db';
import { login, signup, logout } from './userManager';
import { getQuiz, eloUpdate } from './quizServer';

require('dotenv').config();

const greet = (name: string): string => {
    return `'Ello, ${name}!`
}

console.log(greet("Bruv"))

initDB();

// Route handlers
const app = express()

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


const port = 3000

app.all('/', (req: Request, res: Response) => {
    res.send('Hello World!')
})

// Login route to authenticate user
app.post('/login', login);

app.post('/signup', signup);

app.post('/logout', logout);

app.get('/get-quiz', getQuiz);

app.put('/elo-update', eloUpdate);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});