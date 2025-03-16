import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Animated, Vibration, Alert } from 'react-native';
import { realtimeDb } from "../constants/database";
import { ref, onValue, push, remove } from "firebase/database";
import Icon from 'react-native-vector-icons/FontAwesome';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import PushNotification from "react-native-push-notification";
import { useUserContext } from '../components/UserContext';

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const { isHapticEnabled, areNotificationsEnabled, incrementUnreadNotifications } = useUserContext();

  useEffect(() => {
    const notificationsRef = ref(realtimeDb, "doorbell");

    onValue(notificationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const notificationList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setNotifications(notificationList.reverse());

        // Activar vibración y notificación push si hay una nueva notificación
        if (notificationList.length > 0 && (isHapticEnabled || areNotificationsEnabled)) {
          if (isHapticEnabled) {
            Vibration.vibrate();
          }
          if (areNotificationsEnabled) {
            PushNotification.localNotification({
              title: "Doorbell",
              message: "🔔 Alguien tocó el timbre!",
            });
          }
          incrementUnreadNotifications();
        }
      } else {
        setNotifications([]);
      }
    });

    return () => {};
  }, [isHapticEnabled, areNotificationsEnabled]);

  const handleDeleteNotification = (id) => {
    const notificationRef = ref(realtimeDb, `doorbell/${id}`);
    remove(notificationRef);
  };

  const renderRightActions = (progress, dragX, id) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <RectButton style={styles.deleteButton} onPress={() => handleDeleteNotification(id)}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Icon name="trash" size={24} color="#fff" />
        </Animated.View>
      </RectButton>
    );
  };

  const renderItem = ({ item }) => (
    <Swipeable
      renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id)}
    >
      <View style={styles.notificationItem}>
        <Text style={styles.notificationText}>🔔 Alguien tocó el timbre!</Text>
        <Text style={styles.timestampText}>{item.timestamp}</Text>
      </View>
    </Swipeable>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  notificationItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timestampText: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 8,
    marginBottom: 10,
  },
});

export default NotificationScreen;
