import { RowDataPacket } from 'mysql2';
import { connectDB } from './init_db';
import { Request, Response } from 'express';
import mysql from 'mysql2/promise';

const eloRange = 200;
const elo_K = 20;
const dynamicQuizDescription = 'A dynamic quiz has been generated for you! Test yourself on random topics to improve your knowledge!';

function eloDiff (elo1: number, elo2: number, winner: number) : number[] {
    if (winner > 1) {
        return [-1, -1];
    }
    const p1 = 1.0 / (1.0 + Math.pow(10, ((elo2 - elo1) / 400) ));
    const p2 = 1.0 / (1.0 + Math.pow(10, ((elo1 - elo2) / 400) ));
    return [ Math.max(0, elo1 + elo_K*((1 - winner) - p1)), Math.max(0, elo2 + elo_K*(winner - p2))];
}

async function eloUpdate( req: Request, res: Response ) : Promise<void> {
    if (!req.session || !req.session.user){
        console.log('No user logged in');
        res.status(400).send('No user logged in');
        return;
    }
    if (!req.body || !req.body.questionResults || req.body.questionResults.length == 0){
        console.log('No question results provided');
        res.status(400).send('No question results provided');
        return;
    }
    const connection = await connectDB();
    let userElo = req.session.user.elo;
    let totalElo = 0;

    const userUpdateQuery = 'UPDATE USER SET elo = ? WHERE id = ?';
    const questionUpdateQuery = 'UPDATE QUESTION SET elo = ? WHERE id = ?';
    const quizUpdateQuery = 'UPDATE QUIZ SET totalElo = ? WHERE id = ?';

    for (const { key, winResult } of req.body.questionResults) {
        const [ question ] = await connection.query('SELECT * FROM QUESTION WHERE id = ?', [ Number(key) ]);
        if (!Array.isArray(question) || question.length === 0) {
            res.status(404).send('Missing Question');
            continue;
        }
        if (winResult > 1) { // 1 indicates right user answer, 0 indicates wrong
            console.log('Invalid question result');
            res.status(400).send('Invalid question result');
            continue;
        }
        const [ newQuestionElo, newUserElo ] = eloDiff((question[0] as RowDataPacket).elo, userElo, winResult);
        if (newUserElo < 0 || newQuestionElo < 0) {
            console.log('Invalid elo update');
            continue; 
        }
        totalElo += newQuestionElo;
        userElo = newUserElo;
        const [ resultQuestion, fieldsQuestion ] = await connection.query(questionUpdateQuery, [ newQuestionElo, Number(key) ]);
        if ((resultQuestion as mysql.OkPacket).affectedRows === 0) {
            console.log('Error updating question');
            continue;
        }

    }
    const [ resultUser, fieldsUser ] = await connection.query(userUpdateQuery, [userElo, req.session.user.id]);
    if ((resultUser as mysql.OkPacket).affectedRows === 0) {
        console.log('Error updating user');
        res.status(500).send('Error updating user');
    }
    
    totalElo /= req.body.questionResults.length;
    if (req.body && req.body.quizId && req.body.quizId != 0){ // Checking for dynamic quiz, no quiz update
        const [ resultQuiz, fieldsQuiz ] = await connection.query(quizUpdateQuery, [totalElo, req.body.quizId]);
        if ((resultQuiz as mysql.OkPacket).affectedRows === 0) {
            console.log('Error updating quiz');
            res.status(500).send('Error updating quiz');
        }
    }

    res.status(200).send('Elo updated');

}

async function getDynamicQuiz( req: Request, res: Response ) : Promise<void> {
    const connection = await connectDB();
    if (!req.session || !req.session.user){
        console.log('No user logged in');
        res.status(400).send('No user logged in');
    }
    else {
        if (!req.body || !req.body.questionCount){
            console.log('No question count provided');
            res.status(400).send('No question count provided');
            return;
        }
        const questionCount = req.body.questionCount;
        const userId = req.session.user.id;
        const userLookupQuery = 'SELECT * FROM USER WHERE id = ?';
        const [ rows, fields ] = await connection.query(userLookupQuery, [userId]);
        if (!Array.isArray(rows) || rows.length === 0 ) {
            res.status(401).send('User not found');
            return;
        }
        const elo = (rows[0] as RowDataPacket).elo;
        const questionQuery = 'SELECT * FROM QUESTION WHERE elo < ? AND elo > ? ORDER BY RAND() LIMIT ?';
        const [ questions ] = await connection.query(questionQuery, [elo+eloRange, elo-eloRange, Number(questionCount)]);
        if (!Array.isArray(questions) || questions.length < questionCount) {
            res.status(404).send('Insufficient quizzes found');
            return;
        }
        else {
            const responseObject = {
                'quizId': 0, // Indicating dynamic quiz
                'quizName': '',
                'quizDescription': dynamicQuizDescription,
                'questions': questions
            }
            res.status(200).send({ "0": responseObject } );
            return;
        }
    }
}

