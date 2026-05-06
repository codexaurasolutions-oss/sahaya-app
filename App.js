import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const App = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>SAHAYYA APP IS WORKING!</Text>
      <Text style={styles.subtext}>If you see this, the crash is in Navigation or Redux.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtext: {
    color: 'white',
    fontSize: 14,
    marginTop: 20,
  }
});

export default App;
