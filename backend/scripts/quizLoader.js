var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var fs = require('fs');
var mysql = require('mysql2');
// Database connection
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'PoliProof'
});
var charToInt = {
    'A': 0,
    'B': 1,
    'C': 2,
    'D': 3
};
var Question = /** @class */ (function () {
    function Question(question) {
        this.question = question;
        this.options = {};
        this.correctAnswer = 0;
    }
    Question.prototype.addOption = function (key, option) {
        this.options[key] = option;
    };
    Question.prototype.setCorrectAnswer = function (answer) {
        this.correctAnswer = charToInt[answer];
    };
    Question.prototype.display = function () {
        console.log(this.question);
        console.log('A:', this.options.A);
        console.log('B:', this.options.B);
        console.log('C:', this.options.C);
        console.log('D:', this.options.D);
    };
    return Question;
}());
var baseELO = 1000;
// Function to load quizzes from file and insert into database
function loadQuizzesFromFile(filename) {
    return __awaiter(this, void 0, void 0, function () {
        var data, quizzes, _i, quizzes_1, quiz, lines, quizName, quizDescription, tag, questions, currentQuestion, i, line, key, option, quizResult, quizId, error_1, _a, questions_1, question, checkResult, questionId, questionResult, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 16, 17, 18]);
                    data = fs.readFileSync(filename, 'utf8');
                    quizzes = data.split('\n\n').map(function (quiz) { return quiz.trim(); });
                    _i = 0, quizzes_1 = quizzes;
                    _b.label = 1;
                case 1:
                    if (!(_i < quizzes_1.length)) return [3 /*break*/, 15];
                    quiz = quizzes_1[_i];
                    lines = quiz.split('\n').map(function (line) { return line.trim(); });
                    quizName = lines[0].split(':')[1].trim();
                    quizDescription = lines[1].split(':')[1].trim();
                    tag = lines[2].split(':')[1].trim();
                    questions = [];
                    currentQuestion = new Question('');
                    // Loop through each line and build questions
                    for (i = 3; i < lines.length; i++) {
                        line = lines[i];
                        if (line.startsWith('QUESTION:')) {
                            currentQuestion = new Question(line.split(':')[1].trim());
                        }
                        else if (line.startsWith('OPTION')) {
                            key = line.split(':')[0].split(' ')[1].trim();
                            option = line.split(':')[1].trim();
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
                    return [4 /*yield*/, connection.promise().query('SELECT * FROM QUIZ WHERE name = ?', [quizName])];
                case 2:
                    quizResult = (_b.sent())[0];
                    if (quizResult.length > 0) {
                        return [3 /*break*/, 14];
                    }
                    if (quizName.length > 100 || quizDescription.length > 2000) {
                        console.log("Quiz name or description too long: " + quizName);
                        return [3 /*break*/, 14];
                    }
                    quizId = 0;
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, connection.promise().execute('INSERT INTO QUIZ (name, description, tag, totalElo) VALUES (?, ?, ?, ?)', [quizName, quizDescription, tag, baseELO])];
                case 4:
                    quizResult = (_b.sent())[0];
                    console.log(quizResult.insertId);
                    quizId = quizResult.insertId;
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _b.sent();
                    console.log("Error inserting quiz: " + ((error_1 instanceof Error) ? error_1.message : error_1));
                    return [3 /*break*/, 14];
                case 6:
                    console.log("quizId: " + quizId);
                    console.log(questions);
                    _a = 0, questions_1 = questions;
                    _b.label = 7;
                case 7:
                    if (!(_a < questions_1.length)) return [3 /*break*/, 14];
                    question = questions_1[_a];
                    return [4 /*yield*/, connection.promise().query('SELECT * FROM QUESTION WHERE question LIKE ?', [question.question])];
                case 8:
                    checkResult = (_b.sent())[0];
                    questionId = 0;
                    if (!(checkResult.length != 0)) return [3 /*break*/, 9];
                    questionId = checkResult[0].id;
                    return [3 /*break*/, 11];
                case 9: return [4 /*yield*/, connection.promise().query('INSERT INTO QUESTION (question, optionA, optionB, optionC, optionD, correctAnswer, elo) VALUES (?, ?, ?, ?, ?, ?, ?)', [
                        question.question,
                        question.options['A'],
                        question.options['B'],
                        question.options['C'],
                        question.options['D'],
                        question.correctAnswer,
                        baseELO
                    ])];
                case 10:
                    questionResult = (_b.sent())[0];
                    questionId = questionResult.insertId;
                    _b.label = 11;
                case 11: 
                // Link quiz and question in the QUIZ_QUESTIONS table
                return [4 /*yield*/, connection.promise().query('INSERT INTO QUIZ_QUESTIONS (QuizID, QuestionID) VALUES (?, ?)', [quizId, questionId])];
                case 12:
                    // Link quiz and question in the QUIZ_QUESTIONS table
                    _b.sent();
                    _b.label = 13;
                case 13:
                    _a++;
                    return [3 /*break*/, 7];
                case 14:
                    _i++;
                    return [3 /*break*/, 1];
                case 15:
                    console.log('Quizzes loaded successfully');
                    return [3 /*break*/, 18];
                case 16:
                    error_2 = _b.sent();
                    console.error('Error loading quizzes:', error_2);
                    return [3 /*break*/, 18];
                case 17:
                    // Close the database connection
                    connection.end();
                    return [7 /*endfinally*/];
                case 18: return [2 /*return*/];
            }
        });
    });
}
loadQuizzesFromFile('quizzes.txt');
