import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';
import { modelManager } from '../features/localAi/modelManager';
import { CapabilityReport, ModelManifest } from '../features/localAi/types';

export const LocalAiDiagnosticsCard: React.FC = () => {
  const [report, setReport] = useState<CapabilityReport>(modelManager.getCapabilityReport());
  const [manifests, setManifests] = useState<ModelManifest[]>([]);

  useEffect(() => {
    modelManager.discover().then(setManifests);
    const unsubscribe = modelManager.subscribe(() => {
      setReport(modelManager.getCapabilityReport());
    });
    return unsubscribe;
  }, []);

  const handleToggleLoad = async (name: string) => {
    const status = modelManager.status(name);
    if (status === 'READY') {
      await modelManager.unload(name);
    } else {
      await modelManager.load(name);
    }
  };

  const renderCheckItem = (label: string, available: boolean) => (
    <View style={styles.checkRow}>
      <Text style={styles.checkLabel}>{label}</Text>
      <View
        style={[
          styles.statusPill,
          available ? styles.pillAvailable : styles.pillUnavailable,
        ]}
      >
        <Text
          style={[
            styles.statusPillText,
            available ? { color: '#10B981' } : { color: '#EF4444' },
          ]}
        >
          {available ? 'AVAILABLE' : 'OFFLINE'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Local AI Runtime Diagnostics</Text>
        <Text style={styles.badge}>PHONE-ONLY</Text>
      </View>

      <Text style={styles.subtitle}>
        Deterministic VEYRA logic first. Models live strictly on the phone. Render cloud never loads model weights.
      </Text>

      {/* Capability Checklist */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>CAPABILITY AUDIT</Text>
        {renderCheckItem('Local STT (Whisper Tiny)', report.localSttAvailable)}
        {renderCheckItem('Device OCR (ML Kit)', report.ocrAvailable)}
        {renderCheckItem('Local LLM (Phi-3 Mini Q4)', report.localLlmAvailable)}
        {renderCheckItem('Speech Output (System TTS)', report.ttsAvailable)}
        {renderCheckItem('Native Mobile Runtime', report.nativeRuntimeAvailable)}
        {renderCheckItem('RAM Sufficient (8 GB)', report.memorySufficient)}
        {renderCheckItem('Storage Free (> 40 GB)', report.storageSufficient)}
      </View>

      {/* On-Device Model Registry */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>PHONE MODEL REGISTRY</Text>
        {manifests.map((m) => {
          const status = modelManager.status(m.name);
          const isReady = status === 'READY';
          return (
            <View key={m.name} style={styles.modelRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modelName}>{m.name}</Text>
                <Text style={styles.modelMeta}>
                  {m.format} • {m.quantization} • {(m.size / (1024 * 1024)).toFixed(0)} MB
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.loadBtn,
                  isReady ? styles.unloadBtn : styles.loadBtnActive,
                ]}
                onPress={() => handleToggleLoad(m.name)}
              >
                <Text style={styles.loadBtnText}>
                  {status === 'LOADING'
                    ? 'Loading...'
                    : isReady
                    ? 'Unload'
                    : 'Load'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Memory Safety Invariant Note */}
      <View style={styles.safetyBox}>
        <Text style={styles.safetyText}>
          🔒 Phone Safety Invariant: Avoids loading STT + LLM simultaneously. Models unload automatically when idle to preserve device battery and thermals.
        </Text>
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
    marginBottom: 6,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  badge: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: '#10B98120',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 14,
  },
  section: {
    marginBottom: 14,
  },
  sectionHeader: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  checkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  checkLabel: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  pillAvailable: {
    backgroundColor: '#10B98115',
    borderColor: '#10B981',
  },
  pillUnavailable: {
    backgroundColor: '#EF444415',
    borderColor: '#EF4444',
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 8,
  },
  modelName: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '600',
  },
  modelMeta: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  loadBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  loadBtnActive: {
    backgroundColor: '#0284C7',
  },
  unloadBtn: {
    backgroundColor: '#334155',
  },
  loadBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  safetyBox: {
    backgroundColor: '#07080D',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  safetyText: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
  },
});
