"""
Orator.AI — Model Router
Supports:
- OpenAI
- Gemini (Anti-Gravity / Google)
- OpenRouter (Claude, Qwen, DeepSeek, Llama, etc.)

Modes:
- free   → aggressive free-key rotation (OmniRoute style)
- paid   → strong dedicated models only
"""

import os
import json
import time
import urllib.request
import urllib.error
from typing import Optional, Dict, Any, List

# ============================================================
# CONFIG — Put your keys here or in environment variables
# ============================================================

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")          # Anti-Gravity / Google AI Studio
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

# Optional: extra free OpenRouter keys for rotation
OPENROUTER_FREE_KEYS = [
    # Add extra free OpenRouter keys here if you have them
    # "sk-or-v1-xxxx",
]

# ============================================================
# MODEL DEFINITIONS
# ============================================================

PAID_MODELS = {
    "architect": "anthropic/claude-3.5-sonnet",      # Strong reasoning
    "schema":    "qwen/qwen-2.5-coder-32b-instruct",
    "backend":   "openai/gpt-4o",
    "frontend":  "google/gemini-2.0-flash-001",
    "review":    "anthropic/claude-3.5-sonnet",
}

FREE_MODELS = {
    "architect": "google/gemini-2.0-flash-001",
    "schema":    "qwen/qwen-2.5-coder-32b-instruct",
    "backend":   "openai/gpt-4o-mini",
    "frontend":  "google/gemini-2.0-flash-001",
    "review":    "openai/gpt-4o-mini",
}

# ============================================================
# CORE CALLERS
# ============================================================

def _http_post(url: str, headers: Dict[str, str], payload: Dict) -> Dict:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8") if e.fp else str(e)
        raise RuntimeError(f"HTTP {e.code}: {body}")
    except Exception as e:
        raise RuntimeError(str(e))


def call_openai(prompt: str, system: str = "", model: str = "gpt-4o", temperature: float = 0.3) -> str:
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY not set")

    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": 4096,
    }

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }

    result = _http_post("https://api.openai.com/v1/chat/completions", headers, payload)
    return result["choices"][0]["message"]["content"]


def call_gemini(prompt: str, system: str = "", model: str = "gemini-2.0-flash") -> str:
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not set")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"

    full_prompt = f"{system}\n\n{prompt}" if system else prompt

    payload = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 4096,
        }
    }

    headers = {"Content-Type": "application/json"}
    result = _http_post(url, headers, payload)
    return result["candidates"][0]["content"]["parts"][0]["text"]


def call_openrouter(prompt: str, system: str = "", model: str = "anthropic/claude-3.5-sonnet",
                    api_key: Optional[str] = None, temperature: float = 0.3) -> str:
    key = api_key or OPENROUTER_API_KEY
    if not key:
        raise RuntimeError("OPENROUTER_API_KEY not set")

    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": 4096,
    }

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://orator.ai",
        "X-Title": "The Orator",
    }

    result = _http_post("https://openrouter.ai/api/v1/chat/completions", headers, payload)
    return result["choices"][0]["message"]["content"]


# ============================================================
# OMNIROUTE-STYLE FREE KEY ROTATION
# ============================================================

class FreeKeyRotator:
    """Simple OmniRoute-style rotator for free / cheap keys."""

    def __init__(self):
        self.keys = [OPENROUTER_API_KEY] + OPENROUTER_FREE_KEYS
        self.keys = [k for k in self.keys if k]  # remove empty
        self.index = 0

    def next_key(self) -> Optional[str]:
        if not self.keys:
            return None
        key = self.keys[self.index % len(self.keys)]
        self.index += 1
        return key


free_rotator = FreeKeyRotator()


# ============================================================
# HIGH-LEVEL ROUTER
# ============================================================

def route(role: str, prompt: str, system: str = "", mode: str = "paid") -> str:
    """
    role: "architect" | "schema" | "backend" | "frontend" | "review"
    mode: "free" | "paid"
    """

    if mode == "free":
        model = FREE_MODELS.get(role, "google/gemini-2.0-flash-001")
        # Prefer free OpenRouter rotation first
        key = free_rotator.next_key()
        if key:
            try:
                return call_openrouter(prompt, system, model=model, api_key=key)
            except Exception as e:
                print(f"[FreeRotator] OpenRouter failed: {e}")

        # Fallback to direct Gemini
        try:
            return call_gemini(prompt, system)
        except Exception as e:
            print(f"[FreeRotator] Gemini failed: {e}")

        # Last resort
        return call_openai(prompt, system, model="gpt-4o-mini")

    else:  # paid mode — strong models only
        model = PAID_MODELS.get(role, "anthropic/claude-3.5-sonnet")

        # Prefer OpenRouter for Claude / Qwen
        if model.startswith("anthropic/") or model.startswith("qwen/"):
            return call_openrouter(prompt, system, model=model)

        if model.startswith("openai/"):
            return call_openai(prompt, system, model=model.replace("openai/", ""))

        if model.startswith("google/"):
            return call_gemini(prompt, system, model=model.replace("google/", ""))

        # Fallback
        return call_openrouter(prompt, system, model=model)


def route_safe(role: str, prompt: str, system: str = "", mode: str = "paid") -> str:
    """
    Never-throw wrapper around route(). Returns empty string when no provider
    is configured or every provider fails — callers fall back to the
    deterministic template pipeline.
    """
    if not (OPENAI_API_KEY or GEMINI_API_KEY or OPENROUTER_API_KEY):
        return ""
    try:
        return route(role, prompt, system, mode)
    except Exception as e:
        print(f"[ModelRouter] route_safe({role}) failed: {e}")
        return ""


# ============================================================
# Convenience helpers
# ============================================================

def architect(prompt: str, system: str = "", mode: str = "paid") -> str:
    return route("architect", prompt, system, mode)

def schema(prompt: str, system: str = "", mode: str = "paid") -> str:
    return route("schema", prompt, system, mode)

def backend(prompt: str, system: str = "", mode: str = "paid") -> str:
    return route("backend", prompt, system, mode)

def frontend(prompt: str, system: str = "", mode: str = "paid") -> str:
    return route("frontend", prompt, system, mode)

def review(prompt: str, system: str = "", mode: str = "paid") -> str:
    return route("review", prompt, system, mode)
