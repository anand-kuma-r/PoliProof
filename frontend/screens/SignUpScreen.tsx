import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Title, Checkbox } from 'react-native-paper';
import Constants from 'expo-constants';
import { NavigationProp } from '@react-navigation/native';

const interestsOptions = [
  { label: 'Government', value: 'government' },
  { label: 'Policy', value: 'policy' },
  { label: 'Civics', value: 'civics' },
  { label: 'US History', value: 'us_history' },
  { label: 'Voting Rights', value: 'voting_rights' },
  { label: 'Current Events', value: 'current_events' },
];

export default function SignUpScreen({ navigation }: { navigation: NavigationProp<any> }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleInterestChange = (value: string) => {
    setSelectedInterests((prev) =>
      prev.includes(value) ? prev.filter((interest) => interest !== value) : [...prev, value]
    );
  };

  const handleSignUp = async () => {
    if (!username || !email || !firstName || !lastName || !password) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (selectedInterests.length === 0) {
      Alert.alert('Error', 'Please select at least one interest');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${Constants.expoConfig?.extra?.API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          firstName,
          lastName,
          password,
          interests: selectedInterests,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'User registered successfully');
        navigation.navigate('Home');
      } else {
        const errorText = await response.text();
        Alert.alert('Error', errorText);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to register user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Title style={styles.title}>Create Your Account</Title>
      <TextInput
        label="Username"
        value={username}
        onChangeText={setUsername}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        label="First Name"
        value={firstName}
        onChangeText={setFirstName}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Last Name"
        value={lastName}
        onChangeText={setLastName}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        secureTextEntry
        style={styles.input}
      />

      <Text style={styles.label}>Select Your Interests:</Text>
      {interestsOptions.map((option) => (
        <View key={option.value} style={styles.checkboxContainer}>
          <Checkbox
            status={selectedInterests.includes(option.value) ? 'checked' : 'unchecked'}
            onPress={() => handleInterestChange(option.value)}
          />
          <Text>{option.label}</Text>
        </View>
      ))}

      <Button
        mode="contained"
        onPress={handleSignUp}
        loading={loading}
        style={styles.submitButton}
        disabled={loading}
      >
        Sign Up
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 6,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  submitButton: {
    marginTop: 20,
  },
});
