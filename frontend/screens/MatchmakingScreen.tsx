import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, FlatList, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import { NavigationProp } from '@react-navigation/native';

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
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState('Select topics for your live quiz.');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isMatchmaking, setIsMatchmaking] = useState(false);

  useEffect(() => {
    // Establish WebSocket connection
    const newSocket = new WebSocket('ws://localhost:3000');

    newSocket.onopen = () => {
      console.log('WebSocket connection established');
    };

    newSocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'match_found') {
        setStatus('Match found! Starting quiz...');
        navigation.navigate('Quiz', { matchId: message.matchId });
      }
    };

    newSocket.onclose = () => {
      console.log('WebSocket connection closed');
      setStatus('Connection closed. Please try again.');
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStatus('An error occurred. Please try again.');
    };

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, [navigation]);

  const toggleTagSelection = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const startMatchmaking = () => {
    if (selectedTags.length === 0) {
      Alert.alert('Select Topics', 'Please select at least one topic before starting matchmaking.');
      return;
    }

    if (socket) {
      setIsMatchmaking(true);
      setStatus('Searching for a match...');
      socket.send(JSON.stringify({ type: 'start_matchmaking', tags: selectedTags }));
    } else {
      Alert.alert('Error', 'WebSocket connection not established.');
    }
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
          <Button title="Start Matchmaking" onPress={startMatchmaking} />
        </>
      ) : (
        <>
          <Text style={styles.status}>{status}</Text>
          <Button
            title="Cancel Matchmaking"
            onPress={() => {
              setIsMatchmaking(false);
              setStatus('Select topics for your live quiz.');
              socket?.close();
            }}
          />
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
