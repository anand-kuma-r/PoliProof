import React, { useState } from 'react';
import { View, Alert, Text, TouchableOpacity } from 'react-native';
import { TextInput, Button, Title } from 'react-native-paper';
import { NavigationProp } from '@react-navigation/native';
import Constants from 'expo-constants';

export default function SignInScreen({ navigation }: { navigation: NavigationProp<any> }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    try {
      const response = await fetch(`${Constants.expoConfig?.extra?.API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        Alert.alert('Success', 'User logged in successfully');
        navigation.navigate('Home'); // Navigate to Home screen after successful login
      } else {
        const errorText = await response.text();
        Alert.alert('Error', errorText);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to login user');
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Title>Sign In</Title>
      <TextInput
        label="Username"
        value={username}
        onChangeText={setUsername}
        style={{ marginBottom: 8 }}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ marginBottom: 16 }}
      />
      <Button mode="contained" onPress={handleSignIn}>
        Sign In
      </Button>

      <View style={{ marginTop: 16, alignItems: 'center' }}>
        <Text>Don't have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={{ color: '#6200ea', fontWeight: 'bold' }}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}