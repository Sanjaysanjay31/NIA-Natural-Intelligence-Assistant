import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  Easing,
  TouchableOpacity,
  Text,
} from 'react-native';
import { colors, radii } from '../theme/tokens';
import { AgentState } from '../contracts/enums';

interface NIAOrbProps {
  state: AgentState;
  onPress?: () => void;
  onLongPress?: () => void;
  size?: number;
}

export const NIAOrb: React.FC<NIAOrbProps> = ({
  state,
  onPress,
  onLongPress,
  size = 180,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  // Configure animations based on active state
  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;
    let rotateLoop: Animated.CompositeAnimation | null = null;

    if (state === AgentState.THINKING || state === AgentState.VERIFYING) {
      rotateLoop = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotateLoop.start();
    } else {
      rotateAnim.setValue(0);
    }

    const duration =
      state === AgentState.LISTENING
        ? 800
        : state === AgentState.DRIFT
        ? 1000
        : 2200;

    const maxScale =
      state === AgentState.LISTENING
        ? 1.12
        : state === AgentState.DRIFT
        ? 1.08
        : 1.04;

    pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: maxScale,
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.85,
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.35,
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
      ])
    );
    pulseLoop.start();

    return () => {
      pulseLoop?.stop();
      rotateLoop?.stop();
    };
  }, [state, pulseAnim, rotateAnim, glowAnim]);

  // Color mapping based on state
  const getOrbColors = () => {
    switch (state) {
      case AgentState.DRIFT:
        return {
          core: colors.accent.amberDrift,
          glow: colors.border.glowAmber,
          outer: 'rgba(245, 158, 11, 0.15)',
        };
      case AgentState.ERROR:
        return {
          core: colors.accent.dangerRed,
          glow: 'rgba(239, 68, 68, 0.4)',
          outer: 'rgba(239, 68, 68, 0.15)',
        };
      case AgentState.SUCCESS:
      case AgentState.VERIFIED:
        return {
          core: colors.accent.successGreen,
          glow: 'rgba(16, 185, 129, 0.4)',
          outer: 'rgba(16, 185, 129, 0.15)',
        };
      case AgentState.ACTION_PENDING:
        return {
          core: colors.primary.cyan,
          glow: colors.border.glowCyan,
          outer: 'rgba(0, 240, 255, 0.25)',
        };
      case AgentState.LISTENING:
        return {
          core: colors.primary.electricBlue,
          glow: 'rgba(59, 130, 246, 0.45)',
          outer: 'rgba(59, 130, 246, 0.2)',
        };
      default:
        return {
          core: colors.primary.cyan,
          glow: colors.border.glowCyan,
          outer: colors.primary.cyanMuted,
        };
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const activeColors = getOrbColors();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityLabel={`NIA Orb, current state: ${state}`}
      accessibilityRole="button"
      style={[styles.wrapper, { width: size + 40, height: size + 40 }]}
    >
      {/* Outer energy aura */}
      <Animated.View
        style={[
          styles.outerAura,
          {
            width: size + 32,
            height: size + 32,
            borderRadius: (size + 32) / 2,
            backgroundColor: activeColors.outer,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      {/* Rotating radar ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: size + 14,
            height: size + 14,
            borderRadius: (size + 14) / 2,
            borderColor: activeColors.core,
            transform: [{ rotate: spin }],
          },
        ]}
      />

      {/* Core glowing sphere */}
      <Animated.View
        style={[
          styles.core,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.background.surface,
            borderColor: activeColors.core,
            shadowColor: activeColors.core,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <View
          style={[
            styles.innerGlow,
            {
              backgroundColor: activeColors.core,
              width: size * 0.45,
              height: size * 0.45,
              borderRadius: (size * 0.45) / 2,
            },
          ]}
        />
        <Text style={styles.stateLabel}>{state}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerAura: {
    position: 'absolute',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    opacity: 0.6,
  },
  core: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 18,
    elevation: 12,
  },
  innerGlow: {
    opacity: 0.28,
    position: 'absolute',
  },
  stateLabel: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    opacity: 0.85,
  },
});
