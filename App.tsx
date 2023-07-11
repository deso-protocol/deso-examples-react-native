import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { User, configure, identity } from "deso-protocol";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useContext } from "react";
import { DeSoIdentityContext, DeSoIdentityProvider } from "react-deso-protocol";
import { ActivityIndicator, Text, View } from "react-native";
import CryptoPolyfill from "react-native-webview-crypto";
import DerivedKeysLogin from "./src/DerivedKeysLogin";
import LowLevelMessaging from "./src/LowLevelMessaging";
import StyledButton from "./src/Shared/StyledButton";
import StyledHeading from "./src/Shared/StyledHeading";

const Stack = createNativeStackNavigator();

export default function App() {
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

    network: "testnet",
    nodeURI: "https://test.deso.org",

    spendingLimitOptions: {
      GlobalDESOLimit: 1e9, // 1 $DESO
      TransactionCountLimitMap: {
        AUTHORIZE_DERIVED_KEY: 1,
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
        <View style={{ width: "80%" }}>
          <StyledHeading text={"Home Screen"} size={"large"} />
          {currentUser ? (
            <>
              <Text>Hello, ${getDisplayName(currentUser)}</Text>
              <StyledButton
                styles={{ backgroundColor: "#009688", width: "100%" }}
                text="Logout"
                onPress={() => identity.logout()}
              />
            </>
          ) : (
            <StyledButton
              styles={{ backgroundColor: "#009688", width: "100%" }}
              text="Login"
              onPress={() => identity.login()}
            />
          )}
          <StyledButton
            styles={{ backgroundColor: "#009688", width: "100%" }}
            text="Low Level Messaging"
            onPress={() => navigation.push("Messaging")}
          />
          <StyledButton
            styles={{ backgroundColor: "#009688", width: "100%" }}
            text="Derived Keys Login"
            onPress={() => navigation.push("DerivedKeysLogin")}
          />
        </View>
      )}
    </View>
  );
}

function getDisplayName(user: User) {
  return user.ProfileEntryResponse?.Username || user.PublicKeyBase58Check;
}
