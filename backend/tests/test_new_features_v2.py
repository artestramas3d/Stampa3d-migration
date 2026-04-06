"""
Test suite for new features:
1. Products CRUD (Catalog)
2. Public Listino page (no auth)
3. Public Landing page (no auth)
4. Contact form (no auth)
5. Admin Landing Settings
6. Admin Contact Requests
7. 3MF Import
"""
import pytest
import requests
import os
import zipfile
import json
import io
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "testuser@example.com"
ADMIN_PASSWORD = "password123"


@pytest.fixture(scope="module")
def session():
    """Create a requests session"""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth_session(session):
    """Login and return authenticated session"""
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    return session


@pytest.fixture(scope="module")
def test_product_id(auth_session):
    """Create a test product and return its ID"""
    response = auth_session.post(f"{BASE_URL}/api/products", json={
        "name": "TEST_Product_Pytest",
        "description": "Test product for pytest",
        "price": 25.99,
        "category": "Test Category",
        "materials": "PLA, PETG",
        "is_public": True
    })
    assert response.status_code == 200, f"Create product failed: {response.text}"
    data = response.json()
    yield data["id"]
    # Cleanup
    auth_session.delete(f"{BASE_URL}/api/products/{data['id']}")


# ========== PRODUCTS CRUD TESTS ==========

