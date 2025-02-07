import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { auth, db } from '../constants/database';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useUserContext } from '../components/UserContext';

const CustomDrawerContent = (props) => {
  const { profileImage, displayName, updateProfileImage } = useUserContext();
  const [userName, setUserName] = useState(displayName || 'User');

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserName(userDoc.data().name || 'User');
          updateProfileImage(userDoc.data().photoURL || null);
        }
      }
    };

    fetchUserData();
  }, [profileImage]);


  const handleSignOut = () => {
    auth.signOut()
      .then(() => {
        props.navigation.replace("Sign In");
      })
      .catch(error => alert(error.message));
  };


  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.container}>
      <View style={styles.profileContainer}>
        <Image
          source={profileImage ? { uri: profileImage.toString() } : { uri: "https://static-00.iconduck.com/assets.00/gender-neutral-user-icon-931x1024-d5xhj95c.png" }}
          style={styles.profileImage}
          onError={(error) => console.error('Error loading image:', error)}
        />
        <Text style={styles.userName}>{userName}</Text>
      </View>
      <DrawerItemList {...props} />
      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileContainer: {
    alignItems: 'center',
    padding: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    marginTop: 20,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#ff4d4d',
    borderRadius: 5,
    marginHorizontal: 20,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CustomDrawerContent;