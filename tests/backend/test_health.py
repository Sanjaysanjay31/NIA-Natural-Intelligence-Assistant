from starlette.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Verify that root endpoint returns application metadata."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "NIA (Natural Intelligence Assistant)"
    assert data["status"] == "online"
    assert "/api/v1/health" in data["api"]


def test_health_check_endpoint():
    """Verify that /api/v1/health returns healthy status and metadata."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["appName"] == "NIA (Natural Intelligence Assistant)"
    assert data["version"] == "0.1.0"
    assert "timestamp" in data
