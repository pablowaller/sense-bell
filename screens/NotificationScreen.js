import React, { useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const NotificationScreen = () => {

  return (
    <View style={styles.container}>
      <Text>No hay notificaciones aún.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
    },
  });

export default NotificationScreen;