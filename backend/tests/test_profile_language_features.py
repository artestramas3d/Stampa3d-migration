"""
Test Profile Page and Language Features
- PUT /api/auth/profile - Update user name
- POST /api/auth/change-password - Change password
- Registration creates unverified user (email_verified=false)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
ADMIN_EMAIL = "testuser@example.com"
ADMIN_PASSWORD = "password123"


class TestProfileEndpoints:
    """Test profile update and password change endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session with cookies"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.user = response.json()
        yield
        # Cleanup - restore original name if changed
        self.session.put(f"{BASE_URL}/api/auth/profile", json={"name": ""})
    
    def test_get_current_user(self):
        """GET /api/auth/me returns current user info"""
        response = self.session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert data["email"] == ADMIN_EMAIL
        assert "email_verified" in data
        print(f"✓ GET /api/auth/me returns user: {data['email']}, verified: {data['email_verified']}")
    
    def test_update_profile_name(self):
        """PUT /api/auth/profile updates user name"""
        new_name = f"Test User {uuid.uuid4().hex[:6]}"
        response = self.session.put(f"{BASE_URL}/api/auth/profile", json={"name": new_name})
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == new_name
        assert data["email"] == ADMIN_EMAIL
        
        # Verify via GET /api/auth/me
        me_response = self.session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200
        assert me_response.json()["name"] == new_name
        print(f"✓ PUT /api/auth/profile updated name to: {new_name}")
    
    def test_update_profile_empty_name(self):
        """PUT /api/auth/profile with empty name clears name"""
        response = self.session.put(f"{BASE_URL}/api/auth/profile", json={"name": ""})
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == ""
        print("✓ PUT /api/auth/profile with empty name works")
    
    def test_change_password_success(self):
        """POST /api/auth/change-password with correct current password"""
        # Change password
        new_password = "newpassword123"
        response = self.session.post(f"{BASE_URL}/api/auth/change-password", json={
            "current_password": ADMIN_PASSWORD,
            "new_password": new_password
        })
        assert response.status_code == 200
        assert "successo" in response.json().get("message", "").lower() or "success" in response.json().get("message", "").lower()
        print("✓ POST /api/auth/change-password succeeded")
        
        # Verify new password works by logging in
        new_session = requests.Session()
        login_response = new_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": new_password
        })
        assert login_response.status_code == 200, "Login with new password failed"
        print("✓ Login with new password works")
        
        # Restore original password
        restore_response = new_session.post(f"{BASE_URL}/api/auth/change-password", json={
            "current_password": new_password,
            "new_password": ADMIN_PASSWORD
        })
        assert restore_response.status_code == 200, "Failed to restore original password"
        print("✓ Original password restored")
    
    def test_change_password_wrong_current(self):
        """POST /api/auth/change-password with wrong current password returns 400"""
        response = self.session.post(f"{BASE_URL}/api/auth/change-password", json={
            "current_password": "wrongpassword",
            "new_password": "newpassword123"
        })
        assert response.status_code == 400
        print(f"✓ POST /api/auth/change-password with wrong password returns 400: {response.json()}")
    
    def test_change_password_short_new(self):
        """POST /api/auth/change-password with short new password returns 400"""
        response = self.session.post(f"{BASE_URL}/api/auth/change-password", json={
            "current_password": ADMIN_PASSWORD,
            "new_password": "12345"  # Less than 6 chars
        })
        assert response.status_code == 400
        print(f"✓ POST /api/auth/change-password with short password returns 400: {response.json()}")


class TestRegistrationCreatesUnverifiedUser:
    """Test that registration creates unverified user"""
    
    def test_register_creates_unverified_user(self):
        """POST /api/auth/register creates user with email_verified=false"""
        session = requests.Session()
        test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        
        response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "testpass123",
            "name": "Test User"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Check email_verified is false
        assert data.get("email_verified") == False, f"Expected email_verified=false, got {data.get('email_verified')}"
        assert data["email"] == test_email
        print(f"✓ Registration creates unverified user: {test_email}, email_verified={data['email_verified']}")
        
        # Verify via /api/auth/me
        me_response = session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200
        me_data = me_response.json()
        assert me_data.get("email_verified") == False
        print(f"✓ GET /api/auth/me confirms email_verified=false")
        
        # Cleanup - delete test user via admin
        admin_session = requests.Session()
        admin_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        # Get user ID from admin users list
        users_response = admin_session.get(f"{BASE_URL}/api/admin/users")
        if users_response.status_code == 200:
            users = users_response.json()
            test_user = next((u for u in users if u["email"] == test_email), None)
            if test_user:
                admin_session.delete(f"{BASE_URL}/api/admin/users/{test_user['id']}")
                print(f"✓ Cleaned up test user: {test_email}")


class TestAuthEndpointsRequireAuth:
    """Test that profile endpoints require authentication"""
    
    def test_profile_update_requires_auth(self):
        """PUT /api/auth/profile without auth returns 401"""
        session = requests.Session()
        response = session.put(f"{BASE_URL}/api/auth/profile", json={"name": "Test"})
        assert response.status_code == 401
        print("✓ PUT /api/auth/profile requires authentication")
    
    def test_change_password_requires_auth(self):
        """POST /api/auth/change-password without auth returns 401"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/change-password", json={
            "current_password": "test",
            "new_password": "test123"
        })
        assert response.status_code == 401
        print("✓ POST /api/auth/change-password requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
