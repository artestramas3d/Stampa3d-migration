#!/usr/bin/env python3
"""
Backend API Testing for 3D Printing Cost Calculator
Tests all endpoints with Italian interface
"""

import requests
import sys
import json
from datetime import datetime

class FilamentProfitAPITester:
    def __init__(self, base_url="https://filament-profit.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def test_endpoint(self, method, endpoint, expected_status, data=None, description=""):
        """Test a single endpoint"""
        url = f"{self.base_url}/api/{endpoint}"
        
        try:
            if method == 'GET':
                response = self.session.get(url)
            elif method == 'POST':
                response = self.session.post(url, json=data)
            elif method == 'PUT':
                response = self.session.put(url, json=data)
            elif method == 'DELETE':
                response = self.session.delete(url)
            
            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                try:
                    error_data = response.json()
                    details += f", Response: {error_data}"
                except:
                    details += f", Text: {response.text[:100]}"
            
            self.log_test(description or f"{method} {endpoint}", success, details)
            
            return success, response.json() if success and response.content else {}
            
        except Exception as e:
            self.log_test(description or f"{method} {endpoint}", False, f"Exception: {str(e)}")
            return False, {}

    def test_auth_flow(self):
        """Test complete authentication flow"""
        print("\n🔐 Testing Authentication Flow...")
        
        # Test user registration
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@example.com"
        register_data = {
            "email": test_email,
            "password": "test123456",
            "name": "Test User"
        }
        
        success, response = self.test_endpoint(
            'POST', 'auth/register', 200, register_data,
            "User Registration"
        )
        
        if success:
            self.user_id = response.get('id')
            
            # Test login with same credentials
            login_data = {
                "email": test_email,
                "password": "test123456"
            }
            
            success, response = self.test_endpoint(
                'POST', 'auth/login', 200, login_data,
                "User Login"
            )
            
            if success:
                # Test get current user
                self.test_endpoint('GET', 'auth/me', 200, description="Get Current User")
                
                # Test logout
                self.test_endpoint('POST', 'auth/logout', 200, description="User Logout")
                
                # Login again for subsequent tests
                self.test_endpoint('POST', 'auth/login', 200, login_data, "Re-login for tests")
        
        return success

    def test_filaments_crud(self):
        """Test filaments CRUD operations"""
        print("\n🧵 Testing Filaments CRUD...")
        
        # Test get empty filaments
        self.test_endpoint('GET', 'filaments', 200, description="Get Filaments (empty)")
        
        # Test create filament
        filament_data = {
            "material_type": "PLA",
            "color": "Nero",
            "brand": "Sunlu",
            "spool_weight_g": 1000,
            "spool_price": 25.99,
            "color_hex": "#000000",
            "notes": "Test filament"
        }
        
        success, response = self.test_endpoint(
            'POST', 'filaments', 200, filament_data,
            "Create Filament"
        )
        
        filament_id = None
        if success:
            filament_id = response.get('id')
            
            # Test get filaments with data
            self.test_endpoint('GET', 'filaments', 200, description="Get Filaments (with data)")
            
            # Test update filament
            update_data = {
                "color": "Bianco",
                "color_hex": "#FFFFFF"
            }
            self.test_endpoint(
                'PUT', f'filaments/{filament_id}', 200, update_data,
                "Update Filament"
            )
            
            # Test delete filament
            self.test_endpoint(
                'DELETE', f'filaments/{filament_id}', 200,
                description="Delete Filament"
            )
        
        return filament_id is not None

    def test_printers_crud(self):
        """Test printers CRUD operations"""
        print("\n🖨️ Testing Printers CRUD...")
        
        # Test get empty printers
        self.test_endpoint('GET', 'printers', 200, description="Get Printers (empty)")
        
        # Test create printer
        printer_data = {
            "printer_name": "Bambu Lab X1C",
            "printer_cost": 1200.00,
            "estimated_life_hours": 5000,
            "electricity_cost_kwh": 0.25,
            "average_power_watts": 200
        }
        
        success, response = self.test_endpoint(
            'POST', 'printers', 200, printer_data,
            "Create Printer"
        )
        
        printer_id = None
        if success:
            printer_id = response.get('id')
            
            # Test get printers with data
            self.test_endpoint('GET', 'printers', 200, description="Get Printers (with data)")
            
            # Test update printer
            update_data = {
                "printer_name": "Bambu Lab X1C Updated",
                "average_power_watts": 220
            }
            self.test_endpoint(
                'PUT', f'printers/{printer_id}', 200, update_data,
                "Update Printer"
            )
            
            # Test delete printer
            self.test_endpoint(
                'DELETE', f'printers/{printer_id}', 200,
                description="Delete Printer"
            )
        
        return printer_id is not None

    def test_calculator_and_sales(self):
        """Test calculator and sales functionality"""
        print("\n🧮 Testing Calculator & Sales...")
        
        # First create test filament and printer
        filament_data = {
            "material_type": "PLA",
            "color": "Rosso",
            "brand": "eSUN",
            "spool_weight_g": 1000,
            "spool_price": 22.50,
            "color_hex": "#FF0000"
        }
        
        success, filament_response = self.test_endpoint(
            'POST', 'filaments', 200, filament_data,
            "Create Test Filament for Calculator"
        )
        
        if not success:
            return False
        
        printer_data = {
            "printer_name": "Prusa i3 MK3S+",
            "printer_cost": 800.00,
            "estimated_life_hours": 4000,
            "electricity_cost_kwh": 0.22,
            "average_power_watts": 180
        }
        
        success, printer_response = self.test_endpoint(
            'POST', 'printers', 200, printer_data,
            "Create Test Printer for Calculator"
        )
        
        if not success:
            return False
        
        filament_id = filament_response.get('id')
        printer_id = printer_response.get('id')
        
        # Test print calculation
        calc_data = {
            "filament_id": filament_id,
            "printer_id": printer_id,
            "grams_used": 75,
            "print_time_hours": 3.5,
            "labor_hours": 1,
            "design_hours": 0.5,
            "margin_percent": 35,
            "product_name": "Vaso Decorativo"
        }
        
        success, calc_response = self.test_endpoint(
            'POST', 'calculate', 200, calc_data,
            "Calculate Print Cost"
        )
        
        if success:
            # Test create sale
            sale_data = {
                "date": "2024-01-15",
                "product_name": "Vaso Decorativo",
                "filament_id": filament_id,
                "printer_id": printer_id,
                "grams_used": 75,
                "print_time_hours": 3.5,
                "labor_hours": 1,
                "design_hours": 0.5,
                "sale_price": calc_response.get('sale_price', 50)
            }
            
            success, sale_response = self.test_endpoint(
                'POST', 'sales', 200, sale_data,
                "Create Sale"
            )
            
            if success:
                sale_id = sale_response.get('id')
                
                # Test get sales
                self.test_endpoint('GET', 'sales', 200, description="Get Sales")
                
                # Test delete sale
                self.test_endpoint(
                    'DELETE', f'sales/{sale_id}', 200,
                    description="Delete Sale"
                )
        
        return success

    def test_purchases(self):
        """Test purchases functionality"""
        print("\n🛒 Testing Purchases...")
        
        # Test get empty purchases
        self.test_endpoint('GET', 'purchases', 200, description="Get Purchases (empty)")
        
        # Test create purchase
        purchase_data = {
            "date": "2024-01-10",
            "material_type": "PETG",
            "brand": "Prusament",
            "color": "Galaxy Black",
            "quantity_spools": 2,
            "price_total": 55.80,
            "grams_total": 2000,
            "notes": "Bulk purchase"
        }
        
        success, response = self.test_endpoint(
            'POST', 'purchases', 200, purchase_data,
            "Create Purchase"
        )
        
        if success:
            purchase_id = response.get('id')
            
            # Test get purchases with data
            self.test_endpoint('GET', 'purchases', 200, description="Get Purchases (with data)")
            
            # Test delete purchase
            self.test_endpoint(
                'DELETE', f'purchases/{purchase_id}', 200,
                description="Delete Purchase"
            )
        
        return success

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        print("\n📊 Testing Dashboard Stats...")
        
        success, response = self.test_endpoint(
            'GET', 'dashboard/stats', 200,
            description="Get Dashboard Stats"
        )
        
        if success:
            # Verify expected fields in response
            expected_fields = [
                'total_sales', 'total_profit', 'total_grams', 
                'total_hours', 'total_purchases', 'avg_margin',
                'most_profitable', 'sales_count', 'chart_data', 'top_products'
            ]
            
            missing_fields = [field for field in expected_fields if field not in response]
            if missing_fields:
                self.log_test("Dashboard Stats Fields", False, f"Missing: {missing_fields}")
            else:
                self.log_test("Dashboard Stats Fields", True, "All fields present")
        
        return success

    def test_export_functionality(self):
        """Test CSV export functionality"""
        print("\n📄 Testing Export Functionality...")
        
        # Test sales export
        try:
            url = f"{self.base_url}/api/export/sales"
            response = self.session.get(url)
            success = response.status_code == 200 and 'text/csv' in response.headers.get('content-type', '')
            self.log_test("Export Sales CSV", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Export Sales CSV", False, f"Exception: {str(e)}")
        
        # Test purchases export
        try:
            url = f"{self.base_url}/api/export/purchases"
            response = self.session.get(url)
            success = response.status_code == 200 and 'text/csv' in response.headers.get('content-type', '')
            self.log_test("Export Purchases CSV", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Export Purchases CSV", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting FilamentProfit API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Test authentication first
        if not self.test_auth_flow():
            print("❌ Authentication failed - stopping tests")
            return False
        
        # Test all CRUD operations
        self.test_filaments_crud()
        self.test_printers_crud()
        self.test_calculator_and_sales()
        self.test_purchases()
        self.test_dashboard_stats()
        self.test_export_functionality()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = FilamentProfitAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())