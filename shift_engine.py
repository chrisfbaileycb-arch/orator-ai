"""
Orator.AI - Shift State Transition & Lifecycle Engine
Inspired by Shift (https://github.com/chrisfbaileycb-arch/shift.git)
Manages deterministic lifecycle shifts, state invariant checks, and in-memory execution snapshots.
"""

import time
import hashlib
import json

class ShiftState:
    INTAKE = "INTAKE"
    BLUEPRINT_LOCKED = "BLUEPRINT_LOCKED"
    DEPOSIT_AUTHORIZED = "DEPOSIT_AUTHORIZED"
    MANUFACTURING = "MANUFACTURING"
    AUDIT_PASSED = "AUDIT_PASSED"
    SANDBOX_UNLOCKED = "SANDBOX_UNLOCKED"

class ShiftTransitionEngine:
    def __init__(self, session_id="default"):
        self.session_id = session_id
        self.current_state = ShiftState.INTAKE
        self.history = []
        self.metadata = {}
        self._record_shift(None, ShiftState.INTAKE, "Engine initialized into INTAKE state.")

    def shift_to(self, next_state, reason="", payload=None):
        """Transitions state while validating invariants."""
        valid_transitions = {
            ShiftState.INTAKE: [ShiftState.BLUEPRINT_LOCKED],
            ShiftState.BLUEPRINT_LOCKED: [ShiftState.DEPOSIT_AUTHORIZED, ShiftState.INTAKE],
            ShiftState.DEPOSIT_AUTHORIZED: [ShiftState.MANUFACTURING],
            ShiftState.MANUFACTURING: [ShiftState.AUDIT_PASSED, ShiftState.INTAKE],
            ShiftState.AUDIT_PASSED: [ShiftState.SANDBOX_UNLOCKED],
            ShiftState.SANDBOX_UNLOCKED: [ShiftState.INTAKE]
        }

        allowed = valid_transitions.get(self.current_state, [])
        if next_state not in allowed:
            # Allow flexible emergency fallback to INTAKE
            if next_state != ShiftState.INTAKE:
                raise ValueError(f"Invalid Shift transition from {self.current_state} to {next_state}")

        prev_state = self.current_state
        self.current_state = next_state
        self._record_shift(prev_state, next_state, reason, payload)
        return self.get_state_snapshot()

    def _record_shift(self, from_state, to_state, reason, payload=None):
        entry = {
            "shift_id": f"shift_{len(self.history) + 1}",
            "from_state": from_state,
            "to_state": to_state,
            "reason": reason,
            "payload": payload or {},
            "timestamp": time.time(),
            "checksum": hashlib.sha256(f"{from_state}->{to_state}:{time.time()}".encode('utf-8')).hexdigest()[:12]
        }
        self.history.append(entry)

    def get_state_snapshot(self):
        return {
            "session_id": self.session_id,
            "current_state": self.current_state,
            "total_shifts": len(self.history),
            "last_shift": self.history[-1] if self.history else None,
            "history": self.history
        }

# Global in-memory shift engine instance
global_shift_engine = ShiftTransitionEngine("global_orator")
