import { Text, View, Button } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LowLevelMessaging from "./src/LowLevelMessaging";
import React from "react";

const Stack = createNativeStackNavigator();
export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center'}}>
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Home' }}
        />
        <Stack.Screen
          name="Messaging"
          component={LowLevelMessaging}
          options={{ title: 'Messaging' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
    </View>
  );
}

export function HomeScreen({ navigation }: { navigation: any }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Home Screen</Text>
      <Button title="Low Level Messaging" onPress={() => navigation.push('Messaging')}/>
    </View>
  )
}
