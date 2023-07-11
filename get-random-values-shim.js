import { getRandomValues } from 'expo-crypto';

if (!global.crypto) global.crypto = {};
global.crypto.getRandomValues = getRandomValues;