class TestProductsCRUD:
    """Test Products CRUD operations"""
    
    def test_get_products_requires_auth(self, session):
        """GET /api/products requires authentication"""
        # Create a new session without auth
        new_session = requests.Session()
        response = new_session.get(f"{BASE_URL}/api/products")
        assert response.status_code == 401
    
    def test_get_products_returns_list(self, auth_session):
        """GET /api/products returns user's products"""
        response = auth_session.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_product(self, auth_session):
        """POST /api/products creates a product"""
        response = auth_session.post(f"{BASE_URL}/api/products", json={
            "name": "TEST_New_Product",
            "description": "A test product",
            "price": 15.50,
            "category": "Decorazioni",
            "materials": "PLA",
            "is_public": True
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST_New_Product"
        assert data["price"] == 15.50
        assert data["category"] == "Decorazioni"
        assert data["is_public"] == True
        assert "id" in data
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/products/{data['id']}")
    
    def test_create_product_with_photo(self, auth_session):
        """POST /api/products with base64 photo"""
        # Create a small test image (1x1 red pixel PNG)
        test_photo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
        
        response = auth_session.post(f"{BASE_URL}/api/products", json={
            "name": "TEST_Product_With_Photo",
            "price": 20.00,
            "photo": test_photo,
            "is_public": False
        })
        assert response.status_code == 200
        data = response.json()
        assert data["photo"] == test_photo
        assert data["is_public"] == False
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/products/{data['id']}")
    
    def test_update_product(self, auth_session, test_product_id):
        """PUT /api/products/{id} updates a product"""
        response = auth_session.put(f"{BASE_URL}/api/products/{test_product_id}", json={
            "name": "TEST_Updated_Product",
            "price": 30.00
        })
        assert response.status_code == 200
        
        # Verify update
        get_response = auth_session.get(f"{BASE_URL}/api/products")
        assert get_response.status_code == 200
        products = get_response.json()
        updated = next((p for p in products if p["id"] == test_product_id), None)
        assert updated is not None
        assert updated["name"] == "TEST_Updated_Product"
        assert updated["price"] == 30.00
    
    def test_delete_product(self, auth_session):
        """DELETE /api/products/{id} deletes a product"""
        # Create a product to delete
        create_response = auth_session.post(f"{BASE_URL}/api/products", json={
            "name": "TEST_To_Delete",
            "price": 10.00
        })
        product_id = create_response.json()["id"]
        
        # Delete it
        delete_response = auth_session.delete(f"{BASE_URL}/api/products/{product_id}")
        assert delete_response.status_code == 200
        
        # Verify deletion
        get_response = auth_session.get(f"{BASE_URL}/api/products")
        products = get_response.json()
        assert not any(p["id"] == product_id for p in products)


# ========== PUBLIC ENDPOINTS TESTS (NO AUTH) ==========

class TestPublicEndpoints:
    """Test public endpoints that don't require authentication"""
    
    def test_public_listino_no_auth(self):
        """GET /api/public/listino works without authentication"""
        response = requests.get(f"{BASE_URL}/api/public/listino")
        assert response.status_code == 200
        data = response.json()
        assert "brand_name" in data
        assert "primary_color" in data
        assert "products" in data
        assert isinstance(data["products"], list)
    
    def test_public_listino_returns_only_public_products(self, auth_session):
        """Public listino only shows products with is_public=True"""
        # Create a private product
        private_response = auth_session.post(f"{BASE_URL}/api/products", json={
            "name": "TEST_Private_Product",
            "price": 50.00,
            "is_public": False
        })
        private_id = private_response.json()["id"]
        
        # Create a public product
        public_response = auth_session.post(f"{BASE_URL}/api/products", json={
            "name": "TEST_Public_Product",
            "price": 25.00,
            "is_public": True
        })
        public_id = public_response.json()["id"]
        
        # Check public listino
        listino_response = requests.get(f"{BASE_URL}/api/public/listino")
        assert listino_response.status_code == 200
        products = listino_response.json()["products"]
        
        # Public product should be visible
        public_names = [p["name"] for p in products]
        assert "TEST_Public_Product" in public_names
        # Private product should NOT be visible
        assert "TEST_Private_Product" not in public_names
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/products/{private_id}")
        auth_session.delete(f"{BASE_URL}/api/products/{public_id}")
    
    def test_public_landing_no_auth(self):
        """GET /api/public/landing works without authentication"""
        response = requests.get(f"{BASE_URL}/api/public/landing")
        assert response.status_code == 200
        data = response.json()
        assert "brand_name" in data
        assert "primary_color" in data
        assert "hero_title" in data
        assert "hero_subtitle" in data
        assert "about_text" in data
        assert "services" in data
        assert "contact_email" in data
        assert "contact_phone" in data
        assert "social_instagram" in data
        assert "social_facebook" in data
        assert "portfolio" in data
        assert isinstance(data["portfolio"], list)
    
    def test_public_contact_form_no_auth(self):
        """POST /api/public/contact works without authentication"""
        response = requests.post(f"{BASE_URL}/api/public/contact", json={
            "name": "TEST_Contact_User",
            "email": "test@example.com",
            "phone": "+39 123 456 7890",
            "message": "This is a test contact request from pytest"
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
    
    def test_public_contact_form_validation(self):
        """POST /api/public/contact validates required fields"""
        # Missing name
        response = requests.post(f"{BASE_URL}/api/public/contact", json={
            "email": "test@example.com",
            "message": "Test"
        })
        assert response.status_code == 422  # Validation error


# ========== ADMIN LANDING SETTINGS TESTS ==========

class TestAdminLandingSettings:
    """Test admin landing settings endpoints"""
    
    def test_get_landing_settings_requires_admin(self, session):
        """GET /api/admin/landing-settings requires admin"""
        new_session = requests.Session()
        response = new_session.get(f"{BASE_URL}/api/admin/landing-settings")
        assert response.status_code == 401
    
    def test_get_landing_settings(self, auth_session):
        """GET /api/admin/landing-settings returns settings"""
        response = auth_session.get(f"{BASE_URL}/api/admin/landing-settings")
        assert response.status_code == 200
        data = response.json()
        assert "hero_title" in data
        assert "hero_subtitle" in data
        assert "about_text" in data
        assert "services" in data
        assert "contact_email" in data
        assert "contact_phone" in data
        assert "social_instagram" in data
        assert "social_facebook" in data
    
    def test_update_landing_settings(self, auth_session):
        """PUT /api/admin/landing-settings updates settings"""
        response = auth_session.put(f"{BASE_URL}/api/admin/landing-settings", json={
            "hero_title": "TEST_Hero_Title",
            "hero_subtitle": "TEST_Hero_Subtitle",
            "about_text": "TEST_About_Text",
            "services": ["Service 1", "Service 2"],
            "contact_email": "test@example.com",
            "contact_phone": "+39 123 456",
            "social_instagram": "https://instagram.com/test",
            "social_facebook": "https://facebook.com/test"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["hero_title"] == "TEST_Hero_Title"
        assert data["hero_subtitle"] == "TEST_Hero_Subtitle"
        assert data["about_text"] == "TEST_About_Text"
        assert data["services"] == ["Service 1", "Service 2"]
        assert data["contact_email"] == "test@example.com"
        
        # Verify in public landing
        public_response = requests.get(f"{BASE_URL}/api/public/landing")
        public_data = public_response.json()
        assert public_data["hero_title"] == "TEST_Hero_Title"


# ========== ADMIN CONTACT REQUESTS TESTS ==========

class TestAdminContactRequests:
    """Test admin contact requests endpoint"""
    
    def test_get_contact_requests_requires_admin(self):
        """GET /api/admin/contact-requests requires admin"""
        new_session = requests.Session()
        response = new_session.get(f"{BASE_URL}/api/admin/contact-requests")
        assert response.status_code == 401
    
    def test_get_contact_requests(self, auth_session):
        """GET /api/admin/contact-requests returns list"""
        response = auth_session.get(f"{BASE_URL}/api/admin/contact-requests")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should contain our test contact from earlier
        if len(data) > 0:
            assert "name" in data[0]
            assert "email" in data[0]
            assert "message" in data[0]


# ========== 3MF IMPORT TESTS ==========

class Test3MFImport:
    """Test 3MF file import functionality"""
    
    def test_3mf_import_requires_auth(self):
        """POST /api/import/3mf requires authentication"""
        new_session = requests.Session()
        response = new_session.post(f"{BASE_URL}/api/import/3mf")
        assert response.status_code == 401
    
    def test_3mf_import_rejects_non_3mf(self, auth_session):
        """POST /api/import/3mf rejects non-.3mf files"""
        # Need to use a fresh session for file upload (no Content-Type header)
        cookies = auth_session.cookies.get_dict()
        files = {'file': ('test.txt', b'not a 3mf file', 'text/plain')}
        response = requests.post(
            f"{BASE_URL}/api/import/3mf",
            files=files,
            cookies=cookies
        )
        assert response.status_code == 400
        assert "3mf" in response.json().get("detail", "").lower()
    
    def test_3mf_import_with_valid_file(self, auth_session):
        """POST /api/import/3mf parses valid .3mf file"""
        # Create a minimal valid .3mf file (ZIP with plate JSON)
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            # Create Metadata/plate_1.json with print data
            plate_data = {
                "prediction": 3600,  # 1 hour in seconds
                "filament": [
                    {"used_g": 50.5}
                ]
            }
            zf.writestr("Metadata/plate_1.json", json.dumps(plate_data))
        
        zip_buffer.seek(0)
        cookies = auth_session.cookies.get_dict()
        files = {'file': ('test.3mf', zip_buffer.getvalue(), 'application/octet-stream')}
        
        response = requests.post(
            f"{BASE_URL}/api/import/3mf",
            files=files,
            cookies=cookies
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_time_seconds" in data
        assert "total_time_hours" in data
        assert "total_filament_grams" in data
        assert data["total_time_seconds"] == 3600
        assert data["total_filament_grams"] == 50.5
    
    def test_3mf_import_with_multiple_plates(self, auth_session):
        """POST /api/import/3mf handles multiple plates"""
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            # Plate 1
            plate1_data = {
                "prediction": 1800,  # 30 min
                "filament": [{"used_g": 25.0}]
            }
            zf.writestr("Metadata/plate_1.json", json.dumps(plate1_data))
            
            # Plate 2
            plate2_data = {
                "prediction": 2400,  # 40 min
                "filament": [{"used_g": 35.0}]
            }
            zf.writestr("Metadata/plate_2.json", json.dumps(plate2_data))
        
        zip_buffer.seek(0)
        cookies = auth_session.cookies.get_dict()
        files = {'file': ('multi_plate.3mf', zip_buffer.getvalue(), 'application/octet-stream')}
        
        response = requests.post(
            f"{BASE_URL}/api/import/3mf",
            files=files,
            cookies=cookies
        )
        assert response.status_code == 200
        data = response.json()
        # Should sum both plates
        assert data["total_time_seconds"] == 4200  # 1800 + 2400
        assert data["total_filament_grams"] == 60.0  # 25 + 35


# ========== CLEANUP ==========

@pytest.fixture(scope="module", autouse=True)
def cleanup_test_data(auth_session):
    """Cleanup test data after all tests"""
    yield
    # Delete test products
    response = auth_session.get(f"{BASE_URL}/api/products")
    if response.status_code == 200:
        for product in response.json():
            if product["name"].startswith("TEST_"):
                auth_session.delete(f"{BASE_URL}/api/products/{product['id']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
