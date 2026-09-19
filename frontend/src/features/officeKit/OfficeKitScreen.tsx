import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';
import { AuditReportGenerator } from './auditReportGenerator';
import { RealityAuditReport } from './types';

interface OfficeKitScreenProps {
  onBack?: () => void;
}

export const OfficeKitScreen: React.FC<OfficeKitScreenProps> = ({ onBack }) => {
  const [report] = useState<RealityAuditReport>(AuditReportGenerator.generateDemoReport());
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      const markdown = AuditReportGenerator.toMarkdown(report);
      await Share.share({
        message: markdown,
        title: 'NIA Reality Audit Export',
      });
    } catch (e: any) {
      Alert.alert('Export Error', e?.message || 'Could not export audit');
    }
  };

  const handleCopyMarkdown = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>OFFICE KIT</Text>
          <Text style={styles.subtitle}>Reality Audit & Screen Mirror Review</Text>
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={handleShare}>
          <Text style={styles.exportBtnText}>Share / Export</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Office Kit Summary Card */}
        <View style={styles.introCard}>
          <View style={styles.deviceBadge}>
            <Text style={styles.deviceBadgeText}>PHONE PRIMARY • LAPTOP EXTENSION</Text>
          </View>
          <Text style={styles.introText}>
            Exporting verified reality audit to laptop/desktop for presentation review, team signoff, and audit trail retention.
          </Text>
        </View>

        {/* 1. Session */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionNum}>1. SESSION</Text>
          <Text style={styles.itemRow}>ID: <Text style={styles.codeText}>{report.session.sessionId}</Text></Text>
          <Text style={styles.itemRow}>Device: <Text style={styles.valText}>{report.session.device}</Text></Text>
          <Text style={styles.itemRow}>Runtime: <Text style={styles.valText}>{report.session.runtimeMode}</Text></Text>
        </View>

        {/* 2. What NIA Knew */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionNum}>2. WHAT NIA KNEW</Text>
          <Text style={styles.itemRow}>Entity: <Text style={styles.valText}>{report.whatNiaKnew.entity}</Text></Text>
          <Text style={styles.itemRow}>Known Location: <Text style={styles.blueText}>{report.whatNiaKnew.location}</Text></Text>
          <Text style={styles.itemRow}>Scheduled Time: <Text style={styles.valText}>{report.whatNiaKnew.scheduledTime}</Text></Text>
          <Text style={styles.itemRow}>Source: <Text style={styles.valText}>{report.whatNiaKnew.source}</Text></Text>
        </View>

        {/* 3. What Was Observed */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionNum}>3. WHAT WAS OBSERVED</Text>
          <Text style={styles.itemRow}>Observed Location: <Text style={styles.amberText}>{report.whatWasObserved.location}</Text></Text>
          <Text style={styles.itemRow}>Source: <Text style={styles.valText}>{report.whatWasObserved.source}</Text></Text>
          <Text style={styles.itemRow}>Raw Text: <Text style={styles.italicText}>"{report.whatWasObserved.rawSnippet}"</Text></Text>
        </View>

        {/* 4. Reality Drift */}
        <View style={[styles.sectionCard, styles.driftCard]}>
          <Text style={[styles.sectionNum, { color: '#F59E0B' }]}>4. REALITY DRIFT</Text>
          <Text style={styles.itemRow}>State: <Text style={styles.amberText}>{report.realityDrift.state}</Text></Text>
          <Text style={styles.itemRow}>Drift Type: <Text style={styles.valText}>{report.realityDrift.driftType}</Text></Text>
          <Text style={styles.itemRow}>Confidence: <Text style={styles.greenText}>{(report.realityDrift.confidence * 100).toFixed(0)}%</Text></Text>
          <Text style={styles.summaryText}>{report.realityDrift.driftSummary}</Text>
        </View>

        {/* 5. Evidence */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionNum}>5. EVIDENCE</Text>
          {report.evidence.map((ev) => (
            <View key={ev.evidenceId} style={styles.subItemBox}>
              <Text style={styles.itemRow}>Evidence ID: <Text style={styles.codeText}>{ev.evidenceId}</Text></Text>
              <Text style={styles.itemRow}>Snippet: <Text style={styles.italicText}>"{ev.snippet}"</Text></Text>
              <Text style={styles.itemRow}>Privacy Status: <Text style={styles.greenText}>{ev.privacyStatus}</Text></Text>
            </View>
          ))}
        </View>

        {/* 6. Impact */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionNum}>6. IMPACT</Text>
          {report.impact.items.map((imp, idx) => (
            <Text key={idx} style={styles.bulletItem}>
              • [{imp.targetType.toUpperCase()}] {imp.description} ({imp.severity})
            </Text>
          ))}
        </View>

        {/* 7. Proposed Action */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionNum}>7. PROPOSED ACTION</Text>
          <Text style={styles.itemRow}>Action: <Text style={styles.valText}>{report.proposedAction.title}</Text></Text>
          <Text style={styles.itemRow}>Description: <Text style={styles.valText}>{report.proposedAction.description}</Text></Text>
          <Text style={styles.itemRow}>Shift: <Text style={styles.blueText}>Room 204</Text> → <Text style={styles.amberText}>Room 302</Text></Text>
        </View>

        {/* 8. Approval */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionNum}>8. APPROVAL</Text>
          <Text style={styles.itemRow}>State: <Text style={styles.greenText}>{report.approval.state}</Text></Text>
          <Text style={styles.itemRow}>Method: <Text style={styles.valText}>{report.approval.approvalMethod}</Text></Text>
          <Text style={styles.itemRow}>Notes: <Text style={styles.valText}>{report.approval.notes}</Text></Text>
        </View>

        {/* 9. Result */}
        <View style={[styles.sectionCard, styles.resultCard]}>
          <Text style={[styles.sectionNum, { color: '#10B981' }]}>9. RESULT</Text>
          <Text style={styles.itemRow}>Status: <Text style={styles.greenText}>{report.result.executionStatus}</Text></Text>
          <Text style={styles.summaryText}>{report.result.summary}</Text>
        </View>

        {/* 10. Timeline */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionNum}>10. TIMELINE</Text>
          {report.timeline.map((item, idx) => (
            <View key={idx} style={styles.timelineRow}>
              <Text style={styles.timelineIndex}>{idx + 1}.</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.timelineTitle}>{item.title}</Text>
                <Text style={styles.timelineType}>{item.eventType} • {item.timestamp.slice(11, 19)}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    gap: 12,
  },
  backBtn: {
    padding: 8,
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  backBtnText: {
    color: '#00F0FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    color: '#00F0FF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 11,
  },
  exportBtn: {
    backgroundColor: '#00F0FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportBtnText: {
    color: '#07080D',
    fontSize: 11,
    fontWeight: '800',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  introCard: {
    backgroundColor: '#0E1322',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#00F0FF',
    marginBottom: 14,
  },
  deviceBadge: {
    backgroundColor: '#0284C720',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  deviceBadgeText: {
    color: '#38BDF8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  introText: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: '#0E111C',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 12,
  },
  driftCard: {
    borderColor: '#F59E0B60',
    backgroundColor: '#F59E0B08',
  },
  resultCard: {
    borderColor: '#10B98160',
    backgroundColor: '#10B98108',
  },
  sectionNum: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  itemRow: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 4,
  },
  valText: {
    color: '#F1F5F9',
    fontWeight: '600',
  },
  codeText: {
    color: '#38BDF8',
    fontFamily: 'Courier',
    fontSize: 11,
  },
  blueText: {
    color: '#93C5FD',
    fontWeight: '700',
  },
  amberText: {
    color: '#F59E0B',
    fontWeight: '700',
  },
  greenText: {
    color: '#10B981',
    fontWeight: '700',
  },
  italicText: {
    color: '#CBD5E1',
    fontStyle: 'italic',
  },
  summaryText: {
    color: '#E2E8F0',
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },
  subItemBox: {
    backgroundColor: '#07080D',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  bulletItem: {
    color: '#CBD5E1',
    fontSize: 12,
    marginBottom: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  timelineIndex: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  timelineTitle: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '600',
  },
  timelineType: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
});
