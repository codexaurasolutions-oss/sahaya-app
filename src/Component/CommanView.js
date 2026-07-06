import React, { useRef, createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Keyboard,
} from 'react-native';

export const ScrollContext = createContext(null);
export const useScrollContext = () => useContext(ScrollContext);

const CommanView = ({ children }) => {
  const scrollRef = useRef(null);
  const [kbHeight, setKbHeight] = useState(0);
  const scrollY = useRef(0);
  const scrollViewY = useRef(0);

  useEffect(() => {
    const s1 = Keyboard.addListener('keyboardDidShow', (e) => {
      setKbHeight(e.endCoordinates.height);
    });
    const s2 = Keyboard.addListener('keyboardDidHide', () => {
      setKbHeight(0);
    });
    return () => { s1.remove(); s2.remove(); };
  }, []);

  // Track current scroll position
  const onScroll = (e) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
  };

  // Get ScrollView's own screen position once
  const onScrollViewLayout = () => {
    if (scrollRef.current) {
      scrollRef.current.measure?.((x, y, w, h, px, py) => {
        scrollViewY.current = py || 0;
      });
    }
  };

  // Called by Input on focus — receives the Input's View ref
  const scrollToInput = useCallback((inputRef) => {
    if (!inputRef || !scrollRef.current) return;

    setTimeout(() => {
      try {
        inputRef.measure((x, y, width, height, pageX, pageY) => {
          if (pageY === undefined || pageY === null) return;

          // Convert screen position to content position
          // contentPosition = screenY - scrollViewScreenY + scrollOffset
          const contentPos = pageY - scrollViewY.current + scrollY.current;

          scrollRef.current.scrollTo({
            y: Math.max(0, contentPos - 100),
            animated: true,
          });
        });
      } catch (err) {
        // silently fail
      }
    }, 400);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollContext.Provider value={scrollToInput}>
        <ScrollView
          ref={scrollRef}
          onLayout={onScrollViewLayout}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: kbHeight > 0 ? kbHeight + 60 : 100 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          <View style={styles.inner}>
            {children}
          </View>
        </ScrollView>
      </ScrollContext.Provider>
    </View>
  );
};

export default CommanView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  inner: {
    paddingHorizontal: 20,
  },
});
