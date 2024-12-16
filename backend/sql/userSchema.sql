CREATE TABLE IF NOT EXISTS USER (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    elo FLOAT NOT NULL,
    interests JSON DEFAULT NULL,
    streak INT DEFAULT 0,
    streakDate VARCHAR(20) DEFAULT NULL,
    pastQuizzes JSON DEFAULT NULL,  -- Added to store an array of quiz IDs
    liveQuizzes JSON DEFAULT NULL     -- Added to store an array of objects with user IDs and timestamps
);