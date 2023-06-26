import { StyleSheet, Text, View } from "react-native";
import { ReactNode } from "react";

interface StyledCardProps {
  title: string;
  children: ReactNode;
}

const cardStyles = StyleSheet.create({
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
  },
});

const StyledCard: React.FC<StyledCardProps> = ({ title, children }) => (
  <View style={cardStyles.card}>
    <Text style={[cardStyles.title, cardStyles.heading1]}>{title}</Text>

    <View>
      {children}
    </View>
  </View>
);
export default StyledCard;