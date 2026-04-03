"""
Test suite for Admin Panel, Password Recovery, and Email Verification features.
Tests: Admin user management, newsletter, email logs, forgot/reset password, email verification.
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "testuser@example.com"
ADMIN_PASSWORD = "password123"


class TestSession:
    """Shared session for authenticated requests"""
    session = None
    
    @classmethod
    def get_session(cls):
        if cls.session is None:
            cls.session = requests.Session()
            cls.session.headers.update({"Content-Type": "application/json"})
        return cls.session


@pytest.fixture(scope="module")
def admin_session():
    """Login as admin and return authenticated session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    
    if response.status_code != 200:
        pytest.skip(f"Admin login failed: {response.status_code} - {response.text}")
    
    data = response.json()
    assert data.get("is_admin") == True, "Test user must be admin"
    assert data.get("email_verified") == True, "Test user must be verified"
    
    return session


@pytest.fixture(scope="module")
def non_admin_session():
    """Create and login as non-admin user"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    # Create a unique test user
    test_email = f"TEST_nonadmin_{uuid.uuid4().hex[:8]}@example.com"
    
    # Register
    response = session.post(f"{BASE_URL}/api/auth/register", json={
        "email": test_email,
        "password": "testpass123",
        "name": "Test Non-Admin"
    })
    
    if response.status_code != 200:
        pytest.skip(f"Non-admin registration failed: {response.status_code}")
    
    return session, test_email


# ========== ADMIN STATS TESTS ==========
class TestAdminStats:
    """Test /api/admin/stats endpoint"""
    
    def test_admin_stats_returns_correct_structure(self, admin_session):
        """Admin stats should return user counts and totals"""
        response = admin_session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "total_users" in data
        assert "verified_users" in data
        assert "unverified_users" in data
        assert "total_sales" in data
        assert "total_newsletters" in data
        
        # Verify types
        assert isinstance(data["total_users"], int)
        assert isinstance(data["verified_users"], int)
        assert isinstance(data["unverified_users"], int)
    
    def test_admin_stats_requires_admin(self, non_admin_session):
        """Non-admin users should get 403"""
        session, _ = non_admin_session
        response = session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 403, f"Expected 403 for non-admin, got {response.status_code}"


# ========== ADMIN USER MANAGEMENT TESTS ==========
class TestAdminUserManagement:
    """Test admin user management endpoints"""
    
    def test_admin_get_users_list(self, admin_session):
        """Admin should be able to list all users"""
        response = admin_session.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        
        users = response.json()
        assert isinstance(users, list)
        assert len(users) > 0, "Should have at least one user (admin)"
        
        # Check user structure
        user = users[0]
        assert "id" in user
        assert "email" in user
        assert "is_admin" in user
        assert "email_verified" in user
    
    def test_admin_verify_user(self, admin_session):
        """Admin should be able to manually verify a user"""
        # First create an unverified user
        test_email = f"TEST_verify_{uuid.uuid4().hex[:8]}@example.com"
        temp_session = requests.Session()
        temp_session.headers.update({"Content-Type": "application/json"})
        
        reg_response = temp_session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "testpass123",
            "name": "Test Verify User"
        })
        assert reg_response.status_code == 200
        user_id = reg_response.json()["id"]
        
        # Verify the user is unverified
        users_response = admin_session.get(f"{BASE_URL}/api/admin/users")
        users = users_response.json()
        test_user = next((u for u in users if u["id"] == user_id), None)
        assert test_user is not None
        assert test_user["email_verified"] == False
        
        # Admin verifies the user
        verify_response = admin_session.post(f"{BASE_URL}/api/admin/verify-user/{user_id}")
        assert verify_response.status_code == 200
        assert "verificato" in verify_response.json().get("message", "").lower()
        
        # Verify the user is now verified
        users_response = admin_session.get(f"{BASE_URL}/api/admin/users")
        users = users_response.json()
        test_user = next((u for u in users if u["id"] == user_id), None)
        assert test_user["email_verified"] == True
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/admin/users/{user_id}")
    
    def test_admin_toggle_admin_status(self, admin_session):
        """Admin should be able to toggle admin status"""
        # Create a test user
        test_email = f"TEST_toggle_{uuid.uuid4().hex[:8]}@example.com"
        temp_session = requests.Session()
        temp_session.headers.update({"Content-Type": "application/json"})
        
        reg_response = temp_session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "testpass123",
            "name": "Test Toggle Admin"
        })
        assert reg_response.status_code == 200
        user_id = reg_response.json()["id"]
        
        # Toggle to admin
        toggle_response = admin_session.post(f"{BASE_URL}/api/admin/toggle-admin/{user_id}")
        assert toggle_response.status_code == 200
        data = toggle_response.json()
        assert data["is_admin"] == True
        
        # Toggle back to non-admin
        toggle_response = admin_session.post(f"{BASE_URL}/api/admin/toggle-admin/{user_id}")
        assert toggle_response.status_code == 200
        data = toggle_response.json()
        assert data["is_admin"] == False
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/admin/users/{user_id}")
    
    def test_admin_delete_user(self, admin_session):
        """Admin should be able to delete a user and their data"""
        # Create a test user
        test_email = f"TEST_delete_{uuid.uuid4().hex[:8]}@example.com"
        temp_session = requests.Session()
        temp_session.headers.update({"Content-Type": "application/json"})
        
        reg_response = temp_session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "testpass123",
            "name": "Test Delete User"
        })
        assert reg_response.status_code == 200
        user_id = reg_response.json()["id"]
        
        # Delete the user
        delete_response = admin_session.delete(f"{BASE_URL}/api/admin/users/{user_id}")
        assert delete_response.status_code == 200
        assert "eliminat" in delete_response.json().get("message", "").lower()
        
        # Verify user is deleted
        users_response = admin_session.get(f"{BASE_URL}/api/admin/users")
        users = users_response.json()
        test_user = next((u for u in users if u["id"] == user_id), None)
        assert test_user is None, "User should be deleted"
    
    def test_admin_cannot_delete_self(self, admin_session):
        """Admin should not be able to delete themselves"""
        # Get admin user ID
        me_response = admin_session.get(f"{BASE_URL}/api/auth/me")
        admin_id = me_response.json()["id"]
        
        # Try to delete self
        delete_response = admin_session.delete(f"{BASE_URL}/api/admin/users/{admin_id}")
        assert delete_response.status_code == 400
        assert "te stesso" in delete_response.json().get("detail", "").lower()
    
    def test_admin_endpoints_require_admin(self, non_admin_session):
        """Non-admin users should get 403 on admin endpoints"""
        session, _ = non_admin_session
        
        # Test all admin endpoints
        endpoints = [
            ("GET", "/api/admin/users"),
            ("POST", "/api/admin/verify-user/fake-id"),
            ("POST", "/api/admin/toggle-admin/fake-id"),
            ("DELETE", "/api/admin/users/fake-id"),
            ("GET", "/api/admin/email-logs"),
            ("GET", "/api/admin/newsletters"),
            ("POST", "/api/admin/newsletters"),
        ]
        
        for method, endpoint in endpoints:
            if method == "GET":
                response = session.get(f"{BASE_URL}{endpoint}")
            elif method == "POST":
                response = session.post(f"{BASE_URL}{endpoint}", json={})
            elif method == "DELETE":
                response = session.delete(f"{BASE_URL}{endpoint}")
            
            assert response.status_code == 403, f"Expected 403 for {method} {endpoint}, got {response.status_code}"


# ========== PASSWORD RECOVERY TESTS ==========
class TestPasswordRecovery:
    """Test forgot password and reset password flow"""
    
    def test_forgot_password_creates_reset_token(self, admin_session):
        """Forgot password should create a reset token and email log"""
        # Create a test user
        test_email = f"TEST_forgot_{uuid.uuid4().hex[:8]}@example.com"
        temp_session = requests.Session()
        temp_session.headers.update({"Content-Type": "application/json"})
        
        reg_response = temp_session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "oldpassword123",
            "name": "Test Forgot Password"
        })
        assert reg_response.status_code == 200
        user_id = reg_response.json()["id"]
        
        # Request password reset
        forgot_response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": test_email
        })
        assert forgot_response.status_code == 200
        
        # Check email log was created
        logs_response = admin_session.get(f"{BASE_URL}/api/admin/email-logs")
        logs = logs_response.json()
        reset_log = next((l for l in logs if l["to"].lower() == test_email.lower() and l["type"] == "password_reset"), None)
        assert reset_log is not None, "Password reset email log should be created"
        assert "reset-password" in reset_log["link"]
        assert "token=" in reset_log["link"]
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/admin/users/{user_id}")
    
    def test_forgot_password_nonexistent_email_returns_success(self):
        """Forgot password should return success even for non-existent email (prevent enumeration)"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": "nonexistent@example.com"
        })
        assert response.status_code == 200
        # Should not reveal if email exists
        assert "message" in response.json()
    
    def test_reset_password_with_valid_token(self, admin_session):
        """Reset password should work with valid token"""
        # Create a test user
        test_email = f"TEST_reset_{uuid.uuid4().hex[:8]}@example.com"
        temp_session = requests.Session()
        temp_session.headers.update({"Content-Type": "application/json"})
        
        reg_response = temp_session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "oldpassword123",
            "name": "Test Reset Password"
        })
        assert reg_response.status_code == 200
        user_id = reg_response.json()["id"]
        
        # Request password reset
        requests.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": test_email})
        
        # Get token from email logs
        logs_response = admin_session.get(f"{BASE_URL}/api/admin/email-logs")
        logs = logs_response.json()
        reset_log = next((l for l in logs if l["to"].lower() == test_email.lower() and l["type"] == "password_reset"), None)
        assert reset_log is not None, f"Password reset log not found for {test_email}"
        
        # Extract token from link
        link = reset_log["link"]
        token = link.split("token=")[1] if "token=" in link else None
        assert token is not None
        
        # Reset password
        new_password = "newpassword456"
        reset_response = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": token,
            "new_password": new_password
        })
        assert reset_response.status_code == 200
        assert "successo" in reset_response.json().get("message", "").lower()
        
        # Verify can login with new password
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": new_password
        })
        assert login_response.status_code == 200
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/admin/users/{user_id}")
    
    def test_reset_password_invalid_token(self):
        """Reset password should fail with invalid token"""
        response = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": "invalid-token-12345",
            "new_password": "newpassword123"
        })
        assert response.status_code == 400
        assert "non valido" in response.json().get("detail", "").lower() or "scaduto" in response.json().get("detail", "").lower()
    
    def test_reset_token_cannot_be_reused(self, admin_session):
        """Reset token should be marked as used after first use"""
        # Create a test user
        test_email = f"TEST_reuse_{uuid.uuid4().hex[:8]}@example.com"
        temp_session = requests.Session()
        temp_session.headers.update({"Content-Type": "application/json"})
        
        reg_response = temp_session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "oldpassword123",
            "name": "Test Token Reuse"
        })
        assert reg_response.status_code == 200
        user_id = reg_response.json()["id"]
        
        # Request password reset
        requests.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": test_email})
        
        # Get token
        logs_response = admin_session.get(f"{BASE_URL}/api/admin/email-logs")
        logs = logs_response.json()
        reset_log = next((l for l in logs if l["to"].lower() == test_email.lower() and l["type"] == "password_reset"), None)
        assert reset_log is not None, f"Password reset log not found for {test_email}"
        token = reset_log["link"].split("token=")[1]
        
        # First reset - should succeed
        reset_response = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": token,
            "new_password": "newpassword1"
        })
        assert reset_response.status_code == 200
        
        # Second reset with same token - should fail
        reset_response = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": token,
            "new_password": "newpassword2"
        })
        assert reset_response.status_code == 400
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/admin/users/{user_id}")


