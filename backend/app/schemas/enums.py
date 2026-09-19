from enum import Enum


class AgentState(str, Enum):
    """Central agent state machine states."""
    IDLE = "IDLE"
    LISTENING = "LISTENING"
    THINKING = "THINKING"
    VERIFYING = "VERIFYING"
    DRIFT = "DRIFT"
    VERIFIED = "VERIFIED"
    SPEAKING = "SPEAKING"
    ACTION_PENDING = "ACTION_PENDING"
    SUCCESS = "SUCCESS"
    ERROR = "ERROR"


class IntentSource(str, Enum):
    """Vectors of user intent or trigger."""
    VOICE_HOTWORD = "VOICE_HOTWORD"
    ORB_INTERACTION = "ORB_INTERACTION"
    MIND_PULSE_GESTURE = "MIND_PULSE_GESTURE"
    APP_LAUNCH = "APP_LAUNCH"
    MANUAL_TEXT = "MANUAL_TEXT"


class IntentType(str, Enum):
    """Recognized user intentions."""
    CHECK_REALITY = "CHECK_REALITY"
    EXTRACT_COMMITMENTS = "EXTRACT_COMMITMENTS"
    EXECUTE_SAFE_ACTION = "EXECUTE_SAFE_ACTION"
    MIND_PULSE_SCAN = "MIND_PULSE_SCAN"
    AUDIT_TIMELINE = "AUDIT_TIMELINE"
    EXPLAIN_DRIFT = "EXPLAIN_DRIFT"


class RealityState(str, Enum):
    """High-level reality verification state."""
    VERIFIED_TRUE = "VERIFIED_TRUE"
    REALITY_DRIFT = "REALITY_DRIFT"
    UNKNOWN_UNVERIFIED = "UNKNOWN_UNVERIFIED"
    CONFLICTING_EVIDENCE = "CONFLICTING_EVIDENCE"


class DriftType(str, Enum):
    """Granular classification of detected reality divergence."""
    NO_DRIFT = "NO_DRIFT"
    LOCATION_CHANGED = "LOCATION_CHANGED"
    TIME_CHANGED = "TIME_CHANGED"
    STATUS_CANCELLED = "STATUS_CANCELLED"
    PERSONNEL_CHANGED = "PERSONNEL_CHANGED"
    FACT_CONTRADICTED = "FACT_CONTRADICTED"


class ImpactSeverity(str, Enum):
    """Severity level of downstream impact."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ApprovalState(str, Enum):
    """Safe Action Gate lifecycle states."""
    PENDING = "PENDING"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    NOT_REQUIRED = "NOT_REQUIRED"


class ExecutionState(str, Enum):
    """Execution status for proposed consequential actions."""
    NOT_EXECUTED = "NOT_EXECUTED"
    EXECUTING = "EXECUTING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"


class CommitmentStatus(str, Enum):
    """Status lifecycle for commitment items."""
    OPEN = "OPEN"
    COMPLETED = "COMPLETED"
    OVERDUE = "OVERDUE"
    DISMISSED = "DISMISSED"


class TimelineEventType(str, Enum):
    """Events recorded in the immutable Reality Timeline."""
    OBSERVATION_INGESTED = "OBSERVATION_INGESTED"
    DRIFT_DETECTED = "DRIFT_DETECTED"
    TRUTH_CONFIRMED = "TRUTH_CONFIRMED"
    ACTION_PROPOSED = "ACTION_PROPOSED"
    ACTION_APPROVED = "ACTION_APPROVED"
    ACTION_REJECTED = "ACTION_REJECTED"
    ACTION_EXECUTED = "ACTION_EXECUTED"
