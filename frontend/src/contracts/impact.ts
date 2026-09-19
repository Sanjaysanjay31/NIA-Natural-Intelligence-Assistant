import { ImpactSeverity } from './enums';

export interface ImpactItem {
  impactId: string;
  targetType: string; // reminder, alarm, calendar, commitment
  targetId: string;
  description: string;
  severity: ImpactSeverity;
  suggestedRemediation?: string;
  metadata?: Record<string, any>;
}