# ========== EMAIL VERIFICATION TESTS ==========
class TestEmailVerification:
    """Test email verification flow"""
    
    def test_register_creates_unverified_user(self, admin_session):
        """New registration should create user with email_verified=false"""
        test_email = f"TEST_unverified_{uuid.uuid4().hex[:8]}@example.com"
        temp_session = requests.Session()
        temp_session.headers.update({"Content-Type": "application/json"})
        
        reg_response = temp_session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "testpass123",
            "name": "Test Unverified"
        })
        assert reg_response.status_code == 200
        data = reg_response.json()
        assert data["email_verified"] == False
        user_id = data["id"]
        
        # Check email log was created
        logs_response = admin_session.get(f"{BASE_URL}/api/admin/email-logs")
        logs = logs_response.json()
        verify_log = next((l for l in logs if l["to"].lower() == test_email.lower() and l["type"] == "verification"), None)
        assert verify_log is not None, f"Verification email log should be created for {test_email}"
        assert "verify-email" in verify_log["link"]
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/admin/users/{user_id}")
    
    def test_verify_email_with_valid_token(self, admin_session):
        """Email verification should work with valid token"""
        test_email = f"TEST_verifyemail_{uuid.uuid4().hex[:8]}@example.com"
        temp_session = requests.Session()
        temp_session.headers.update({"Content-Type": "application/json"})
        
        reg_response = temp_session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "testpass123",
            "name": "Test Verify Email"
        })
        assert reg_response.status_code == 200
        user_id = reg_response.json()["id"]
        
        # Get verification token from email logs
        logs_response = admin_session.get(f"{BASE_URL}/api/admin/email-logs")
        logs = logs_response.json()
        verify_log = next((l for l in logs if l["to"].lower() == test_email.lower() and l["type"] == "verification"), None)
        assert verify_log is not None, f"Verification log not found for {test_email}"
        
        token = verify_log["link"].split("token=")[1]
        
        # Verify email
        verify_response = requests.get(f"{BASE_URL}/api/auth/verify-email?token={token}")
        assert verify_response.status_code == 200
        assert "verificata" in verify_response.json().get("message", "").lower()
        
        # Check user is now verified
        users_response = admin_session.get(f"{BASE_URL}/api/admin/users")
        users = users_response.json()
        test_user = next((u for u in users if u["id"] == user_id), None)
        assert test_user["email_verified"] == True
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/admin/users/{user_id}")
    
    def test_verify_email_invalid_token(self):
        """Email verification should fail with invalid token"""
        response = requests.get(f"{BASE_URL}/api/auth/verify-email?token=invalid-token-12345")
        assert response.status_code == 400
        assert "non valido" in response.json().get("detail", "").lower()


