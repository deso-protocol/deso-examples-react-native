import { decryptChatMessage, encryptChatMessage, keygen, publicKeyToBase58Check } from 'deso-protocol';
import { StatusBar } from 'expo-status-bar';
import { Button, Text, View } from 'react-native';

export default function App() {
  return (
    <View>
      <Text>Open up App.tsx to start working on your app!</Text>
      <Button title="Click me" onPress={async () => {
        const keys1 = keygen();
        const keys2 = keygen();

        const message = 'hello world';
        const publicEncryptionKey = publicKeyToBase58Check(keys2.public);
        const cipherText = await encryptChatMessage(keys1.seedHex, publicEncryptionKey, message);
        console.log('encrypted message', cipherText);
        const plainText = await decryptChatMessage(keys2.seedHex, publicKeyToBase58Check(keys1.public), cipherText);
        console.log('decrypted message', plainText);
      }} />
      <StatusBar style="auto" />
    </View>
  );
}
