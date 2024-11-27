import express, { Request, Response } from 'express';
import session, { SessionData } from 'express-session';
import bodyParser from 'body-parser';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

import { initDB } from './init_db';
import { login, signup } from './userManager';

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

/*
async (req: Request, res: Response) : Promise<void> => {
    const { username, password } = req.body;

    const userLookupQuery = 'SELECT * FROM USER WHERE username = ?';

    const connection = await connectDB();
    
    try {
        const [ rows, fields ] = await connection.query(userLookupQuery, [username]);
        if (!Array.isArray(rows) || rows.length === 0 || !('password' in rows[0]) ) {
            res.status(401).send('Invalid username or password');
            return;
        }
        else {
            try {
                const result = await bcrypt.compare(password, rows[0].password);
                if (!result) {
                    console.log('Password is incorrect');
                    res.status(401).send('Invalid username or password');
                    return;
                }
                else {
                    req.session.user = rows[0];
                    req.session.save();
                    console.log('Login successful');
                    res.status(200).send('Login successful');
                    return;
                }
            }
            catch (error) {
                console.log(error);
                res.status(401).send('Invalid username or password');
                return;
            }
        }
    }
    catch (error) {
        res.status(401).send('User lookup failed');
        return;
    }
    finally {
        await connection.end();
    }
  });

*/

app.post('/signup', signup);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});