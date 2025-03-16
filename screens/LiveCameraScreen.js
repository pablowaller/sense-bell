import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Button, Text, StyleSheet, Platform, ActivityIndicator 
} from 'react-native';
import { WebView as RNWebView } from 'react-native-webview';
import WebWebView from 'react-native-web-webview';
import { FaceDetector } from 'react-native-mlkit-face-detection';
import { realtimeDb } from '../constants/database';
import { ref, set, onValue } from "firebase/database"; 

const WebView = Platform.OS === 'web' ? WebWebView : RNWebView;

const CameraComponent = React.memo(({ cameraUrl, onLoad, onError }) => {
  if (Platform.OS === 'web') {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
        <img
          src={cameraUrl}
          style={styles.cameraFeedWeb}
          alt="Live Camera Feed"
          onError={onError}
          onLoad={onLoad}
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
      onLoadEnd={onLoad}
      onError={onError}
    />
  );
});

const LiveCameraScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [faces, setFaces] = useState([]);
  const [flashPressed, setFlashPressed] = useState(false);
  const [streaming, setStreaming] = useState(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const flashRef = ref(realtimeDb, "flash");
    onValue(flashRef, (snapshot) => {
      if (snapshot.exists()) {
        setFlashPressed(snapshot.val().pressed);
        console.log("Estado del flash actualizado:", snapshot.val().pressed);
      }
    });

    return () => {};
  }, []);

  const cameraUrl = 'http://192.168.0.145/stream'; 

  useEffect(() => {
    if (streaming) {
      const detectFacesInStream = async () => {
        const faceDetector = new FaceDetector();
        const detectedFaces = await faceDetector.detectFaces(streaming);
        setFaces(detectedFaces);
      };

      const interval = setInterval(() => {
        detectFacesInStream();
      }, 2000);  

      return () => clearInterval(interval);
    }
  }, [streaming]);

  const handleLoad = () => {
    setLoading(false);
    setError(null);
    setStreaming(cameraUrl);
  };

  const handleError = () => {
    setLoading(false);
    setError('Error al cargar la transmisión. Verifica la conexión.');
  };

  const toggleFlash = async () => {
    try {
      await set(ref(realtimeDb, "flash"), { pressed: !flashPressed });
    } catch (error) {
      console.error("Error al actualizar Firebase:", error);
    }
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#0000ff" />
          <Text>Cargando transmisión...</Text>
        </View>
      )}

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Reintentar" onPress={() => setLoading(true)} />
        </View>
      ) : (
        <CameraComponent
          cameraUrl={cameraUrl}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      <View style={{ marginVertical: 20 }}>
        <Button title="FLASH LIGHT 📸" onPress={toggleFlash} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraFeed: {
    flex: 1,
    width: '100%',
    aspectRatio: 16 / 9,  
  },
  cameraFeedWeb: {
    width: '100%',
    height: '100vh',
    objectFit: 'cover',
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});

export default LiveCameraScreen;
