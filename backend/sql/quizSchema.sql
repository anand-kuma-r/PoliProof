CREATE TABLE IF NOT EXISTS QUIZ (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(2000) NOT NULL
);

CREATE TABLE IF NOT EXISTS QUESTION (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    question VARCHAR(10000) NOT NULL,
    optionA VARCHAR(1000) NOT NULL,
    optionB VARCHAR(1000) NOT NULL,
    optionC VARCHAR(1000) NOT NULL,
    optionD VARCHAR(1000) NOT NULL,
    correctAnswer INT NOT NULL,
    elo FLOAT NOT NULL
);

CREATE TABLE IF NOT EXISTS QUIZ_QUESTIONS (
    QuizID INT NOT NULL,
    QuestionID INT NOT NULL,
    PRIMARY KEY (QuizID, QuestionID),
    FOREIGN KEY (QuizID) REFERENCES QUIZ(id) ON DELETE CASCADE,
    FOREIGN KEY (QuestionID) REFERENCES QUESTION(id) ON DELETE CASCADE
);