# DeSo Examples (React Native)

Examples of using the
[deso-protocol](https://github.com/deso-protocol/deso-js#deso-protocol) library
in a React Native application.

## What works out of the box
- Data fetching
- Arbitrary key generation
- Encrypting and decrypting
- Constructing, signing, and submitting transactions

## Current Limitations
- All flows that depend on the identity window (login, logout, derive, etc) and/or
local storage are a work in progress and will require some special work specific
to the react native environment.
