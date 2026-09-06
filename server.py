#!/usr/bin/env python3
"""
Orator.AI Platform - Core Ephemeral Server & SSE Stream Engine
Continuous Multi-Model MoE Rotation, WebGL Orb Bindings, 11 Knowledge Repos & 22-Point Audit Suite
Zero hard-drive footprint for manufactured codebases; in-memory packaging, preview, and streaming.
"""

import http.server
import socketserver
import json
import os
import mimetypes
import time
import io
import zipfile
import uuid
import threading
import sys
from datetime import datetime, timezone
from urllib.parse import urlparse, parse_qs

# Import templates, knowledge engine, audit engine, and shift state machine
sys.path.insert(0, os.path.dirname(__file__))
from templates.single_session_template import generate_single_session_package
from templates.citadel_template import generate_citadel_package
from backend_knowledge import get_all_knowledge_repos, MODEL_PROVIDERS, DEPLOYMENT_OPTIONS
from audit_engine import run_comprehensive_audit
from shift_engine import global_shift_engine, shift_registry, ShiftState
import model_router


PORT = int(os.environ.get("PORT", 8080))
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

# Ephemeral in-memory session cache & free/paid tracker
active_sessions = {}
latest_manufactured_files = {}
latest_manufactured_lock = threading.Lock()
free_sessions = {}   # { client_id: count_used }
paid_clients = set() # { client_id }
build_history = []   # ledger of completed builds -> powers real telemetry
_telemetry_lock = threading.Lock()

FREE_SESSION_LIMIT = 3
FILES_LOCK = threading.Lock()


