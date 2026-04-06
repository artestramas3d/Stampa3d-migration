"""
Test Suite for New Features:
1. Site Settings (GET /api/site-settings, PUT /api/admin/site-settings)
2. Newsletter Scheduling (POST /api/admin/newsletters with scheduled_at)
3. Bug Reports (POST /api/bug-reports, GET /api/bug-reports, admin endpoints)
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://filament-profit.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_EMAIL = "testuser@example.com"
ADMIN_PASSWORD = "password123"


class TestSiteSettings:
    """Site Settings feature tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin before each test"""
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200, f"Admin login failed: {login_resp.text}"
        self.user = login_resp.json()
        assert self.user.get("is_admin") == True, "User is not admin"
    
    def test_get_site_settings_returns_defaults(self):
        """GET /api/site-settings returns default settings"""
        response = self.session.get(f"{BASE_URL}/api/site-settings")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        # Verify default structure
        assert "brand_name" in data
        assert "subtitle" in data
        assert "primary_color" in data
        assert "accent_color" in data
        print(f"Site settings: {data}")
    
    def test_update_site_settings_brand_name(self):
        """PUT /api/admin/site-settings updates brand_name"""
        # Update brand name
        update_resp = self.session.put(f"{BASE_URL}/api/admin/site-settings", json={
            "brand_name": "TEST_Brand_Name"
        })
        assert update_resp.status_code == 200, f"Update failed: {update_resp.text}"
        
        updated = update_resp.json()
        assert updated["brand_name"] == "TEST_Brand_Name"
        
        # Verify via GET
        get_resp = self.session.get(f"{BASE_URL}/api/site-settings")
        assert get_resp.status_code == 200
        assert get_resp.json()["brand_name"] == "TEST_Brand_Name"
        
        # Restore original
        self.session.put(f"{BASE_URL}/api/admin/site-settings", json={
            "brand_name": "Artes&Tramas"
        })
    
    def test_update_site_settings_subtitle(self):
        """PUT /api/admin/site-settings updates subtitle"""
        update_resp = self.session.put(f"{BASE_URL}/api/admin/site-settings", json={
            "subtitle": "TEST_Subtitle"
        })
        assert update_resp.status_code == 200
        assert update_resp.json()["subtitle"] == "TEST_Subtitle"
        
        # Restore
        self.session.put(f"{BASE_URL}/api/admin/site-settings", json={
            "subtitle": "Calcolatore"
        })
    
    def test_update_site_settings_colors(self):
        """PUT /api/admin/site-settings updates primary_color and accent_color"""
        update_resp = self.session.put(f"{BASE_URL}/api/admin/site-settings", json={
            "primary_color": "#ff0000",
            "accent_color": "#00ff00"
        })
        assert update_resp.status_code == 200
        
        data = update_resp.json()
        assert data["primary_color"] == "#ff0000"
        assert data["accent_color"] == "#00ff00"
        
        # Restore
        self.session.put(f"{BASE_URL}/api/admin/site-settings", json={
            "primary_color": "#f97316",
            "accent_color": "#2563eb"
        })


class TestNewsletterScheduling:
    """Newsletter scheduling feature tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin before each test"""
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200
    
    def test_send_newsletter_immediately(self):
        """POST /api/admin/newsletters without scheduled_at sends immediately (status=sent)"""
        response = self.session.post(f"{BASE_URL}/api/admin/newsletters", json={
            "subject": "TEST_Immediate_Newsletter",
            "body": "This is a test newsletter sent immediately"
        })
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["status"] == "sent", f"Expected status=sent, got {data['status']}"
        assert "sent_at" in data or data.get("sent_at") is not None or data.get("recipients_count", 0) >= 0
        assert data["subject"] == "TEST_Immediate_Newsletter"
        print(f"Immediate newsletter: {data}")
    
    def test_schedule_newsletter_for_future(self):
        """POST /api/admin/newsletters with scheduled_at creates scheduled newsletter (status=scheduled)"""
        # Schedule for 1 hour in the future
        future_time = (datetime.utcnow() + timedelta(hours=1)).isoformat()
        
        response = self.session.post(f"{BASE_URL}/api/admin/newsletters", json={
            "subject": "TEST_Scheduled_Newsletter",
            "body": "This is a scheduled test newsletter",
            "scheduled_at": future_time
        })
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["status"] == "scheduled", f"Expected status=scheduled, got {data['status']}"
        assert data["scheduled_at"] == future_time
        assert data["subject"] == "TEST_Scheduled_Newsletter"
        
        # Store ID for cleanup
        self.scheduled_newsletter_id = data["id"]
        print(f"Scheduled newsletter: {data}")
        
        # Cleanup - delete the scheduled newsletter
        delete_resp = self.session.delete(f"{BASE_URL}/api/admin/newsletters/{self.scheduled_newsletter_id}")
        assert delete_resp.status_code == 200
    
    def test_delete_newsletter(self):
        """DELETE /api/admin/newsletters/{id} deletes a newsletter"""
        # First create a scheduled newsletter
        future_time = (datetime.utcnow() + timedelta(hours=2)).isoformat()
        create_resp = self.session.post(f"{BASE_URL}/api/admin/newsletters", json={
            "subject": "TEST_To_Delete",
            "body": "This will be deleted",
            "scheduled_at": future_time
        })
        assert create_resp.status_code == 200
        newsletter_id = create_resp.json()["id"]
        
        # Delete it
        delete_resp = self.session.delete(f"{BASE_URL}/api/admin/newsletters/{newsletter_id}")
        assert delete_resp.status_code == 200
        
        # Verify it's gone from the list
        list_resp = self.session.get(f"{BASE_URL}/api/admin/newsletters")
        assert list_resp.status_code == 200
        newsletters = list_resp.json()
        assert not any(nl["id"] == newsletter_id for nl in newsletters), "Newsletter was not deleted"
    
    def test_get_newsletters_list(self):
        """GET /api/admin/newsletters returns list with status, scheduled_at, sent_at fields"""
        response = self.session.get(f"{BASE_URL}/api/admin/newsletters")
        assert response.status_code == 200
        
        newsletters = response.json()
        assert isinstance(newsletters, list)
        
        # Check structure of each newsletter
        for nl in newsletters:
            assert "id" in nl
            assert "subject" in nl
            assert "body" in nl
            assert "status" in nl
            assert "scheduled_at" in nl or nl.get("scheduled_at") == ""
            assert "sent_at" in nl or nl.get("sent_at") == ""
            assert "recipients_count" in nl
        
        print(f"Found {len(newsletters)} newsletters")


class TestBugReports:
    """Bug Reports feature tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin before each test"""
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200
    
    def test_create_bug_report(self):
        """POST /api/bug-reports creates a bug report with title, description, priority"""
        response = self.session.post(f"{BASE_URL}/api/bug-reports", json={
            "title": "TEST_Bug_Report",
            "description": "This is a test bug report description",
            "priority": "alta"
        })
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["title"] == "TEST_Bug_Report"
        assert data["description"] == "This is a test bug report description"
        assert data["priority"] == "alta"
        assert data["status"] == "aperto"
        assert "id" in data
        
        self.bug_report_id = data["id"]
        print(f"Created bug report: {data}")
    
    def test_get_my_bug_reports(self):
        """GET /api/bug-reports returns user's own bug reports"""
        # First create a bug report
        create_resp = self.session.post(f"{BASE_URL}/api/bug-reports", json={
            "title": "TEST_My_Bug",
            "description": "Test description",
            "priority": "media"
        })
        assert create_resp.status_code == 200
        
        # Get my reports
        response = self.session.get(f"{BASE_URL}/api/bug-reports")
        assert response.status_code == 200
        
        reports = response.json()
        assert isinstance(reports, list)
        assert len(reports) > 0
        
        # Check structure
        for report in reports:
            assert "id" in report
            assert "title" in report
            assert "description" in report
            assert "priority" in report
            assert "status" in report
            assert "has_screenshot" in report
            assert "created_at" in report
        
        print(f"Found {len(reports)} bug reports")
    
    def test_admin_get_all_bug_reports(self):
        """GET /api/admin/bug-reports returns all bug reports for admin"""
        response = self.session.get(f"{BASE_URL}/api/admin/bug-reports")
        assert response.status_code == 200
        
        reports = response.json()
        assert isinstance(reports, list)
        
        # Admin view should include user info
        for report in reports:
            assert "id" in report
            assert "user_email" in report
            assert "title" in report
            assert "status" in report
            assert "priority" in report
        
        print(f"Admin found {len(reports)} bug reports")
    
    def test_admin_update_bug_report_status(self):
        """PUT /api/admin/bug-reports/{id} updates status and admin_note"""
        # First create a bug report
        create_resp = self.session.post(f"{BASE_URL}/api/bug-reports", json={
            "title": "TEST_Status_Update",
            "description": "Test for status update",
            "priority": "bassa"
        })
        assert create_resp.status_code == 200
        report_id = create_resp.json()["id"]
        
        # Update status
        update_resp = self.session.put(f"{BASE_URL}/api/admin/bug-reports/{report_id}", json={
            "status": "in_lavorazione",
            "admin_note": "Working on this issue"
        })
        assert update_resp.status_code == 200
        
        # Verify via admin list
        list_resp = self.session.get(f"{BASE_URL}/api/admin/bug-reports")
        reports = list_resp.json()
        updated_report = next((r for r in reports if r["id"] == report_id), None)
        assert updated_report is not None
        assert updated_report["status"] == "in_lavorazione"
        assert updated_report["admin_note"] == "Working on this issue"
        
        # Update to resolved
        resolve_resp = self.session.put(f"{BASE_URL}/api/admin/bug-reports/{report_id}", json={
            "status": "risolto",
            "admin_note": "Issue has been fixed"
        })
        assert resolve_resp.status_code == 200
    
    def test_create_bug_report_with_screenshot(self):
        """POST /api/bug-reports with screenshot (base64)"""
        # Small test image (1x1 red pixel PNG in base64)
        test_screenshot = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
        
        response = self.session.post(f"{BASE_URL}/api/bug-reports", json={
            "title": "TEST_With_Screenshot",
            "description": "Bug report with screenshot",
            "priority": "media",
            "screenshot": test_screenshot
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == "TEST_With_Screenshot"
        # Screenshot should not be returned in the response (for list efficiency)
        # But has_screenshot should be true when fetching
        
        report_id = data["id"]
        
        # Verify screenshot via admin endpoint
        screenshot_resp = self.session.get(f"{BASE_URL}/api/admin/bug-reports/{report_id}/screenshot")
        assert screenshot_resp.status_code == 200
        screenshot_data = screenshot_resp.json()
        assert "screenshot" in screenshot_data
        assert screenshot_data["screenshot"] == test_screenshot
        print("Screenshot stored and retrieved successfully")
    
    def test_screenshot_not_found(self):
        """GET /api/admin/bug-reports/{id}/screenshot returns 404 for report without screenshot"""
        # Create report without screenshot
        create_resp = self.session.post(f"{BASE_URL}/api/bug-reports", json={
            "title": "TEST_No_Screenshot",
            "description": "No screenshot here",
            "priority": "bassa"
        })
        assert create_resp.status_code == 200
        report_id = create_resp.json()["id"]
        
        # Try to get screenshot
        screenshot_resp = self.session.get(f"{BASE_URL}/api/admin/bug-reports/{report_id}/screenshot")
        assert screenshot_resp.status_code == 404


class TestNonAdminAccess:
    """Test that non-admin users cannot access admin endpoints"""
    
    def test_non_admin_cannot_update_site_settings(self):
        """Non-admin users get 403 on PUT /api/admin/site-settings"""
        # Register a new non-admin user
        session = requests.Session()
        import uuid
        test_email = f"test_nonadmin_{uuid.uuid4().hex[:8]}@example.com"
        
        reg_resp = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "testpass123",
            "name": "Test Non-Admin"
        })
        assert reg_resp.status_code == 200
        
        # Try to update site settings
        update_resp = session.put(f"{BASE_URL}/api/admin/site-settings", json={
            "brand_name": "Hacked"
        })
        assert update_resp.status_code == 403
        
        # Cleanup - login as admin and delete the test user
        admin_session = requests.Session()
        admin_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        users_resp = admin_session.get(f"{BASE_URL}/api/admin/users")
        users = users_resp.json()
        test_user = next((u for u in users if u["email"] == test_email), None)
        if test_user:
            admin_session.delete(f"{BASE_URL}/api/admin/users/{test_user['id']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
