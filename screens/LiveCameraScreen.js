import React, { useState, useEffect, useRef } from 'react';
import {
  View, Button, StyleSheet, Platform, ScrollView, Text, Animated, 
  ActivityIndicator, Vibration
} from 'react-native';
import { WebView as RNWebView } from 'react-native-webview';
import WebWebView from 'react-native-web-webview';
import { realtimeDb } from '../constants/database';
import { ref, set, onValue } from "firebase/database";
import AsyncStorage from '@react-native-async-storage/async-storage';

const WebView = Platform.OS === 'web' ? WebWebView : RNWebView;

const CameraComponent = React.memo(({ cameraUrl, onLoad, onError, onStreamStopped }) => {
  const lastUpdateRef = useRef(Date.now());
  const timerRef = useRef(null);
  const errorCountRef = useRef(0);
  const heartbeatRef = useRef(null);

  const updateActivity = () => {
    lastUpdateRef.current = Date.now();
  };

  useEffect(() => {
    heartbeatRef.current = setInterval(updateActivity, 5000);

    const checkStreamActivity = () => {
      const now = Date.now();
      if (now - lastUpdateRef.current > 30000) { 
        onStreamStopped();
      }
    };

    timerRef.current = setInterval(checkStreamActivity, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [onStreamStopped]);

  const handleError = (error) => {
    errorCountRef.current += 1;
    if (errorCountRef.current > 2) {
      onError(error);
    }
  };

  const handleLoadProgress = ({ nativeEvent }) => {
    if (nativeEvent.progress > 0) {
      updateActivity();
    }
  };

  if (Platform.OS === 'web') {
    return (
      <div style={styles.webContainer}>
        <img
          src={`${cameraUrl}?t=${Date.now()}`}
          style={styles.cameraFeedWeb}
          alt="Live Camera Feed"
          onError={handleError}
          onLoad={() => {
            errorCountRef.current = 0;
            updateActivity();
            onLoad();
          }}
          onLoadStart={updateActivity}
        />
      </div>
    );
  }

  return (
    <WebView
      key={`camera-stream-${Date.now()}`}
      source={{ uri: cameraUrl }}
      style={styles.cameraFeed}
      scrollEnabled={false}
      javaScriptEnabled={true}
      onLoadEnd={() => {
        errorCountRef.current = 0;
        updateActivity();
        onLoad();
      }}
      onError={handleError}
      onLoadStart={updateActivity}
      onLoadProgress={handleLoadProgress}
      mixedContentMode="always"
      allowsInlineMediaPlayback={true}
      mediaPlaybackRequiresUserAction={false}
      startInLoadingState={true}
    />
  );
});

const LiveCameraScreen = ({ navigation }) => {
  const [isStreamAvailable, setIsStreamAvailable] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const flashRef = useRef(ref(realtimeDb, "flash")).current;
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isFlashUpdating, setIsFlashUpdating] = useState(false);
  const ipRef = useRef(ref(realtimeDb, "currentIP/ip")).current;
  const [streamUrl, setStreamUrl] = useState("");
  const flashUpdateRef = useRef(null);

  // Cargar estado persistente del flash
  useEffect(() => {
    const loadPersistedState = async () => {
      try {
        const savedState = await AsyncStorage.getItem('flashState');
        if (savedState !== null) {
          const initialState = savedState === 'true';
          setFlashEnabled(initialState);
          await set(flashRef, { enabled: initialState });
        }
      } catch (error) {
        console.error("Error al cargar estado persistente:", error);
      }
    };
    
    loadPersistedState();
  }, []);

  useEffect(() => {
    // Inicializar flash como false al montar el componente
    const initializeFlash = async () => {
      try {
        await set(flashRef, { enabled: false });
        await AsyncStorage.setItem('flashState', 'false');
        setFlashEnabled(false);
      } catch (error) {
        console.error("Error inicializando flash:", error);
      }
    };
  
    initializeFlash();
  
    // Resto de la inicialización...
    const unsubscribeIP = onValue(ipRef, (snapshot) => {
      if (snapshot.exists()) {
        const ip = snapshot.val();
        setStreamUrl(`http://${ip}/stream?t=${Date.now()}`);
      } else {
        setStreamUrl(`http://192.168.0.145/stream?t=${Date.now()}`);
      }
    });
    
    const unsubscribeFlash = onValue(flashRef, (snapshot) => {
      if (snapshot.exists()) {
        const currentFlashState = snapshot.val().enabled;

        if (currentFlashState !== flashEnabled) {
          setFlashEnabled(currentFlashState);
          AsyncStorage.setItem('flashState', currentFlashState.toString())
            .catch(e => console.error("Error guardando estado:", e));
        }
      }
    });
  
    return () => {
      unsubscribeIP();
      unsubscribeFlash();
    };
  }, []);

  const handleStreamLoad = () => {
    setIsStreamAvailable(true);
    setRetryCount(0);
  };

  const handleStreamError = () => {
    setIsStreamAvailable(false);
    if (retryCount < 2) {
      setTimeout(attemptReconnect, 1000);
    } else {
      attemptReconnect();
    }
  };

  const handleStreamStopped = () => {
    setIsStreamAvailable(false);
    attemptReconnect();
  };

  const attemptReconnect = () => {
    if (retryCount < 3) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setIsStreamAvailable(true);
        setStreamUrl(prevUrl => {
          const newUrl = prevUrl.replace(/\?t=\d+/, '') + `?t=${Date.now()}`;
          return newUrl;
        });
      }, retryCount < 2 ? 1000 : 5000);
      
      return () => clearTimeout(timer);
    }
  };

  const handleManualRetry = () => {
    Vibration.vibrate(50); // Feedback háptico
    setRetryCount(0);
    setIsStreamAvailable(true);
    setStreamUrl(prevUrl => {
      const newUrl = prevUrl.replace(/\?t=\d+/, '') + `?t=${Date.now()}`;
      return newUrl;
    });
  };

  const toggleFlash = async () => {
    const newState = !flashEnabled;
    Vibration.vibrate(50);
    
    if (flashUpdateRef.current) {
      clearTimeout(flashUpdateRef.current);
    }
    
    setFlashEnabled(newState);
    setIsFlashUpdating(true);
    
    try {
      await set(flashRef, { enabled: newState });
      await AsyncStorage.setItem('flashState', newState.toString());
    } catch (error) {
      console.error("Error al cambiar flash:", error);
      setFlashEnabled(!newState);
    } finally {
      setIsFlashUpdating(false);
    }
  };

  useEffect(() => {
    return () => {
      if (flashUpdateRef.current) {
        clearTimeout(flashUpdateRef.current);
      }
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {isStreamAvailable ? (
        <CameraComponent
          cameraUrl={streamUrl}
          onLoad={handleStreamLoad}
          onError={handleStreamError}
          onStreamStopped={handleStreamStopped}
        />
      ) : (
        <View style={styles.noStreamContainer}>
          <Text style={styles.noStreamText}>Por el momento no hay transmisión</Text>
          {retryCount < 3 ? (
            <Text style={styles.retryText}>Intentando reconectar... ({retryCount + 1}/3)</Text>
          ) : (
            <Button 
              title="Reintentar conexión" 
              onPress={handleManualRetry} 
            />
          )}
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <View style={styles.buttonWrapper}>
          <Button 
            title={flashEnabled ? "DESACTIVAR FLASH 🔦" : "ACTIVAR FLASH 📸"} 
            onPress={toggleFlash} 
            color={flashEnabled ? "#FF0000" : "#32CD32"}
            disabled={isFlashUpdating}
          />
          {isFlashUpdating && (
            <ActivityIndicator 
              style={styles.loadingIndicator} 
              size="small" 
              color={flashEnabled ? "#FF0000" : "#32CD32"} 
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  webContainer: {
    width: '100%',
    maxHeight: '80vh',
    display: 'flex',
    justifyContent: 'center',
  },
  cameraFeed: {
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: '#000',
  },
  cameraFeedWeb: {
    width: '100%',
    maxHeight: '80vh',
    objectFit: 'contain',
    backgroundColor: '#000',
  },
  buttonContainer: {
    marginVertical: 20,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 20,
    alignItems: 'center',
  },
  buttonWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingIndicator: {
    marginLeft: 10,
  },
  noStreamContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    width: '100%',
  },
  noStreamText: {
    fontSize: 18,
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryText: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
  },
});

export default LiveCameraScreen;