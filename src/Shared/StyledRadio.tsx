import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'black',
    marginRight: 8,
  },
  radioSelected: {
    backgroundColor: 'black',
  },
});

interface StyledRadioProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

const StyledRadio: React.FC<StyledRadioProps> = ({ label, selected, onPress }) => (
  <TouchableOpacity style={styles.radioContainer} onPress={onPress}>
    <View style={[styles.radio, selected && styles.radioSelected]} />
    <Text>{label}</Text>
  </TouchableOpacity>
);

export default StyledRadio;
