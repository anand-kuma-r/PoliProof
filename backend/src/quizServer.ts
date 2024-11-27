import { connectDB } from './init_db';
import { Request, Response } from 'express';

const eloRange = 200;

async function getQuiz( req: Request, res: Response ) : Promise<void> {
    const connection = await connectDB();
    if (!req.session || !req.session.user){
        console.log('No user logged in');
        res.status(400).send('No user logged in');
    }
    else {
        const userId = req.session.user.id;
        const userLookupQuery = 'SELECT * FROM USER WHERE id = ?';
        const [ rows, fields ] = await connection.query(userLookupQuery, [userId]);
        if (!Array.isArray(rows) || rows.length === 0 || !('password' in rows[0]) ) {
            res.status(401).send('User not found');
            return;
        }
        else {
            const elo = rows[0].elo;
            const quizQuery = 'SELECT * FROM QUIZ WHERE totalElo < ? AND totalElo > ? ORDER BY RAND() LIMIT 1';
            const [ quiz ] = await connection.query(quizQuery, [elo+eloRange, elo-eloRange]);
            if (!Array.isArray(quiz) || quiz.length === 0) {
                res.status(404).send('No quizzes found');
                return;
            }
            else {
                res.status(200).send(quiz[0]);
                return;
            }
        }
    }
}

export { getQuiz };