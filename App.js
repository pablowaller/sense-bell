import './polyfills'; 
import * as React from 'react';
import { StyleSheet } from 'react-native'; 
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import SignInScreen from './screens/SignInScreen';
import SignUpScreen from './screens/SignUpScreen';
import HomeScreen from './screens/HomeScreen';
import NotificationScreen from './screens/NotificationScreen';
import VisitorsScreen from './screens/VisitorsScreen';
import LiveCameraScreen from './screens/LiveCameraScreen';
import SettingsScreen from './screens/SettingsScreen';
import CustomDrawerContent from './components/CustomDrawerContent'; 
import { UserProvider } from './components/UserContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

function App() {
  const Stack = createStackNavigator();
  const Drawer = createDrawerNavigator();

  const Screens = () => {
    return (
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          drawerStyle: { backgroundColor: '#fff' },
        }}
      >
        <Drawer.Screen
          name="Home"
          component={HomeScreen}
          options={{
            drawerIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="home" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen
          name="Notifications"
          component={NotificationScreen}
          options={{
            drawerIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="bell" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen
          name="Visitors"
          component={VisitorsScreen}
          options={{
            drawerIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="door-open" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen
          name="Live Stream"
          component={LiveCameraScreen}
          options={{
            drawerIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="video-wireless" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            drawerIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="cog" color={color} size={size} />
            ),
          }}
        />
      </Drawer.Navigator>
    );
  };

  return (
    <UserProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Sign In">
          <Stack.Screen name="Sign In" component={SignInScreen} />
          <Stack.Screen name="Sign Up" component={SignUpScreen} />
          <Stack.Screen
            name="Sense-Bell"
            component={Screens}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}

export default App;
