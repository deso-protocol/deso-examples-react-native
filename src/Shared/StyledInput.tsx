import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
});

interface StyledInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
}

const StyledInput: React.FC<StyledInputProps> = ({ placeholder, value, onChangeText }) => (
  <TextInput
    style={styles.input}
    placeholder={placeholder}
    value={value}
    onChangeText={onChangeText}
  />
);

export default StyledInput;
