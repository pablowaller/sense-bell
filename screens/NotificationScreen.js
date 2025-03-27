import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Animated, Vibration } from 'react-native';
import { realtimeDb } from "../constants/database";
import { ref, onValue, remove } from "firebase/database";
import Icon from 'react-native-vector-icons/FontAwesome';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useUserContext } from '../components/UserContext';

const NotificationScreen = ({ route }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(new Set());
  const [animations, setAnimations] = useState(new Map()); 
  const { isHapticEnabled, incrementUnreadNotifications, resetUnreadNotifications } = useUserContext();

  useEffect(() => {
    const notificationsRef = ref(realtimeDb, "doorbell");

    onValue(notificationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const notificationList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        const reversedList = notificationList.reverse();

        const newNotifications = reversedList.filter(
          (notification) => !notifications.some((n) => n.id === notification.id)
        );

        if (newNotifications.length > 0) {
          incrementUnreadNotifications(newNotifications.length);
          if (isHapticEnabled) {
            Vibration.vibrate(500);
          }


          const newAnimations = new Map(animations);
          newNotifications.forEach((notification) => {
            const opacity = new Animated.Value(0); 
            newAnimations.set(notification.id, opacity);

            Animated.timing(opacity, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }).start();
          });
          setAnimations(newAnimations);
        }

        setNotifications(reversedList);

        const newUnreadNotifications = new Set(unreadNotifications);
        newNotifications.forEach((notification) => {
          newUnreadNotifications.add(notification.id);
        });
        setUnreadNotifications(newUnreadNotifications);
      } else {
        setNotifications([]);
        resetUnreadNotifications();
      }
    });

    return () => {};
  }, [isHapticEnabled]);

  useEffect(() => {
    if (route.params?.deleteAll) {
      const notificationsRef = ref(realtimeDb, "doorbell");
      remove(notificationsRef).then(() => {
        setNotifications([]);
        resetUnreadNotifications();
        setAnimations(new Map()); // Limpiar animaciones
      });
    }
  }, [route.params?.deleteAll]);

  const handleDeleteNotification = (id) => {
    const notificationRef = ref(realtimeDb, `doorbell/${id}`);
    remove(notificationRef).then(() => {
      if (unreadNotifications.has(id)) {
        const newUnreadNotifications = new Set(unreadNotifications);
        newUnreadNotifications.delete(id);
        setUnreadNotifications(newUnreadNotifications);
      }

      const newAnimations = new Map(animations);
      newAnimations.delete(id);
      setAnimations(newAnimations);
    });
  };

  const markAsRead = (id) => {
    if (unreadNotifications.has(id)) {
      const newUnreadNotifications = new Set(unreadNotifications);
      newUnreadNotifications.delete(id);
      setUnreadNotifications(newUnreadNotifications);
    }
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

  const renderItem = ({ item }) => {
    const opacity = animations.get(item.id) || new Animated.Value(1); 

    return (
      <Swipeable
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id)}
        onSwipeableOpen={() => markAsRead(item.id)}
      >
        <Animated.View style={[styles.notificationItem, { opacity }]}>
          <Text style={styles.notificationText}>🔔 Alguien tocó el timbre!</Text>
          <Text style={styles.timestampText}>{item.timestamp}</Text>
        </Animated.View>
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
   
      {notifications.length === 0 ? (
        <Text style={styles.emptyMessage}>Aún no hay notificaciones.</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      )}
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
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#777',
  },
});

export default NotificationScreen;