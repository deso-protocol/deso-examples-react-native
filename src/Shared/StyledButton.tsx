import React from "react";
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, View } from "react-native";

interface StyledButtonProps {
  text: string;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
}

const styles = StyleSheet.create({
  button: {
    marginTop: 20,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.5
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const StyledButton = (props: StyledButtonProps) => {
  const { text, disabled, loading, onPress } = props;

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator color="#FFFFFF" />
      );
    }

    return (
      <Text style={styles.buttonText}>{text}</Text>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.button, disabled ? styles.buttonDisabled : {}]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <View style={styles.loadingContainer}>
        {renderContent()}
      </View>
    </TouchableOpacity>
  );
};

export default StyledButton;
