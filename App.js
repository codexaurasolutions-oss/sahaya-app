import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const App = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>ISOLATION TEST: NO SCREENS / NO SAFE AREA</Text>
      <Text style={styles.subtext}>If this works, the problem is in Screens or Safe Area library.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'blue',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtext: {
    color: 'white',
    fontSize: 14,
    marginTop: 20,
  }
});

export default App;
