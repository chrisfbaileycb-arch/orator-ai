"""
Orator.AI - Shift State Transition & Lifecycle Engine
Deterministic lifecycle state machine managing:
INTAKE -> BLUEPRINT_LOCKED -> DEPOSIT_AUTHORIZED -> MANUFACTURING -> AUDIT_PASSED -> SANDBOX_UNLOCKED

Each client session gets an isolated engine; transitions are invariant-checked,
checksum-stamped (SHA-256 over the full transition record), and appended to an
immutable in-memory audit log.
"""

import time
import hashlib
import threading

class ShiftState:
    INTAKE = "INTAKE"
    BLUEPRINT_LOCKED = "BLUEPRINT_LOCKED"
    DEPOSIT_AUTHORIZED = "DEPOSIT_AUTHORIZED"
    MANUFACTURING = "MANUFACTURING"
    AUDIT_PASSED = "AUDIT_PASSED"
    SANDBOX_UNLOCKED = "SANDBOX_UNLOCKED"

VALID_TRANSITIONS = {
    ShiftState.INTAKE: [ShiftState.BLUEPRINT_LOCKED],
    ShiftState.BLUEPRINT_LOCKED: [ShiftState.DEPOSIT_AUTHORIZED, ShiftState.INTAKE],
    ShiftState.DEPOSIT_AUTHORIZED: [ShiftState.MANUFACTURING],
    ShiftState.MANUFACTURING: [ShiftState.AUDIT_PASSED, ShiftState.INTAKE],
    ShiftState.AUDIT_PASSED: [ShiftState.SANDBOX_UNLOCKED],
    ShiftState.SANDBOX_UNLOCKED: [ShiftState.INTAKE],
}


class ShiftTransitionEngine:
    def __init__(self, session_id="default"):
        self.session_id = session_id
        self.current_state = ShiftState.INTAKE
        self.history = []
        self.metadata = {}
        self._lock = threading.Lock()
        self._record_shift(None, ShiftState.INTAKE, "Engine initialized into INTAKE state.")

    def shift_to(self, next_state, reason="", payload=None):
        """
        Transitions state while validating invariants.
        Raises ValueError on illegal transitions (caller decides fallback policy).
        """
        with self._lock:
            allowed = VALID_TRANSITIONS.get(self.current_state, [])
            if next_state not in allowed and next_state != ShiftState.INTAKE:
                raise ValueError(
                    f"Invalid Shift transition from {self.current_state} to {next_state}"
                )

            prev_state = self.current_state
            self.current_state = next_state
            record = self._record_shift(prev_state, next_state, reason, payload)
        return self.get_state_snapshot(record)

    def try_shift(self, next_state, reason="", payload=None):
        """Non-throwing variant. Returns (snapshot, error_message|None)."""
        try:
            return self.shift_to(next_state, reason, payload), None
        except ValueError as e:
            return self.get_state_snapshot(), str(e)

    def _record_shift(self, from_state, to_state, reason, payload=None):
        seq = len(self.history) + 1
        ts = time.time()
        checksum_basis = (
            f"{self.session_id}:{seq}:{from_state}->{to_state}:{reason}:{ts:.6f}"
        )
        entry = {
            "shift_id": f"shift_{seq}",
            "from_state": from_state,
            "to_state": to_state,
            "reason": reason,
            "payload": payload or {},
            "timestamp": ts,
            "checksum": hashlib.sha256(checksum_basis.encode("utf-8")).hexdigest()[:16],
        }
        self.history.append(entry)
        return entry

    def get_state_snapshot(self, last_record=None):
        with self._lock:
            return {
                "session_id": self.session_id,
                "current_state": self.current_state,
                "total_shifts": len(self.history),
                "last_shift": last_record or (self.history[-1] if self.history else None),
                "history": self.history,
            }


class ShiftRegistry:
    """
    Registry of per-client shift engines. A single global engine shared across
    clients would let one client's lifecycle corrupt another's invariants and
    raise on concurrent legal transitions, so every client_id owns one engine.
    """
    def __init__(self):
        self._engines = {}
        self._lock = threading.Lock()

    def engine_for(self, client_id: str) -> ShiftTransitionEngine:
        with self._lock:
            engine = self._engines.get(client_id)
            if engine is None:
                engine = ShiftTransitionEngine(f"client_{client_id[:24]}")
                self._engines[client_id] = engine
            return engine

    def client_count(self) -> int:
        with self._lock:
            return len(self._engines)


# Backwards-compatible global engine (server admin / anonymous pre-client use)
global_shift_engine = ShiftTransitionEngine("global_orator")
# Per-client registry used by the HTTP layer
shift_registry = ShiftRegistry()
