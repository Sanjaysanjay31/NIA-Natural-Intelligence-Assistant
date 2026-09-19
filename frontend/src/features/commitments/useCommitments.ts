import { useState, useEffect, useCallback } from 'react';
import { config } from '../../config/env';
import { CommitmentItem, CommitmentStatus, CommitmentFilterOptions } from './types';

export function useCommitments(initialFilters?: CommitmentFilterOptions) {
  const [commitments, setCommitments] = useState<CommitmentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CommitmentFilterOptions>(initialFilters || {});

  const fetchCommitments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (filters.owner) queryParams.append('owner', filters.owner);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.relatedEventId) queryParams.append('relatedEventId', filters.relatedEventId);
      if (filters.relatedLocation) queryParams.append('relatedLocation', filters.relatedLocation);

      const qs = queryParams.toString();
      const url = `${config.apiUrl}/api/v1/commitments${qs ? `?${qs}` : ''}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Failed to load commitments: HTTP ${res.status}`);
      }

      const data: any[] = await res.json();
      const mapped: CommitmentItem[] = data.map((c) => ({
        id: c.id,
        owner: c.owner,
        action: c.action,
        deadline: c.deadline,
        source: c.source,
        status: c.status,
        confidence: c.confidence,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        relatedEventId: c.relatedEventId,
        relatedLocation: c.relatedLocation,
        evidenceRef: c.evidenceRef,
        evidence: c.evidence,
        metadata: c.metadata,
      }));

      setCommitments(mapped);
    } catch (err: any) {
      setError(err.message || 'Error fetching commitments');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCommitments();
  }, [fetchCommitments]);

  const updateStatus = useCallback(
    async (id: string, newStatus: CommitmentStatus) => {
      try {
        const res = await fetch(`${config.apiUrl}/api/v1/commitments/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Update failed: HTTP ${res.status}`);
        }

        const updated: CommitmentItem = await res.json();
        setCommitments((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: updated.status, updatedAt: updated.updatedAt } : c))
        );
      } catch (err: any) {
        setError(err.message || 'Could not update status');
        throw err;
      }
    },
    []
  );

  const linkContext = useCallback(
    async (id: string, eventId?: string, location?: string) => {
      try {
        const res = await fetch(`${config.apiUrl}/api/v1/commitments/${id}/link`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            commitmentId: id,
            relatedEventId: eventId,
            relatedLocation: location,
          }),
        });

        if (!res.ok) {
          throw new Error(`Link context failed: HTTP ${res.status}`);
        }

        const updated: CommitmentItem = await res.json();
        setCommitments((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  relatedEventId: updated.relatedEventId,
                  relatedLocation: updated.relatedLocation,
                  updatedAt: updated.updatedAt,
                }
              : c
          )
        );
      } catch (err: any) {
        setError(err.message || 'Could not link context');
        throw err;
      }
    },
    []
  );

  const markCompleted = useCallback(
    async (commitment: CommitmentItem) => {
      await updateStatus(commitment.id, 'COMPLETED');
    },
    [updateStatus]
  );

  const deleteCommitment = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${config.apiUrl}/api/v1/commitments/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error(`Delete failed: HTTP ${res.status}`);
      }

      setCommitments((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      setError(err.message || 'Could not delete commitment');
      throw err;
    }
  }, []);

  return {
    commitments,
    isLoading,
    error,
    filters,
    setFilters,
    fetchCommitments,
    updateStatus,
    linkContext,
    markCompleted,
    deleteCommitment,
  };
}
