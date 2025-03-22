import React, { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { realtimeDb } from "../constants/database";
import { ref as databaseRef, onValue, remove } from "firebase/database";
import Icon from 'react-native-vector-icons/FontAwesome';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';

const VisitorsScreen = ({ route, navigation }) => {
  const [visitors, setVisitors] = useState([]);
  const [displayedVisitors, setDisplayedVisitors] = useState(new Set());
  const fadeAnim = useRef(new Animated.Value(0)).current;


  useEffect(() => {
    const visitorsRef = databaseRef(realtimeDb, "attendance"); // Referencia a la base de datos
    const unsubscribe = onValue(visitorsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const visitorsList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        const newVisitors = visitorsList.reverse();

        // Identificar nuevos visitantes
        const newVisitorIds = newVisitors.map((visitor) => visitor.id);
        const currentDisplayedIds = Array.from(displayedVisitors);
        const addedVisitors = newVisitorIds.filter((id) => !currentDisplayedIds.includes(id));

        // Aplicar fading solo a los nuevos visitantes
        if (addedVisitors.length > 0) {
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            // Agregar los nuevos IDs al estado de visitantes mostrados
            setDisplayedVisitors(new Set([...currentDisplayedIds, ...addedVisitors]));
          });
        }

        setVisitors(newVisitors);
      } else {
        setVisitors([]);
      }
    });

    return () => unsubscribe(); // Limpiar la suscripción al desmontar el componente
  }, [displayedVisitors]);

  useEffect(() => {
    if (route.params?.deleteAll) {
      const visitorsRef = databaseRef(realtimeDb, "attendance");
      remove(visitorsRef).then(() => {
        setVisitors([]);
        setDisplayedVisitors(new Set()); // Limpiar los visitantes mostrados
      });
    }
  }, [route.params?.deleteAll]);

  const handleDeleteVisitor = (id) => {
    const visitorRef = databaseRef(realtimeDb, `attendance/${id}`);
    remove(visitorRef).then(() => {
      if (displayedVisitors.has(id)) {
        const newDisplayedVisitors = new Set(displayedVisitors);
        newDisplayedVisitors.delete(id);
        setDisplayedVisitors(newDisplayedVisitors);
      }
    });
  };

  const renderRightActions = (progress, dragX, id) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <RectButton style={styles.deleteButton} onPress={() => handleDeleteVisitor(id)}>
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
      <Animated.View
        style={{
          opacity: displayedVisitors.has(item.id) ? 1 : fadeAnim, // Aplicar fading solo a nuevos visitantes
        }}
      >
        <View style={styles.visitorItem}>
          <Text style={styles.visitorName}>🔹 {item.name} está en la puerta!</Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>
      </Animated.View>
    </Swipeable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👥 Visitantes recientes</Text>
      {visitors.length === 0 ? (
        <Text style={styles.emptyMessage}>Aún no hay visitantes.</Text>
      ) : (
        <FlatList
          data={visitors}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      )}
      <TouchableOpacity
        style={styles.addVisitorLink}
        onPress={() => navigation.navigate('LogVisitors')}
      >
        <Text style={styles.addVisitorText}>¿Añadir visitantes? Click aquí</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  visitorItem: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  visitorName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  timestamp: {
    fontSize: 14,
    color: "#777",
    marginTop: 5,
  },
  deleteButton: {
    backgroundColor: "#ff4444",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
    borderRadius: 8,
    marginBottom: 10,
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#777',
  },
  addVisitorLink: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#0bb4bf",
    borderRadius: 8,
    alignItems: 'center',
  },
  addVisitorText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VisitorsScreen;