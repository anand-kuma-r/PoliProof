import { RowDataPacket } from 'mysql2';
import { connectDB } from './init_db';
import { Request, Response } from 'express';

const eloRange = 200;
const elo_K = 40;

function eloDiff (elo1: number, elo2: number, winner: number) : number[] {
    if (winner > 1) {
        return [-1, -1];
    }
    const p1 = 1.0 / (1.0 + Math.pow(10, ((elo1 - elo2) / 400) ));
    const p2 = 1.0 / (1.0 + Math.pow(10, ((elo2 - elo1) / 400) ));
    return [ Math.max(0, elo1 + elo_K*( (1.0 - winner) - p1)), Math.max(0, elo2 + elo_K*(winner - p2))];
}

async function eloUpdate( req: Request, res: Response ) : Promise<void> {
    const connection = await connectDB();
}

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
                const quizId = (quiz[0] as RowDataPacket ).id;
                const quizName = (quiz[0] as RowDataPacket ).name;
                const quizDescription = (quiz[0] as RowDataPacket ).description;
                const [ matches ] = await connection.query('SELECT * FROM QUIZ_QUESTIONS WHERE QuizID = ?', [quizId]);
                if (!Array.isArray(matches) || matches.length === 0) {
                    res.status(404).send('No questions found');
                    return;
                }

                let quizQuestions = [];
                for (const match of matches) {
                    try {
                        const [ question ] = await connection.query('SELECT * FROM QUESTION WHERE id = ?', [(match as RowDataPacket).QuestionID]);
                        if (!Array.isArray(question) || question.length === 0) {
                            res.status(404).send('Missing Question');
                            continue;
                        }
                        quizQuestions.push( question[0] as RowDataPacket );
                    }
                    catch (error) {
                        console.log(error);
                        res.status(404).send('Missing Question');
                    }
                }
                const responseObject = {
                    'quizName': quizName,
                    'quizDescription': quizDescription,
                    'questions': quizQuestions
                }
                res.status(200).send(responseObject);
                return;
            }
        }
    }
}

export { getQuiz, eloUpdate };