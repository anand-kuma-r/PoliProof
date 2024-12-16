import React from 'react';
import { View, Text, Button, StyleSheet, Image } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import LottieView from 'lottie-react-native'; 
import ConfettiCannon from 'react-native-confetti-cannon';

export default function ResultsScreen({ navigation, route }: { navigation: NavigationProp<any>, route: any }) {
  const { score, totalQuestions } = route.params;
  const percentage = (score / totalQuestions) * 100;

  // Determine result message and animations based on the score
  const getResultMessage = () => {
    if (percentage === 100) return 'Perfect Score! You crushed it!';
    if (percentage >= 80) return 'Amazing! You did great!';
    if (percentage >= 50) return 'Good Job! Keep it up!';
    return 'Better luck next time!';
  };

  const getAnimation = () => {
    if (percentage === 100) return require('../animations/trophy.json');
    if (percentage >= 80) return require('../animations/celebration.json');
    if (percentage >= 50) return require('../animations/thumbs-up.json');
    return require('../animations/try-again.json');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getResultMessage()}</Text>

      {/* Lottie Animation */}
      <LottieView
        source={getAnimation()}
        autoPlay
        loop={true}
        style={styles.animation}
      />

      {/* Score Display */}
      <Text style={styles.score}>
        Your Score: {score} / {totalQuestions}
      </Text>

      {/* Confetti Effect for High Scores */}
      {percentage >= 80 && <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} fadeOut />}
      
      {/* Motivational Graphic */}
      <Image
        source={require('../images/motivational-graphic.png')} // Add your image to the project
        style={styles.image}
      />

      {/* Navigation Button */}
      <Button
        title="Go to Profile"
        onPress={() => navigation.navigate('Profile')}
        color="#6200EE"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef9ef',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3b5998',
    textAlign: 'center',
    marginBottom: 20,
  },
  animation: {
    width: 250,
    height: 250,
    marginBottom: 20,
  },
  score: {
    fontSize: 20,
    color: '#555',
    marginVertical: 10,
  },
  image: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginVertical: 20,
  },
});
