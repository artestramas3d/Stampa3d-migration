"""
Test suite for Hours/Minutes feature in 3D Printing Cost Calculator
Tests the new separate hours and minutes inputs for Print Time, Labor, and Design
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHoursMinutesFeature:
    """Tests for hours/minutes time input feature"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "testuser@example.com",
            "password": "password123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        # Get filament and printer IDs
        filaments = self.session.get(f"{BASE_URL}/api/filaments").json()
        printers = self.session.get(f"{BASE_URL}/api/printers").json()
        
        assert len(filaments) > 0, "No filaments found"
        assert len(printers) > 0, "No printers found"
        
        self.filament_id = filaments[0]["id"]
        self.printer_id = printers[0]["id"]
        
        yield
        
        # Cleanup - delete test sales
        sales = self.session.get(f"{BASE_URL}/api/sales").json()
        for sale in sales:
            if sale.get("product_name", "").startswith("TEST_"):
                self.session.delete(f"{BASE_URL}/api/sales/{sale['id']}")
    
    def test_calculate_with_decimal_hours_1h30m(self):
        """Test calculation with 1.5 hours (1h 30m)"""
        response = self.session.post(f"{BASE_URL}/api/calculate", json={
            "filaments": [{"filament_id": self.filament_id, "grams_used": 50}],
            "printer_id": self.printer_id,
            "print_time_hours": 1.5,  # 1h 30m
            "labor_hours": 0,
            "design_hours": 0,
            "margin_percent": 30,
            "quantity": 1
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify calculation uses correct time
        assert "electricity_cost" in data
        assert "depreciation_cost" in data
        assert data["total_cost"] > 0
        
    def test_calculate_with_decimal_hours_2h45m(self):
        """Test calculation with 2.75 hours (2h 45m)"""
        response = self.session.post(f"{BASE_URL}/api/calculate", json={
            "filaments": [{"filament_id": self.filament_id, "grams_used": 50}],
            "printer_id": self.printer_id,
            "print_time_hours": 2.75,  # 2h 45m
            "labor_hours": 0.5,  # 30m
            "design_hours": 0.25,  # 15m
            "margin_percent": 30,
            "quantity": 1
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify labor and design costs are calculated
        assert data["labor_cost"] == 7.5  # 0.5h * 15€/h
        assert data["design_cost"] == 5.0  # 0.25h * 20€/h
        
    def test_create_sale_with_decimal_hours(self):
        """Test creating a sale with decimal hours (2h 30m = 2.5h)"""
        response = self.session.post(f"{BASE_URL}/api/sales", json={
            "date": "2026-01-15",
            "product_name": "TEST_HM_Sale",
            "filaments": [{"filament_id": self.filament_id, "grams_used": 30}],
            "printer_id": self.printer_id,
            "print_time_hours": 2.5,  # 2h 30m
            "labor_hours": 0.75,  # 45m
            "design_hours": 0.5,  # 30m
            "sale_price": 25.00,
            "quantity": 1
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify print_time_hours is stored correctly as decimal
        assert data["print_time_hours"] == 2.5
        assert data["labor_hours"] == 0.75
        assert data["design_hours"] == 0.5
        
        # Verify GET returns the same values
        sale_id = data["id"]
        get_response = self.session.get(f"{BASE_URL}/api/sales")
        assert get_response.status_code == 200
        
        sales = get_response.json()
        created_sale = next((s for s in sales if s["id"] == sale_id), None)
        assert created_sale is not None
        assert created_sale["print_time_hours"] == 2.5
        
    def test_recent_sales_returns_decimal_hours(self):
        """Test that recent sales endpoint returns decimal hours for copy feature"""
        # First create a sale
        self.session.post(f"{BASE_URL}/api/sales", json={
            "date": "2026-01-15",
            "product_name": "TEST_Recent_Sale",
            "filaments": [{"filament_id": self.filament_id, "grams_used": 40}],
            "printer_id": self.printer_id,
            "print_time_hours": 3.25,  # 3h 15m
            "labor_hours": 1.5,  # 1h 30m
            "design_hours": 0.75,  # 45m
            "sale_price": 30.00,
            "quantity": 1
        })
        
        # Get recent sales
        response = self.session.get(f"{BASE_URL}/api/sales/recent?limit=5")
        assert response.status_code == 200
        
        sales = response.json()
        test_sale = next((s for s in sales if s["product_name"] == "TEST_Recent_Sale"), None)
        
        assert test_sale is not None
        assert test_sale["print_time_hours"] == 3.25
        assert test_sale["labor_hours"] == 1.5
        assert test_sale["design_hours"] == 0.75


class TestPaidUnpaidToggle:
    """Tests for paid/unpaid checkbox toggle on Sales page"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "testuser@example.com",
            "password": "password123"
        })
        assert response.status_code == 200
        
        # Get filament and printer IDs
        filaments = self.session.get(f"{BASE_URL}/api/filaments").json()
        printers = self.session.get(f"{BASE_URL}/api/printers").json()
        
        self.filament_id = filaments[0]["id"]
        self.printer_id = printers[0]["id"]
        
        yield
        
        # Cleanup
        sales = self.session.get(f"{BASE_URL}/api/sales").json()
        for sale in sales:
            if sale.get("product_name", "").startswith("TEST_"):
                self.session.delete(f"{BASE_URL}/api/sales/{sale['id']}")
    
    def test_toggle_paid_status_to_true(self):
        """Test toggling a sale from unpaid to paid"""
        # Create a sale (defaults to unpaid)
        create_response = self.session.post(f"{BASE_URL}/api/sales", json={
            "date": "2026-01-15",
            "product_name": "TEST_Paid_Toggle",
            "filaments": [{"filament_id": self.filament_id, "grams_used": 20}],
            "printer_id": self.printer_id,
            "print_time_hours": 1.0,
            "sale_price": 15.00,
            "quantity": 1
        })
        assert create_response.status_code == 200
        sale_id = create_response.json()["id"]
        
        # Toggle to paid
        toggle_response = self.session.patch(
            f"{BASE_URL}/api/sales/{sale_id}/paid",
            json={"paid": True}
        )
        assert toggle_response.status_code == 200
        assert toggle_response.json()["paid"] == True
        
        # Verify persistence
        sales = self.session.get(f"{BASE_URL}/api/sales").json()
        sale = next((s for s in sales if s["id"] == sale_id), None)
        assert sale is not None
        assert sale["paid"] == True
        
    def test_toggle_paid_status_to_false(self):
        """Test toggling a sale from paid to unpaid"""
        # Create a sale
        create_response = self.session.post(f"{BASE_URL}/api/sales", json={
            "date": "2026-01-15",
            "product_name": "TEST_Unpaid_Toggle",
            "filaments": [{"filament_id": self.filament_id, "grams_used": 20}],
            "printer_id": self.printer_id,
            "print_time_hours": 1.0,
            "sale_price": 15.00,
            "quantity": 1
        })
        sale_id = create_response.json()["id"]
        
        # First set to paid
        self.session.patch(f"{BASE_URL}/api/sales/{sale_id}/paid", json={"paid": True})
        
        # Then toggle back to unpaid
        toggle_response = self.session.patch(
            f"{BASE_URL}/api/sales/{sale_id}/paid",
            json={"paid": False}
        )
        assert toggle_response.status_code == 200
        assert toggle_response.json()["paid"] == False
        
        # Verify persistence
        sales = self.session.get(f"{BASE_URL}/api/sales").json()
        sale = next((s for s in sales if s["id"] == sale_id), None)
        assert sale["paid"] == False
        
    def test_toggle_nonexistent_sale_returns_404(self):
        """Test toggling paid status on non-existent sale returns 404"""
        response = self.session.patch(
            f"{BASE_URL}/api/sales/000000000000000000000000/paid",
            json={"paid": True}
        )
        assert response.status_code == 404


class TestCalculatorEndpoint:
    """Additional tests for calculator endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "testuser@example.com",
            "password": "password123"
        })
        assert response.status_code == 200
        
        filaments = self.session.get(f"{BASE_URL}/api/filaments").json()
        printers = self.session.get(f"{BASE_URL}/api/printers").json()
        
        self.filament_id = filaments[0]["id"]
        self.printer_id = printers[0]["id"]
    
    def test_calculate_with_zero_minutes(self):
        """Test calculation with whole hours (0 minutes)"""
        response = self.session.post(f"{BASE_URL}/api/calculate", json={
            "filaments": [{"filament_id": self.filament_id, "grams_used": 50}],
            "printer_id": self.printer_id,
            "print_time_hours": 3.0,  # 3h 0m
            "labor_hours": 0,
            "design_hours": 0,
            "margin_percent": 30,
            "quantity": 1
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_cost"] > 0
        
    def test_calculate_with_only_minutes(self):
        """Test calculation with only minutes (0 hours)"""
        response = self.session.post(f"{BASE_URL}/api/calculate", json={
            "filaments": [{"filament_id": self.filament_id, "grams_used": 50}],
            "printer_id": self.printer_id,
            "print_time_hours": 0.5,  # 0h 30m
            "labor_hours": 0,
            "design_hours": 0,
            "margin_percent": 30,
            "quantity": 1
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_cost"] > 0
