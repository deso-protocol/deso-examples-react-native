# DeSo Examples (React Native)

Examples of using the
[deso-protocol](https://github.com/deso-protocol/deso-js#deso-protocol) library
in a React Native application.

## Running this app locally
This is using a basic react native [expo setup](https://reactnative.dev/docs/environment-setup?guide=quickstart).
- Make sure you have the relevant dependencies and the correct versions installed:
  - `node >= 14`
  - `ruby 2.7.6`

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

## What works out of the box
- Data fetching
- [Arbitrary key generation](./App.tsx#L10)
- [Encrypting and decrypting](./App.tsx#L15)
- Constructing, signing, and submitting transactions

## Current Limitations
- All flows that depend on the identity window (login, logout, derive, etc) and/or
local storage are a work in progress and will require some special work specific
to the react native environment.
