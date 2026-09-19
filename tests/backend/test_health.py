from starlette.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Verify that root endpoint returns application metadata and links."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "NIA (Natural Intelligence Assistant)"
    assert data["status"] == "online"
    assert "health" in data
    assert "ready" in data


def test_health_check_endpoint():
    """Verify that /api/v1/health returns healthy status."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["appName"] == "NIA (Natural Intelligence Assistant)"
    assert data["version"] == "0.1.0"
    assert "timestamp" in data
    assert "X-Request-ID" in response.headers


def test_readiness_check_endpoint():
    """Verify that /api/v1/ready confirms lightweight dependencies without heavy models."""
    response = client.get("/api/v1/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["ready"] is True
    assert data["checks"]["heavyModelsLoaded"] is False  # Render safety rule
    assert data["checks"]["lightweightMode"] is True


def test_request_id_propagation():
    """Verify custom X-Request-ID is preserved in response headers."""
    custom_id = "req-custom-test-12345"
    response = client.get("/api/v1/health", headers={"X-Request-ID": custom_id})
    assert response.headers["X-Request-ID"] == custom_id
