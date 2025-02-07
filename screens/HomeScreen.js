import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUserContext } from '../components/UserContext'; 

const HomeScreen = ({ navigation }) => {
  const { displayName } = useUserContext(); 

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome back, {displayName || 'User'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default HomeScreen;