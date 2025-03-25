import React, { useState, useEffect, useRef } from 'react';
import {
  View, Button, StyleSheet, Platform, ScrollView, Text, Animated
} from 'react-native';
import { WebView as RNWebView } from 'react-native-webview';
import WebWebView from 'react-native-web-webview';
import { realtimeDb } from '../constants/database';
import { ref, set, onValue } from "firebase/database";

const WebView = Platform.OS === 'web' ? WebWebView : RNWebView;

const CameraComponent = React.memo(({ cameraUrl, onLoad, onError, onStreamStopped }) => {
  const lastUpdateRef = useRef(Date.now());
  const timerRef = useRef(null);
  const errorCountRef = useRef(0);

  const updateActivity = () => {
    lastUpdateRef.current = Date.now();
  };

  useEffect(() => {
    const checkStreamActivity = () => {
      const now = Date.now();
      if (now - lastUpdateRef.current > 10000) {
        onStreamStopped();
      }
    };

    timerRef.current = setInterval(checkStreamActivity, 2000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onStreamStopped]);

  const handleError = (error) => {
    errorCountRef.current += 1;
    if (errorCountRef.current > 2) {
      onError(error);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <div style={styles.webContainer}>
        <img
          src={cameraUrl}
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
      key="camera-stream"
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
      mixedContentMode="always"
      allowsInlineMediaPlayback={true}
      mediaPlaybackRequiresUserAction={false}
    />
  );
});

const LiveCameraScreen = ({ navigation }) => {
  const [captureStatus, setCaptureStatus] = useState("");
  const [isStreamAvailable, setIsStreamAvailable] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const captureRef = useRef(ref(realtimeDb, "capture")).current;

  useEffect(() => {
    const unsubscribeCapture = onValue(captureRef, (snapshot) => {
      if (snapshot.exists() && snapshot.val().pressed) {
        setCaptureStatus("📸 Captura solicitada");
        startFadeAnimation();
        setTimeout(() => set(ref(realtimeDb, "capture"), { pressed: false }), 1000);
      }
    });

    return () => unsubscribeCapture();
  }, []);

  const startFadeAnimation = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start(() => setCaptureStatus(""));
  };

  const cameraUrl = 'http://192.168.0.145/stream';

  const captureImage = async () => {
    try {
      await set(captureRef, { pressed: true });
    } catch (error) {
      console.error("Error al solicitar captura:", error);
    }
  };

  const handleStreamLoad = () => {
    setIsStreamAvailable(true);
    setRetryCount(0);
  };

  const handleStreamError = () => {
    setIsStreamAvailable(false);
    attemptReconnect();
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
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {isStreamAvailable ? (
        <CameraComponent
          cameraUrl={cameraUrl}
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
              onPress={() => {
                setRetryCount(0);
                setIsStreamAvailable(true);
              }} 
            />
          )}
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <Button 
          title="CAPTURAR IMAGEN 📷" 
          onPress={captureImage} 
        />
      </View>

      {captureStatus ? (
        <Animated.View style={[styles.modalContainer, { opacity: fadeAnim }]}>
          <Text style={styles.modalText}>{captureStatus}</Text>
        </Animated.View>
      ) : null}
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
  },
  modalContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    backgroundColor: 'rgba(0, 128, 0, 0.8)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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