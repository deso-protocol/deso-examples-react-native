import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  configure,
  decryptChatMessage,
  encryptChatMessage,
  getUsersStateless,
  identity,
  keygen,
  publicKeyToBase58Check,
} from "deso-protocol";
import * as AuthSession from "expo-auth-session";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from 'expo-web-browser';
import { Button, Linking, Text, View } from "react-native";

configure({
  redirectURI: AuthSession.makeRedirectUri(),
  identityPresenter: (url) => WebBrowser.openBrowserAsync(url),
  identityRedirectResolver: () => {
    return new Promise((resolve) => {
      Linking.addEventListener('url', ({ url }) => {
        WebBrowser.dismissBrowser();
        resolve(url);
      });
    });
  },

  storageProvider: AsyncStorage,
});

export default function App() {
  return (
    <View>
      <Text>Open up App.tsx to start working on your app!</Text>
      <Button
        title="Click me"
        onPress={async () => {
          const user = await getUsersStateless({
            PublicKeysBase58Check: ['BC1YLivYU6g9w3LXNnS7Amiji3AoQQjDNKgTX8GEeaTo7J9551nFCTB'],
          });

          console.log("user", user);

          const keys1 = keygen();
          const keys2 = keygen();

          const message = "hello world";
          const publicEncryptionKey = publicKeyToBase58Check(keys2.public);
          const cipherText = await encryptChatMessage(
            keys1.seedHex,
            publicEncryptionKey,
            message
          );
          console.log("encrypted message", cipherText);
          const plainText = await decryptChatMessage(
            keys2.seedHex,
            publicKeyToBase58Check(keys1.public),
            cipherText
          );
          console.log("decrypted message", plainText);
        }}
      />
      <Button
        title="Login"
        onPress={async () => {
          const payload = await identity.login();
          console.log("payload", payload);

          const snapshot = await identity.snapshot();
          console.log("snapshot", snapshot);
        }}
      />
      <StatusBar style="auto" />
    </View>
  );
}
