# PoliProof: Gamifying Knowledge and Fighting Misinformation  

PoliProof is a real-time, interactive quiz application designed to make learning about important political, social, and economic topics engaging and impactful. By gamifying the learning experience, PoliProof empowers users to test their knowledge, compete with others, and earn a credibility score—called the **Ethos Meter**—that reflects their understanding of critical issues. The project aims to foster informed discussions and reduce misinformation, especially on social media platforms.

---

## Features
- **Real-Time Quizzes**: Compete against others in fast-paced, live quiz matches.
- **Ethos Meter**: Earn a credibility score based on your accuracy and performance across various topics.
- **Gamified Learning**: Experience a fun, competitive way to expand your knowledge with detailed feedback on answers.
- **Progress Tracking**: Monitor your growth and identify areas for improvement.
- **Social Accountability**: Share your Ethos Meter score to establish credibility in online discussions.

---

## Tech Stack
PoliProof is a full-stack application built with the following technologies:

### **Frontend**  
- **React Native**: For building a responsive and user-friendly mobile interface.  
- **Expo**: For rapid mobile app development and testing.  
- **TypeScript**: To improve code quality and maintainability.

### **Backend**  
- **Node.js**: To handle server-side logic and APIs.  
- **Express**: To manage routes, user authentication, and quiz logic.  
- **WebSocket**: For real-time communication between players during live quizzes.  
- **MySQL**: For managing user data, quiz questions, and Ethos Meter scores.

### **Other Tools**  
- **Redis**: To manage real-time match state and session data efficiently.  
- **ngrok**: To enable local testing of the app on mobile devices during development.

---

## How It Works
1. **Matchmaking**: Players are matched in real time to compete in quizzes.  
2. **Gameplay**: Each player answers the same set of questions. Points are awarded based on accuracy and speed.  
3. **Ethos Meter**: Players earn credibility scores based on their performance, which can be shared online to showcase expertise.  
4. **Learning and Growth**: Feedback on answers helps players deepen their knowledge, making the experience educational as well as competitive.  

---

## Project Structure
This project consists of two main repositories:

### 1. **Frontend**
- The React Native-based mobile app that users interact with.
- Features include:
  - User authentication
  - Quiz participation
  - Score tracking and feedback
- **Setup Instructions**: Refer to the `README` in the `frontend` directory.

### 2. **Backend**
- The Node.js server managing APIs, real-time quiz logic, and database interactions.
- Features include:
  - Matchmaking using Node
  - WebSocket integration for live gameplay
  - Secure user authentication
- **Setup Instructions**: Refer to the `README` in the `backend` directory.

---

## Getting Started

### **Prerequisites**
Before running PoliProof locally, ensure you have the following installed:
- **Node.js**: For running the backend server.
- **MySQL**: For managing the database.
- **Expo CLI**: For building and testing the React Native app.

### **Steps to Run Locally**
1. there are more `README` files in the `frontend` and `backend` directories explaining how to set up each of those up on ur own.
