import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import Constants from 'expo-constants';

interface Quiz {
  quizId: number;
  quizName: string;
  quizDescription: string;
  quizTag: string;
  imgUrl: string;
  totalElo: number;
}

export default function HomeScreen({ navigation }: { navigation: NavigationProp<any> }) {
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await fetch(`${Constants.expoConfig?.extra?.API_URL}/get-all-quizzes`);
        if (response.ok) {
          const data = await response.json();
          setQuizzes(data);
        } else {
          console.error('Failed to fetch quizzes');
        }
      } catch (error) {
        console.error('Error fetching quizzes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ea" />
        <Text>Loading quizzes...</Text>
      </View>
    );
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No quizzes available at the moment.</Text>
      </View>
    );
  }

  const displayedQuizzes = quizzes.slice(0, 3); // Always display only the first 3 quizzes

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Available Quizzes</Text>
        <TouchableOpacity onPress={() => navigation.navigate('QuizList')}>
          <Text style={styles.seeMoreText}>See More</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={displayedQuizzes}
        keyExtractor={(item) => item.quizId.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.quizTile}
            onPress={() => navigation.navigate('Quiz', { quizId: item.quizId })}
          >
            <Image source={{ uri: item.imgUrl }} style={styles.quizImage} />
            <View style={styles.quizDetails}>
              <Text style={styles.quizName}>{item.quizName}</Text>
              <Text style={styles.quizTag}>{item.quizTag}</Text>
              <Text style={styles.quizDescription} numberOfLines={2}>
                {item.quizDescription}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
      <TouchableOpacity
        style={styles.liveQuizzesButton}
        onPress={() => navigation.navigate('Matchmaking')}
      >
        <Text style={styles.liveQuizzesButtonText}>Live Quizzes</Text>
      </TouchableOpacity>
      {/* Placeholder for bottom navigation bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Resources')}>
          <Text style={styles.navText}>Resources</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  seeMoreText: {
    fontSize: 16,
    color: '#6200ea',
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 16,
  },
  quizTile: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quizImage: {
    width: 100,
    height: 100,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  quizDetails: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  quizName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  quizTag: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#6200ea',
  },
  quizDescription: {
    fontSize: 14,
    color: '#555',
  },
  liveQuizzesButton: {
    backgroundColor: '#6200ea',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 80, // Leave space for navbar
  },
  liveQuizzesButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  navText: {
    fontSize: 16,
    color: '#6200ea',
    fontWeight: 'bold',
  },
});
