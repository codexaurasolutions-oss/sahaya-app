import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { ImageConstant } from '../../Constants/ImageConstant';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const IntroScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Intro slides data
  const introSlides = [
    {
      id: 1,
      image: ImageConstant?.user || ImageConstant?.logo,
      title: 'Welcome to Sahayya',
      subtitle:
        'Your trusted companion for managing household and staff services',
    },
    {
      id: 2,
      image: ImageConstant?.logo || ImageConstant?.user,
      title: 'Manage Your Staff',
      subtitle: 'Easily add, manage and track your household staff members',
    },
    {
      id: 3,
      image: ImageConstant?.profile || ImageConstant?.logo,
      title: 'Get Started',
      subtitle:
        'Start managing your household services efficiently and effectively',
    },
  ];

  useEffect(() => {
    // Check if intro was already shown
    const checkIntroShown = async () => {
      try {
        const introShown = await AsyncStorage.getItem('introShown');
        if (introShown === 'true') {
          // Intro already shown, navigate to Login
          navigation.replace('Login');
        }
      } catch (error) {
        // If read fails, default to showing intro screen
        console.log('AsyncStorage read error:', error);
      }
    };

    checkIntroShown();

    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = async () => {
    if (currentIndex < introSlides.length - 1) {
      // Go to next slide - let onMomentumScrollEnd handle state update
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    } else {
      // Last slide, navigate to Login
      try {
        await AsyncStorage.setItem('introShown', 'true');
        navigation.replace('Login');
      } catch (error) {
        console.log('AsyncStorage save error:', error);
        navigation.replace('Login');
      }
    }
  };

  const handleScroll = event => {
    // Only update during manual scroll, not programmatic scroll
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    if (
      slideIndex !== currentIndex &&
      slideIndex >= 0 &&
      slideIndex < introSlides.length
    ) {
      // Check if this is a manual scroll (not programmatic)
      const scrollPosition = event.nativeEvent.contentOffset.x;
      const expectedPosition = currentIndex * width;
      const isManualScroll = Math.abs(scrollPosition - expectedPosition) > 10;

      if (isManualScroll) {
        setCurrentIndex(slideIndex);
      }
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem('introShown', 'true');
      navigation.replace('Login');
    } catch (error) {
      // Even if save fails, navigate to Login
      console.log('AsyncStorage save error:', error);
      navigation.replace('Login');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FEF9F9" />

      {/* Image Slider */}
      <Animated.View
        style={[
          styles.sliderContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={event => {
            // This handles both manual and programmatic scrolls
            const slideIndex = Math.round(
              event.nativeEvent.contentOffset.x / width,
            );
            if (slideIndex >= 0 && slideIndex < introSlides.length) {
              setCurrentIndex(slideIndex);
            }
          }}
        >
          {introSlides.map((slide, index) => (
            <View key={slide.id} style={styles.slide}>
              <View style={styles.imageContainer}>
                <Image
                  source={slide.image}
                  style={[
                    styles.image,
                    index === 1 && styles.logoImage,
                  ]}
                  resizeMode={index === 1 ? 'contain' : 'cover'}
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.subtitle}>{slide.subtitle}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Pagination Dots */}
      <View style={styles.paginationContainer}>
        {introSlides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>

      {/* Buttons */}
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            transform: [{ translateY: slideAnim }],
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          accessibilityLabel="Next button"
          accessibilityRole="button"
        >
          <Text style={styles.nextButtonText}>
            {currentIndex === introSlides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          accessibilityLabel="Skip button"
          accessibilityRole="button"
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF9F9',
  },
  sliderContainer: {
    flex: 1,
  },
  slide: {
    width: width,
    flex: 1,
  },
  imageContainer: {
    height: height * 0.45,
    width: '100%',
    overflow: 'hidden',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  logoImage: {
    width: width * 0.6,
    height: '70%',
    alignSelf: 'center',
    marginTop: '5%',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D98579',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#D98579',
    width: 24,
  },
  inactiveDot: {
    backgroundColor: '#D0D0D0',
  },
  buttonContainer: {
    paddingBottom: 30,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#D98579',
    width: width * 0.6,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#D98579',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    color: '#888888',
    fontSize: 15,
    fontWeight: '500',
  },
});

export default IntroScreen;
