import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const formatElapsedTime = seconds =>
  `0:${String(Math.min(seconds, 59)).padStart(2, '0')}`;

const VoiceSearchButton = ({
  disabled = false,
  isListening = false,
  isLoading = false,
  onPress,
  onStop,
}) => {
  const pulse = useRef(new Animated.Value(0)).current;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isListening) {
      pulse.stopAnimation();
      pulse.setValue(0);
      setElapsedSeconds(0);
      return undefined;
    }

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          duration: 650,
          easing: Easing.out(Easing.ease),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          duration: 650,
          easing: Easing.in(Easing.ease),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    pulseAnimation.start();

    const timer = setInterval(() => {
      setElapsedSeconds(current => current + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      pulseAnimation.stop();
      pulse.setValue(0);
    };
  }, [isListening, pulse]);

  const handlePress = () => {
    if (isListening) {
      onStop?.();
      return;
    }

    onPress?.();
  };

  return (
    <View style={styles.wrapper}>
      {isListening && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pulseRing,
            {
              opacity: pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0.55, 0],
              }),
              transform: [
                {
                  scale: pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1.55],
                  }),
                },
              ],
            },
          ]}
        />
      )}

      <TouchableOpacity
        accessibilityHint={
          isListening
            ? 'Stops recording and searches'
            : 'Records your voice for search'
        }
        accessibilityLabel={
          isListening ? 'Stop voice search' : 'Start voice search'
        }
        accessibilityRole="button"
        activeOpacity={0.8}
        disabled={disabled || isLoading}
        onPress={handlePress}
        style={[
          styles.button,
          isListening && styles.buttonListening,
          (disabled || isLoading) && styles.buttonDisabled,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : isListening ? (
          <View style={styles.waveform}>
            {[0, 1, 2, 3].map(index => (
              <Animated.View
                key={index}
                style={[
                  styles.waveBar,
                  {
                    transform: [
                      {
                        scaleY: pulse.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange:
                            index % 2 === 0
                              ? [0.45, 1.25, 0.7]
                              : [1.15, 0.55, 1.3],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>
        ) : (
          <View style={styles.icon}>
            <View style={styles.micBody} />
            <View style={styles.micArc} />
            <View style={styles.micStem} />
            <View style={styles.micBase} />
          </View>
        )}
      </TouchableOpacity>

      {(isListening || isLoading) && (
        <View
          pointerEvents="none"
          style={[styles.statusPill, isLoading && styles.statusPillLoading]}
        >
          {isListening && <View style={styles.liveDot} />}
          <View style={styles.statusTextGroup}>
            <Text style={styles.statusTitle}>
              {isListening
                ? `Listening ${formatElapsedTime(elapsedSeconds)}`
                : 'Processing voice'}
            </Text>
            <Text style={styles.statusHint}>
              {isListening ? 'Tap mic to stop' : 'Creating search text...'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    height: 108,
    marginRight: 2,
    position: 'relative',
    width: 54,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#D98579',
    borderRadius: 24,
    elevation: 3,
    height: 48,
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#9D3F38',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 4,
    width: 48,
    zIndex: 2,
  },
  buttonListening: {
    backgroundColor: '#C6534B',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  pulseRing: {
    backgroundColor: '#EAA098',
    borderRadius: 27,
    height: 54,
    position: 'absolute',
    top: 1,
    width: 54,
    zIndex: 1,
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
  waveform: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 22,
    justifyContent: 'center',
  },
  waveBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    height: 16,
    marginHorizontal: 1.5,
    width: 3,
  },
  statusPill: {
    alignItems: 'center',
    backgroundColor: '#FFF0EE',
    borderColor: '#E8A39B',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 43,
    paddingHorizontal: 9,
    position: 'absolute',
    right: 0,
    top: 60,
    width: 138,
    zIndex: 3,
  },
  statusPillLoading: {
    backgroundColor: '#F7F5F4',
    borderColor: '#DDD8D5',
  },
  liveDot: {
    backgroundColor: '#C6534B',
    borderRadius: 4,
    height: 8,
    marginRight: 7,
    width: 8,
  },
  statusTextGroup: {
    flex: 1,
  },
  statusTitle: {
    color: '#7E2D28',
    fontSize: 11,
    fontWeight: '700',
  },
  statusHint: {
    color: '#7C6B68',
    fontSize: 9,
    marginTop: 1,
  },
});

export default VoiceSearchButton;
