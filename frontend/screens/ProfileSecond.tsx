import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Button } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import Constants from 'expo-constants';
import BottomNavBar from './BottomNavBar';

interface User {
  id: string;
  username: string;
  email: string;
  elo: number;
}

export default function Profile2Screen({ navigation }: { navigation: NavigationProp<any> }) {
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch(`${Constants.expoConfig?.extra?.API_URL}/get-user-info`, {
          method: 'GET',
          credentials: 'include', // Ensure session cookie is sent
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setUserInfo(data);
      } catch (error) {
        console.error('Error fetching user info:', error);
        Alert.alert('Error', 'Failed to load user information. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ea" />
        <Text>Loading profile...</Text>
      </View>
    );
  }

  if (!userInfo) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No user information available.</Text>
        <Button title="Retry" onPress={() => navigation.navigate('Profile')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <Text style={styles.header}>User Profile</Text>
        <Text style={styles.label}>Username:</Text>
        <Text style={styles.value}>{userInfo.username}</Text>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{userInfo.email}</Text>
        <Text style={styles.label}>Elo Score:</Text>
        <Text style={styles.value}>{userInfo.elo+60}</Text>
      </View>

      <BottomNavBar navigation={navigation} currentRouteName={'Profile2'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f4f4',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#d9534f',
    fontSize: 16,
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ea',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '400',
    color: '#555',
    marginBottom: 12,
  },
  buttonsContainer: {
    marginTop: 20,
  },
});
