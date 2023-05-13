import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  NOTIFICATION_EVENTS,
  User,
  configure,
  getUsersStateless,
  identity,
} from "deso-protocol";
import * as AuthSession from "expo-auth-session";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { ActivityIndicator, Button, Text, View } from "react-native";

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

interface AppState {
  authenticatedUser: User | null;
  isLoading: boolean;
  alternateUsers: User[];
}

export default function App() {
  const [appState, setAppState] = useState<AppState>({
    authenticatedUser: null,
    alternateUsers: [],
    isLoading: false,
  });

  // For in depth explanation of this useEffect, see our react example app:
  // https://github.com/deso-protocol/deso-examples-react/blob/80eccc3d8d7e29485e8645baff4bb58936080c33/src/routes/root.jsx#LL28C3-L124C5
  useEffect(
    () => {
      identity.subscribe(({ event, currentUser, alternateUsers }) => {
        if (event === NOTIFICATION_EVENTS.AUTHORIZE_DERIVED_KEY_START) {
          setAppState((state) => ({ ...state, isLoading: true }));
          return;
        }

        if (alternateUsers?.length && !currentUser) {
          const fallbackUser = Object.values(alternateUsers)[0];
          identity.setActiveUser(fallbackUser.publicKey);
          return;
        }

        if (!currentUser) {
          setAppState((state) => ({
            ...state,
            authenticatedUser: null,
            isLoading: false,
          }));
        } else if (
          currentUser?.publicKey !==
          appState.authenticatedUser?.PublicKeyBase58Check
        ) {
          const alternateUserKeys =
            Object.values(alternateUsers ?? {})?.map((u) => u.publicKey) ?? [];

          setAppState((state) => ({
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
              setAppState((state) => ({
                ...state,
                authenticatedUser,
                alternateUsers,
              }));
            })
            .finally(() =>
              setAppState((state) => ({
                ...state,
                isLoading: false,
              }))
            );
        }
      });
    },
    [] /* NOTE: We pass an empty array to useEffect so that it only runs once for our entire app session */
  );

  if (appState.isLoading) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <View>
      <Text>Open up App.tsx to start working on your app!</Text>
      {appState.authenticatedUser ? (
        <>
          <Text>Hello, ${getDisplayName(appState.authenticatedUser)}</Text>
          <Button title="Logout" onPress={() => identity.logout()} />
        </>
      ) : (
        <Button title="Login" onPress={() => identity.login()} />
      )}
      <StatusBar style="auto" />
    </View>
  );
}

function getDisplayName(user: User) {
  return user.ProfileEntryResponse?.Username || user.PublicKeyBase58Check;
}
