// NOTE: shims must be imported into index.js before anything else and the order
// is important so don't change it.
import "./get-random-values-shim";

// The deso-protocol lib depends on the ethers library. See the following for more info:
// https://docs.ethers.org/v5/cookbook/react-native/
import "@ethersproject/shims";

import { TextDecoder, TextEncoder } from 'text-encoding';

import 'react-native-url-polyfill/auto';

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}
