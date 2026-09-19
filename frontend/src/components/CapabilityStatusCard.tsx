import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { wakeUpOrchestrator } from '../features/orchestrator/wakeUpOrchestrator';
import { WakeUpSource } from '../contracts/enums';
import { CapabilityStatus } from '../contracts/intent';

interface CapabilityItemProps {
  label: string;
  source: WakeUpSource;
  status: CapabilityStatus;
  onPressTrigger: () => void;
}

const StatusBadge: React.FC<{ status: CapabilityStatus }> = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'supported':
        return { backgroundColor: '#10B98125', borderColor: '#10B981', color: '#10B981' };
      case 'simulation':
        return { backgroundColor: '#F59E0B25', borderColor: '#F59E0B', color: '#F59E0B' };
      case 'unavailable':
      default:
        return { backgroundColor: '#EF444425', borderColor: '#EF4444', color: '#EF4444' };
    }
  };

  const current = getBadgeStyle();

  return (
    <View style={[styles.badge, { backgroundColor: current.backgroundColor, borderColor: current.borderColor }]}>
      <Text style={[styles.badgeText, { color: current.color }]}>{status.toUpperCase()}</Text>
    </View>
  );
};

export const CapabilityStatusCard: React.FC = () => {
  const capabilities = wakeUpOrchestrator.getAdapter().getCapabilities();

  const handleTrigger = (source: WakeUpSource) => {
    wakeUpOrchestrator.getAdapter().triggerWakeUp(source, { manualTest: true });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Unified Wake-Up Triggers</Text>
        <Text style={styles.modeTag}>{capabilities.platformMode === 'expo_go' ? 'EXPO GO SANDBOX' : 'NATIVE ANDROID'}</Text>
      </View>

      <Text style={styles.infoText}>
        {capabilities.platformMode === 'expo_go'
          ? 'In Expo Go, OS-level background hotwords and system-wide gestures are simulated in-app. Never claiming "always listening" in Expo Go.'
          : 'Running with native Android background services.'}
      </Text>

      <View style={styles.row}>
        <View style={styles.triggerInfo}>
          <Text style={styles.triggerName}>1. "Hey NIA" Wake Word</Text>
          <Text style={styles.triggerDesc}>Path 1: In-app voice activation</Text>
        </View>
        <StatusBadge status={capabilities.alwaysListening} />
        <TouchableOpacity style={styles.testBtn} onPress={() => handleTrigger(WakeUpSource.WAKE_WORD)}>
          <Text style={styles.testBtnText}>Test</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <View style={styles.triggerInfo}>
          <Text style={styles.triggerName}>2. Orb Tap / Circle</Text>
          <Text style={styles.triggerDesc}>Path 2: Reality verification mode</Text>
        </View>
        <StatusBadge status="supported" />
        <TouchableOpacity style={styles.testBtn} onPress={() => handleTrigger(WakeUpSource.ORB)}>
          <Text style={styles.testBtnText}>Test</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <View style={styles.triggerInfo}>
          <Text style={styles.triggerName}>3. 3-Finger Swipe Up</Text>
          <Text style={styles.triggerDesc}>Path 3: Mind Pulse scan</Text>
        </View>
        <StatusBadge status={capabilities.gestureSupport} />
        <TouchableOpacity style={styles.testBtn} onPress={() => handleTrigger(WakeUpSource.MIND_PULSE)}>
          <Text style={styles.testBtnText}>Test</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <View style={styles.triggerInfo}>
          <Text style={styles.triggerName}>4. App Icon Launch</Text>
          <Text style={styles.triggerDesc}>Path 4: Full NIA agent home</Text>
        </View>
        <StatusBadge status="supported" />
        <TouchableOpacity style={styles.testBtn} onPress={() => handleTrigger(WakeUpSource.APP_ICON)}>
          <Text style={styles.testBtnText}>Test</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F131C',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  modeTag: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: '#0284C720',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  infoText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 8,
  },
  triggerInfo: {
    flex: 1,
  },
  triggerName: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  triggerDesc: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  testBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  testBtnText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
  },
});
