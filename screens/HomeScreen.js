import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUserContext } from '../components/UserContext';

const HomeScreen = ({ navigation }) => {
  const { displayName } = useUserContext();

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>¡Bienvenido, {displayName || 'Usuario'} a Sense-Bell!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
    backgroundColor: '#f5f5f5',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
});

export default HomeScreen;