async function processQuiz ( quiz: RowDataPacket, connection: mysql.Connection ) : Promise<[Record<string, unknown>, Number]> {
    const quizId = quiz.id;
    const quizName = quiz.name;
    const quizDescription = quiz.description;
    const quizTag = quiz.tag;
    const [ matches ] = await connection.query('SELECT * FROM QUIZ_QUESTIONS WHERE QuizID = ?', [quizId]);
    if (!Array.isArray(matches) || matches.length === 0) {
        return [{}, 0];
    }

    let quizQuestions = [];
    for (const match of matches) {
        try {
            const [ question ] = await connection.query('SELECT * FROM QUESTION WHERE id = ?', [(match as RowDataPacket).QuestionID]);
            if (!Array.isArray(question) || question.length === 0) {
                continue;
            }
            quizQuestions.push( question[0] as RowDataPacket );
        }
        catch (error) {
            console.log(error);
            return [{}, 0];
        }
    }
    const responseObject = {
        'quizId': quizId,
        'quizName': quizName,
        'quizDescription': quizDescription,
        'quizTag': quizTag,
        'questions': quizQuestions
    }
    return [responseObject, quizId];
}

/**
 * Given a user, send a quiz with a random set of questions.
 * If req.body.tag is present, send a quiz with that tag.
 * If req.body.quizCount is present, send that many quizzes.
 * Request must contain a valid user session.
 * 
 * @param req Express request object
 * @param res Express response object
 */
async function getQuiz(req: Request, res: Response): Promise<void> {
    const connection = await connectDB();

    // Check if the user is logged in (uncomment if session management is required)
    // if (!req.session || !req.session.user) {
    //     console.log('No user logged in');
    //     res.status(400).send('No user logged in');
    //     return;
    // }

    const quizID = req.query.quizID ? parseInt(req.query.quizID as string, 10) : null;

    try {
        let quizResults: RowDataPacket[] = [];

        if (quizID) {
            // Fetch the quiz by ID
            const [quizResultsArray] = await connection.query<RowDataPacket[]>('SELECT * FROM QUIZ WHERE id = ?', [quizID]);
            quizResults = quizResultsArray;
        } else {
            // Fetch a random quiz if quizID is not provided
            const [quizResultsArray] = await connection.query<RowDataPacket[]>('SELECT * FROM QUIZ ORDER BY RAND() LIMIT 1');
            quizResults = quizResultsArray;
        }

        if (!Array.isArray(quizResults) || quizResults.length === 0) {
            res.status(404).send('Quiz not found');
            return;
        }

        const quiz = quizResults[0];

        // Process the quiz using `processQuiz`
        const [responseObject, quizId] = await processQuiz(quiz as RowDataPacket, connection);

        if (quizId !== 0) {
            // Structure response as requested
            const response: Record<string, unknown> = {};
            response[String(quizId)] = responseObject;
            res.status(200).send(response);
            return;
        } else {
            res.status(404).send('No questions found for the quiz');
        }
    } catch (error) {
        console.error('Error retrieving quiz:', error);
        res.status(500).send('An error occurred while retrieving the quiz');
    } finally {
        if (connection) {
            connection.end();
        }
    }
}




async function getAllQuizzes(req: Request, res: Response) {
    const connection = await connectDB();

    try {
        const query = `
            SELECT id AS quizId, name AS quizName, description AS quizDescription, 
                   tag AS quizTag, img AS imgUrl, totalElo
            FROM QUIZ;
        `;
        const [quizzes] = await connection.query(query);

        if (!Array.isArray(quizzes) || quizzes.length === 0) {
            res.status(404).send('No quizzes found');
            return;
        }

        res.status(200).send(quizzes);
    } catch (error) {
        console.error('Error retrieving quizzes:', error);
        res.status(500).send('An error occurred while retrieving quizzes');
    } finally {
        if (connection) {
            connection.end();
        }
    }
}



export { getQuiz, eloUpdate, getDynamicQuiz ,getAllQuizzes};