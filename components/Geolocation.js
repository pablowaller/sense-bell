import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Button } from 'react-native-elements';
import MapView, { Marker as NativeMarker } from 'react-native-maps';
import { MapContainer, TileLayer, Marker as WebMarker } from 'react-leaflet';
import * as Location from 'expo-location';
import { COLORS, API_KEY } from '../constants/constants';

const Geolocation = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState([]);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permisos insuficientes', 'Necesitas dar permisos de localización para la app', [{ text: 'Okay' }]);
          return;
        }
        let loc = await Location.getCurrentPositionAsync({});
        setLocation({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        });
      })();
    } else {
      setLocation({ lat: -34.5, lng: -63.5 });
    }
  }, []);

  const handleTitleChange = (text) => setTitle(text);

  const handleSave = async () => {
    if (!title || !location.lat || !location.lng) {
      Alert.alert('Datos incompletos', 'Por favor, introduce un título y selecciona una ubicación.', [{ text: 'Okay' }]);
      return;
    }

    try {
      setIsFetching(true);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&key=${API_KEY}`
      );
      const data = await response.json();
      const address = data.results[0]?.formatted_address || 'Dirección no encontrada';

      const newPlace = {
        id: Math.random().toString(),
        title,
        address,
        coords: location,
      };

      setPlaces((prevPlaces) => [...prevPlaces, newPlace]);
      Alert.alert('Dirección guardada', `Se ha guardado la dirección: ${address}`);
      setTitle('');
      setSearchQuery('');
    } catch (error) {
      Alert.alert('Error al guardar', 'No se pudo guardar la dirección. Por favor, inténtalo más tarde.');
      console.error(error);
    } finally {
      setIsFetching(false);
    }
  };

  const onMapPress = (e) => {
    const lat = Platform.OS === 'web' ? e.latlng.lat : e.nativeEvent.coordinate.latitude;
    const lng = Platform.OS === 'web' ? e.latlng.lng : e.nativeEvent.coordinate.longitude;
    setLocation({ lat, lng });
  };

  const handleSearch = async () => {
    if (searchQuery) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${searchQuery}&key=${API_KEY}`
        );
        const data = await response.json();
        if (data.results.length > 0) {
          const { lat, lng } = data.results[0].geometry.location;
          setLocation({ lat, lng });
        } else {
          Alert.alert('Dirección no encontrada', 'Por favor, verifica la dirección.');
        }
      } catch (error) {
        Alert.alert('Error de búsqueda', 'Hubo un problema al buscar la dirección.');
        console.error(error);
      }
    } else {
      Alert.alert('Ingrese una dirección', 'Por favor, escribe una ciudad o calle para buscar.');
    }
  };

  const MapComponent = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.mapContainer}>
          <MapContainer
            center={[location.lat || -34.5, location.lng || -63.5]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            onclick={onMapPress}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap contributors"
            />
            {location.lat && location.lng && (
              <WebMarker position={[location.lat, location.lng]} />
            )}
          </MapContainer>
        </View>
      );
    }

    return (
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: -34.5,
          longitude: -63.5,
          latitudeDelta: 10.0,
          longitudeDelta: 10.0,
        }}
        onPress={onMapPress}
      >
        {location.lat && location.lng && (
          <NativeMarker
            coordinate={{ latitude: location.lat, longitude: location.lng }}
          />
        )}
      </MapView>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={handleTitleChange}
        placeholder="Introduce el nombre de la dirección"
      />

      <TextInput
        style={styles.input}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Buscar dirección (Ciudad, Calle...)"
      />

      <Button
        title="Buscar Dirección"
        onPress={handleSearch}
        titleStyle={styles.buttonTitleStyle}
        buttonStyle={[
          styles.buttonStyle,
          { backgroundColor: COLORS.primary, justifyContent: 'center', height: 50 },
        ]}
        containerStyle={{ width: '80%', alignSelf: 'center' }}
      />

      {isFetching ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <MapComponent />
      )}

      <Button
        title="Guardar Dirección"
        onPress={handleSave}
        titleStyle={styles.buttonTitleStyle}
        buttonStyle={[
          styles.buttonStyle,
          { backgroundColor: COLORS.primary, justifyContent: 'center', height: 50 },
        ]}
        containerStyle={{ width: '80%', alignSelf: 'center' }}
      />

      <Text style={styles.label}>Direcciones guardadas</Text>
      <ScrollView style={{ width: '100%' }}>
        {places.map((place) => (
          <View key={place.id} style={styles.placeItem}>
            <Text style={styles.placeTitle}>{place.title}</Text>
            <Text style={styles.placeAddress}>{place.address}</Text>
          </View>
        ))}
      </ScrollView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  buttonStyle: {
    marginBottom: 15,
    width: '80%',
    borderRadius: 5,
  },
  buttonTitleStyle: {
    color: 'white',
  },
  mapContainer: {
    width: '100%',
    height: 200,
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  placeItem: {
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  placeTitle: {
    fontWeight: 'bold',
  },
  placeAddress: {
    color: '#555',
  },
});

export default Geolocation;
