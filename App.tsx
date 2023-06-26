import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { User, configure, identity } from "deso-protocol";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useContext } from "react";
import { DeSoIdentityContext, DeSoIdentityProvider } from "react-deso-protocol";
import { ActivityIndicator, Button, Text, View } from "react-native";
import CryptoPolyfill from "react-native-webview-crypto";
import DerivedKeysLogin from "./src/DerivedKeysLogin";
import LowLevelMessaging from "./src/LowLevelMessaging";

// Configure the SDK to use the Expo AuthSession and AsyncStorage
configure({
  redirectURI: AuthSession.makeRedirectUri(),

  identityPresenter: async (url) => {
    const result = await WebBrowser.openAuthSessionAsync(url);
    if (result.type === "success") {
      identity.handleRedirectURI(result.url);
    }
  },

  storageProvider: AsyncStorage,

  appName: "Deso Examples React Native",

  spendingLimitOptions: {
    GlobalDESOLimit: 1e9, // 1 $DESO
    TransactionCountLimitMap: {
      NEW_MESSAGE: "UNLIMITED",
    },
    AccessGroupLimitMap: [
      {
        AccessGroupOwnerPublicKeyBase58Check: "",
        ScopeType: "Any",
        AccessGroupKeyName: "",
        OperationType: "Any",
        OpCount: "UNLIMITED",
      },
    ],
    AccessGroupMemberLimitMap: [
      {
        AccessGroupOwnerPublicKeyBase58Check: "",
        ScopeType: "Any",
        AccessGroupKeyName: "",
        OperationType: "Any",
        OpCount: "UNLIMITED",
      },
    ],
  },
});

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <DeSoIdentityProvider>
        <CryptoPolyfill />
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Messaging" component={LowLevelMessaging} />
          <Stack.Screen name="DerivedKeysLogin" component={DerivedKeysLogin} />
        </Stack.Navigator>
      </DeSoIdentityProvider>
    </NavigationContainer>
  );
}

export function HomeScreen({ navigation }: { navigation: any }) {
  const { currentUser, isLoading } = useContext(DeSoIdentityContext);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {isLoading ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          <Text>Home Screen</Text>
          {currentUser ? (
            <>
              <Text>Hello, ${getDisplayName(currentUser)}</Text>
              <Button title="Logout" onPress={() => identity.logout()} />
            </>
          ) : (
            <Button title="Login" onPress={() => identity.login()} />
          )}
          <Button
            title="Low Level Messaging"
            onPress={() => navigation.push("Messaging")}
          />
          <Button
            title="Derived Keys Login"
            onPress={() => navigation.push("DerivedKeysLogin")}
          />
        </>
      )}
    </View>
  );
}

function getDisplayName(user: User) {
  return user.ProfileEntryResponse?.Username || user.PublicKeyBase58Check;
}
