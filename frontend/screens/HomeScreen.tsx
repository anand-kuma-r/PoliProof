import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ViewStyle } from 'react-native';
import { NavigationProp, useNavigationState } from '@react-navigation/native';
import Constants from 'expo-constants';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomNavBar from './BottomNavBar';

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
  const [showAllQuizzes, setShowAllQuizzes] = useState(false);

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

  const toggleShowAllQuizzes = () => {
    setShowAllQuizzes((prev) => !prev);
  };

  const displayedQuizzes = showAllQuizzes ? quizzes || [] : quizzes?.slice(0, 3) || [];

  const currentRouteName = useNavigationState((state) => state.routes[state.index].name);

  const isActive = (routeName: string) => currentRouteName === routeName;

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Available Quizzes</Text>
        <TouchableOpacity onPress={toggleShowAllQuizzes}>
          <Text style={styles.seeMoreText}>{showAllQuizzes ? 'Show Less' : 'See More'}</Text>
        </TouchableOpacity>
      </View>

      {/* Quiz List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ea" />
          <Text>Loading quizzes...</Text>
        </View>
      ) : displayedQuizzes.length > 0 ? (
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
          contentContainerStyle={[styles.listContent, { paddingBottom: 80 }]}
        />
      ) : (
        <View style={styles.loadingContainer}>
          <Text>No quizzes available at the moment.</Text>
        </View>
      )}

      {/* Live Quiz Button */}
      {!showAllQuizzes && (
        <TouchableOpacity
          style={styles.liveQuizzesButton}
          onPress={() => navigation.navigate('Matchmaking')}
        >
          <Text style={styles.liveQuizzesButtonText}>Live Quizzes</Text>
        </TouchableOpacity>
      )}

      {!showAllQuizzes && (
        <View style={styles.iconContainer}>
          <Icon name="star" size={100} color="rgba(98, 0, 234, 0.1)" style={styles.icon} />
        </View>
      )}

      {/* Upgraded Bottom Navigation Bar */}
      <BottomNavBar navigation={navigation} currentRouteName={currentRouteName} />
    </View>
  );
}

interface NavItemProps {
  label: string;
  iconName: string;
  activeIconName: string;
  isActive: boolean;
  onPress: () => void;
}

const NavItem = ({ label, iconName, activeIconName, isActive, onPress }: NavItemProps) => (
  <TouchableOpacity style={styles.navItem} onPress={onPress}>
    <Icon name={isActive ? activeIconName : iconName} size={24} color={isActive ? '#6200ea' : '#777'} />
    <Text style={[styles.navText, isActive && styles.navTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    paddingHorizontal: 16,
    paddingTop: 16,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 80,
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
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  navTextActive: {
    color: '#6200ea',
    fontWeight: 'bold',
  },
  iconContainer: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
  } as ViewStyle,
  icon: {
    // Additional styles for the icon if needed
  },
});
