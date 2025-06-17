// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, Image, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

// Import your screens based on your file structure
import SplashScreen from './screens/SplashScreen';
import HomeScreen from './screens/HomeScreen';
import SignInScreen from './screens/SignInScreen';
import SignUpScreen from './screens/SignUpScreen';
import DashboardScreen from './screens/DashboardScreen';
import SettingsScreen from './screens/SettingsScreen';
import WeatherScreen from './screens/WeatherScreen';
import CropCalendarScreen from './screens/CropCalendarScreen';
import ReminderScreen from './screens/ReminderScreen';
import CommunityForumScreen from './screens/CommunityForumScreen';
import CommunityChatScreen from './screens/CommunityChatScreen'; // New: Import CommunityChatScreen


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// MainTabs component containing the bottom tab navigator
function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="DashboardTab" // Set Dashboard as the default tab for authenticated users
      screenOptions={({ route }) => ({
        headerShown: false, // Hide header for screens within the tabs
        tabBarBackground: () => (
          <LinearGradient
            colors={['#1A5C4A', '#4CAF50']} // Example: Deeper green to a standard green gradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.tabBarBackground}
          />
        ),
        tabBarIcon: ({ focused }) => {
          let imageSource;
          const iconWidth = 24;
          const iconHeight = 24;

          // Define your custom image sources for each tab based on your assets folder
          if (route.name === 'DashboardTab') {
            imageSource = focused
              ? require('./assets/dashboard_active.png')
              : require('./assets/dashboard_inactive.png');
          } else if (route.name === 'WeatherTab') {
            imageSource = focused
              ? require('./assets/weather_active.png')
              : require('./assets/weather_inactive.png');
          } else if (route.name === 'CropCalendarTab') {
            imageSource = focused
              ? require('./assets/calender_active.png')
              : require('./assets/calender_inactive.png');
          } else if (route.name === 'ReminderTab') {
            imageSource = focused
              ? require('./assets/bell_active.png')
              : require('./assets/bell_inactive.png');
          } else if (route.name === 'CommunityForumTab') { // New Tab Icon Logic
            imageSource = focused
              ? require('./assets/chat_active.png') // Make sure you have these assets
              : require('./assets/chat_inactive.png'); // Make sure you have these assets
          }
          else if (route.name === 'SettingsTab') {
            imageSource = focused
              ? require('./assets/settings_active.png')
              : require('./assets/settings_inactive.png');
          }

          return (
            <Image
              source={imageSource}
              style={{
                width: iconWidth,
                height: iconHeight,
                tintColor: focused ? '#FFFFFF' : 'rgba(255,255,255,0.7)'
              }}
            />
          );
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.7)',
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          height: Platform.OS === 'ios' ? 90 : 65,
          paddingBottom: Platform.OS === 'ios' ? 30 : 5,
          paddingTop: 5,
          position: 'absolute',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: Platform.OS === 'ios' ? 0 : 5,
        },
        tabBarItemStyle: {
          paddingTop: Platform.OS === 'ios' ? 0 : 3,
        }
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="WeatherTab" component={WeatherScreen} options={{ title: 'Weather' }} />
      <Tab.Screen name="CropCalendarTab" component={CropCalendarScreen} options={{ title: 'Calendar' }} />
      <Tab.Screen name="CommunityForumTab" component={CommunityForumScreen} options={{ title: 'Forum' }} />
      <Tab.Screen name="ReminderTab" component={ReminderScreen} options={{ title: 'Remind' }} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}

// Main App component containing the stack navigator
const App = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash" // Start with SplashScreen
          screenOptions={{
            // Header gradient for stack screens (except those hidden by MainAppTabs)
            headerBackground: () => (
              <LinearGradient
                colors={['#029f1e', '#03ed2d']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerBackground}
              />
            ),
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 20,
            },
            headerTitleAlign: 'center',
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false  }} />
          <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: 'Sign In' }} />
          <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Sign Up' }} />
          {/* This is the crucial part: Nest the Tab Navigator here */}
          <Stack.Screen
            name="MainAppTabs"
            component={MainTabs}
            options={{ headerShown: false }} // Hide the stack header for the screen that contains the tabs
          />
          {/* New: Community Chat Screen added to the main stack */}
          <Stack.Screen
            name="CommunityChat"
            component={CommunityChatScreen}
            options={{ headerShown: false }} // We'll manage the header inside CommunityChatScreen
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

// Styles for the LinearGradient components
const styles = StyleSheet.create({
  tabBarBackground: {
    flex: 1,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    overflow: 'hidden',
  },
  headerBackground: {
    flex: 1,
  },
});

export default App;