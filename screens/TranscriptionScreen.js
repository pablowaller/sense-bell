import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { realtimeDb } from '../constants/database';
import { ref, onValue, remove } from 'firebase/database';
import Icon from 'react-native-vector-icons/FontAwesome';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Platform } from 'react-native';

const TranscriptionScreen = ({ navigation }) => {
  const [allTranscriptions, setAllTranscriptions] = useState([]);
  const [visibleTranscriptions, setVisibleTranscriptions] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const animationQueue = useRef([]);
  const isAnimating = useRef(false);

  useEffect(() => {
    const transcriptionsRef = ref(realtimeDb, "transcriptions");
    const unsubscribe = onValue(transcriptionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const newTranscriptions = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        })).reverse();
        
        setAllTranscriptions(newTranscriptions);
        
        const newItems = newTranscriptions.filter(
          item => !visibleTranscriptions.some(t => t.id === item.id)
        );
        
        if (newItems.length > 0) {
          queueAnimations(newItems);
        }
      } else {
        setAllTranscriptions([]);
        setVisibleTranscriptions([]);
      }
    });

    return () => unsubscribe();
  }, [visibleTranscriptions]);

  const queueAnimations = (items) => {
    animationQueue.current = [...animationQueue.current, ...items];
    if (!isAnimating.current) {
      processAnimationQueue();
    }
  };
  
  const processAnimationQueue = () => {
    if (animationQueue.current.length === 0) {
      isAnimating.current = false;
      return;
    }

    isAnimating.current = true;
    const nextItem = animationQueue.current.shift();

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(300), 
    ]).start(() => {
      setVisibleTranscriptions(prev => [nextItem, ...prev]);
      fadeAnim.setValue(0);
      processAnimationQueue();
    });
  };

  const handleDeleteTranscription = (id) => {
    const transcriptionRef = ref(realtimeDb, `transcriptions/${id}`);
    remove(transcriptionRef).then(() => {
      setVisibleTranscriptions(prev => prev.filter(item => item.id !== id));
    });
  };

  const renderRightActions = (progress, dragX, id) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <RectButton style={styles.deleteButton} onPress={() => handleDeleteTranscription(id)}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Icon name="trash" size={24} color="#fff" />
        </Animated.View>
      </RectButton>
    );
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFlagEmoji = (language) => {
  const emojiMap = {
    'en-us': '🇬🇧',
    'es-ar': '🇦🇷',
    'de-de': '🇩🇪',
    'fr-fr': '🇫🇷',
    'pt-br': '🇧🇷',
  };

  const code = emojiMap[language] || '🇦🇷';

  if (Platform.OS === 'web') {
    const flagMap = {
      '🇬🇧': 'https://flagcdn.com/gb.svg',
      '🇦🇷': 'https://flagcdn.com/ar.svg',
      '🇩🇪': 'https://flagcdn.com/de.svg',
      '🇫🇷': 'https://flagcdn.com/fr.svg',
      '🇧🇷': 'https://flagcdn.com/br.svg',
    };
    return (
      <img src={flagMap[code]} alt={language} style={{ width: 20, height: 14, marginRight: 4 }} />
    );
  }
  return code;
};

  const renderItem = ({ item }) => (
  <Swipeable
    renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id)}
  >
    <View style={styles.transcriptionItem}>
      <View style={styles.transcriptionContent}>
        <View style={styles.textColumn}>
          <View style={styles.textRow}>
            <Text style={styles.transcriptionText}>
              {item.text || "No transcription available"}
            </Text>
            {Platform.OS === 'web' ? (
              getFlagEmoji(item.language)
            ) : (
              <Text style={styles.flag}>{getFlagEmoji(item.language)}</Text>
            )}
          </View>
          <Text style={styles.timestamp}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
      </View>
    </View>
  </Swipeable>
);


  return (
    <View style={styles.container}>
      <Text style={styles.title}>🗣️ Asistente de Reconocimiento de Voz</Text>
      
      {visibleTranscriptions.length === 0 ? (
        <Text style={styles.emptyMessage}>Aún no hay transcripciones.</Text>
      ) : (
        <FlatList
          data={visibleTranscriptions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          inverted={false}
          contentContainerStyle={styles.listContent}
        />
      )}
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
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  transcriptionItem: {
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
  transcriptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textColumn: {
    flex: 1,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  flag: {
    fontSize: 18,
    marginLeft: 8,
  },
  transcriptionText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
  },
  timestamp: {
    fontSize: 12,
    color: "#777",
    alignSelf: 'flex-end',
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
});

export default TranscriptionScreen;
