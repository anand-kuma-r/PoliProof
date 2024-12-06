const fs = require('fs');
const mysql = require('mysql2/promise');

// Database connection
const connectionConfig = {
    host: 'localhost',
    user: 'root',
    database: 'PoliProof',
};

async function clearTables(connection) {
    console.log('Clearing existing data...');
    await connection.execute('DELETE FROM QUIZ_QUESTIONS');
    await connection.execute('DELETE FROM QUESTION');
    await connection.execute('DELETE FROM QUIZ');
    console.log('Data cleared.');
}

async function loadQuizzesFromJSON(filename) {
    let connection;
    try {
        // Connect to the database
        connection = await mysql.createConnection(connectionConfig);

        // Clear all tables
        await clearTables(connection);

        // Load quizzes from JSON
        const data = fs.readFileSync(filename, 'utf8');
        const quizzes = JSON.parse(data);

        for (const quizData of quizzes) {
            const { name, description, tag, img_url, questions } = quizData.quiz;

            let totalElo = 0; // Initialize total elo for the quiz
            const questionIds = []; // Array to store question IDs for this quiz

            for (const questionData of questions) {
                const {
                    question,
                    optionA,
                    optionB,
                    optionC,
                    optionD,
                    correctAnswer,
                    elo,
                } = questionData;

                // Insert the question into the QUESTION table
                const [questionResult] = await connection.execute(
                    'INSERT INTO QUESTION (question, optionA, optionB, optionC, optionD, correctAnswer, elo) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [
                        question,
                        optionA,
                        optionB,
                        optionC,
                        optionD,
                        correctAnswer,
                        elo,
                    ]
                );
                const questionId = questionResult.insertId;
                questionIds.push(questionId); // Store the question ID

                console.log(
                    `Inserted Question: "${question}" (ID: ${questionId})`
                );

                // Add the question's elo to the total elo for the quiz
                totalElo += elo;
            }

            // Insert the quiz into the QUIZ table with the calculated total elo
            const [quizResult] = await connection.execute(
                'INSERT INTO QUIZ (name, description, tag, img, totalElo) VALUES (?, ?, ?, ?, ?)',
                [name, description, tag, img_url, totalElo]
            );
            const quizId = quizResult.insertId;

            console.log(`Inserted Quiz: ${name} (ID: ${quizId})`);

            // Link the quiz and its questions in the QUIZ_QUESTIONS table
            for (const questionId of questionIds) {
                await connection.execute(
                    'INSERT INTO QUIZ_QUESTIONS (QuizID, QuestionID) VALUES (?, ?)',
                    [quizId, questionId]
                );
            }
        }

        console.log('Quizzes loaded successfully.');
    } catch (error) {
        console.error('Error loading quizzes:', error);
    } finally {
        // Close the database connection
        if (connection) {
            await connection.end();
        }
    }
}

// Load the JSON file and insert quizzes
loadQuizzesFromJSON('quizzes.json');
