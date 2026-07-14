import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

const VoiceSearchButton = ({
  disabled = false,
  isListening = false,
  isLoading = false,
  onPress,
  onStop,
}) => {
  const handlePress = () => {
    if (isListening) {
      onStop?.();
      return;
    }

    onPress?.();
  };

  return (
    <TouchableOpacity
      accessibilityLabel={isListening ? 'Stop voice search' : 'Start voice search'}
      accessibilityRole="button"
      activeOpacity={0.8}
      disabled={disabled || isLoading}
      onPress={handlePress}
      style={[
        styles.button,
        isListening && styles.buttonListening,
        (disabled || isLoading) && styles.buttonDisabled,
      ]}>
      {isLoading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <View style={styles.icon}>
          <View style={styles.micBody} />
          <View style={styles.micArc} />
          <View style={styles.micStem} />
          <View style={styles.micBase} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#D98579',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    marginRight: 6,
    marginTop: 4,
    width: 44,
  },
  buttonListening: {
    backgroundColor: '#C45D55',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  icon: {
    alignItems: 'center',
    height: 28,
    position: 'relative',
    width: 24,
  },
  micBody: {
    borderColor: '#FFFFFF',
    borderRadius: 7,
    borderWidth: 2,
    height: 17,
    position: 'absolute',
    top: 0,
    width: 11,
  },
  micArc: {
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderBottomWidth: 2,
    borderColor: '#FFFFFF',
    borderLeftWidth: 2,
    borderRightWidth: 2,
    height: 13,
    position: 'absolute',
    top: 8,
    width: 19,
  },
  micStem: {
    backgroundColor: '#FFFFFF',
    height: 5,
    position: 'absolute',
    top: 20,
    width: 2,
  },
  micBase: {
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    height: 2,
    position: 'absolute',
    top: 25,
    width: 12,
  },
});

export default VoiceSearchButton;
