import './polyfills';
import * as React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
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
import Icon from 'react-native-vector-icons/FontAwesome';
import { COLORS } from './constants/colors';

function App() {
  const Stack = createStackNavigator();
  const Drawer = createDrawerNavigator();

  const Screens = () => {
    return (
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          drawerStyle: { backgroundColor: '#fff' },
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
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
          options={({ navigation }) => ({
            drawerIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="bell" color={color} size={size} />
            ),
            headerRight: () => (
              <TouchableOpacity
                style={{ marginRight: 15 }}
                onPress={() => {
                  navigation.navigate('Notifications', { deleteAll: true });
                }}
              >
                <Icon name="trash" size={24} color="#ff4444" />
              </TouchableOpacity>
            ),
          })}
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
          <Stack.Screen
            name="Sign In"
            component={SignInScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Sign Up"
            component={SignUpScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Sense-Bell"
            component={Screens}
            options={{ 
              headerShown: false,
              headerStyle: { backgroundColor: COLORS.primary },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' },
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}

export default App;
