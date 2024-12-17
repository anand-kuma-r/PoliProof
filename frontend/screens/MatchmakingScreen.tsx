import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Button, Alert, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NavigationProp, useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';

interface Tag {
  id: string;
  name: string;
}

const tags: Tag[] = [
  { id: 'us_history', name: 'US History' },
  { id: 'public_policy', name: 'Public Policy' },
  { id: 'current_events', name: 'Current Events' },
  { id: 'climate_change', name: 'Climate Change' },
  { id: 'civics', name: 'Civics' },
];

const MatchmakingScreen = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [status, setStatus] = useState('Select topics for your live quiz.');
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [username, setUsername] = useState('TestUser123'); // Replace this dynamically in your app
  const [token, setToken] = useState<string | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isFocused, setIsFocused] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useFocusEffect(
    // Cleanup when component unmounts
    React.useCallback(() => {
      console.log('Component in focus');
      setIsFocused(true);

      return () => {
        handleLeaveMatchmaking();
        socket?.close();
        setIsFocused(false);
        console.log('Component out of focus');
      };
    }, [])
  );

  useEffect(() => {
    if (token && !socket) {
      initiateWebSocket(token);
    }
  }, [token, socket]);

  useEffect(() => {
    console.log('Effect triggered, isSearching:', isSearching);
    let tokenPolling: NodeJS.Timeout;

    if (isFocused && isSearching) {
      tokenPolling = setInterval(async () => {
        if (!isFocused) {
          clearInterval(tokenPolling); // Stop polling when focus is lost
          console.log('Exiting polling loop');
          return;
        }

        // Your polling logic
        try {
          const tokenResponse = await fetch(`${Constants.expoConfig?.extra?.API_URL}/getToken`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          });
          const responseText = await tokenResponse.text();
          console.log('Token response:', responseText);
          if (tokenResponse.status === 200) {
            setToken(responseText);
            console.log('Token received:', responseText);
            clearInterval(tokenPolling); // Stop polling once you have the token
            setIsSearching(false);
          }
        } catch (error) {
          console.error('Error during polling:', error);
          clearInterval(tokenPolling); // Optional: Stop polling if an error occurs
        }
      }, 1000);
    }
    // Cleanup function when component unmounts or focus changes
    return () => {
      if (tokenPolling) clearInterval(tokenPolling); // Clear interval on cleanup
    };
  }, [isFocused, isSearching]);

  const toggleTagSelection = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleStartMatchmaking = async () => {
    if (selectedTags.length === 0) {
      Alert.alert('Select Topics', 'Please select at least one topic before starting matchmaking.');
      return;
    }
    setIsMatchmaking(true);
    setStatus('Joining matchmaking queue...');
  
    try {
      const joinResponse = await fetch(`${Constants.expoConfig?.extra?.API_URL}/joinMatchmaking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
  
      if (!joinResponse.ok) throw new Error('Failed to join matchmaking.');
  
      setIsSearching(true);
  
      // Polling to retrieve the token
      const pollingInterval = setInterval(async () => {
        const tokenResponse = await fetch(`${Constants.expoConfig?.extra?.API_URL}/getToken`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        const responseText = await tokenResponse.text();
        if (tokenResponse.status === 200) {
          clearInterval(pollingInterval);
          console.log('Token received:', responseText);
          initiateWebSocket(responseText); // Pass the token to LiveQuizScreen
          setIsSearching(false);
        }
      }, 1000);
    } catch (error) {
      console.error('Error during matchmaking:', error);
      setStatus('Error occurred during matchmaking.');
      setIsMatchmaking(false);
      setIsSearching(false);
    }
  };

  const initiateWebSocket = (receivedToken: string) => {
    console.log('Navigating to LiveQuizScreen with token:', receivedToken);
    navigation.navigate('LiveQuiz', { token: receivedToken });
  };

  const handleLeaveMatchmaking = async () => {
    console.log('Leaving matchmaking, isMatchmaking:', isMatchmaking);
    try {
      await fetch(`${Constants.expoConfig?.extra?.API_URL}/leaveMatchmaking`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      setStatus('Left matchmaking.');
    } catch (error) {
      console.error('Error leaving matchmaking:', error);
    }
    setIsMatchmaking(false);
    setIsSearching(false);
  };

  return (
    <View style={styles.container}>
      {!isMatchmaking ? (
        <>
          <Text style={styles.status}>{status}</Text>
          <Text style={styles.subHeader}>Popular Tags:</Text>
          <FlatList
            data={tags}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.tagButton,
                  selectedTags.includes(item.id) && styles.selectedTag,
                ]}
                onPress={() => toggleTagSelection(item.id)}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedTags.includes(item.id) && styles.selectedTagText,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.tagList}
          />
          <Button title="Start Matchmaking" onPress={handleStartMatchmaking} />
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color="#6200ea" />
          <Text style={styles.status}>{status}</Text>
          <Button title="Cancel Matchmaking" onPress={handleLeaveMatchmaking} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
  },
  status: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  tagButton: {
    backgroundColor: '#ddd',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    margin: 8,
    borderWidth: 1,
    borderColor: '#aaa',
  },
  selectedTag: {
    backgroundColor: '#6200ea',
    borderColor: '#6200ea',
  },
  tagText: {
    color: '#333',
    fontSize: 14,
  },
  selectedTagText: {
    color: '#fff',
  },
});

export default MatchmakingScreen;