# ========== NEWSLETTER TESTS ==========
class TestNewsletter:
    """Test newsletter functionality"""
    
    def test_send_newsletter_creates_entry(self, admin_session):
        """Sending newsletter should create entry in newsletters collection"""
        subject = f"TEST Newsletter {uuid.uuid4().hex[:8]}"
        body = "This is a test newsletter body."
        
        response = admin_session.post(f"{BASE_URL}/api/admin/newsletters", json={
            "subject": subject,
            "body": body
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["subject"] == subject
        assert data["body"] == body
        assert "recipients_count" in data
        assert isinstance(data["recipients_count"], int)
        
        # Verify newsletter appears in list
        list_response = admin_session.get(f"{BASE_URL}/api/admin/newsletters")
        newsletters = list_response.json()
        test_nl = next((n for n in newsletters if n["subject"] == subject), None)
        assert test_nl is not None
    
    def test_get_newsletters_list(self, admin_session):
        """Should be able to get list of sent newsletters"""
        response = admin_session.get(f"{BASE_URL}/api/admin/newsletters")
        assert response.status_code == 200
        
        newsletters = response.json()
        assert isinstance(newsletters, list)
        
        if len(newsletters) > 0:
            nl = newsletters[0]
            assert "id" in nl
            assert "subject" in nl
            assert "body" in nl
            assert "recipients_count" in nl
            assert "created_at" in nl


# ========== EMAIL LOGS TESTS ==========
class TestEmailLogs:
    """Test email logs functionality"""
    
    def test_get_email_logs(self, admin_session):
        """Admin should be able to get email logs"""
        response = admin_session.get(f"{BASE_URL}/api/admin/email-logs")
        assert response.status_code == 200
        
        logs = response.json()
        assert isinstance(logs, list)
        
        if len(logs) > 0:
            log = logs[0]
            assert "id" in log
            assert "to" in log
            assert "subject" in log
            assert "type" in log
            assert "created_at" in log
    
    def test_email_logs_contain_links(self, admin_session):
        """Email logs should contain verification and reset links"""
        # Create a user to generate verification email
        test_email = f"TEST_logs_{uuid.uuid4().hex[:8]}@example.com"
        temp_session = requests.Session()
        temp_session.headers.update({"Content-Type": "application/json"})
        
        reg_response = temp_session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "testpass123",
            "name": "Test Logs"
        })
        assert reg_response.status_code == 200
        user_id = reg_response.json()["id"]
        
        # Check logs
        logs_response = admin_session.get(f"{BASE_URL}/api/admin/email-logs")
        logs = logs_response.json()
        
        verify_log = next((l for l in logs if l["to"].lower() == test_email.lower()), None)
        assert verify_log is not None, f"Email log not found for {test_email}"
        assert "link" in verify_log
        assert verify_log["link"].startswith("http")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/admin/users/{user_id}")


# ========== CLEANUP ==========
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_users(request):
    """Cleanup all TEST_ prefixed users after all tests"""
    def cleanup():
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if login_response.status_code == 200:
            # Get all users
            users_response = session.get(f"{BASE_URL}/api/admin/users")
            if users_response.status_code == 200:
                users = users_response.json()
                for user in users:
                    if user["email"].startswith("TEST_"):
                        session.delete(f"{BASE_URL}/api/admin/users/{user['id']}")
    
    request.addfinalizer(cleanup)
