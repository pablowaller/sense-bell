import React, { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, StyleSheet, Animated, TouchableOpacity, Image } from "react-native";
import { realtimeDb, storage } from "../constants/database";
import { ref as databaseRef, onValue, remove } from "firebase/database";
import { ref as storageRef, listAll, getDownloadURL } from "firebase/storage";
import Icon from 'react-native-vector-icons/FontAwesome';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';

const VisitorsScreen = ({ route, navigation }) => {
  const [visitors, setVisitors] = useState([]);
  const [displayedVisitors, setDisplayedVisitors] = useState(new Set());
  const [photoUrls, setPhotoUrls] = useState({});
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const normalizeName = (name) => {
    if (!name) return '';

    let normalized = name.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]/g, '');
    
    normalized = normalized.toLowerCase()
                          .trim()
                          .replace(/\s+/g, ' ')
                          .replace(/\s/g, '-');
    
    return normalized;
  };

  const getPhotoUrl = async (originalName) => {
    try {
      const normalizedSearchName = normalizeName(originalName);
      
      if (!normalizedSearchName) return null;
      
      const photosRef = storageRef(storage, 'photos');
      const res = await listAll(photosRef);
      
      let bestMatchUrl = null;
      let bestMatchScore = 0;
      
      for (const itemRef of res.items) {

        const fileName = itemRef.name.split('.')[0];
        const normalizedFileName = normalizeName(fileName);
        
        const searchParts = normalizedSearchName.split('-');
        const fileParts = normalizedFileName.split('-');
        
        let matchScore = 0;
        for (const part of searchParts) {
          if (fileParts.includes(part)) {
            matchScore++;
          }
        }
        
        if (matchScore > bestMatchScore) {
          bestMatchScore = matchScore;
          bestMatchUrl = await getDownloadURL(itemRef);
        }
      }
      
      if (bestMatchUrl) {
        console.log(`Foto encontrada para: ${originalName}`);
        return bestMatchUrl;
      }
      
      console.log(`No se encontró foto para: ${originalName}`);
      return null;
    } catch (error) {
      console.log(`Error buscando foto para ${originalName}:`, error.message);
      return null;
    }
  };

  useEffect(() => {
    const updatePhotoUrls = async () => {
      const newPhotoUrls = {};
      const updates = {};
      
      for (const visitor of visitors) {
        if (!photoUrls[visitor.name]) {
          const url = await getPhotoUrl(visitor.name);
          if (url) {
            newPhotoUrls[visitor.name] = url;
            updates[visitor.name] = url;
          }
        }
      }
      
      if (Object.keys(updates).length > 0) {
        setPhotoUrls(prev => ({ ...prev, ...updates }));
      }
    };
    
    updatePhotoUrls();
  }, [visitors]);

  useEffect(() => {
    const visitorsRef = databaseRef(realtimeDb, "attendance");
    const unsubscribe = onValue(visitorsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const visitorsList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        const newVisitors = visitorsList.reverse();

        const newVisitorIds = newVisitors.map((visitor) => visitor.id);
        const currentDisplayedIds = Array.from(displayedVisitors);
        const addedVisitors = newVisitorIds.filter((id) => !currentDisplayedIds.includes(id));

        if (addedVisitors.length > 0) {
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            setDisplayedVisitors(new Set([...currentDisplayedIds, ...addedVisitors]));
          });
        }

        setVisitors(newVisitors);
      } else {
        setVisitors([]);
      }
    });

    return () => unsubscribe();
  }, [displayedVisitors]);

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

  const cleanName = (name) => {
    if (!name) return '';
    let cleaned = name.replace(/%20/g, ' ');
    cleaned = cleaned.replace(/[_\d%]/g, ' ');
    return cleaned.replace(/\s+/g, ' ').trim();
  };

  const renderItem = ({ item }) => (
    <Swipeable
      renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id)}
    >
      <Animated.View
        style={{
          opacity: displayedVisitors.has(item.id) ? 1 : fadeAnim, 
        }}
      >
        <View style={styles.visitorItem}>
          <View style={styles.visitorContent}>
            {photoUrls[item.name] ? (
              <Image 
                source={{ uri: photoUrls[item.name] }}
                style={styles.visitorPhoto}
              />
            ) : (
              <View style={[styles.visitorPhoto, styles.emptyPhoto]}>
                <Icon name="user" size={20} color="#fff" />
              </View>
            )}
            <View style={styles.textRow}>
              <Text style={styles.visitorName}>{cleanName(item.name)} está en la puerta!</Text>
              <Text style={styles.timestamp}>{item.timestamp}</Text>
            </View>
          </View>
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
  visitorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visitorPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#ddd',
  },
  emptyPhoto: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0bb4bf',
  },
  textRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  visitorName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flexShrink: 1,
  },
  timestamp: {
    fontSize: 12,
    color: "#777",
    marginLeft: 8,
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