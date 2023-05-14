import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  NOTIFICATION_EVENTS,
  User,
  configure,
  getUsersStateless,
  identity,
} from "deso-protocol-react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { createContext, useContext, useEffect, useState } from "react";
import { ActivityIndicator, Button, Text, View } from "react-native";
import CryptoPolyfill from "react-native-webview-crypto";
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

interface DesoIdentityState {
  authenticatedUser: User | null;
  isLoading: boolean;
  alternateUsers: User[];
}

const DesoIdentityContext = createContext<DesoIdentityState>({
  authenticatedUser: null,
  alternateUsers: [],
  isLoading: false,
});
const Stack = createNativeStackNavigator();

export default function App() {
  const [desoIdentityState, setDesoIdentityState] = useState<DesoIdentityState>(
    {
      authenticatedUser: null,
      alternateUsers: [],
      isLoading: false,
    }
  );

  // For in depth explanation of this useEffect, see our react example app:
  // https://github.com/deso-protocol/deso-examples-react/blob/80eccc3d8d7e29485e8645baff4bb58936080c33/src/routes/root.jsx#LL28C3-L124C5
  useEffect(
    () => {
      identity.subscribe(({ event, currentUser, alternateUsers }) => {
        if (event === NOTIFICATION_EVENTS.AUTHORIZE_DERIVED_KEY_START) {
          setDesoIdentityState((state) => ({ ...state, isLoading: true }));
          return;
        }

        if (alternateUsers?.length && !currentUser) {
          const fallbackUser = Object.values(alternateUsers)[0];
          identity.setActiveUser(fallbackUser.publicKey);
          return;
        }

        if (!currentUser) {
          setDesoIdentityState((state) => ({
            ...state,
            authenticatedUser: null,
            isLoading: false,
          }));
        } else if (
          currentUser?.publicKey !==
          desoIdentityState.authenticatedUser?.PublicKeyBase58Check
        ) {
          const alternateUserKeys =
            Object.values(alternateUsers ?? {})?.map((u) => u.publicKey) ?? [];

          setDesoIdentityState((state) => ({
            ...state,
            isLoading: true,
          }));

          getUsersStateless({
            PublicKeysBase58Check: [
              currentUser.publicKey,
              ...alternateUserKeys,
            ],
            IncludeBalance: true,
          })
            .then(({ UserList }) => {
              const [authenticatedUser, ...alternateUsers] = UserList ?? [];
              setDesoIdentityState((state) => ({
                ...state,
                authenticatedUser,
                alternateUsers,
              }));
            })
            .finally(() =>
              setDesoIdentityState((state) => ({
                ...state,
                isLoading: false,
              }))
            );
        }
      });
    },
    [] /* NOTE: We pass an empty array to useEffect so that it only runs once for our entire app session */
  );

  return (
    <DesoIdentityContext.Provider value={desoIdentityState}>
      <NavigationContainer>
        <CryptoPolyfill />
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Messaging" component={LowLevelMessaging} />
        </Stack.Navigator>
      </NavigationContainer>
    </DesoIdentityContext.Provider>
  );
}

export function HomeScreen({ navigation }: { navigation: any }) {
  const { authenticatedUser, isLoading } = useContext(DesoIdentityContext);

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
          {authenticatedUser ? (
            <>
              <Text>Hello, ${getDisplayName(authenticatedUser)}</Text>
              <Button title="Logout" onPress={() => identity.logout()} />
            </>
          ) : (
            <Button title="Login" onPress={() => identity.login()} />
          )}
          <Button
            title="Low Level Messaging"
            onPress={() => navigation.push("Messaging")}
          />
        </>
      )}
    </View>
  );
}

function getDisplayName(user: User) {
  return user.ProfileEntryResponse?.Username || user.PublicKeyBase58Check;
}
