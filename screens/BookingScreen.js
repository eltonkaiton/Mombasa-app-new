import { View, Text, StyleSheet } from 'react-native';

export default function BookingScreen() {
  return (
    <View style={styles.container}>
      <Text>This is the Booking Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
});
