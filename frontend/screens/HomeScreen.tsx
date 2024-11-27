import React from 'react';
import { View, Text, Button } from 'react-native';
import { NavigationProp } from '@react-navigation/native';

export default function HomeScreen({ navigation }: { navigation: NavigationProp<any> }) {
  return (
    <View>
      <Text>Home Screen</Text>
      <Button title="Go to Quiz" onPress={() => navigation.navigate('Quiz')} />
    </View>
  );
}