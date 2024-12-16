import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import mysql, { RowDataPacket } from 'mysql2/promise';


import { connectDB } from './init_db';

const baseELO = 1000

async function getLastDate( currDate: string ) : Promise<string> {
    console.log('Input date is ' + currDate);
    const date = new Date(currDate);

    date.setHours(0, 0, 0, 0);
    console.log('Input date raw form is ' + date);
    date.setDate(date.getDate() - 1);
    console.log('Last date raw form is ' + date);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    console.log('Last date is ' + `${year}-${month}-${day}`);
    return `${year}-${month}-${day}`;
}

async function streakUpdate( username: string ) : Promise<boolean> {
    try {
        const connection = await connectDB();
        const checkQuery = 'SELECT STREAK, STREAKDATE FROM USER WHERE username = ?';
        const [ rows ] = await connection.query(checkQuery, [username]);

        if (Array.isArray(rows) && rows.length > 0) {
            const { streak, streakDate } = rows[0] as RowDataPacket;
            console.log('Database date: ' + streakDate);

            const today = new Date();
            const todayString = today.toISOString().split('T')[0];
            console.log("Today's date: " + todayString);

            if (streakDate === todayString) {
                return true;
            }

            if (streakDate === getLastDate(todayString)) {
                const updateStreakQuery = 'UPDATE USER SET STREAK = ?, STREAKDATE = ? WHERE username = ?';
                await connection.query(updateStreakQuery, [streak + 1, todayString, username]);
                return true;
            }

            const updateStreakQuery = 'UPDATE USER SET STREAK = ?, STREAKDATE = ? WHERE username = ?';
            await connection.query(updateStreakQuery, [1, todayString, username]);
            return true;
        }
        else {
            console.log('Invalid username');
            return false;
        }
    }
    catch (error) {
        console.error('Error updating streak:', error);
        return false;
    }
}

async function signup(req: Request, res: Response): Promise<void> {
    const { 
        username, 
        email, 
        firstName, 
        lastName, 
        password, 
        birthdate, 
        country, 
        interests 
    } = req.body;

    // Validate required fields
    if (!username || !email || !firstName || !lastName || !password ) {
        res.status(400).send('All fields (username, email, first name, last name, and password) are required');
        return;
    }

    // Validate interests field
    if (interests && !Array.isArray(interests)) {
        res.status(400).send('Interests must be an array');
        return;
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
        const connection = await connectDB();

        // Check if the username or email already exists
        const checkQuery = 'SELECT * FROM USER WHERE username = ? OR email = ?';
        const [rows] = await connection.query(checkQuery, [username, email]);

        if (Array.isArray(rows) && rows.length > 0) {
            res.status(400).send('Username or email already exists');
            return;
        }

        // Insert new user into the database
        const addQuery = `
            INSERT INTO USER 
            (firstName, lastName, username, email, password, elo, interests, streak, streakDate) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await connection.query(addQuery, [
            firstName,
            lastName,
            username,
            email,
            hashedPassword,
            baseELO,
            interests ? JSON.stringify(interests) : null, // Store interests as JSON or null
            1,
            new Date().toISOString().split('T')[0]
        ]);

        // Check if the user was successfully inserted
        if ((result as any).affectedRows === 0 || !(result as any).insertId) {
            res.status(500).send('Error creating user');
            return;
        }
        // Set the session user
        req.session.user = {
            id: (result as any).insertId,
            username,
            firstName,
            lastName,
            email,
            elo: baseELO,
            interests: interests || [],
            streak: 1
        };
        req.session.save();
        res.status(201).send('User registered successfully');

    } catch (error) {
        console.error('Error inserting user:', error);
        res.status(500).send('Error creating user');
    }
}

async function login( req: Request, res: Response ) : Promise<void> {
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
                    streakUpdate(username);
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
}

async function logout( req: Request, res: Response ) : Promise<void> {
    if (req.session && req.session.user) {
        const username = req.session.user.username;
        req.session.destroy(err => {
            if (err) {
            res.status(400).send('Unable to log out');
            } else {
            console.log('Logout successful for user ' + username);
            res.status(200).send('Logout successful');
            }
        });
    } else {
        console.log('No user logged in');
        res.status(400).send('No user logged in');
    }
}

async function getStreak( req: Request, res: Response ) : Promise<void> {
    if (req.session && req.session.user) {
        const checkQuery = 'SELECT STREAK FROM USER WHERE username = ?';
        const connection = await connectDB();
        const [ rows ] = await connection.query(checkQuery, [req.session.user.username]);
        if (Array.isArray(rows) && rows.length > 0) {
            req.session.user.streak = (rows[0] as RowDataPacket).streak;
        }
        await connection.end();
        res.status(200).json({streak: req.session.user.streak});
        return;
    } else {
        console.log('No user logged in');
        res.status(400).send('No user logged in');
        return;
    }
}

export { login, signup, logout, getStreak };