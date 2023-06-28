import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StyledMessageProps {
  text: string;
  sender: string;
  timestampNanos: number;
  isSelf: boolean;
}

const StyledMessage: React.FC<StyledMessageProps> = ({ text, sender, timestampNanos, isSelf }) => {
  const containerStyle = isSelf ? styles.selfContainer : styles.otherContainer;
  const textStyle = isSelf ? styles.selfText : styles.otherText;

  return (
    <View style={{ marginBottom: 10 }}>
      <View style={containerStyle}>
        <Text style={styles.title}>{sender}</Text>
        <Text style={[styles.text, textStyle]}>{text}</Text>
      </View>

      <View>
        <Text style={[styles.timestamp, textStyle]}>{formatTimestamp(timestampNanos)}</Text>
      </View>
    </View>
  );
};

const formatTimestamp = (timestampNanos: number): string => {
  const timestamp = new Date(timestampNanos / 1000000).toLocaleString();
  return timestamp;
};

const styles = StyleSheet.create({
  selfContainer: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
    borderRadius: 10,
    padding: 10,
  },
  otherContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 10,
  },
  title: {
    fontSize: 12,
    marginBottom: 5,
    color: '#888',
  },
  text: {
    fontSize: 16,
    color: '#000',
  },
  selfText: {
    textAlign: 'right',
  },
  otherText: {
    textAlign: 'left',
  },
  timestamp: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
    textAlign: 'right',
  },
});

export default StyledMessage;
