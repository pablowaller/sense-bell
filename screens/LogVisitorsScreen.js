import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, Alert, ActivityIndicator, Platform, Modal, TouchableOpacity } from "react-native";
import { Input, Button, Icon, Slider } from "react-native-elements";
import * as ImagePicker from "expo-image-picker";
import { storage, realtimeDb } from "../constants/database";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage";
import { ref as databaseRef, set, remove, push, get } from "firebase/database";

const LogVisitorsScreen = () => {
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [priority, setPriority] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const selectedImageUri = result.assets[0].uri;
        await handleImage(selectedImageUri);
      }
    } catch (error) {
      Alert.alert("Error", "Error seleccionando la imagen. Intenta de nuevo.");
    }
  };

  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          Alert.alert('Error', 'Tu navegador no soporta el acceso a la cámara.');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        video.addEventListener('canplay', () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          const capturedImageUri = canvas.toDataURL('image/png');
          stream.getTracks().forEach(track => track.stop());

          handleImage(capturedImageUri);
        });
      } catch (error) {
        console.error('Error accediendo a la cámara:', error);
        Alert.alert('Error', 'Error accediendo a la cámara. Asegúrate de haber concedido los permisos.');
      }
    } else {
      try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Error', 'Se requieren permisos de cámara para tomar fotos.');
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });

        if (!result.canceled) {
          const capturedImageUri = result.assets[0].uri;
          await handleImage(capturedImageUri);
        }
      } catch (error) {
        console.error('Error tomando la foto:', error);
        Alert.alert('Error', 'Error tomando la foto. Intenta de nuevo.');
      }
    }
  };

  const handleImage = async (imageUri) => {
    setImageUrl(imageUri);
    setPreviewImageUrl(imageUri);
  };

  const uploadImageToFirebase = async (uri, fileName) => {
    try {
      setUploading(true);
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const imageRef = storageRef(storage, fileName);
      
      await uploadBytes(imageRef, blob);
      const downloadUrl = await getDownloadURL(imageRef);
      setUploading(false);
      return downloadUrl;
    } catch (error) {
      setUploading(false);
      console.error("Error subiendo imagen:", error);
      return null;
    }
  };
  
  const generateUniqueFileName = async (baseName) => {
    const sanitizedName = baseName.replace(/\//g, '-');
    const photosRef = storageRef(storage, 'photos');
    
    try {
      const listResult = await listAll(photosRef);
      let count = 1;
      let fileName = `photos/${sanitizedName}_${count}.jpg`;
      
      // Verificar si el nombre ya existe y encontrar el siguiente disponible
      const existingFiles = listResult.items.map(item => item.name);
      while (existingFiles.includes(fileName.split('/')[1])) {
        count++;
        fileName = `photos/${sanitizedName}_${count}.jpg`;
      }
      
      return fileName;
    } catch (error) {
      console.error("Error listando archivos:", error);

      return `photos/${sanitizedName}_${Date.now()}.jpg`;
    }
  };

  const saveVisitorToDatabase = async (downloadUrl, fileName) => {
    try {
      const visitorsRef = databaseRef(realtimeDb, 'visitors');
      const newVisitorRef = push(visitorsRef);
      
      await set(newVisitorRef, {
        name: name,
        imageUrl: downloadUrl,
        imagePath: fileName, 
        priority: priority === 0 ? "low" : priority === 1 ? "medium" : "high",
        timestamp: Date.now(),
      });
      
      return newVisitorRef.key; 
    } catch (error) {
      console.error("Error guardando en RTDB:", error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!name || !imageUrl) {
      Alert.alert("Error", "Por favor, completa todos los campos.");
      return;
    }

    try {

      const fileName = await generateUniqueFileName(name);
      
      const uploadedImageUrl = await uploadImageToFirebase(imageUrl, fileName);
      
      if (uploadedImageUrl) {
        await saveVisitorToDatabase(uploadedImageUrl, fileName);
        await set(databaseRef(realtimeDb, 'new_face_flag'), true);
        setModalMessage("Visitante registrado correctamente!");
        setShowSuccessModal(true);
        setName("");
        setImageUrl(null);
        setPreviewImageUrl(null);
        setPriority(1);
      } else {
        Alert.alert("Error", "Error al subir la imagen. Intenta de nuevo.");
      }
    } catch (error) {
      console.error("Error en el registro:", error);
      Alert.alert("Error", "Ocurrió un error al registrar el visitante. Intenta de nuevo.");
    }
  };

  const handleDeleteVisitor = async () => {
    if (!name) {
      Alert.alert("Error", "Por favor, ingresa el nombre del visitante que deseas eliminar.");
      return;
    }
  
    try {

      const visitorsRef = databaseRef(realtimeDb, 'visitors');
      const snapshot = await get(visitorsRef);
      
      if (!snapshot.exists()) {
        Alert.alert("Error", "No se encontraron visitantes para eliminar.");
        return;
      }
      
      const visitors = snapshot.val();
      let deletedCount = 0;
      

      for (const [key, visitor] of Object.entries(visitors)) {
        if (visitor.name === name) {

          await remove(databaseRef(realtimeDb, `visitors/${key}`));
          

          if (visitor.imagePath) {
            try {
              const imageRef = storageRef(storage, visitor.imagePath);
              await deleteObject(imageRef);
            } catch (error) {
              console.log("No se encontró la imagen asociada o ya fue eliminada.");
            }
          }
          
          deletedCount++;
        }
      }
      
      if (deletedCount > 0) {
        setModalMessage(`Se eliminaron ${deletedCount} registros del visitante ${name}.`);
        setShowSuccessModal(true);
        setName("");
        setImageUrl(null);
        setPreviewImageUrl(null);
      } else {
        Alert.alert("Error", `No se encontraron visitantes con el nombre ${name}.`);
      }
    } catch (error) {
      console.error("Error eliminando visitante:", error);
      Alert.alert("Error", "No se pudo eliminar el visitante. Intenta de nuevo.");
    }
  };

  const handleUpdatePriority = async () => {
    if (!name) {
      Alert.alert("Error", "Por favor, ingresa el nombre del visitante que deseas actualizar.");
      return;
    }

    try {

      const visitorsRef = databaseRef(realtimeDb, 'visitors');
      const snapshot = await get(visitorsRef);
      
      if (!snapshot.exists()) {
        Alert.alert("Error", "No se encontraron visitantes para actualizar.");
        return;
      }
      
      const visitors = snapshot.val();
      let updatedCount = 0;
      
      for (const [key, visitor] of Object.entries(visitors)) {
        if (visitor.name === name) {
          await set(databaseRef(realtimeDb, `visitors/${key}/priority`), 
                   priority === 0 ? "low" : priority === 1 ? "medium" : "high");
          updatedCount++;
        }
      }
      
      if (updatedCount > 0) {
        setModalMessage(`Se actualizó la prioridad de ${updatedCount} registros del visitante ${name}.`);
        setShowSuccessModal(true);
      } else {
        Alert.alert("Error", `No se encontraron visitantes con el nombre ${name}.`);
      }
    } catch (error) {
      console.error("Error actualizando prioridad:", error);
      Alert.alert("Error", "No se pudo actualizar la prioridad. Intenta de nuevo.");
    }
  };

  const CustomSlider = ({ value, onValueChange, minimumValue, maximumValue, step }) => {
    if (Platform.OS === 'web') {
      return (
        <input
          type="range"
          min={minimumValue}
          max={maximumValue}
          step={step}
          value={value}
          onChange={(e) => onValueChange(parseFloat(e.target.value))}
          style={styles.webSlider}
        />
      );
    }

    return (
      <Slider
        value={value}
        onValueChange={onValueChange}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        thumbStyle={styles.thumb}
        minimumTrackTintColor="#008CBA"
        maximumTrackTintColor="#ccc"
        style={styles.slider}
      />
    );
  };

  const SuccessModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showSuccessModal}
      onRequestClose={() => setShowSuccessModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Icon name="check-circle" type="material" color="#4CAF50" size={60} />
          <Text style={styles.modalText}>{modalMessage}</Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setShowSuccessModal(false)}
          >
            <Text style={styles.modalButtonText}>Aceptar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Input
          placeholder="Insertar nombre de la persona"
          value={name}
          onChangeText={setName}
          leftIcon={{ type: "material", name: "person" }}
        />
        <Button
          title="Subir foto del rostro"
          onPress={pickImage}
          buttonStyle={styles.button}
          icon={{ name: "face", type: "material", size: 20, color: "white" }}
        />
        <Button
          title="O tomar una foto"
          onPress={takePhoto}
          buttonStyle={styles.button}
          icon={{ name: "camera-alt", type: "material", size: 20, color: "white" }}
        />
        {previewImageUrl && <Image source={{ uri: previewImageUrl }} style={styles.image} />}
        <Text style={styles.priorityText}>Prioridad del visitante:</Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>Baja</Text>
          <CustomSlider
            value={priority}
            onValueChange={setPriority}
            minimumValue={0}
            maximumValue={2}
            step={1}
          />
          <Text style={styles.sliderLabel}>Alta</Text>
        </View>
        <Text style={styles.prioritySubText}>
          {priority === 0 ? "baja" : priority === 1 ? "media" : "alta"}
        </Text>

        {uploading && <ActivityIndicator size="large" color="#008CBA" />}
        <Button
          title="Registrar usuario en la base de datos"
          onPress={handleSubmit}
          buttonStyle={[styles.button, { backgroundColor: "#0bb4bf" }]}
          icon={{ name: "cloud-upload", type: "material", size: 20, color: "white" }}
        />
        <Button
          title="Eliminar visitante de la base de datos"
          onPress={handleDeleteVisitor}
          buttonStyle={[styles.button, { backgroundColor: "#ff4444" }]}
          icon={{ name: "delete", type: "material", size: 20, color: "white" }}
        />
        <Button
          title="Actualizar prioridad"
          onPress={handleUpdatePriority}
          buttonStyle={[styles.button, { backgroundColor: "#4CAF50" }]}
          icon={{ name: "update", type: "material", size: 20, color: "white" }}
        />
      </ScrollView>
      <SuccessModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    padding: 20,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 30,
  },
  button: {
    marginVertical: 7,
    backgroundColor: "#008CBA",
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginVertical: 10,
  },
  priorityText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
    fontWeight: "bold",
  },
  prioritySubText: {
    fontSize: 15,
    textAlign: "center",
    fontWeight: "bold",
    color: "#008CBA",
    marginBottom: 10,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 30,
    marginTop: 10,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },
  thumb: {
    height: 20,
    width: 20,
    backgroundColor: "#0bb4bf",
  },
  slider: {
    width: "70%", 
  },
  webSlider: {
    width: "100%",
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 25,
    borderRadius: 10,
    alignItems: "center",
    width: "80%",
  },
  modalText: {
    fontSize: 18,
    marginVertical: 15,
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: "#008CBA",
    padding: 10,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
  },
});

export default LogVisitorsScreen;