const fs = require('fs');
const mysql = require('mysql2');

// Database connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'PoliProof'
});

const charToInt = {
    'A': 0,
    'B': 1,
    'C': 2,
    'D': 3
}

class Question {
    question: string;
    options: { [key: string]: string };
    correctAnswer: number;
    constructor(question : string) {
        this.question = question;
        this.options = {};
        this.correctAnswer = 0;
    }

    addOption(key : string, option : string) {
        this.options[key] = option;
    }

    setCorrectAnswer(answer : string) {
        this.correctAnswer = charToInt[answer];
    }

    display() {
        console.log(this.question);
        console.log('A:', this.options.A);
        console.log('B:', this.options.B);
        console.log('C:', this.options.C);
        console.log('D:', this.options.D);
    }
}

const baseELO = 1000;
// Function to load quizzes from file and insert into database
async function loadQuizzesFromFile(filename) {
    try {
    // Read file content
    const data = fs.readFileSync(filename, 'utf8');

    // Split the file into individual quizzes based on two newlines
    const quizzes = data.split('\n\n').map((quiz) => quiz.trim());

    for (const quiz of quizzes) {
        // Parse each quiz by splitting by the defined sections
        const lines = quiz.split('\n').map((line: string) => line.trim());
        const quizName = lines[0].split(':')[1].trim();
        const quizDescription = lines[1].split(':')[1].trim();
        const tag = lines[2].split(':')[1].trim();
        const questions : Question[] = [];
        let currentQuestion = new Question('');

        // Loop through each line and build questions
        for (let i = 3; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.startsWith('QUESTION:')) {
                currentQuestion = new Question(line.split(':')[1].trim());
            } 
            else if (line.startsWith('OPTION')) {
                const key = line.split(':')[0].split(' ')[1].trim();
                const option = line.split(':')[1].trim();
                currentQuestion.addOption(key, option);
            } 
            else if (line.startsWith('CORRECT ANSWER:')) {
                currentQuestion.setCorrectAnswer(line.split(':')[1].trim());
                questions.push(currentQuestion);
            } 
            else {
                continue;
            }
        }

        let [ quizResult ] = await connection.promise().query( 'SELECT * FROM QUIZ WHERE name = ?', [quizName]);
        if (quizResult.length > 0) {
            continue;
        }

        if (quizName.length > 100 || quizDescription.length > 2000) {
            console.log("Quiz name or description too long: " + quizName);
            continue;
        }

        let quizId = 0;
        try {
            [ quizResult ] = await connection.promise().execute(
                'INSERT INTO QUIZ (name, description, tag, totalElo) VALUES (?, ?, ?, ?)',
                [quizName, quizDescription, tag, baseELO]
            );
            console.log(quizResult.insertId)
            quizId = quizResult.insertId;
        }
        catch (error) {
            console.log("Error inserting quiz: " + ((error instanceof Error) ? error.message : error));
            continue;
        }

        console.log("quizId: " + quizId);
        console.log(questions);

        for (const question of questions) {
            const [ checkResult ] = await connection.promise().query( 'SELECT * FROM QUESTION WHERE question LIKE ?', [question.question]);
            let questionId = 0;
            if (checkResult.length != 0) {
                questionId = checkResult[0].id;
            }
            else
            {
                const [questionResult] = await connection.promise().query(
                    'INSERT INTO QUESTION (question, optionA, optionB, optionC, optionD, correctAnswer, elo) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [
                        question.question,
                        question.options['A'],
                        question.options['B'],
                        question.options['C'],
                        question.options['D'],
                        question.correctAnswer,
                        baseELO
                    ]
                );
    
                questionId = questionResult.insertId;
            }            
            

            // Link quiz and question in the QUIZ_QUESTIONS table
            await connection.promise().query(
                'INSERT INTO QUIZ_QUESTIONS (QuizID, QuestionID) VALUES (?, ?)',
                [quizId, questionId]
            );
        }
    }

    console.log('Quizzes loaded successfully');
    } catch (error) {
    console.error('Error loading quizzes:', error);
    } finally {
    // Close the database connection
    connection.end();
    }
}

loadQuizzesFromFile('quizzes.txt');