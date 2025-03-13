import React, { useState } from 'react';
import { Platform, View, Text, Switch, Button, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { Icon } from 'react-native-elements';
import { Geolocation} from '../components/Geolocation'
import { useUserContext } from '../components/UserContext';
import { auth, storage } from '../constants/database';

const SettingsScreen = () => {
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [message, setMessage] = useState('');
  const [isHapticEnabled, setIsHapticEnabled] = useState(false);
  const [areNotificationsEnabled, setAreNotificationsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { profileImage, updateProfileImage } = useUserContext();

  const handleProfileImageChange = async (imageUri) => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'User must be authenticated to upload an image.');
      return null;
    }
  
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const userId = auth.currentUser.uid;
      const storageRef = ref(storage, `profileImages/${userId}/${new Date().getTime()}.jpg`);
  
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
      return null;
    }
  };
  

  const updateUserProfileImage = async (imageUrl) => {
    try {
      await updateProfile(auth.currentUser, { photoURL: imageUrl });
      updateProfileImage(imageUrl);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleImage = async (imageUri) => {
    setIsLoading(true);
    setPreviewImageUrl(imageUri);

    const uploadedImageUrl = await handleProfileImageChange(imageUri);
    if (uploadedImageUrl) {
      await updateUserProfileImage(uploadedImageUrl);
    }

    setIsLoading(false);
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
        await handleImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Error selecting image. Please try again.');
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
  
          handleImage(capturedImageUri); // Handle the captured image
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
          await handleImage(capturedImageUri); // Handle the captured image
        }
      } catch (error) {
        console.error('Error taking photo:', error);
        Alert.alert('Error', 'Error taking photo. Please try again.');
      }
    }
  };

  const handleSaveSettings = () => {
    setMessage('Settings Saved!');
    setTimeout(() => setMessage(''), 2000);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>
      <View style={styles.imageContainer}>
        {(profileImage || previewImageUrl) && (
          <View style={styles.imageWrapper}>
            <TouchableOpacity
             style={styles.cancelButton}
             onPress={async () => {
              setPreviewImageUrl(null);
              updateProfileImage(null);
              try {
                await updateProfile(auth.currentUser, { photoURL: null });
              } catch (error) {
                console.error("Error removing profile picture:", error);
              }
              }}>
                <Icon name="close" type="material" size={20} color="white" />
            </TouchableOpacity>
            <Image
              source={{ uri: (previewImageUrl || profileImage || '').toString() }}
              style={styles.image}
              onError={(error) => console.error('Error loading image:', error)}
            />
          </View>
        )}
        <Button
          title="Select Picture from Gallery"
          onPress={pickImage}
          style={styles.button}
        />
        <Button
          title={Platform.OS === 'web' ? 'Take a Picture with Webcam' : 'Take a Picture'}
          onPress={takePhoto}
          style={styles.button}
        />
      </View>
      <View style={styles.setting}>
        <Text>Haptic Feedback</Text>
        <Switch
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isHapticEnabled ? '#f5dd4b' : '#f4f3f4'}
          onValueChange={setIsHapticEnabled}
          value={isHapticEnabled}
        />
      </View>
      <View style={styles.setting}>
        <Text>Notifications</Text>
        <Switch
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={areNotificationsEnabled ? '#f5dd4b' : '#f4f3f4'}
          onValueChange={setAreNotificationsEnabled}
          value={areNotificationsEnabled}
        />
      </View>
      <Geolocation/>
      <Button title="Save Settings" onPress={handleSaveSettings} />
      {message ? <Text>{message}</Text> : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  imageContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  imageWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  button: {
    marginVertical: 5,
    backgroundColor: '#008CBA',
    borderRadius: 5,
    padding: 10,
    minWidth: 200,
  },
  cancelButton: {
    position: 'absolute',
    right: 5,
    top: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 5,
    borderRadius: 15,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
});

export default SettingsScreen;
