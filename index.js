import "./shims";

import { registerRootComponent } from "expo";
import { StyleSheet, View } from "react-native";
import CryptoPolyfill from "react-native-webview-crypto";
import App from "./App";

const WebCryptoWrapper = () => (
  <View style={styles.container}>
    <CryptoPolyfill />
    <App />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(WebCryptoWrapper);
