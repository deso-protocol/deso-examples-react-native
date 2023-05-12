import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from "react";
import { Button, Text, View } from 'react-native';
import CryptoPolyfill from "react-native-webview-crypto";
import LowLevelMessaging from "./src/LowLevelMessaging";

const Stack = createNativeStackNavigator();
export default function App() {
  return (
    <NavigationContainer>
      <CryptoPolyfill />
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
        />
        <Stack.Screen
          name="Messaging"
          component={LowLevelMessaging}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export function HomeScreen({ navigation }: { navigation: any }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
      <Text>Home Screen</Text>
      <Button title="Low Level Messaging" onPress={() => navigation.push('Messaging')}/>
    </View>
  )
}
