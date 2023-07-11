import * as Clipboard from 'expo-clipboard';
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  copyButton: {
    backgroundColor: "#009688",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 4,
    marginTop: 12,
    borderRadius: 4
  },
  copyButtonText: {
    color: "white",
    fontWeight: "bold"
  },
  text: {
    marginLeft: 8
  }
});

interface CopyToClipboardProps {
  text: string;
  children: React.ReactNode;
}

const CopyToClipboard: React.FC<CopyToClipboardProps> = ({ text, children }) => {
  const handleCopyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(text);
    } catch (error) {
      console.log("Error copying to clipboard:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text numberOfLines={4} ellipsizeMode="tail">{children}</Text>
      <TouchableOpacity style={styles.copyButton} onPress={handleCopyToClipboard}>
        <Text style={styles.copyButtonText}>Copy</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CopyToClipboard;
