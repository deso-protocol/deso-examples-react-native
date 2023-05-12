import "./shims";

import { registerRootComponent } from "expo";
import { View } from "react-native";
import CryptoPolyfill from "react-native-webview-crypto";

import App from "./App";

const WebCryptoWrapper = () => {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CryptoPolyfill />
      <App />
    </View>
  );
};

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(WebCryptoWrapper);
