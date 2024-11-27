import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import { NavigationProp } from '@react-navigation/native';

interface Question {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

interface Quiz {
  quizId: number;
  quizName: string;
  quizDescription: string;
  questions: Question[];
}

export default function QuizScreen({ navigation }: { navigation: NavigationProp<any> }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`https://aa67-71-35-24-99.ngrok-free.app/get-quiz`);
        if (response.ok) {
          const data = await response.json();
          setQuiz(data);
        } else {
          console.error('Failed to fetch quiz');
          console.error(response);
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
      }
    };

    fetchQuiz();
  }, []);

  return (
    <View>
      <Text>Quiz Screen</Text>
      {quiz ? (
        <View>
          <Text>{quiz.quizName}</Text>
          <Text>{quiz.quizDescription}</Text>
          <FlatList
            data={quiz.questions}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View>
                <Text>{item.question}</Text>
                <Text>A: {item.optionA}</Text>
                <Text>B: {item.optionB}</Text>
                <Text>C: {item.optionC}</Text>
                <Text>D: {item.optionD}</Text>
              </View>
            )}
          />
        </View>
      ) : (
        <Text>Loading...</Text>
      )}
      <Button title="Go to Results" onPress={() => navigation.navigate('Results')} />
    </View>
  );
}