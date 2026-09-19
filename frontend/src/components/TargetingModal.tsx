import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { colors, radii, spacing, typography } from '../theme/tokens';
import {
  getBackendTarget,
  setBackendTarget,
  getLaptopWifiIp,
  setLaptopWifiIp,
  resolveApiBaseUrl,
  BackendTarget,
} from '../config/targeting';
import { apiClient } from '../services/apiClient';

interface TargetingModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TargetingModal: React.FC<TargetingModalProps> = ({
  visible,
  onClose,
}) => {
  const [target, setTarget] = useState<BackendTarget>(getBackendTarget());
  const [ip, setIp] = useState<string>(getLaptopWifiIp());
  const [resolvedUrl, setResolvedUrl] = useState<string>(resolveApiBaseUrl());
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  const handleSelectTarget = (newTarget: BackendTarget) => {
    setBackendTarget(newTarget);
    setTarget(newTarget);
    setResolvedUrl(resolveApiBaseUrl());
    setTestResult(null);
  };

  const handleIpChange = (newIp: string) => {
    setIp(newIp);
    try {
      setLaptopWifiIp(newIp);
      setResolvedUrl(resolveApiBaseUrl());
    } catch {
      // transient invalid input
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult('Connecting...');
    try {
      const activeUrl = resolveApiBaseUrl();
      const res = await fetch(`${activeUrl}/api/v1/health`);
      if (res.ok) {
        const data = await res.json();
        setTestResult(`✓ Connected! ${data.appName} (${data.status})`);
      } else {
        setTestResult(`✗ Server returned status: ${res.status}`);
      }
    } catch (err: any) {
      setTestResult(`✗ Connection failed: ${err.message || 'Network request failed'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Backend Targeting</Text>
          <Text style={styles.subtitle}>
            Select where NIA sends reality queries
          </Text>

          {/* Target Selection Pills */}
          <View style={styles.targetRow}>
            <TouchableOpacity
              style={[
                styles.targetBtn,
                target === 'render' && styles.targetBtnActive,
              ]}
              onPress={() => handleSelectTarget('render')}
            >
              <Text
                style={[
                  styles.targetBtnText,
                  target === 'render' && styles.targetBtnTextActive,
                ]}
              >
                Render Cloud
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.targetBtn,
                target === 'lan' && styles.targetBtnActive,
              ]}
              onPress={() => handleSelectTarget('lan')}
            >
              <Text
                style={[
                  styles.targetBtnText,
                  target === 'lan' && styles.targetBtnTextActive,
                ]}
              >
                Laptop LAN
              </Text>
            </TouchableOpacity>
          </View>

          {/* LAN IP Input */}
          {target === 'lan' && (
            <View style={styles.ipContainer}>
              <Text style={styles.inputLabel}>Laptop WiFi IPv4:</Text>
              <TextInput
                style={styles.input}
                value={ip}
                onChangeText={handleIpChange}
                placeholder="192.168.1.100"
                placeholderTextColor={colors.text.muted}
                keyboardType="numeric"
              />
            </View>
          )}

          {/* Resolved URL Display */}
          <View style={styles.resolvedBox}>
            <Text style={styles.resolvedHeader}>RESOLVED API BASE URL:</Text>
            <Text style={styles.resolvedUrl}>{resolvedUrl}</Text>
          </View>

          {/* Test Connection Button */}
          <TouchableOpacity
            style={styles.testBtn}
            onPress={handleTestConnection}
            disabled={isTesting}
          >
            <Text style={styles.testBtnText}>
              {isTesting ? 'Testing...' : 'Test Connection'}
            </Text>
          </TouchableOpacity>

          {testResult && (
            <Text
              style={[
                styles.resultText,
                testResult.startsWith('✓') ? styles.resultSuccess : styles.resultError,
              ]}
            >
              {testResult}
            </Text>
          )}

          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.background.overlay,
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: colors.background.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.md,
  },
  targetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  targetBtn: {
    flex: 1,
    backgroundColor: colors.background.elevated,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  targetBtnActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderColor: colors.primary.cyan,
  },
  targetBtnText: {
    color: colors.text.secondary,
    fontWeight: '600',
    fontSize: typography.fontSize.sm,
  },
  targetBtnTextActive: {
    color: colors.primary.cyan,
  },
  ipContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    color: colors.text.muted,
    fontSize: typography.fontSize.xs,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.background.elevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.sm,
  },
  resolvedBox: {
    backgroundColor: colors.background.elevated,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.cyan,
  },
  resolvedHeader: {
    color: colors.text.muted,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  resolvedUrl: {
    color: colors.primary.cyan,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.mono,
  },
  testBtn: {
    backgroundColor: colors.primary.electricBlue,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  testBtnText: {
    color: colors.text.primary,
    fontWeight: 'bold',
    fontSize: typography.fontSize.sm,
  },
  resultText: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  resultSuccess: {
    color: colors.accent.successGreen,
  },
  resultError: {
    color: colors.accent.dangerRed,
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  closeBtnText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
});
