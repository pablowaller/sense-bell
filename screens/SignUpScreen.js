import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, Platform, Alert } from 'react-native';
import { Input, Button, Icon } from 'react-native-elements';
import * as ImagePicker from 'expo-image-picker';
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import AuthScreenWrapper from '../components/AuthScreenWrapper';
import { useUserContext } from '../components/UserContext';
import { auth, storage } from '../constants/database';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const SignUpScreen = ({ navigation }) => {
  const { updateProfileImage, updateDisplayName } = useUserContext();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [imageUrl, setImageUrl] = useState(null);
  const [isSecureEntry, setIsSecureEntry] = useState(true);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  const toggleSecureEntry = () => {
    setIsSecureEntry(prevState => !prevState);
  };

  const handleProfileImageChange = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const imageRef = ref(storage, `profileImages/${auth.currentUser.uid}/${new Date().getTime()}`);
      await uploadBytes(imageRef, blob);
      const imageUrl = await getDownloadURL(imageRef);
      return imageUrl;
    } catch (error) {
      console.error("Error uploading image: ", error);
      return null;  
    }
  };

  const handleSignUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      let uploadedImageUrl = null;
      if (imageUrl) {
        uploadedImageUrl = await handleProfileImageChange(imageUrl);
      }
  
      await updateProfile(user, {
        displayName: name,
        photoURL: uploadedImageUrl,
      });
  
      updateDisplayName(name);
      updateProfileImage(uploadedImageUrl);
  
      navigation.replace('Sense-Bell');
    } catch (error) {
      console.error("Error signing up: ", error);
      Alert.alert("Error", error.message);
    }
  };

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
        setImageUrl(selectedImageUri);
        setPreviewImageUrl(selectedImageUri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Error selecting image. Please try again.");
    }
  };

  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          Alert.alert('Error', 'Your browser does not support accessing the webcam.');
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
  
          setImageUrl(capturedImageUri); // Set the image URL for sign-up
          setPreviewImageUrl(capturedImageUri); // Set the preview image URL
        });
      } catch (error) {
        console.error('Error accessing webcam:', error);
        Alert.alert('Error', 'Error accessing webcam. Please make sure you have granted camera permissions.');
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
          setImageUrl(capturedImageUri); 
          setPreviewImageUrl(capturedImageUri); 
        }
      } catch (error) {
        console.error('Error taking photo:', error);
        Alert.alert('Error', 'Error taking photo. Please try again.');
      }
    }
  };

  return (
    <AuthScreenWrapper
      title="SIGN UP"
      message="Do you already have an account?"
      buttonText="SIGN IN"
      buttonPath="Sign In"
      style={styles.registerContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Input
          placeholder="Name"
          leftIcon={{ type: "material", name: "badge" }}
          value={name}
          onChangeText={setName}
          required
        />
        <Input
          placeholder="Email"
          leftIcon={{ type: "material", name: "email" }}
          value={email}
          onChangeText={setEmail}
          required
        />
        <Input
          placeholder="Password"
          leftIcon={{ type: "material", name: "lock" }}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={isSecureEntry}
          rightIcon={{
            name: isSecureEntry ? "visibility-off" : "visibility",
            type: "material",
            size: 20,
            color: "gray",
            onPress: toggleSecureEntry,
          }}
        />
        <View style={styles.imagePickerContainer}>
          <Button
            title="Select Pic from Gallery"
            onPress={pickImage}
            buttonStyle={styles.button}
            icon={{
              name: "face",
              type: "material",
              size: 20,
              color: "white",
            }}
          />
          {Platform.OS !== 'web' && (
            <Button
              title="Or take a Selfie"
              onPress={takePhoto}
              buttonStyle={styles.button}
              icon={{
                name: "camera-alt",
                type: "material",
                size: 20,
                color: "white",
              }}
            />
          )}
          {previewImageUrl && (
            <View style={styles.imageContainer}>
              <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setImageUrl(null);
                setPreviewImageUrl(null);
              }}>
                <Icon name="close" type="material" size={20} color="white" />
                </TouchableOpacity>
                <Image 
                source={{ uri: previewImageUrl }} 
                style={styles.image} 
                onError={() => setPreviewImageUrl(null)} 
                />
                </View>
              )}
        </View>
        <Button
          title="SIGN UP"
          onPress={handleSignUp}
          buttonStyle={styles.button}
        />
      </ScrollView>
    </AuthScreenWrapper>
  );
};

const styles = StyleSheet.create({
  registerContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  button: {
    marginVertical: 10,
    backgroundColor: "#008CBA",
    borderRadius: Platform.OS === 'web' ? 5 : 0,
    padding: Platform.OS === 'web' ? 10 : 15,
  },
  imagePickerContainer: {
    marginVertical: 20,
    alignItems: "center",
  },
  imageContainer: {
    position: "relative",
    marginVertical: 10,
  },
  cancelButton: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 5,
    zIndex: 1,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
});

export default SignUpScreen;