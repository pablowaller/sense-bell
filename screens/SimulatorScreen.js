import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { realtimeDb } from '../constants/database';
import { ref, set } from "firebase/database";

const SimulatorScreen = ({ navigation }) => {
  const [notificationStatus, setNotificationStatus] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const notificationsRef = {
    priorityLow: useRef(ref(realtimeDb, "doorbell/priority_low")).current,
    priorityMedium: useRef(ref(realtimeDb, "doorbell/priority_medium")).current,
    priorityHigh: useRef(ref(realtimeDb, "doorbell/priority_high")).current
  };  

  const activateNotification = async (type) => {
    try {
      let message = "";
      let refToUpdate = null;
  
      switch(type) {
        case 'low':
          refToUpdate = notificationsRef.priorityLow;
          message = "✅ Prioridad Baja activada";
          break;
        case 'medium':
          refToUpdate = notificationsRef.priorityMedium;
          message = "✅ Prioridad Media activada";
          break;
        case 'high':
          refToUpdate = notificationsRef.priorityHigh;
          message = "✅ Prioridad Alta activada";
          break;
      }
  
      if (refToUpdate) {
        await set(refToUpdate, true);
        
        setTimeout(async () => {
          await set(refToUpdate, false);
        }, 10000);
      }
  
      setNotificationStatus(message);
      startNotificationAnimation();
    } catch (error) {
      console.error(`Error al activar notificación ${type}:`, error);
      setNotificationStatus(`❌ Error al activar ${type}`);
    }
  };
  

  const startNotificationAnimation = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1000),
      Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true })
    ]).start(() => setNotificationStatus(""));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Simulación de Eventos a través de Pulsaciones:</Text>
      <View style={styles.buttonColumn}>
        <TouchableOpacity style={[styles.button, styles.highPriority]} onPress={() => activateNotification('high')}>
          <Text style={styles.buttonText}>PRIORIDAD ALTA 🟢</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.mediumPriority]} onPress={() => activateNotification('medium')}>
          <Text style={styles.buttonText}>PRIORIDAD MEDIA 🟡</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.lowPriority]} onPress={() => activateNotification('low')}>
          <Text style={styles.buttonText}>PRIORIDAD BAJA 🔴</Text>
        </TouchableOpacity>
      </View>
      {notificationStatus ? (
        <Animated.View style={[styles.modalContainer, { opacity: fadeAnim }]}> 
          <Text style={styles.modalText}>{notificationStatus}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 20,
    color: '#333',
    textAlign: 'center'
  },
  buttonColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  button: {
    width: '80%',
    marginVertical: 5,
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  lowPriority: {
    backgroundColor: '#FF0000',
  },
  mediumPriority: {
    backgroundColor: '#FFA500',
  },
  highPriority: {
    backgroundColor: '#32CD32',
  },
  modalContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -125 }, { translateY: -50 }],
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    width: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SimulatorScreen;
