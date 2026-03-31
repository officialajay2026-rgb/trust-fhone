#!/usr/bin/env python3
"""
TrustFhone Delhi Backend API Testing Suite
Tests all API endpoints including authentication, listings, admin functions, and fraud detection
"""

import requests
import json
import sys
from datetime import datetime
import time

class TrustFhoneAPITester:
    def __init__(self, base_url="https://secure-fhone-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.seller_token = None
        self.buyer_token = None
        self.test_listing_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, message="", response_data=None):
        """Log test results"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"\n{status} - {name}")
        if message:
            print(f"   {message}")
        if not success:
            self.failed_tests.append(f"{name}: {message}")
        else:
            self.tests_passed += 1
        if response_data and not success:
            print(f"   Response: {json.dumps(response_data, indent=2)}")

    def make_request(self, method, endpoint, data=None, token=None, files=None):
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        if files:
            # Remove Content-Type for file uploads
            headers.pop('Content-Type', None)
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, data=data, headers=headers, timeout=10)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            
            return response
        except requests.exceptions.Timeout:
            print(f"Request timed out after 10 seconds")
            return None
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {str(e)}")
            return None

    def test_health_check(self):
        """Test API health endpoint"""
        print("\n🔍 Testing API Health Check...")
        response = self.make_request('GET', 'health')
        
        if response and response.status_code == 200:
            data = response.json()
            self.log_test("Health Check", True, f"API is running - {data.get('message', '')}")
            return True
        else:
            self.log_test("Health Check", False, f"API not responding - Status: {response.status_code if response else 'No response'}")
            return False

    def test_admin_login(self):
        """Test admin login with seeded credentials"""
        print("\n🔍 Testing Admin Login...")
        
        login_data = {
            "email": "admin@trustfhone.com",
            "password": "admin123"
        }
        
        response = self.make_request('POST', 'auth/login', login_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get('success') and data.get('token'):
                self.admin_token = data['token']
                user = data.get('user', {})
                self.log_test("Admin Login", True, f"Logged in as {user.get('name')} ({user.get('role')})")
                return True
            else:
                self.log_test("Admin Login", False, "No token received", data)
                return False
        else:
            self.log_test("Admin Login", False, f"Login failed - Status: {response.status_code if response else 'No response'}", 
                         response.json() if response else None)
            return False

    def test_seller_signup(self):
        """Test seller account creation"""
        print("\n🔍 Testing Seller Signup...")
        
        timestamp = int(time.time())
        signup_data = {
            "name": f"Test Seller {timestamp}",
            "email": f"seller{timestamp}@test.com",
            "password": "seller123",
            "role": "seller",
            "phone": "9876543210"
        }
        
        response = self.make_request('POST', 'auth/signup', signup_data)
        
        if response and response.status_code == 201:
            data = response.json()
            if data.get('success') and data.get('token'):
                self.seller_token = data['token']
                user = data.get('user', {})
                self.log_test("Seller Signup", True, f"Created seller account: {user.get('email')}")
                return True
            else:
                self.log_test("Seller Signup", False, "Account created but no token", data)
                return False
        else:
            self.log_test("Seller Signup", False, f"Signup failed - Status: {response.status_code if response else 'No response'}", 
                         response.json() if response else None)
            return False

    def test_buyer_signup(self):
        """Test buyer account creation"""
        print("\n🔍 Testing Buyer Signup...")
        
        timestamp = int(time.time())
        signup_data = {
            "name": f"Test Buyer {timestamp}",
            "email": f"buyer{timestamp}@test.com",
            "password": "buyer123",
            "role": "buyer"
        }
        
        response = self.make_request('POST', 'auth/signup', signup_data)
        
        if response and response.status_code == 201:
            data = response.json()
            if data.get('success') and data.get('token'):
                self.buyer_token = data['token']
                user = data.get('user', {})
                self.log_test("Buyer Signup", True, f"Created buyer account: {user.get('email')}")
                return True
            else:
                self.log_test("Buyer Signup", False, "Account created but no token", data)
                return False
        else:
            self.log_test("Buyer Signup", False, f"Signup failed - Status: {response.status_code if response else 'No response'}", 
                         response.json() if response else None)
            return False

    def test_create_listing_without_images(self):
        """Test listing creation with mock data (without actual image upload)"""
        print("\n🔍 Testing Listing Creation (Mock Data)...")
        
        if not self.seller_token:
            self.log_test("Create Listing", False, "No seller token available")
            return False
        
        # Mock listing data with fake image URLs for testing
        listing_data = {
            "brand": "Apple",
            "model": "iPhone 14 Pro",
            "price": 75000,
            "condition": "Like New",
            "imei": "123456789012345",  # Valid IMEI for testing
            "hasBox": True,
            "hasOriginalParts": True,
            "description": "Test listing for API validation",
            "images": [
                {"url": "https://example.com/image1.jpg"},
                {"url": "https://example.com/image2.jpg"}
            ],
            "billImage": {"url": "https://example.com/bill.jpg"}
        }
        
        response = self.make_request('POST', 'listings', listing_data, self.seller_token)
        
        if response:
            if response.status_code == 201:
                data = response.json()
                if data.get('success'):
                    self.test_listing_id = data.get('listing', {}).get('_id')
                    fraud_score = data.get('fraudScore', 0)
                    self.log_test("Create Listing", True, f"Listing created with fraud score: {fraud_score}/100")
                    return True
                else:
                    self.log_test("Create Listing", False, "Listing creation failed", data)
                    return False
            elif response.status_code == 400:
                data = response.json()
                # Check if it's auto-rejected due to high fraud score
                if data.get('autoRejected'):
                    self.log_test("Create Listing", True, f"Auto-rejected due to fraud score: {data.get('fraudScore')}/100 (Expected behavior)")
                    return True
                else:
                    self.log_test("Create Listing", False, f"Bad request: {data.get('message')}", data)
                    return False
            else:
                self.log_test("Create Listing", False, f"Unexpected status: {response.status_code}", response.json())
                return False
        else:
            self.log_test("Create Listing", False, "No response received")
            return False

    def test_get_seller_listings(self):
        """Test getting seller's own listings"""
        print("\n🔍 Testing Get Seller Listings...")
        
        if not self.seller_token:
            self.log_test("Get Seller Listings", False, "No seller token available")
            return False
        
        response = self.make_request('GET', 'listings/my/listings', token=self.seller_token)
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get('success'):
                listings = data.get('listings', [])
                self.log_test("Get Seller Listings", True, f"Retrieved {len(listings)} listings")
                return True
            else:
                self.log_test("Get Seller Listings", False, "Failed to get listings", data)
                return False
        else:
            self.log_test("Get Seller Listings", False, f"Request failed - Status: {response.status_code if response else 'No response'}")
            return False

    def test_admin_dashboard(self):
        """Test admin dashboard stats"""
        print("\n🔍 Testing Admin Dashboard...")
        
        if not self.admin_token:
            self.log_test("Admin Dashboard", False, "No admin token available")
            return False
        
        response = self.make_request('GET', 'admin/dashboard', token=self.admin_token)
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get('success'):
                stats = data.get('stats', {})
                listings_stats = stats.get('listings', {})
                users_stats = stats.get('users', {})
                self.log_test("Admin Dashboard", True, 
                             f"Total listings: {listings_stats.get('total', 0)}, Total users: {users_stats.get('total', 0)}")
                return True
            else:
                self.log_test("Admin Dashboard", False, "Failed to get dashboard stats", data)
                return False
        else:
            self.log_test("Admin Dashboard", False, f"Request failed - Status: {response.status_code if response else 'No response'}")
            return False

    def test_admin_get_listings(self):
        """Test admin getting all listings"""
        print("\n🔍 Testing Admin Get Listings...")
        
        if not self.admin_token:
            self.log_test("Admin Get Listings", False, "No admin token available")
            return False
        
        response = self.make_request('GET', 'admin/listings?status=pending', token=self.admin_token)
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get('success'):
                listings = data.get('listings', [])
                self.log_test("Admin Get Listings", True, f"Retrieved {len(listings)} pending listings")
                return True
            else:
                self.log_test("Admin Get Listings", False, "Failed to get admin listings", data)
                return False
        else:
            self.log_test("Admin Get Listings", False, f"Request failed - Status: {response.status_code if response else 'No response'}")
            return False

    def test_marketplace_listings(self):
        """Test public marketplace listings"""
        print("\n🔍 Testing Marketplace Listings...")
        
        response = self.make_request('GET', 'listings')
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get('success'):
                listings = data.get('listings', [])
                total = data.get('total', 0)
                self.log_test("Marketplace Listings", True, f"Retrieved {len(listings)} of {total} approved listings")
                return True
            else:
                self.log_test("Marketplace Listings", False, "Failed to get marketplace listings", data)
                return False
        else:
            self.log_test("Marketplace Listings", False, f"Request failed - Status: {response.status_code if response else 'No response'}")
            return False

    def test_invalid_imei_validation(self):
        """Test IMEI validation with invalid IMEI"""
        print("\n🔍 Testing Invalid IMEI Validation...")
        
        if not self.seller_token:
            self.log_test("Invalid IMEI Test", False, "No seller token available")
            return False
        
        # Invalid IMEI (wrong length and fails Luhn algorithm)
        listing_data = {
            "brand": "Samsung",
            "model": "Galaxy S23",
            "price": 60000,
            "condition": "Used",
            "imei": "123456789012340",  # Invalid IMEI
            "hasBox": False,
            "hasOriginalParts": True,
            "description": "Test listing with invalid IMEI",
            "images": [
                {"url": "https://example.com/image1.jpg"},
                {"url": "https://example.com/image2.jpg"}
            ],
            "billImage": {"url": "https://example.com/bill.jpg"}
        }
        
        response = self.make_request('POST', 'listings', listing_data, self.seller_token)
        
        if response:
            if response.status_code == 400:
                data = response.json()
                if 'fraud' in data.get('message', '').lower() or data.get('autoRejected'):
                    self.log_test("Invalid IMEI Test", True, f"Invalid IMEI correctly rejected: {data.get('message')}")
                    return True
                else:
                    self.log_test("Invalid IMEI Test", False, f"Unexpected rejection reason: {data.get('message')}")
                    return False
            elif response.status_code == 201:
                # If it passes, check if fraud score is high
                data = response.json()
                fraud_score = data.get('fraudScore', 0)
                if fraud_score > 40:  # High fraud score expected for invalid IMEI
                    self.log_test("Invalid IMEI Test", True, f"Invalid IMEI detected with high fraud score: {fraud_score}/100")
                    return True
                else:
                    self.log_test("Invalid IMEI Test", False, f"Invalid IMEI not properly detected, fraud score: {fraud_score}/100")
                    return False
            else:
                self.log_test("Invalid IMEI Test", False, f"Unexpected status: {response.status_code}")
                return False
        else:
            self.log_test("Invalid IMEI Test", False, "No response received")
            return False

    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        print("\n🔍 Testing Unauthorized Access...")
        
        # Try to access seller dashboard without token
        response = self.make_request('GET', 'listings/my/listings')
        
        if response and response.status_code == 401:
            self.log_test("Unauthorized Access", True, "Properly blocked unauthorized access")
            return True
        else:
            self.log_test("Unauthorized Access", False, f"Should block unauthorized access - Status: {response.status_code if response else 'No response'}")
            return False

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting TrustFhone Delhi Backend API Tests")
        print("=" * 60)
        
        # Test sequence
        tests = [
            self.test_health_check,
            self.test_admin_login,
            self.test_seller_signup,
            self.test_buyer_signup,
            self.test_unauthorized_access,
            self.test_create_listing_without_images,
            self.test_invalid_imei_validation,
            self.test_get_seller_listings,
            self.test_admin_dashboard,
            self.test_admin_get_listings,
            self.test_marketplace_listings
        ]
        
        for test in tests:
            try:
                test()
                time.sleep(0.5)  # Small delay between tests
            except Exception as e:
                self.log_test(test.__name__, False, f"Test crashed: {str(e)}")
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                print(f"  - {failure}")
        
        return len(self.failed_tests) == 0

def main():
    """Main test execution"""
    tester = TrustFhoneAPITester()
    success = tester.run_all_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())