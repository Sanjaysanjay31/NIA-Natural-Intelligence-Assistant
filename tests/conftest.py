import sys
from pathlib import Path

# Add backend directory to sys.path for test discovery
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))
