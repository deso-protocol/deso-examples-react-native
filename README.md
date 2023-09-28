# DeSo Examples (React Native)

Examples of using the
[deso-protocol](https://github.com/deso-protocol/deso-js#deso-protocol) library
in a React Native application. 

IMPORTANT: [Read this REACT-NATIVE.md](https://github.com/deso-protocol/deso-js/blob/main/REACT-NATIVE.md) for an overview of shims and other requirements.

## Running this app locally
This is using a basic react native [expo setup](https://reactnative.dev/docs/environment-setup?guide=quickstart).
- Make sure you have the relevant dependencies and the correct versions installed:
  - `node >= 14`
  - `ruby 2.7.6`

- Install [cocoapods](https://cocoapods.org) (native ios dependency manager).
  ```sh
  sudo gem install cocoapods
  ```

- clone this repo
  ```sh
  git clone ...
  ```

- Install dependencies
  ```sh
  cd deso-examples-react-native
  npm i
  ```

- Make sure all necessary native code is installed
  ```sh
  npx expo prebuild
  cd ios && pod install && cd -
  ```

- Run the app
  ```sh
  npx expo start
  ```

- Install the [Expo Go](https://expo.dev/client) app on your phone

- Open your phone's camera app and scan the QR code from your terminal
