import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Title, Text, Button, TouchableRipple } from 'react-native-paper';
import Constants from 'expo-constants';
import { useRoute, RouteProp } from '@react-navigation/native';

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
  quizDescription: string;
  questions: Question[];
}

type QuizScreenParams = {
  quizId: number;
};

type QuizScreenRouteProp = RouteProp<{ Quiz: QuizScreenParams }, 'Quiz'>;

export default function QuizScreen({ navigation }: { navigation: any }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [progress, setProgress] = useState(new Animated.Value(0));
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const route = useRoute<QuizScreenRouteProp>();
  const { quizId } = route.params;

  useEffect(() => {
    const fetchQuiz = async (quizID = quizId) => {
      try {
        const url = `${Constants.expoConfig?.extra?.API_URL}/get-quiz?quizID=${quizID}`
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();

          // Extract quiz object from the response format
          const quizId = Object.keys(data)[0]; // Extract the first quizId
          const quizObject = data[quizId]; // Access the corresponding quiz object

          if (quizObject) {
            setQuiz(quizObject);
          } else {
            console.error('No quiz found in response');
          }
        } else {
          console.error('Failed to fetch quiz');
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
      }
    };

    fetchQuiz();
  }, []);

  const handleAnswerSelection = (answer: string) => {
    setSelectedAnswer(answer);
    const answerIndex = ['A', 'B', 'C', 'D'].indexOf(answer);

    setUserAnswers((prevAnswers) => {
        const newAnswers = [...prevAnswers];
        newAnswers[currentQuestionIndex] = answerIndex; // Update user's answer for the current question
        return newAnswers;
    });

    // Handle next question or finish quiz
    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
        setTimeout(() => {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedAnswer(null);
            Animated.timing(progress, {
                toValue: (currentQuestionIndex + 1) / (quiz?.questions.length || 1),
                duration: 200,
                useNativeDriver: false,
            }).start();
        }, 1000); // Simulate delay for feedback
    } else {
        // Update progress for the final question and navigate to results
        setTimeout(() => {
          Animated.timing(progress, {
              toValue: 91, // Fully completed
              duration: 200,
              useNativeDriver: false,
          }).start(async () => {
              if (quiz) {
                  const correctAnswers = quiz.questions.map((q) => q.correctAnswer);
                  let score = userAnswers.reduce((acc, answer, index) => {
                      return acc + (answer === (correctAnswers[index] - 1) ? 1 : 0); // Adjust index
                  }, 0);
      
                  // Add the last question's score (if not already included)
                  const lastAnswer = answerIndex;
                  if (lastAnswer === (correctAnswers[currentQuestionIndex] - 1)) {
                      score += 1;
                  }
      
                  // Update Elo after calculating the score
                  await updateElo(score, quiz.questions.length);
      
                  navigation.navigate('Results', { score, totalQuestions: quiz.questions.length });
              }
          });
      }, 1000);
    }
};

const updateElo = async (score: number, totalQuestions: number) => {
  const percentage = (score / totalQuestions) * 100;
  const questionResults = userAnswers.map((answer, index) => ({
    key: quiz?.questions[index]?.id ?? 0, // Added optional chaining to handle null case
    winResult: answer === (quiz && quiz.questions && quiz.questions[index] ? quiz.questions[index].correctAnswer - 1 : undefined) ? 1 : 0,
}));

  const requestBody = {
      questionResults,
      quizId: quiz?.quizId ?? 0, // Use optional chaining and provide a default value
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
          {
            width: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, width],
            }),
          },
        ]}
      />
      <Text style={styles.questionText}>{currentQuestion.question}</Text>
      <View style={styles.optionsContainer}>
        {['A', 'B', 'C', 'D'].map((optionKey) => {
          const optionText = currentQuestion[`option${optionKey}` as keyof Question];
          return (
            <TouchableRipple
              key={optionKey}
              onPress={() => handleAnswerSelection(optionKey)}
              style={[
                styles.optionButton,
                selectedAnswer === optionKey && styles.selectedOption,
              ]}
              rippleColor="rgba(0, 0, 0, .32)"
              disabled={!!selectedAnswer}
            >
              <Text style={styles.optionText}>{optionText}</Text>
            </TouchableRipple>
          );
        })}
      </View>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('Results')}
        style={styles.nextButton}
      >
        Go to Results
      </Button>
    </View>
  );
}

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
  selectedOption: {
    backgroundColor: '#d1c4e9',
    borderColor: '#6200ea',
  },
  optionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  nextButton: {
    marginTop: 16,
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
});
