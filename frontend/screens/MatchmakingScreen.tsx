import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, Alert, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
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

  useEffect(() => {
    // Cleanup when component unmounts
    return () => {
      handleLeaveMatchmaking();
      socket?.close();
    };
  }, []);

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
      // Step 1: Join Matchmaking
      const joinResponse = await fetch(`${Constants.expoConfig?.extra?.API_URL}/joinMatchmaking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (!joinResponse.ok) throw new Error('Failed to join matchmaking.');

      // Step 2: Poll for Token
      const tokenPolling = setInterval(async () => {
        const tokenResponse = await fetch(`${Constants.expoConfig?.extra?.API_URL}/getToken`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        });

        const responseText = await tokenResponse.text();
        if (tokenResponse.status === 200) {
          clearInterval(tokenPolling);
          setToken(responseText);
          setStatus('Token received. Connecting to game...');
          initiateWebSocket(responseText);
        }
      }, 1000);
    } catch (error) {
      console.error(error);
      setStatus('Error occurred during matchmaking.');
      setIsMatchmaking(false);
    }
  };

  const initiateWebSocket = (receivedToken: string) => {
    const newSocket = new WebSocket(`${Constants.expoConfig?.extra?.WS_URL}?token=${receivedToken}`);

    newSocket.onopen = () => {
      console.log('WebSocket connection established');
      setStatus('Connected. Waiting for the opponent...');
    };

    newSocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.message === 'Both users now connected') {
        setStatus('Match found! Starting quiz...');
        navigation.navigate('Quiz', { token: receivedToken });
      } else if (message.message === 'Waiting for other user to connect') {
        setStatus('Waiting for the other user...');
      }
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStatus('WebSocket connection error.');
    };

    newSocket.onclose = () => {
      setStatus('WebSocket connection closed.');
      setSocket(null);
    };

    setSocket(newSocket);
  };

  const handleLeaveMatchmaking = async () => {
    if (isMatchmaking) {
      try {
        await fetch('http://localhost:3000/leaveMatchmaking', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        });
        setStatus('Left matchmaking.');
      } catch (error) {
        console.error('Error leaving matchmaking:', error);
      }
    }
    setIsMatchmaking(false);
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