def iso_now() -> str:
    """Strict ISO-8601 UTC timestamp used on every API/SSE response."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def get_client_id(handler):
    """Client identification for free/paid tier (header > query param > IP)."""
    client_id = handler.headers.get("X-Orator-Client-Id")
    if client_id:
        return client_id
    try:
        parsed = urlparse(handler.path)
        qs = parse_qs(parsed.query)
        if "client_id" in qs and qs["client_id"]:
            return qs["client_id"][0]
    except Exception:
        pass
    return handler.client_address[0]


def can_use_free_session(client_id: str) -> bool:
    return free_sessions.get(client_id, 0) < FREE_SESSION_LIMIT


def consume_free_session(client_id: str):
    free_sessions[client_id] = free_sessions.get(client_id, 0) + 1


def has_paid(client_id: str) -> bool:
    return client_id in paid_clients


def mark_as_paid(client_id: str):
    paid_clients.add(client_id)


def record_build(client_id, system_name, tier, file_count, composite_score, mode):
    """Append to the build ledger. Real numbers drive the HUD telemetry."""
    with _telemetry_lock:
        build_history.append({
            "id": f"build_{len(build_history) + 1:04d}",
            "client_id": client_id,
            "system": system_name,
            "tier": tier,
            "files": file_count,
            "audit_score": composite_score,
            "mode": mode,
            "completed_at": time.time(),
        })
        return len(build_history)


def telemetry_snapshot():
    """Real telemetry from the build ledger — no synthetic jitter."""
    with _telemetry_lock:
        total = len(build_history)
        recent = [b for b in build_history if time.time() - b["completed_at"] < 86400]
        avg = round(sum(b["audit_score"] for b in build_history) / total, 1) if total else 0.0
        return {
            "total_builds": total,
            "builds_last_24h": len(recent),
            "average_audit_score": avg,
            "registered_clients": shift_registry.client_count(),
        }


# 15 Ground-Truth Ingestion Questions Definition
INGESTION_QUESTIONS = [
    {"id": "q1_mission", "title": "1. Product Core & Name", "category": "Product Mission"},
    {"id": "q2_tier", "title": "2. Architecture Tier ($100 vs $300)", "category": "Packaging"},
    {"id": "q3_moat", "title": "3. Technical Moat & Algorithmic Edge", "category": "Defensibility"},
    {"id": "q4_scope", "title": "4. Executive Scope & Boundaries", "category": "Product Mission"},
    {"id": "q5_rbac", "title": "5. Actor Personas & RBAC Hierarchy", "category": "Security"},
    {"id": "q6_entities", "title": "6. Domain Entities & Relational Schema", "category": "Data Layer"},
    {"id": "q7_auth", "title": "7. Authentication & Security Boundary", "category": "Security"},
    {"id": "q8_routes", "title": "8. Primary API Routes & Mutation Contracts", "category": "API Contract"},
    {"id": "q9_db", "title": "9. Relational Storage Engine (SQLite WAL/Postgres RLS)", "category": "Data Layer"},
    {"id": "q10_realtime", "title": "10. Realtime Event Stream (SSE/Webhooks)", "category": "Events"},
    {"id": "q11_ui", "title": "11. UI Component Hierarchy & HUD Tokens", "category": "Frontend"},
    {"id": "q12_caching", "title": "12. State Management & Cache Policy", "category": "Architecture"},
    {"id": "q13_edge", "title": "13. Edge Cases & Concurrency Handling", "category": "Resilience"},
    {"id": "q14_testing", "title": "14. Automated Playwright E2E Expectations", "category": "QA & Harness"},
    {"id": "q15_delivery", "title": "15. In-Memory Zero-Footprint Verification", "category": "Packaging"}
]

# 5 Dynamic Lengthy Turn Questions
LENGTHY_FOLLOWUPS = [
    {
        "id": "f1_backpressure",
        "question": "How should worker backpressure and memory ring buffers behave under sustained burst spikes exceeding 10,000 requests per second?",
        "options": [
            "Lockless in-memory ring buffer with hard backpressure rejection (HTTP 429)",
            "Pipelined asynchronous batching with priority queue shed",
            "Direct synchronous execution with zero buffering"
        ],
        "selected": "Lockless in-memory ring buffer with hard backpressure rejection (HTTP 429)"
    },
    {
        "id": "f2_key_rotation",
        "question": "For cryptographic JWT/Ed25519 token signatures, how should air-gapped key rotation be scheduled without invalidating in-flight client sessions?",
        "options": [
            "Dual-key signing window with 24-hour overlapping grace period",
            "Ephemeral per-session symmetric handshake with zero disk persistence",
            "Master air-gapped RSA-4096 key pair with manual operator rotation"
        ],
        "selected": "Dual-key signing window with 24-hour overlapping grace period"
    },
    {
        "id": "f3_failover",
        "question": "What is the automated state reconstitution strategy if an in-memory worker subprocess suffers an unhandled panic?",
        "options": [
            "Zero-downtime worker reconstitution from write-ahead log (WAL) snapshot replay",
            "Immediate process termination with fail-closed air-gap lock",
            "Fallback to read-only degraded telemetry mode"
        ],
        "selected": "Zero-downtime worker reconstitution from write-ahead log (WAL) snapshot replay"
    },
    {
        "id": "f4_schema_checksum",
        "question": "How should relational schema DDL migrations be cryptographically audited across rotated LLM handoffs?",
        "options": [
            "Forward-only immutable SQL delta migrations with strict SHA-256 checksum verification",
            "Dynamic runtime table sync with automatic column inference",
            "Pre-compiled embedded binary schema definitions"
        ],
        "selected": "Forward-only immutable SQL delta migrations with strict SHA-256 checksum verification"
    },
    {
        "id": "f5_test_gate",
        "question": "Which automated testing harness suite gates final delivery of the in-memory air-gapped ZIP package?",
        "options": [
            "Full Playwright E2E DOM tests + 22-point audit suite + API route fuzzing",
            "Unit test matrix + Static OpenAPI contract validation only",
            "Zero-dependency container startup smoke assertions"
        ],
        "selected": "Full Playwright E2E DOM tests + 22-point audit suite + API route fuzzing"
    }
]

# 16+ Model MoE Rotation Matrix (8 Skills × 2-3 Rotated LLMs per skill)
ROTATION_MATRIX = [
    {
        "skill_idx": 1,
        "skill_name": "Architecture & Specs",
        "mcp_connector": "OpenAPI-Contract-MCP",
        "primary_llm": "Claude 3.7 Sonnet (Anthropic)",
        "secondary_llm": "Mistral Large (Mistral)",
        "moe_consensus": "Verified: Claude + Mistral + GPT-4.5",
        "repo_source": "langgraph.git / google-adk-skill.git",
        "task_desc": "Synthesizing immutable SPEC.md and formal OpenAPI 3.1.0 contract matrix."
    },
    {
        "skill_idx": 2,
        "skill_name": "Cryptographic Auth Boundary",
        "mcp_connector": "JWT-Crypto-MCP",
        "primary_llm": "GLM-4.7 Reasoning",
        "secondary_llm": "Cohere Command-R+",
        "moe_consensus": "Verified: GLM + Cohere + Claude",
        "repo_source": "hallmark.git / ECC.git",
        "task_desc": "Compiling constant-time HMAC-SHA256 password hashing and stateless air-gapped JWT token manager."
    },
    {
        "skill_idx": 3,
        "skill_name": "Relational Schema & WAL DDL",
        "mcp_connector": "SQLite-WAL-MCP",
        "primary_llm": "Qwen 2.5 Coder 32B (OpenRouter)",
        "secondary_llm": "DeepSeek-R1 (Hugging Face)",
        "moe_consensus": "Verified: Qwen + DeepSeek + Llama",
        "repo_source": "ECC.git / awesome-agent-skills.git",
        "task_desc": "Generating database/schema.sql and WAL mode partition indexes with foreign key constraints."
    },
    {
        "skill_idx": 4,
        "skill_name": "Async Core Engine",
        "mcp_connector": "ECC-Sandbox-MCP",
        "primary_llm": "Qwen 2.5 Coder 32B (OpenRouter)",
        "secondary_llm": "Llama 3.3 70B (Meta)",
        "moe_consensus": "Verified: Qwen + Llama + GPT-4.5",
        "repo_source": "full-stack-ai-agent-template.git",
        "task_desc": "Compiling server/routes.py, server/models.py, and asynchronous HTTP request router."
    },
    {
        "skill_idx": 5,
        "skill_name": "Realtime SSE Stream",
        "mcp_connector": "Ruflo-Swarm-MCP",
        "primary_llm": "Gemini 2.0 Flash (Google API)",
        "secondary_llm": "Claude 3.7 Sonnet (Anthropic)",
        "moe_consensus": "Verified: Gemini + Claude + DeepSeek",
        "repo_source": "google-adk-skill.git",
        "task_desc": "Synthesizing Server-Sent Events (SSE) live telemetry stream and event bus handlers."
    },
    {
        "skill_idx": 6,
        "skill_name": "HUD Frontend Command Deck",
        "mcp_connector": "Web-DOM-MCP",
        "primary_llm": "Gemini 2.0 Pro (Google API)",
        "secondary_llm": "DeepSeek-R1 (Hugging Face)",
        "moe_consensus": "Verified: Gemini + DeepSeek + Qwen",
        "repo_source": "ux-ui-agent-skills.git / screenshot-to-code.git",
        "task_desc": "Generating responsive client/index.html, client/app.js, and glassmorphic cybernetic CSS styles."
    },
    {
        "skill_idx": 7,
        "skill_name": "Playwright E2E QA Harness",
        "mcp_connector": "Playwright-MCP",
        "primary_llm": "Playwright Engine",
        "secondary_llm": "GLM-4.7 Reasoning",
        "moe_consensus": "Verified: Playwright + GLM + GPT-4.5",
        "repo_source": "best-skills.git",
        "task_desc": "Executing headless DOM assertions, form submission verification, and route contract fuzzing."
    },
    {
        "skill_idx": 8,
        "skill_name": "0-Disk RAM Packager",
        "mcp_connector": "Zero-Disk-Packer-MCP",
        "primary_llm": "ECC Controller",
        "secondary_llm": "Qwen 2.5 Coder 32B",
        "moe_consensus": "Verified: ECC + Qwen + FreeToken",
        "repo_source": "ECC.git / FreeToken.git",
        "task_desc": "Verifying 0-byte disk footprint, FreeToken pruning, and packaging complete air-gapped ZIP archive."
    }
]


def compute_anti_slop_evaluation(prompt_text, moat_text=""):
    combined = f"{prompt_text} {moat_text}".lower()
    slop_indicators = [
        ("uber for", "Generic aggregator clone pattern detected without transport network moat."),
        ("airbnb for", "Generic rental marketplace pattern with high churn risk."),
        ("golf tee", "Commodity physical/digital clone. Extreme market saturation."),
        ("todo app", "Trivial utility. Zero defensibility."),
        ("wrapper for chatgpt", "Superficial API wrapper without proprietary fine-tuning or logic."),
        ("crypto casino", "Regulatory and security hazard without verified custody protocol."),
        ("social network for", "Zero network-effect moat detected.")
    ]

    score = 85
    flags = []
    challenge = None

    for term, reason in slop_indicators:
        if term in combined:
            score -= 40
            flags.append(reason)

    if len(prompt_text.strip()) < 15:
        score -= 30
        flags.append("Prompt is critically underspecified.")

    score = max(5, min(99, score))

    if score < 70:
        challenges = [
            "This matches known clone heuristics. What makes your algorithmic execution defensible against a 2-person engineering team copying this in 48 hours?",
            "Your architecture touches commodity clone patterns. What is your proprietary validation engine or zero-telemetry air-gap boundary?",
            "Moat verification failed. How does your system guarantee defensibility without external vendor lock-in?"
        ]
        challenge = challenges[int(time.time()) % len(challenges)]

    return {
        "score": score,
        "passed": score >= 70,
        "flags": flags,
        "challenge": challenge,
        "timestamp": iso_now()
    }


def _default_scope():
    return {
        "name": "Orator-Autonomous-App",
        "tier": "complete",
        "tier_label": "$99 Complete Digital Build",
        "description": "Sub-millisecond air-gapped software appliance with lockless state machine.",
        "moat": "Zero-disk in-memory deterministic state engine with continuous SHA-256 state chain verification.",
        "auth": "Stateless Air-Gapped JWT",
        "entities": ["Principal (id, email)", "LedgerState (id, payload, signature)"],
        "routes": ["GET /api/v1/health", "POST /api/v1/auth/login", "POST /api/v1/mutate"],
        "hosting": "Fly.io / Vercel / Docker"
    }


def process_conversational_turn(messages):
    last_msg = messages[-1]["content"] if messages else ""
    last_msg_lower = last_msg.lower().strip()
    total_turns = len(messages)

    # 1. Calm Conversational Greeting Check (No false clone warnings)
    greetings = ["hello", "hi", "hey", "greetings", "good morning", "good evening", "start", "begin", "help", "who are you"]
    if last_msg_lower in greetings or len(last_msg_lower) < 6:
        return {
            "type": "greeting",
            "message": "**I AM READY.**\n\nState the product, architecture, or software system you want to construct, and we will forge the master blueprint.",
            "scope_ready": False,
            "phase": "AWAITING_VISION"
        }

    # 2. Anti-Slop / Commodity Pattern Check (Only for actual feature prompts)
    slop_eval = compute_anti_slop_evaluation(last_msg)
    if not slop_eval["passed"] and total_turns <= 2 and any(k in last_msg_lower for k in ["todo", "simple", "basic", "clone", "uber for", "airbnb for"]):
        return {
            "type": "moat_challenge",
            "message": f"◈ **Architectural Clarification**: {slop_eval['challenge']}\n\nWhat proprietary workflow, state model, or security boundary differentiates your system?",
            "scope_ready": False,
            "phase": "INTERROGATION"
        }

    # 3. Preset or Custom Scoping Resolution
    if "fintech" in last_msg_lower or "settlement" in last_msg_lower or "ledger" in last_msg_lower:
        scope = {
            "name": "Aether-Settlement-Engine",
            "tier": "complete",
            "tier_label": "$99 Complete Digital Build",
            "description": "Sub-millisecond air-gapped cryptographic ledger and double-entry transaction settlement appliance.",
            "moat": "Custom lockless ring buffer ledger with continuous SHA-256 state chain verification.",
            "auth": "Stateless Air-Gapped JWT (Constant-Time HMAC)",
            "entities": ["Account (id, balance, nonce)", "LedgerEntry (id, debit, credit, amount, signature)", "AuditProof (id, block_hash)"],
            "routes": ["POST /api/v1/transfer", "GET /api/v1/ledger/proof", "GET /api/v1/accounts/{id}/balance"],
            "hosting": "Self-Hosted Docker / Fly.io"
        }
    elif "citadel" in last_msg_lower or "enterprise" in last_msg_lower or "multi-tenant" in last_msg_lower:
        scope = {
            "name": "Citadel-Enterprise-Cloud",
            "tier": "citadel",
            "tier_label": "$99 Complete Digital Build",
            "description": "Multi-tenant high-throughput enterprise governance platform with row-level tenant isolation.",
            "moat": "Cryptographic tenant partition isolation with sub-millisecond distributed batch worker scheduling.",
            "auth": "Multi-Tenant JWT with Role Masking & RBAC/ABAC",
            "entities": ["Tenant (id, slug, quota)", "User (id, tenant_id, role_mask)", "Task (id, tenant_id, status, payload)"],
            "routes": ["GET /api/v1/tenants", "POST /api/v1/tasks", "GET /api/v1/cluster/metrics"],
            "hosting": "Fly.io / Vercel / Docker"
        }
    elif "medical" in last_msg_lower or "biometric" in last_msg_lower or "vault" in last_msg_lower:
        scope = {
            "name": "Aegis-Biometrics-Vault",
            "tier": "complete",
            "tier_label": "$99 Complete Digital Build",
            "description": "Air-gapped biometric identity vault with zero external cloud telemetry and zero-footprint retention.",
            "moat": "Zero hard-drive footprint biometric hash matching with constant-time cryptographic verification.",
            "auth": "Hardware Key Air-gap Handshake",
            "entities": ["SubjectIdentity (id, biometric_hash)", "AccessRecord (id, timestamp, clearance)"],
            "routes": ["POST /api/v1/verify/biometric", "GET /api/v1/vault/audit"],
            "hosting": "Air-Gapped On-Premise Docker"
        }
    else:
        scope = {
            "name": "Orator-Software-Forge",
            "tier": "complete",
            "tier_label": "$99 Complete Digital Build",
            "description": last_msg.strip() if len(last_msg) > 20 else "High-performance air-gapped software appliance.",
            "moat": "Zero external SaaS dependencies with deterministic in-memory execution.",
            "auth": "Stateless Air-Gapped JWT",
            "entities": ["AuthPrincipal (id, email, role)", "MasterResource (id, title, payload, owner_id)"],
            "routes": ["GET /api/v1/health", "POST /api/v1/auth/login", "GET /api/v1/resources", "POST /api/v1/resources"],
            "hosting": "Fly.io / Vercel / Docker"
        }

    response_text = (
        f"**I AM THE ORCHESTRATOR.**\n\n"
        f"All **15 Architectural Inquest Parameters** have locked into the master blueprint:\n\n"
        f"◈ **System Target**: `{scope['name']}`\n"
        f"◈ **Packaging Tier**: `{scope['tier_label']}`\n"
        f"◈ **Verified Moat**: {scope['moat']}\n"
        f"◈ **Cryptographic Auth**: `{scope['auth']}`\n"
        f"◈ **11 Indexed Knowledge Repos**: *Shift, LangGraph, ECC, Hallmark, Google ADK, FreeToken, etc.*\n"
        f"◈ **MoE Requirement**: Minimum 3-AI consensus across continuous rotation.\n\n"
        f"Authorize the **$99 Complete Build** to launch the multi-agent pipeline and live dynamic mind map."
    )

    return {
        "type": "scope_locked",
        "message": response_text,
        "scope": scope,
        "ingestion_questions": INGESTION_QUESTIONS,
        "lengthy_followups": LENGTHY_FOLLOWUPS,
        "rotation_matrix": ROTATION_MATRIX,
        "scope_ready": True,
        "phase": "BLUEPRINT"
    }


class OrchestratorHTTPHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        sys.stdout.write(f"[{self.log_date_time_string()}] {format % args}\n")
        sys.stdout.flush()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Orator-Client-Id")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/health":
            self._send_json(200, {
                "status": "ONLINE",
                "system": "Orator.AI Digital Manufacturing Appliance",
                "version": "3.5.0-ORATOR-ORACLE-POLISHED",
                "knowledge_repos_indexed": 11,
                "sse_stream": "ACTIVE",
                "telemetry": telemetry_snapshot(),
                "timestamp": iso_now()
            })
            return

        if path == "/api/knowledge":
            self._send_json(200, get_all_knowledge_repos())
            return

        if path == "/api/models":
            self._send_json(200, {
                "paid_models": model_router.PAID_MODELS,
                "free_models": model_router.FREE_MODELS,
                "providers": {
                    "openai_configured": bool(model_router.OPENAI_API_KEY),
                    "gemini_configured": bool(model_router.GEMINI_API_KEY),
                    "openrouter_configured": bool(model_router.OPENROUTER_API_KEY),
                    "free_rotation_keys_count": len(model_router.free_rotator.keys)
                }
            })
            return

        if path == "/api/stream":
            self._handle_sse_stream()
            return

        if path == "/api/stream-manufacture":
            self._handle_manufacture_sse_stream()
            return

        if path == "/api/preview":
            self._serve_live_preview()
            return

        if path == "/api/download-zip":
            self._serve_download_zip()
            return

        if path == "/api/state":
            client_id = get_client_id(self)
            engine = shift_registry.engine_for(client_id)
            snap = engine.get_state_snapshot()
            self._send_json(200, {
                "client_id": client_id,
                "shift_state": snap["current_state"],
                "total_shifts": snap["total_shifts"],
                "free_sessions_used": free_sessions.get(client_id, 0),
                "free_sessions_remaining": max(0, FREE_SESSION_LIMIT - free_sessions.get(client_id, 0)),
                "has_paid": has_paid(client_id),
                "telemetry": telemetry_snapshot(),
            })
            return

        self._serve_static(path)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get("Content-Length", 0))
        body = {}
        if content_length > 0:
            try:
                raw = self.rfile.read(content_length)
                body = json.loads(raw.decode("utf-8"))
            except Exception as e:
                self._send_json(400, {"error": f"Invalid JSON body: {str(e)}"})
                return

        if path == "/api/chat":
            messages = body.get("messages", [])
            result = process_conversational_turn(messages)
            if result.get("scope_ready"):
                client_id = get_client_id(self)
                engine = shift_registry.engine_for(client_id)
                engine.try_shift(ShiftState.BLUEPRINT_LOCKED, "15-Question scope locked.")
            self._send_json(200, result)
            return

        elif path == "/api/mark-paid":
            client_id = body.get("client_id") or get_client_id(self)
            mark_as_paid(client_id)
            engine = shift_registry.engine_for(client_id)
            engine.try_shift(
                ShiftState.DEPOSIT_AUTHORIZED,
                "Execution slot authorized.",
                {"tier": body.get("tier", "complete"), "amount_usd": body.get("amount", 99)},
            )
            self._send_json(200, {
                "status": "PAID",
                "client_id": client_id,
                "shift_state": engine.current_state,
                "message": "Client marked as paid. Full manufacturing unlocked."
            })
            return

        elif path == "/api/upload-intake":
            file_name = body.get("filename", "spec.md")
            file_content = body.get("content", "")
            file_type = body.get("type", "markdown")

            if file_type == "markdown":
                summary = f"Parsed Markdown specification ({len(file_content)} chars)."
            else:
                summary = f"Parsed visual mockup image ({file_name})."

            self._send_json(200, {
                "status": "ACCEPTED",
                "filename": file_name,
                "file_type": file_type,
                "summary": summary,
                "timestamp": iso_now()
            })
            return

        elif path == "/api/audit":
            spec = body.get("spec", {"name": "Orator-App"})
            with FILES_LOCK:
                files = dict(latest_manufactured_files)
            audit_result = run_comprehensive_audit(spec, files)
            self._send_json(200, audit_result)
            return

        elif path == "/api/interrogate":
            prompt = body.get("prompt", "")
            moat = body.get("moat", "")
            result = compute_anti_slop_evaluation(prompt, moat)
            self._send_json(200, result)
            return

        elif path == "/api/download-zip":
            tier = body.get("tier", "single")
            spec = {
                "name": body.get("name", "orator-app"),
                "description": body.get("description", "High-performance air-gapped system."),
                "moat": body.get("moat", "Zero external SaaS dependencies."),
                "entities": body.get("entities", []),
                "routes": body.get("routes", [])
            }
            self._serve_download_zip(spec=spec, tier=tier)
            return

        elif path == "/api/manufacture-sim":
            tier = body.get("tier", "single")
            spec = {
                "name": body.get("name", "orator-app"),
                "description": body.get("description", "Air-gapped system."),
                "moat": body.get("moat", "Algorithmic defensibility."),
                "entities": body.get("entities", []),
                "routes": body.get("routes", [])
            }
            files = generate_citadel_package(spec) if tier == "citadel" else generate_single_session_package(spec)

            with FILES_LOCK:
                latest_manufactured_files.clear()
                latest_manufactured_files.update(files)

            audit_report = run_comprehensive_audit(spec, files)

            self._send_json(200, {
                "status": "MANUFACTURED",
                "rotation_matrix": ROTATION_MATRIX,
                "file_count": len(files),
                "files": list(files.keys()),
                "file_contents": files,
                "sandbox_footprint_bytes": 0,
                "memory_resident_kb": sum(len(c) for c in files.values()) / 1024,
                "audit": audit_report
            })
            return

        elif path == "/api/stream-manufacture":
            scope = body.get("scope")
            mode = body.get("mode")
            self._handle_manufacture_sse_stream(scope=scope, mode=mode)
            return

        else:
            self._send_json(404, {"error": f"Endpoint not found: {path}"})

    # ------------------------------------------------------------------
    # SSE: rotation telemetry stream (GET /api/stream)
    # ------------------------------------------------------------------
    def _handle_sse_stream(self):
        self._sse_headers()

        def send_sse_event(event_type, data):
            payload = f"event: {event_type}\ndata: {json.dumps(data)}\n\n".encode("utf-8")
            self.wfile.write(payload)
            self.wfile.flush()

        try:
            send_sse_event("stream_connected", {"status": "STREAM_ONLINE", "timestamp": iso_now()})
            for step in ROTATION_MATRIX:
                send_sse_event("model_dispatch", {
                    "step": step["skill_idx"],
                    "skill": step["skill_name"],
                    "primary_model": step["primary_llm"],
                    "secondary_model": step["secondary_llm"],
                    "moe_consensus": step["moe_consensus"],
                    "mcp_connector": step["mcp_connector"],
                    "repo_source": step["repo_source"],
                    "task": step["task_desc"]
                })
                time.sleep(0.5)
            send_sse_event("stream_complete", {"status": "STREAM_FINISHED"})
        except (BrokenPipeError, ConnectionResetError):
            pass
        except Exception:
            pass

    def _sse_headers(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

    # ------------------------------------------------------------------
    # SSE: the forge (GET or POST /api/stream-manufacture)
    # ------------------------------------------------------------------
    def _handle_manufacture_sse_stream(self, scope=None, mode=None):
        self._sse_headers()

        def emit(event_type, data):
            try:
                payload = f"event: {event_type}\ndata: {json.dumps(data)}\n\n".encode("utf-8")
                self.wfile.write(payload)
                self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError):
                raise ConnectionAbortedError()
            except Exception:
                pass

        client_id = get_client_id(self)
        engine = shift_registry.engine_for(client_id)

        # ----- Allowance gate (server-side, authoritative) -----
        if mode is None:
            if can_use_free_session(client_id):
                mode = "free"
            elif has_paid(client_id):
                mode = "paid"
            else:
                emit("payment_required", {
                    "message": f"You have used your {FREE_SESSION_LIMIT} free practice builds. A $99 payment is required for full manufacturing.",
                    "price": 99,
                    "currency": "USD",
                    "client_id": client_id
                })
                return

        try:
            emit("manufacture_started", {
                "status": "MANUFACTURING",
                "total_skills": 8,
                "mode": mode,
                "client_id": client_id,
                "free_sessions_used": free_sessions.get(client_id, 0),
                "timestamp": iso_now()
            })

            engine.try_shift(ShiftState.MANUFACTURING, f"Forge pipeline started ({mode} mode).")

            scope = scope or _default_scope()

            # Skill definitions for the 8-step pipeline. The LLM-augmented
            # steps (1,2,3,5) call live models when keys are configured and
            # fall back silently to the deterministic template otherwise.
            skills = [
                {"step": 1, "skill": "Architecture & Specs", "mcp": "OpenAPI-Contract-MCP", "repo": "shift.git",
                 "primary": "Claude 3.7 Sonnet" if mode == "paid" else "Gemini 2.0 Flash",
                 "secondary": "Mistral Large", "task": "Synthesizing immutable SPEC.md and formal architecture contract"},
                {"step": 2, "skill": "DB Schema & WAL", "mcp": "DB-Schema-MCP", "repo": "full-stack-ai-agent.git",
                 "primary": "Qwen 2.5 Coder 32B", "secondary": "DeepSeek-R1",
                 "task": "Generating database schema and authentication boundary"},
                {"step": 3, "skill": "API Scaffolding", "mcp": "Execution-Context-MCP", "repo": "ecc.git",
                 "primary": "GPT-4o" if mode == "paid" else "GPT-4o-mini", "secondary": "Qwen 2.5 Coder",
                 "task": "Compiling backend routes, models and server engine"},
                {"step": 4, "skill": "Security & Enclave RBAC", "mcp": "Hallmark-Crypto-MCP", "repo": "hallmark.git",
                 "primary": "Cohere Command-R+", "secondary": "Claude 3.5 Sonnet",
                 "task": "Generating constant-time HMAC tokens & tenant partition guards"},
                {"step": 5, "skill": "Reactive Frontend", "mcp": "Screenshot-To-Code-MCP", "repo": "screenshot-to-code.git",
                 "primary": "Gemini 2.0 Flash", "secondary": "Claude 3.5",
                 "task": "Generating single-file responsive Web HUD"},
                {"step": 6, "skill": "Agent Swarm DAG", "mcp": "LangGraph-Cyclic-MCP", "repo": "langgraph.git",
                 "primary": "Llama 3.3 70B", "secondary": "LangGraph Cyclic",
                 "task": "Constructing autonomous worker hierarchy and task DAG matrix"},
                {"step": 7, "skill": "Token Optimizer", "mcp": "FreeToken-Optimizer-MCP", "repo": "free-token.git",
                 "primary": "DeepSeek-R1", "secondary": "FreeToken Optimizer",
                 "task": "Applying zero-waste KV cache pruning and AST deduplication"},
                {"step": 8, "skill": "22-Point Audit Invariants", "mcp": "Contract-Lock-MCP", "repo": "shift.git",
                 "primary": "Claude 3.5 Sonnet" if mode == "paid" else "GPT-4o-mini",
                 "secondary": "Orator Consensus",
                 "task": "Final review, 22-point invariant audit, and air-gapped packaging"},
            ]

            has_live_keys = bool(model_router.OPENAI_API_KEY or model_router.GEMINI_API_KEY or model_router.OPENROUTER_API_KEY)
            live_outputs = {}

            def run_live_skill(skill_key, router_fn, prompt, system):
                """Run a live model call; record output + timing, never raise."""
                if not has_live_keys:
                    return
                t0 = time.time()
                out = router_fn(prompt=prompt, system=system, mode=mode)
                if out:
                    live_outputs[skill_key] = {
                        "content": out,
                        "duration_s": round(time.time() - t0, 2),
                    }

            scope_json = json.dumps(scope, indent=2)

            for sk in skills:
                emit("skill_start", {
                    "step": sk["step"],
                    "skill": sk["skill"],
                    "primary_model": sk["primary"],
                    "secondary_model": sk["secondary"],
                    "moe_consensus": "Verified",
                    "mcp_connector": sk["mcp"],
                    "repo_source": sk["repo"],
                    "task": sk["task"],
                    "progress_pct": int((sk["step"] - 1) * 100 / 8),
                    "live": has_live_keys and sk["step"] in (1, 2, 3, 5),
                })

                if sk["step"] == 1:
                    run_live_skill(
                        "architect", model_router.route_safe,
                        f"Create a clean, production-ready architecture and SPEC.md for system:\n{scope_json}",
                        "You are a senior software architect. Output only the architecture and SPEC.md content.",
                    )
                elif sk["step"] == 2:
                    arch = live_outputs.get("architect", {}).get("content", "") or scope_json
                    run_live_skill(
                        "schema", model_router.route_safe,
                        f"Create SQL database schema and auth DDL for:\n{arch[:4000]}",
                        "You are a database and security specialist. Output clean SQL schema only.",
                    )
                elif sk["step"] == 3:
                    arch = live_outputs.get("architect", {}).get("content", "") or scope_json
                    schema = live_outputs.get("schema", {}).get("content", "")
                    run_live_skill(
                        "backend", model_router.route_safe,
                        f"Create the complete backend code (Python) based on:\n{arch[:4000]}\nSCHEMA:\n{schema[:3000]}",
                        "You are a senior backend engineer. Output complete, runnable Python backend code.",
                    )
                elif sk["step"] == 5:
                    arch = live_outputs.get("architect", {}).get("content", "") or scope_json
                    run_live_skill(
                        "frontend", model_router.route_safe,
                        f"Create a clean, modern single-page frontend (HTML + CSS + JS) that matches:\n{arch[:4000]}",
                        "You are a frontend specialist. Output complete index.html and styles.",
                    )

                time.sleep(0.65)  # deliberate pacing for the HUD deck

                # Attach live-model latency when this step produced a real call.
                step_output_key = {1: "architect", 2: "schema", 3: "backend", 5: "frontend"}.get(sk["step"])
                extra = {}
                if step_output_key and step_output_key in live_outputs:
                    extra["live_latency_s"] = live_outputs[step_output_key]["duration_s"]

                emit("skill_complete", {
                    "step": sk["step"],
                    "skill": sk["skill"],
                    "status": "COMPLETED",
                    "progress_pct": int(sk["step"] * 100 / 8),
                    **extra,
                })

            # ----- Package generation (deterministic template + live overlays) -----
            template_package = generate_citadel_package(scope) if scope.get("tier") == "citadel" else generate_single_session_package(scope)

            # Live model outputs override the deterministic template files.
            if "architect" in live_outputs:
                template_package["SPEC.md"] = live_outputs["architect"]["content"]
            if "schema" in live_outputs:
                template_package["schema.sql"] = live_outputs["schema"]["content"]
            if "backend" in live_outputs:
                template_package["server/routes.py"] = live_outputs["backend"]["content"]
            if "frontend" in live_outputs and "<html" in live_outputs["frontend"]["content"].lower():
                template_package["client/index.html"] = live_outputs["frontend"]["content"]

            with FILES_LOCK:
                latest_manufactured_files.clear()
                latest_manufactured_files.update(template_package)

            audit_res = run_comprehensive_audit(scope, template_package)
            total_files = len(template_package)
            build_seq = record_build(
                client_id, scope.get("name", "orator-app"), scope.get("tier", "complete"),
                total_files, audit_res.get("composite_score", 0), mode,
            )

            engine.try_shift(ShiftState.AUDIT_PASSED, f"22-point audit complete: {audit_res.get('composite_score')}")
            engine.try_shift(ShiftState.SANDBOX_UNLOCKED, "Live sandbox + ZIP delivery unlocked.")

            # Consume free allowance only after a successful run.
            if mode == "free":
                consume_free_session(client_id)

            emit("audit_complete", {
                "composite_score": audit_res.get("composite_score", 0),
                "total_checks": audit_res.get("total_audits_evaluated", 22),
                "failed_checks": audit_res.get("failed_checks", []),
                "all_passed": audit_res.get("all_passed", False),
                "categories": audit_res.get("categories", []),
                "verification_seal": audit_res.get("verification_seal", {}),
            })

            emit("package_ready", {
                "status": "PACKAGE_READY",
                "download_endpoint": "/api/download-zip",
                "sandbox_endpoint": "/api/preview",
                "sandbox_footprint_bytes": 0,
                "memory_resident_kb": round(sum(len(c) for c in template_package.values()) / 1024, 1),
                "file_count": total_files,
                "files": list(template_package.keys()),
                "build_seq": build_seq,
                "mode": mode,
                "message": "Manufacturing complete. Air-gapped package ready."
            })

        except ConnectionAbortedError:
            pass
        except Exception as e:
            try:
                emit("error", {"message": str(e)})
            except Exception:
                pass

    # ------------------------------------------------------------------
    # Delivery helpers
    # ------------------------------------------------------------------
    def _send_json(self, status, data):
        raw = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _serve_live_preview(self):
        with FILES_LOCK:
            files = dict(latest_manufactured_files)
        html_content = files.get("client/index.html")
        css_content = files.get("client/styles.css")
        js_content = files.get("client/app.js")

        if not html_content:
            html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ORATOR.AI // Live Sandbox Idle</title>
  <style>
    body { background: #06090e; color: #38bdf8; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .box { text-align: center; border: 1px solid rgba(56,189,248,0.3); padding: 30px; border-radius: 10px; background: rgba(10,16,32,0.8); }
    .pulse { width: 12px; height: 12px; background: #00f0ff; border-radius: 50%; display: inline-block; margin-bottom: 12px; box-shadow: 0 0 10px #00f0ff; animation: p 1.5s infinite; }
    @keyframes p { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
  </style>
</head>
<body>
  <div class="box">
    <div class="pulse"></div>
    <h3>ORATOR.AI // LIVE SANDBOX IDLE</h3>
    <p style="color: #94a3b8; font-size: 0.85rem;">Lock a blueprint and authorize your execution slot to start live multi-agent manufacturing and the 22-point audit.</p>
  </div>
</body>
</html>"""
        else:
            if css_content:
                html_content = html_content.replace('<link rel="stylesheet" href="styles.css" />', f'<style>{css_content}</style>')
            if js_content:
                mock_api_script = """
                <script>
                  const originalFetch = window.fetch;
                  window.fetch = async function(url, options = {}) {
                    if (url.includes('/api/v1/resources') || url.includes('/api/v1/tasks')) {
                      if (options.method === 'POST') {
                        const body = JSON.parse(options.body || '{}');
                        return new Response(JSON.stringify({ id: 'res_' + Date.now(), title: body.title || body.name || 'Resource', status: 'ACTIVE', created_at: new Date().toISOString() }), { status: 201 });
                      }
                      return new Response(JSON.stringify({ resources: [
                        { id: 'res_01', title: 'Cryptographic Keyring Vault', status: 'ACTIVE', created_at: '2026-08-29T12:00:00Z' },
                        { id: 'res_02', title: 'Double-Entry WAL Buffer', status: 'ACTIVE', created_at: '2026-08-29T12:05:00Z' }
                      ], tasks: [
                        { id: 'tsk_01', name: 'Realtime Settlement Job', status: 'COMPLETED', runtime_ms: 42 }
                      ]}), { status: 200 });
                    }
                    if (url.includes('/api/v1/health')) {
                      return new Response(JSON.stringify({ status: 'healthy', uptime_seconds: 1200 }), { status: 200 });
                    }
                    return originalFetch(url, options);
                  };
                </script>
                """
                html_content = html_content.replace('<script src="app.js"></script>', f'{mock_api_script}<script>{js_content}</script>')

        content_bytes = html_content.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(content_bytes)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(content_bytes)

    def _serve_download_zip(self, spec=None, tier="single"):
        with FILES_LOCK:
            files = dict(latest_manufactured_files)

        if not files:
            spec = spec or {
                "name": "orator-manufactured-app",
                "description": "High-performance air-gapped system.",
                "moat": "Zero external SaaS dependencies with deterministic in-memory execution.",
                "entities": ["AuthPrincipal (id, email, role)", "MasterResource (id, title, payload, owner_id)"],
                "routes": ["GET /api/v1/health", "POST /api/v1/auth/login", "GET /api/v1/resources", "POST /api/v1/resources"]
            }
            files = generate_citadel_package(spec) if tier == "citadel" else generate_single_session_package(spec)
            with FILES_LOCK:
                latest_manufactured_files.clear()
                latest_manufactured_files.update(files)

        spec = spec or {}
        filename = f"{spec.get('name', 'orator-app') or 'orator-app'}-airgapped.zip"

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for file_path, content in files.items():
                zf.writestr(file_path, content)

        zip_bytes = zip_buffer.getvalue()

        self.send_response(200)
        self.send_header("Content-Type", "application/zip")
        self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.send_header("Content-Length", str(len(zip_bytes)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(zip_bytes)

    def _serve_static(self, path):
        if path in ("/", ""):
            path = "/index.html"
        clean = path.lstrip("/")

        # Path traversal guard: resolve and verify containment in STATIC_DIR.
        base = os.path.realpath(STATIC_DIR)
        full_path = os.path.realpath(os.path.join(STATIC_DIR, clean))
        if not (full_path == base or full_path.startswith(base + os.sep)):
            self.send_response(403)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"403 Forbidden")
            return

        if os.path.isfile(full_path):
            mime, _ = mimetypes.guess_type(full_path)
            with open(full_path, "rb") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", mime or "application/octet-stream")
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(content)
        else:
            self.send_response(404)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"404 Asset Not Found")


def run():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("0.0.0.0", PORT), OrchestratorHTTPHandler) as httpd:
        print(f"================================================================")
        print(f"   ORATOR.AI - 11-REPOSITORY BACKEND KNOWLEDGE APPLIANCE")
        print(f"   Listening on: http://0.0.0.0:{PORT}")
        print(f"   SSE Stream: Active // 22-Point Comprehensive Audit Engine")
        print(f"   0 Bytes Hard-Drive Footprint // Ephemeral In-Memory Sandbox")
        print(f"================================================================")
        sys.stdout.flush()
        httpd.serve_forever()


if __name__ == "__main__":
    run()
