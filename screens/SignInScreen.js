import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Input, Button, Icon } from 'react-native-elements';
import AuthScreenWrapper from '../components/AuthScreenWrapper';
import { auth, signIn, sendPasswordResetEmail } from "../constants/database";
import { useUserContext } from '../components/UserContext';

const SignInScreen = ({ navigation }) => {
  const { updateProfileImage, updateDisplayName } = useUserContext(); // Usa el hook
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSecureEntry, setIsSecureEntry] = useState(true);

  const toggleSecureEntry = () => {
    setIsSecureEntry((prevState) => !prevState);
  };

  const handleSignIn = () => {
    signIn(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        navigation.replace('Sense-Bell');
      })
      .catch((error) => {
        alert("Error: " + error.message);
      });
  };

  const handleForgotPassword = () => {
    if (email) {
      sendPasswordResetEmail(auth, email)
        .then(() => {
          alert("Password reset email sent!");
        })
        .catch((error) => {
          alert("Error: " + error.message);
        });
    } else {
      alert("Please enter your email address.");
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        updateProfileImage(user.photoURL || "https://static-00.iconduck.com/assets.00/gender-neutral-user-icon-931x1024-d5xhj95c.png");
        updateDisplayName(user.displayName || "User"); 
        navigation.replace("Sense-Bell");
      }
    });
  
    return () => {
      unsubscribe();
    };
  }, [navigation]);
  
  return (
    <AuthScreenWrapper
      title="SIGN IN"
      message="Don't have an account yet?"
      buttonText="SIGN UP"
      buttonPath="Sign Up"
    >
      <Input
        placeholder="Email"
        leftIcon={{ type: "material", name: "email" }}
        value={email}
        onChangeText={text => setEmail(text)}
        required
      />
      <Input
        placeholder="Password"
        leftIcon={{ type: "material", name: "lock" }}
        value={password}
        onChangeText={setPassword}
        secureTextEntry={isSecureEntry}
        rightIcon={
          <Icon
            name={isSecureEntry ? "visibility-off" : "visibility"}
            type="material"
            size={20}
            color="gray"
            onPress={toggleSecureEntry}
          />
        }
      />
      <Button
        title="SIGN IN"
        onPress={handleSignIn}
        buttonStyle={styles.button}
      />
      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={styles.forgotPasswordText}>Forgot password?</Text>
      </TouchableOpacity>
    </AuthScreenWrapper>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2D93AD',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#2D93AD',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
    fontSize: 16,
  }
});

export default SignInScreen;