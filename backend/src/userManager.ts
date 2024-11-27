import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';


import { connectDB } from './init_db';

const baseELO = 1000

async function signup( req: Request, res: Response ) : Promise<void> {
    const { username, firstName, lastName, password } = req.body;
  
    // Validate the input (you can add more validation here)
    if (!username || !firstName || !lastName || !password) {
      res.status(400).send('username, firstName, lastName, and password are required');
      return;
    }
  
    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const connection = await connectDB();

        const checkQuery = 'SELECT * FROM USER WHERE username = ?';
        const [ rows ] = await connection.query(checkQuery, [username]);
        if (Array.isArray(rows) && rows.length > 0) {
            console.error('User already exists');
            res.status(400).send('User already exists');
            return;
        }

        // Save the new user to the database
        const addQuery = 'INSERT INTO user (firstName, lastName, username, password, elo) VALUES (?, ?, ?, ?, ?)';
        let [ result, fields ] = await connection.query(addQuery, [firstName, lastName, username, hashedPassword, baseELO]);
        if ((result as mysql.OkPacket).affectedRows === 0 || !(result as mysql.OkPacket).insertId) {
            console.error('Error inserting user');
            res.status(500).send('Error creating user');
            return;
        }
        else {
            console.log('User registered successfully');
            req.session.user = {
                username,
                firstName,
                lastName,
                elo: baseELO,
            };
            req.session.save();
            res.status(201).send('User registered successfully');
            return;
        }
    }
    catch (error) {
        console.error('Error inserting user:', error);
        res.status(500).send('Error creating user');
        return;
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

export { login, signup };