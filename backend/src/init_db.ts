import e from 'express';
import mysql from 'mysql2/promise';
const fs = require('fs');

async function initDB() {
    let connection : mysql.Connection;
    try {
        console.log('Database Setup');

        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            // debug: true // Remove for production
            // Insert 'password': 'password' here if added
        });

        // Log the SQL query before executing  
        connection.on('query', (query : mysql.Query) => {
            console.log('Executing SQL query:', query.sql);
        });


        // Optionally create the database if it doesn't exist
        await connection.query('CREATE DATABASE IF NOT EXISTS PoliProof');

        // Connect to the 'test' database
        await connection.changeUser({ database: 'PoliProof' });
    }
    catch (error){
        console.log("Error creating database: " + ((error instanceof Error) ? error.message : error));
        return error;
    }
    console.log("Database connected");
    try {
        console.log('User and Quiz Setup');
        const userSQL = fs.readFileSync('sql/userSchema.sql', 'utf8');
        const quizSQL = fs.readFileSync('sql/quizSchema.sql', 'utf8').split(';');
    
        let result = await connection.query(userSQL);

        for (let i = 0; i < quizSQL.length-1; i++) {
            result = await connection.query(quizSQL[i]);
        }
        await connection.end()
    }
    catch (error){
        console.log("Error creating database: " + ((error instanceof Error) ? error.message : error));
        return error;
    }
    console.log("Database setup complete");
    return undefined;

}

export default initDB;