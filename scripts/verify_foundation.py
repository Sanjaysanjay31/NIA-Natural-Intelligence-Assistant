"""
NIA Repository Foundation Verification Script
Performs end-to-end integrity checks on structure, documentation, configuration, and API health.
"""
import sys
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent


def check_paths():
    print("[1/4] Checking Directory Structure & Documentation...")
    required = [
        "frontend/src/components",
        "frontend/src/features",
        "frontend/src/features/commitments",
        "frontend/src/features/voiceMemo",
        "frontend/src/navigation",
        "frontend/src/state",
        "frontend/src/services",
        "frontend/src/adapters",
        "frontend/src/contracts",
        "frontend/src/config",
        "frontend/src/theme",
        "backend/app/api",
        "backend/app/core",
        "backend/app/schemas",
        "backend/app/services",
        "backend/app/repositories",
        "backend/app/modules/reality",
        "backend/app/modules/evidence",
        "backend/app/modules/actions",
        "backend/app/modules/digital_state",
        "backend/app/modules/physical_observation",
        "backend/app/modules/commitments",
        "docs/PROJECT_OVERVIEW.md",
        "docs/ARCHITECTURE.md",
        "docs/DEVELOPMENT_RULES.md",
        "docs/ENVIRONMENT.md",
        "docs/MODULE_OWNERSHIP.md",
        "docs/API_CONTRACT.md",
        "docs/LOCAL_AI_AND_RENDER.md",
        "README.md",
        ".gitignore",
        ".env.example"
    ]
    missing = []
    for rel in required:
        p = REPO_ROOT / rel
        if not p.exists():
            missing.append(rel)
    if missing:
        print(f"FAILED: Missing paths: {missing}")
        return False
    print(f"PASSED: All {len(required)} core paths and documents verified.")
    return True


def check_backend_imports():
    print("[2/4] Verifying Backend Application Bootstrap...")
    sys.path.insert(0, str(REPO_ROOT / "backend"))
    try:
        from app.main import app
        from app.core.config import settings
        from app.schemas.base import HealthResponse
        assert app.title == settings.APP_NAME
        print(f"PASSED: Backend initialized ({settings.APP_NAME} v{settings.APP_VERSION})")
        return True
    except Exception as e:
        print(f"FAILED: Backend import failed: {e}")
        return False


def run_unit_tests():
    print("[3/4] Running Backend Pytest Suite...")
    res = subprocess.run(
        [sys.executable, "-m", "pytest", str(REPO_ROOT / "tests/backend"), "-v"],
        capture_output=True,
        text=True
    )
    print(res.stdout)
    if res.returncode != 0:
        print(res.stderr)
        print("FAILED: Pytest suite failed.")
        return False
    print("PASSED: Pytest suite passed.")
    return True


def check_git_hygiene():
    print("[4/4] Checking Repository Hygiene & Git Invariants...")
    gitignore_path = REPO_ROOT / ".gitignore"
    if not gitignore_path.exists():
        print("FAILED: .gitignore missing")
        return False
    content = gitignore_path.read_text(encoding="utf-8")
    forbidden = [".env", "models/", "weights/", "*.onnx", "*.tflite"]
    for f in forbidden:
        if f not in content:
            print(f"FAILED: .gitignore does not explicitly forbid '{f}'")
            return False
    print("PASSED: Git hygiene rules verified (no secrets, no models).")
    return True


if __name__ == "__main__":
    print("=== NIA Foundation Verification ===")
    p1 = check_paths()
    p2 = check_backend_imports()
    p3 = run_unit_tests()
    p4 = check_git_hygiene()
    if p1 and p2 and p3 and p4:
        print("\n=== ALL VERIFICATION CHECKS PASSED ===")
        sys.exit(0)
    else:
        print("\n=== VERIFICATION FAILED ===")
        sys.exit(1)
