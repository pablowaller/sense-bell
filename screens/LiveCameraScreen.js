import React, { useState, useEffect } from 'react';
import { 
  View, Button, StyleSheet, Platform, ScrollView, Text
} from 'react-native';
import { WebView as RNWebView } from 'react-native-webview';
import WebWebView from 'react-native-web-webview';
import { realtimeDb } from '../constants/database';
import { ref, set, onValue } from "firebase/database"; 

const WebView = Platform.OS === 'web' ? WebWebView : RNWebView;

const CameraComponent = React.memo(({ cameraUrl, onLoad, onError }) => {
  if (Platform.OS === 'web') {
    return (
      <div style={styles.webContainer}>
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
      mixedContentMode="always"
    />
  );
});

const LiveCameraScreen = ({ navigation }) => {
  const [flashPressed, setFlashPressed] = useState(false);
  const [capturePressed, setCapturePressed] = useState(false);
  const [captureStatus, setCaptureStatus] = useState("");

  useEffect(() => {
    const flashRef = ref(realtimeDb, "flash");
    const captureRef = ref(realtimeDb, "capture");

    const unsubscribeFlash = onValue(flashRef, (snapshot) => {
      if (snapshot.exists()) {
        setFlashPressed(snapshot.val().pressed);
        console.log("Estado del flash actualizado:", snapshot.val().pressed);
      }
    });

    const unsubscribeCapture = onValue(captureRef, (snapshot) => {
      if (snapshot.exists()) {
        setCapturePressed(snapshot.val().pressed);
        console.log("Estado de captura actualizado:", snapshot.val().pressed);
        if (snapshot.val().pressed) {
          setCaptureStatus("📸 Captura solicitada");
        } else {
          setCaptureStatus("");
        }
      }
    });

    return () => {
      unsubscribeFlash();
      unsubscribeCapture();
    };
  }, []);

  const cameraUrl = 'http://192.168.0.145/stream'; 

  const toggleFlash = async () => {
    try {
      await set(ref(realtimeDb, "flash"), { pressed: !flashPressed });
    } catch (error) {
      console.error("Error al actualizar Firebase:", error);
    }
  };

  const captureImage = async () => {
    try {
      // Activar la captura
      await set(ref(realtimeDb, "capture"), { pressed: true });
      console.log("📸 Solicitud de captura enviada");

      // Desactivar la captura después de un breve retraso
      setTimeout(async () => {
        await set(ref(realtimeDb, "capture"), { pressed: false });
        console.log("🔄 Captura desactivada");
      }, 1000); // 1 segundo de retraso
    } catch (error) {
      console.error("❌ Error al solicitar captura:", error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <CameraComponent
        cameraUrl={cameraUrl}
      />
      <View style={styles.buttonContainer}>
        <Button title="FLASH LIGHT 📸" onPress={toggleFlash} />
        <Button title="CAPTURAR IMAGEN 📷" onPress={captureImage} />
      </View>
      {captureStatus ? <Text style={styles.statusText}>{captureStatus}</Text> : null}
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
    flex: 1,
    width: '100%',
    aspectRatio: 16 / 9,  
  },
  cameraFeedWeb: {
    width: '100%',
    maxHeight: '80vh',
    objectFit: 'cover',
  },
  buttonContainer: {
    marginVertical: 20,
    ...Platform.select({
      web: {
        flexDirection: 'row', 
        gap: 20, 
      },
      default: {
        flexDirection: 'column',
        gap: 20,
      },
    }),
  },
  statusText: {
    marginTop: 10,
    fontSize: 16,
    color: 'green',
  },
});

export default LiveCameraScreen;