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

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Available Quizzes</Text>
      <FlatList
        data={quizzes}
        keyExtractor={(item) => item.quizId.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.quizTile}
            onPress={() => {
              // console.log(item.quizId); // Log the quizId
              navigation.navigate('Quiz', { quizId: item.quizId });
            }}
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
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
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
    elevation: 3, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
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
});
