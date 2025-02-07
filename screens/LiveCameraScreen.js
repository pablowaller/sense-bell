import React, { useState } from 'react';
import { View, Button, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

const LiveCameraScreen = ({ navigation }) => {
  const [imageCaptured, setImageCaptured] = useState(null);
  const [loading, setLoading] = useState(true); // Estado para controlar la carga del stream

  // URL de la transmisión y captura de la ESP32-CAM
  const cameraUrl = 'http://192.168.0.145/stream'; 
  const captureImageUrl = 'http://192.168.0.145/cam-hi.jpg'; 

  // Función para capturar imagen
  const captureImage = () => {
    setImageCaptured(captureImageUrl);
    navigation.navigate('VisitorsScreen', { capturedImage: captureImageUrl });
  };

  // Componente de la cámara
  const CameraComponent = () => {
    if (Platform.OS === 'web') {
      return (
        <img
          src={cameraUrl}
          style={{
            width: 300,
            height: 200,
            objectFit: 'cover',
          }}
          alt="Live Camera Feed"
          onError={() => alert('Error al cargar la transmisión. Verifica la conexión.')}
          onLoad={() => setLoading(false)}
        />
      );
    }

    return (
      <WebView
        source={{ uri: cameraUrl }}
        style={styles.cameraFeed}
        scrollEnabled={false}
        javaScriptEnabled={true}
        onLoadEnd={() => setLoading(false)}
        onError={() => alert('Error al cargar la transmisión. Verifica la conexión.')}
      />
    );
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Cargando transmisión...</Text>
        </View>
      )}
      <CameraComponent />
      <Button title="Capturar Imagen" onPress={captureImage} />
      {imageCaptured && <Text>Snapshot tomado, redirigiendo...</Text>}
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
    width: 300,
    height: 200,
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    alignItems: 'center',
  },
});

export default LiveCameraScreen;
