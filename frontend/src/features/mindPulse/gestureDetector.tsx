import React, { useRef } from 'react';
import {
  PanResponder,
  View,
  StyleSheet,
  ViewProps,
  PanResponderGestureState,
  GestureResponderEvent,
} from 'react-native';
import { mindPulseService } from './mindPulseService';

interface MindPulseGestureDetectorProps extends ViewProps {
  children: React.ReactNode;
  onGestureDetected?: () => void;
}

/**
 * Real 3-Finger Gesture Detector for Expo Go and Native environments.
 * Detects 3-finger swipe up gesture to trigger the Mind Pulse verification radar.
 */
export const MindPulseGestureDetector: React.FC<MindPulseGestureDetectorProps> = ({
  children,
  onGestureDetected,
  style,
  ...props
}) => {
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt: GestureResponderEvent) => {
        // Only claim responder if 3 touches are detected simultaneously
        return evt.nativeEvent.touches.length === 3;
      },
      onMoveShouldSetPanResponder: (
        evt: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        return evt.nativeEvent.touches.length === 3 && Math.abs(gestureState.dy) > 10;
      },
      onPanResponderRelease: (
        evt: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        // Swipe Up: negative dy exceeding 40 density pixels
        if (gestureState.dy < -40) {
          if (onGestureDetected) {
            onGestureDetected();
          } else {
            mindPulseService.triggerPulse();
          }
        }
      },
    })
  ).current;

  return (
    <View style={[styles.container, style]} {...panResponder.panHandlers} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
