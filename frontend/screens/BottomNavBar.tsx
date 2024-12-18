import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NavigationProp } from '@react-navigation/native';

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

const BottomNavBar = ({ navigation, currentRouteName }: { navigation: NavigationProp<any>; currentRouteName: string }) => {
  const isActive = (routeName: string) => currentRouteName === routeName;

  return (
    <View style={styles.navBar}>
      <NavItem
        label="Home"
        iconName="home-outline"
        activeIconName="home"
        isActive={isActive('Home')}
        onPress={() => navigation.navigate('Home')}
      />
      <NavItem
        label="Profile"
        iconName="account-outline"
        activeIconName="account"
        isActive={isActive('Profile')}
        onPress={() => navigation.navigate('Profile')}
      />
      <NavItem
        label="Resources"
        iconName="book-outline"
        activeIconName="book"
        isActive={isActive('Resources')}
        onPress={() => navigation.navigate('Resources')}
      />
      <NavItem
        label="Settings"
        iconName="cog-outline"
        activeIconName="cog"
        isActive={isActive('Settings')}
        onPress={() => navigation.navigate('Settings')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default BottomNavBar;