import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { TextInput, Button, Text, Title } from 'react-native-paper';

export default function SignUpScreen() {
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async () => {
    try {
      const response = await fetch('https://aa67-71-35-24-99.ngrok-free.app/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, firstName, lastName, password }),
      });

      if (response.ok) {
        Alert.alert('Success', 'User registered successfully');
      } else {
        const errorText = await response.text();
        Alert.alert('Error', errorText);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to register user');
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Title>Sign Up</Title>
      <TextInput
        label="Username"
        value={username}
        onChangeText={setUsername}
        style={{ marginBottom: 8 }}
      />
      <TextInput
        label="First Name"
        value={firstName}
        onChangeText={setFirstName}
        style={{ marginBottom: 8 }}
      />
      <TextInput
        label="Last Name"
        value={lastName}
        onChangeText={setLastName}
        style={{ marginBottom: 8 }}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ marginBottom: 16 }}
      />
      <Button mode="contained" onPress={handleSignUp}>
        Sign Up
      </Button>
    </View>
  );
}