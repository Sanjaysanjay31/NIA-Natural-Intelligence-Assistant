from pathlib import Path


def test_repository_structure_exists():
    """Verify that all target directories exist per Prompt 1 specification."""
    repo_root = Path(__file__).parent.parent.parent

    # Required frontend directories
    frontend_dirs = [
        "frontend/src/components",
        "frontend/src/features",
        "frontend/src/features/reality",
        "frontend/src/features/actions",
        "frontend/src/features/timeline",
        "frontend/src/features/mindPulse",
        "frontend/src/features/commitments",
        "frontend/src/features/voiceMemo",
        "frontend/src/navigation",
        "frontend/src/state",
        "frontend/src/services",
        "frontend/src/adapters",
        "frontend/src/contracts",
        "frontend/src/config",
        "frontend/src/theme",
    ]
    for d in frontend_dirs:
        assert (repo_root / d).is_dir(), f"Frontend directory missing: {d}"

    # Required backend directories
    backend_dirs = [
        "backend/app/api",
        "backend/app/core",
        "backend/app/schemas",
        "backend/app/services",
        "backend/app/repositories",
        "backend/app/modules",
        "backend/app/modules/reality",
        "backend/app/modules/evidence",
        "backend/app/modules/actions",
        "backend/app/modules/digital_state",
        "backend/app/modules/physical_observation",
        "backend/app/modules/commitments",
    ]
    for d in backend_dirs:
        assert (repo_root / d).is_dir(), f"Backend directory missing: {d}"

    # Required root docs
    required_docs = [
        "README.md",
        "docs/PROJECT_OVERVIEW.md",
        "docs/ARCHITECTURE.md",
        "docs/DEVELOPMENT_RULES.md",
        "docs/ENVIRONMENT.md",
        "docs/MODULE_OWNERSHIP.md",
        "docs/API_CONTRACT.md",
        "docs/LOCAL_AI_AND_RENDER.md",
    ]
    for doc in required_docs:
        assert (repo_root / doc).is_file(), f"Documentation file missing: {doc}"


def test_bhupathi_module_reservation():
    """Verify that backend/app/modules/commitments is explicitly marked as Bhupathi's isolated domain."""
    repo_root = Path(__file__).parent.parent.parent
    commitments_readme = repo_root / "backend/app/modules/commitments/README.md"
    assert commitments_readme.is_file(), "commitments/README.md must exist"
    content = commitments_readme.read_text(encoding="utf-8")
    assert "Bhupathi" in content
    assert "Isolated" in content
