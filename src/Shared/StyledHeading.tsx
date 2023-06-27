import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface StyledHeadingProps {
  text: string;
  size?: 'small' | 'medium' | 'large';
}

const StyledHeading: React.FC<StyledHeadingProps> = ({ text, size = 'medium' }) => {
  let headingStyle: any = null;

  switch (size) {
    case 'small':
      headingStyle = styles.smallHeading;
      break;
    case 'large':
      headingStyle = styles.largeHeading;
      break;
    case 'medium':
    default:
      headingStyle = styles.mediumHeading;
      break;
  }

  return <Text style={[styles.heading, headingStyle]}>{text}</Text>;
};

const styles = StyleSheet.create({
  heading: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  smallHeading: {
    fontSize: 16,
  },
  mediumHeading: {
    fontSize: 24,
  },
  largeHeading: {
    fontSize: 32,
  },
});

export default StyledHeading;
