import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, Text } from 'react-native';
import { Title, Button, TouchableRipple } from 'react-native-paper';
import { useRoute } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');

interface Question {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: number;
}

interface Quiz {
  quizId: number;
  quizName: string;
  questions: Question[];
}

const LiveQuizScreen = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [progress, setProgress] = useState(new Animated.Value(0));
  const [playerScore, setPlayerScore] = useState(0);
  const [completedTime, setCompletedTime] = useState<number | null>(null);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [opponentScore, setOpponentScore] = useState(0);
  const [opponentCompletedTime, setOpponentCompletedTime] = useState<number | null>(null);
  const [opponentFinished, setOpponentFinished] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const route = useRoute();
  const token = (route.params as { token?: string })?.token;

  useEffect(() => {
    const fetchQuiz = async (quizID = 16) => {
      try {
        const url = `${Constants.expoConfig?.extra?.API_URL}/get-quiz?quizID=${quizID}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const quizId = Object.keys(data)[0];
          const quizObject = data[quizId];
          if (quizObject) setQuiz(quizObject);
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
      }
    };
    fetchQuiz();

    if (!token) {
      console.error('Token not passed to LiveQuizScreen');
      return;
    }

    const socketString = `${Constants.expoConfig?.extra?.WS_URL}?token=${token}`;
    const newSocket = new WebSocket(socketString);

    newSocket.onopen = () => console.log('WebSocket connection established');

    newSocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Message received:', message);

      if (message.type === 'QUIZ_COMPLETED') {
        setOpponentScore(message.score);
        setOpponentCompletedTime(message.completedTime);
        setOpponentFinished(true);
        checkWinner(message.score, message.completedTime);
      }
    };

    setSocket(newSocket);
    return () => newSocket.close();
  }, [token]);

  const handleNavigateToProfile = () => {
    navigation.navigate('Profile2');
  };

  const handleAnswerSelection = (answer: number) => {
    if (!socket || isQuizFinished) return;

    const currentQuestion = quiz?.questions[currentQuestionIndex];
    const isCorrect = currentQuestion?.correctAnswer === answer + 1;

    setPlayerScore((prevScore) => (isCorrect ? prevScore + 1 : prevScore));
    setUserAnswers((prev) => [...prev, answer]);

    if (currentQuestionIndex + 1 < (quiz?.questions.length || 0)) {
      setCurrentQuestionIndex((prev) => prev + 1);
      Animated.timing(progress, {
        toValue: (currentQuestionIndex + 1) / (quiz?.questions.length || 1),
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      // Quiz Finished
      const finishTime = Date.now();
      setCompletedTime(finishTime);
      setIsQuizFinished(true);

      socket.send(
        JSON.stringify({
          type: 'QUIZ_COMPLETED',
          score: playerScore + (isCorrect ? 1 : 0),
          completedTime: finishTime,
        })
      );

      console.log('Quiz completed, score sent to opponent');
    }
  };

  const checkWinner = (opponentScore: number, opponentTime: number) => {
    if (isQuizFinished && opponentFinished) {
      console.log('Both players have finished');
      if (playerScore > opponentScore) {
        console.log('You win!');
      } else if (playerScore < opponentScore) {
        console.log('Opponent wins!');
      } else if (completedTime! < opponentTime) {
        console.log('You win by time!');
      } else {
        console.log('Opponent wins by time!');
      }
      updateElo(playerScore, quiz?.questions.length || 0);
    }
  };

  const updateElo = async (score: number, totalQuestions: number) => {
    const percentage = (score / totalQuestions) * 100;
    const requestBody = {
      quizId: quiz?.quizId ?? 0, // Use optional chaining and provide a default value
      score, // Player's score
      percentage, // Calculate percentage for Elo update
    };

    try {
      const response = await fetch(`${Constants.expoConfig?.extra?.API_URL}/elo-update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error('Failed to update Elo:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating Elo:', error);
    }
  };

  if (!quiz) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <View style={styles.container}>
      <Title style={styles.title}>{quiz.quizName}</Title>
      <Animated.View
        style={[
          styles.progressBar,
          { width: progress.interpolate({ inputRange: [0, 1], outputRange: [0, width] }) },
        ]}
      />
      <Text style={styles.questionText}>{currentQuestion.question}</Text>
      <View style={styles.optionsContainer}>
        {[0, 1, 2, 3].map((optionIndex) => (
          <TouchableRipple
            key={optionIndex}
            onPress={() => handleAnswerSelection(optionIndex)}
            style={styles.optionButton}
          >
            <Text>{currentQuestion[`option${String.fromCharCode(65 + optionIndex)}` as keyof Question]}</Text>
          </TouchableRipple>
        ))}
      </View>
      {isQuizFinished && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>Your Score: {playerScore}</Text>
          <Text style={styles.resultText}>
            Opponent's Score: {opponentScore !== null ? opponentScore : 'Waiting...'}
          </Text>
          {opponentFinished && (
            <Text style={styles.resultText}>
              {playerScore > opponentScore
                ? 'You Win!'
                : playerScore < opponentScore
                ? 'Opponent Wins!'
                : completedTime! < opponentCompletedTime!
                ? 'You Win by Time!'
                : 'Opponent Wins by Time!'}
            </Text>
          )}
          <Button mode="contained" onPress={handleNavigateToProfile} style={styles.navigateButton}>
            Go to Profile
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 22,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#6200ea',
    borderRadius: 4,
    marginBottom: 16,
  },
  questionText: {
    fontSize: 18,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '600',
  },
  optionsContainer: {
    marginVertical: 16,
  },
  optionButton: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  resultContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#555',
  },
  navigateButton: {
    marginTop: 16,
    padding: 10,
    backgroundColor: '#6200ea', // Example color
    borderRadius: 8,
  },
});

export default LiveQuizScreen;
