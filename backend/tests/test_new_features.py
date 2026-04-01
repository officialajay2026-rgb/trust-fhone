"""
Test suite for TrustFhone Delhi - 4 New Features
1. In-App Chat (buyer-seller messaging)
2. Seller Reviews & Ratings
3. Buyer Wishlist/Favorites
4. Notifications (listing status changes)
"""

import pytest
import requests
import os
import time
import random
import string

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://secure-fhone-hub.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@trustfhone.com"
ADMIN_PASSWORD = "admin123"
BUYER_EMAIL = "buyer@test.com"
BUYER_PASSWORD = "buyer123"
SELLER_EMAIL = "seller@test.com"
SELLER_PASSWORD = "seller123"

# Valid IMEI for testing (passes Luhn check)
VALID_IMEI = "490154203237518"

def generate_valid_imei():
    """Generate a valid IMEI that passes Luhn check"""
    # Generate 14 random digits
    base = ''.join([str(random.randint(0, 9)) for _ in range(14)])
    
    # Calculate Luhn check digit
    total = 0
    for i, digit in enumerate(base):
        d = int(digit)
        if i % 2 == 1:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    check_digit = (10 - (total % 10)) % 10
    
    return base + str(check_digit)


def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def admin_token(api_client):
    """Get admin auth token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Admin authentication failed")


@pytest.fixture(scope="module")
def buyer_token(api_client):
    """Get buyer auth token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": BUYER_EMAIL,
        "password": BUYER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Buyer authentication failed")


@pytest.fixture(scope="module")
def seller_data(api_client):
    """Create a test seller and return token + user data"""
    unique_email = f"test_seller_{random_string()}@test.com"
    response = api_client.post(f"{BASE_URL}/api/auth/signup", json={
        "name": f"Test Seller {random_string(4)}",
        "email": unique_email,
        "password": "seller123",
        "role": "seller"
    })
    if response.status_code == 201:
        data = response.json()
        return {
            "token": data.get("token"),
            "user": data.get("user"),
            "email": unique_email
        }
    pytest.skip(f"Seller registration failed: {response.text}")


@pytest.fixture(scope="module")
def buyer_data(api_client):
    """Create a test buyer and return token + user data"""
    unique_email = f"test_buyer_{random_string()}@test.com"
    response = api_client.post(f"{BASE_URL}/api/auth/signup", json={
        "name": f"Test Buyer {random_string(4)}",
        "email": unique_email,
        "password": "buyer123",
        "role": "buyer"
    })
    if response.status_code == 201:
        data = response.json()
        return {
            "token": data.get("token"),
            "user": data.get("user"),
            "email": unique_email
        }
    pytest.skip(f"Buyer registration failed: {response.text}")


@pytest.fixture(scope="module")
def approved_listing(api_client, seller_data, admin_token):
    """Create and approve a listing for testing"""
    # Create listing as seller
    seller_token = seller_data["token"]
    listing_data = {
        "brand": "Samsung",
        "model": f"Galaxy Test {random_string(4)}",
        "price": 25000,
        "condition": "Like New",
        "imei": generate_valid_imei(),
        "description": "Test listing for feature testing",
        "hasBox": True,
        "hasOriginalParts": True,
        "images": [
            {"url": f"https://via.placeholder.com/400?text=Phone1_{random_string(4)}", "publicId": f"test_{random_string(4)}"},
            {"url": f"https://via.placeholder.com/400?text=Phone2_{random_string(4)}", "publicId": f"test_{random_string(4)}"}
        ],
        "billImage": {"url": f"https://via.placeholder.com/400?text=Bill_{random_string(4)}", "publicId": f"test_bill_{random_string(4)}"}
    }
    
    response = api_client.post(
        f"{BASE_URL}/api/listings",
        json=listing_data,
        headers={"Authorization": f"Bearer {seller_token}"}
    )
    
    if response.status_code not in [200, 201]:
        pytest.skip(f"Listing creation failed: {response.text}")
    
    listing = response.json().get("listing")
    listing_id = listing.get("_id") or listing.get("id")
    
    # Approve listing as admin
    approve_response = api_client.put(
        f"{BASE_URL}/api/admin/approve/{listing_id}",
        json={"adminNotes": "Approved for testing"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    if approve_response.status_code != 200:
        pytest.skip(f"Listing approval failed: {approve_response.text}")
    
    return {
        "listing_id": listing_id,
        "seller_id": seller_data["user"]["id"],
        "seller_token": seller_token
    }


# ============== FEATURE 1: IN-APP CHAT TESTS ==============

class TestChatFeature:
    """Tests for in-app chat between buyer and seller"""
    
    def test_start_chat_requires_auth(self, api_client, approved_listing):
        """Chat start should require authentication"""
        response = api_client.post(f"{BASE_URL}/api/chat/start", json={
            "listingId": approved_listing["listing_id"]
        })
        assert response.status_code == 401, "Should require authentication"
        print("✅ Chat start requires authentication")
    
    def test_start_chat_success(self, api_client, buyer_data, approved_listing):
        """Buyer can start chat with seller"""
        response = api_client.post(
            f"{BASE_URL}/api/chat/start",
            json={"listingId": approved_listing["listing_id"]},
            headers={"Authorization": f"Bearer {buyer_data['token']}"}
        )
        assert response.status_code == 200, f"Chat start failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "conversation" in data
        assert data["conversation"].get("_id") is not None
        print(f"✅ Chat started successfully, conversation ID: {data['conversation']['_id']}")
        return data["conversation"]["_id"]
    
    def test_cannot_chat_with_self(self, api_client, approved_listing):
        """Seller cannot start chat with themselves"""
        response = api_client.post(
            f"{BASE_URL}/api/chat/start",
            json={"listingId": approved_listing["listing_id"]},
            headers={"Authorization": f"Bearer {approved_listing['seller_token']}"}
        )
        assert response.status_code == 400, "Should not allow self-chat"
        assert "yourself" in response.json().get("message", "").lower()
        print("✅ Self-chat correctly rejected")
    
    def test_get_conversations(self, api_client, buyer_data, approved_listing):
        """Get user conversations list"""
        # First start a chat
        api_client.post(
            f"{BASE_URL}/api/chat/start",
            json={"listingId": approved_listing["listing_id"]},
            headers={"Authorization": f"Bearer {buyer_data['token']}"}
        )
        
        response = api_client.get(
            f"{BASE_URL}/api/chat/conversations",
            headers={"Authorization": f"Bearer {buyer_data['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "conversations" in data
        assert isinstance(data["conversations"], list)
        print(f"✅ Got {len(data['conversations'])} conversations")
    
    def test_send_message(self, api_client, buyer_data, approved_listing):
        """Send message in conversation"""
        # Start chat first
        start_response = api_client.post(
            f"{BASE_URL}/api/chat/start",
            json={"listingId": approved_listing["listing_id"]},
            headers={"Authorization": f"Bearer {buyer_data['token']}"}
        )
        conv_id = start_response.json()["conversation"]["_id"]
        
        # Send message
        response = api_client.post(
            f"{BASE_URL}/api/chat/send",
            json={"conversationId": conv_id, "text": "Hello, is this phone still available?"},
            headers={"Authorization": f"Bearer {buyer_data['token']}"}
        )
        assert response.status_code == 200, f"Send message failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "message" in data
        assert data["message"]["text"] == "Hello, is this phone still available?"
        print("✅ Message sent successfully")
    
    def test_get_messages(self, api_client, buyer_data, approved_listing):
        """Get messages for a conversation"""
        # Start chat and send message
        start_response = api_client.post(
            f"{BASE_URL}/api/chat/start",
            json={"listingId": approved_listing["listing_id"]},
            headers={"Authorization": f"Bearer {buyer_data['token']}"}
        )
        conv_id = start_response.json()["conversation"]["_id"]
        
        api_client.post(
            f"{BASE_URL}/api/chat/send",
            json={"conversationId": conv_id, "text": "Test message for retrieval"},
            headers={"Authorization": f"Bearer {buyer_data['token']}"}
        )
        
        # Get messages
        response = api_client.get(
            f"{BASE_URL}/api/chat/messages/{conv_id}",
            headers={"Authorization": f"Bearer {buyer_data['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "messages" in data
        assert len(data["messages"]) > 0
        print(f"✅ Retrieved {len(data['messages'])} messages")
    
    def test_unread_count(self, api_client, buyer_data):
        """Get unread message count"""
        response = api_client.get(
            f"{BASE_URL}/api/chat/unread-count",
            headers={"Authorization": f"Bearer {buyer_data['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "count" in data
        assert isinstance(data["count"], int)
        print(f"✅ Unread count: {data['count']}")


# ============== FEATURE 2: SELLER REVIEWS TESTS ==============

class TestReviewsFeature:
    """Tests for seller reviews and ratings"""
    
    def test_create_review_requires_auth(self, api_client, approved_listing):
        """Review creation requires authentication"""
        response = api_client.post(f"{BASE_URL}/api/reviews", json={
            "sellerId": approved_listing["seller_id"],
            "rating": 5,
            "comment": "Great seller!"
        })
        assert response.status_code == 401
        print("✅ Review creation requires authentication")
    
    def test_create_review_success(self, api_client, buyer_data, approved_listing):
        """Buyer can create review for seller"""
        response = api_client.post(
            f"{BASE_URL}/api/reviews",
            json={
                "sellerId": approved_listing["seller_id"],
                "listingId": approved_listing["listing_id"],
                "rating": 4,
                "comment": "Good phone, fast delivery!"
            },
            headers={"Authorization": f"Bearer {buyer_data['token']}"}
        )
        assert response.status_code == 201, f"Review creation failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "review" in data
        assert data["review"]["rating"] == 4
        print("✅ Review created successfully")
    
    def test_cannot_review_self(self, api_client, approved_listing):
        """Seller cannot review themselves"""
        response = api_client.post(
            f"{BASE_URL}/api/reviews",
            json={
                "sellerId": approved_listing["seller_id"],
                "rating": 5,
                "comment": "I'm great!"
            },
            headers={"Authorization": f"Bearer {approved_listing['seller_token']}"}
        )
        assert response.status_code == 400
        assert "yourself" in response.json().get("message", "").lower()
        print("✅ Self-review correctly rejected")
    
    def test_duplicate_review_rejected(self, api_client, buyer_data, approved_listing):
        """Same buyer cannot review same seller twice"""
        # First review (may already exist from previous test)
        api_client.post(
            f"{BASE_URL}/api/reviews",
            json={
                "sellerId": approved_listing["seller_id"],
                "rating": 4,
                "comment": "First review"
            },
            headers={"Authorization": f"Bearer {buyer_data['token']}"}
        )
        
        # Second review should fail
        response = api_client.post(
            f"{BASE_URL}/api/reviews",
            json={
                "sellerId": approved_listing["seller_id"],
                "rating": 5,
                "comment": "Second review"
            },
            headers={"Authorization": f"Bearer {buyer_data['token']}"}
        )
        assert response.status_code == 400
        assert "already" in response.json().get("message", "").lower()
        print("✅ Duplicate review correctly rejected")
    
    def test_get_seller_reviews(self, api_client, approved_listing):
        """Get reviews for a seller with stats"""
        response = api_client.get(f"{BASE_URL}/api/reviews/seller/{approved_listing['seller_id']}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "reviews" in data
        assert "stats" in data
        assert "avgRating" in data["stats"]
        assert "totalRatings" in data["stats"]
        assert "distribution" in data["stats"]
        print(f"✅ Got seller reviews - Avg: {data['stats']['avgRating']}, Total: {data['stats']['totalRatings']}")
    
    def test_rating_validation(self, api_client, buyer_data, seller_data):
        """Rating must be between 1 and 5"""
        # Test invalid rating
        response = api_client.post(
            f"{BASE_URL}/api/reviews",
            json={
                "sellerId": seller_data["user"]["id"],
                "rating": 6,
                "comment": "Invalid rating"
            },
            headers={"Authorization": f"Bearer {buyer_data['token']}"}
        )
        assert response.status_code == 400
        print("✅ Invalid rating correctly rejected")


# ============== FEATURE 3: WISHLIST TESTS ==============

class TestWishlistFeature:
    """Tests for buyer wishlist/favorites"""
    
    def test_add_to_wishlist_requires_auth(self, api_client, approved_listing):
        """Wishlist add requires authentication"""
        response = api_client.post(f"{BASE_URL}/api/user/wishlist/{approved_listing['listing_id']}")
        assert response.status_code == 401
        print("✅ Wishlist add requires authentication")
    
    def test_add_to_wishlist_success(self, api_client, buyer_data, approved_listing):
        """Add listing to wishlist"""
        response = api_client.post(
            f"{BASE_URL}/api/user/wishlist/{approved_listing['listing_id']}",
            headers={"Authorization": f"Bearer {buyer_data['token']}"}
        )
        # May return 400 if already in wishlist
        assert response.status_code in [200, 400], f"Unexpected status: {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            print("✅ Added to wishlist successfully")
        else:
            print("✅ Already in wishlist (expected)")
    
    def test_get_wishlist(self, api_client, buyer_data, approved_listing):
        """Get user wishlist"""
        # Ensure item is in wishlist
        api_client.post(
            f"{BASE_URL}/api/user/wishlist/{approved_listing['listing_id']}",
            headers={"Authorization": f"Bearer {buyer_data['token']}"}
        )
        
        response = api_client.get(
            f"{BASE_URL}/api/user/wishlist",
            headers={"Authorization": f"Bearer {buyer_data['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "wishlist" in data
        assert isinstance(data["wishlist"], list)
        print(f"✅ Got wishlist with {len(data['wishlist'])} items")
    
    def test_remove_from_wishlist(self, api_client, buyer_data, approved_listing):
        """Remove listing from wishlist"""
        # First add to wishlist
        api_client.post(
            f"{BASE_URL}/api/user/wishlist/{approved_listing['listing_id']}",
            headers={"Authorization": f"Bearer {buyer_data['token']}"}
        )
        
        # Then remove
        response = api_client.delete(
            f"{BASE_URL}/api/user/wishlist/{approved_listing['listing_id']}",
            headers={"Authorization": f"Bearer {buyer_data['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print("✅ Removed from wishlist successfully")
    
    def test_wishlist_invalid_listing(self, api_client, buyer_data):
        """Adding invalid listing to wishlist should fail"""
        response = api_client.post(
            f"{BASE_URL}/api/user/wishlist/000000000000000000000000",
            headers={"Authorization": f"Bearer {buyer_data['token']}"}
        )
        assert response.status_code == 404
        print("✅ Invalid listing correctly rejected")


# ============== FEATURE 4: NOTIFICATIONS TESTS ==============

class TestNotificationsFeature:
    """Tests for notifications system"""
    
    def test_get_notifications_requires_auth(self, api_client):
        """Notifications require authentication"""
        response = api_client.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 401
        print("✅ Notifications require authentication")
    
    def test_get_notifications(self, api_client, seller_data):
        """Get user notifications"""
        response = api_client.get(
            f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {seller_data['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "notifications" in data
        assert "unreadCount" in data
        print(f"✅ Got {len(data['notifications'])} notifications, {data['unreadCount']} unread")
    
    def test_get_unread_count(self, api_client, seller_data):
        """Get unread notification count"""
        response = api_client.get(
            f"{BASE_URL}/api/notifications/unread-count",
            headers={"Authorization": f"Bearer {seller_data['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "count" in data
        assert isinstance(data["count"], int)
        print(f"✅ Unread notification count: {data['count']}")
    
    def test_notification_created_on_listing_approval(self, api_client, admin_token):
        """Notification should be created when listing is approved"""
        # Create a new seller and listing
        unique_email = f"test_notif_seller_{random_string()}@test.com"
        reg_response = api_client.post(f"{BASE_URL}/api/auth/signup", json={
            "name": f"Notif Test Seller",
            "email": unique_email,
            "password": "test123",
            "role": "seller"
        })
        
        if reg_response.status_code != 201:
            pytest.skip("Seller registration failed")
        
        seller_token = reg_response.json()["token"]
        
        # Create listing
        listing_response = api_client.post(
            f"{BASE_URL}/api/listings",
            json={
                "brand": "Apple",
                "model": f"iPhone Notif Test {random_string(4)}",
                "price": 50000,
                "condition": "New",
                "imei": generate_valid_imei(),
                "description": "Test for notification",
                "hasBox": True,
                "hasOriginalParts": True,
                "images": [
                    {"url": f"https://via.placeholder.com/400?text=NotifPhone1_{random_string(4)}", "publicId": f"notif_test_{random_string(4)}"},
                    {"url": f"https://via.placeholder.com/400?text=NotifPhone2_{random_string(4)}", "publicId": f"notif_test_{random_string(4)}"}
                ],
                "billImage": {"url": f"https://via.placeholder.com/400?text=NotifBill_{random_string(4)}", "publicId": f"notif_bill_{random_string(4)}"}
            },
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        
        if listing_response.status_code not in [200, 201]:
            pytest.skip(f"Listing creation failed: {listing_response.text}")
        
        listing_id = listing_response.json()["listing"]["_id"]
        
        # Get initial notification count
        initial_notifs = api_client.get(
            f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {seller_token}"}
        ).json()
        initial_count = len(initial_notifs.get("notifications", []))
        
        # Approve listing as admin
        approve_response = api_client.put(
            f"{BASE_URL}/api/admin/approve/{listing_id}",
            json={"adminNotes": "Approved for notification test"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert approve_response.status_code == 200
        
        # Wait a moment for notification to be created
        time.sleep(1)
        
        # Check notifications
        notifs_response = api_client.get(
            f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert notifs_response.status_code == 200
        new_notifs = notifs_response.json().get("notifications", [])
        
        # Should have at least one new notification
        assert len(new_notifs) > initial_count, "No new notification created on approval"
        
        # Check notification type
        latest_notif = new_notifs[0]
        assert latest_notif["type"] == "listing_approved"
        assert "approved" in latest_notif["title"].lower()
        print("✅ Notification created on listing approval")
    
    def test_mark_notification_read(self, api_client, seller_data):
        """Mark single notification as read"""
        # Get notifications
        notifs_response = api_client.get(
            f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {seller_data['token']}"}
        )
        notifs = notifs_response.json().get("notifications", [])
        
        if not notifs:
            pytest.skip("No notifications to mark as read")
        
        notif_id = notifs[0]["_id"]
        
        response = api_client.put(
            f"{BASE_URL}/api/notifications/read/{notif_id}",
            headers={"Authorization": f"Bearer {seller_data['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print("✅ Notification marked as read")
    
    def test_mark_all_notifications_read(self, api_client, seller_data):
        """Mark all notifications as read"""
        response = api_client.put(
            f"{BASE_URL}/api/notifications/read-all",
            headers={"Authorization": f"Bearer {seller_data['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print("✅ All notifications marked as read")


# ============== INTEGRATION TESTS ==============

class TestIntegrationFlow:
    """End-to-end integration tests"""
    
    def test_full_buyer_seller_flow(self, api_client, admin_token):
        """Complete flow: seller creates listing -> admin approves -> buyer interacts"""
        # 1. Create seller
        seller_email = f"test_flow_seller_{random_string()}@test.com"
        seller_reg = api_client.post(f"{BASE_URL}/api/auth/signup", json={
            "name": "Flow Test Seller",
            "email": seller_email,
            "password": "test123",
            "role": "seller"
        })
        assert seller_reg.status_code == 201
        seller_token = seller_reg.json()["token"]
        seller_id = seller_reg.json()["user"]["id"]
        print("✅ Step 1: Seller registered")
        
        # 2. Create listing
        listing_response = api_client.post(
            f"{BASE_URL}/api/listings",
            json={
                "brand": "OnePlus",
                "model": f"Flow Test {random_string(4)}",
                "price": 30000,
                "condition": "Like New",
                "imei": generate_valid_imei(),
                "description": "Integration test listing",
                "hasBox": True,
                "hasOriginalParts": True,
                "images": [
                    {"url": f"https://via.placeholder.com/400?text=FlowPhone1_{random_string(4)}", "publicId": f"flow_test_{random_string(4)}"},
                    {"url": f"https://via.placeholder.com/400?text=FlowPhone2_{random_string(4)}", "publicId": f"flow_test_{random_string(4)}"}
                ],
                "billImage": {"url": f"https://via.placeholder.com/400?text=FlowBill_{random_string(4)}", "publicId": f"flow_bill_{random_string(4)}"}
            },
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert listing_response.status_code in [200, 201], f"Listing creation failed: {listing_response.text}"
        listing_id = listing_response.json()["listing"]["_id"]
        print(f"✅ Step 2: Listing created (ID: {listing_id})")
        
        # 3. Admin approves listing
        approve_response = api_client.put(
            f"{BASE_URL}/api/admin/approve/{listing_id}",
            json={"adminNotes": "Approved for integration test"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert approve_response.status_code == 200
        print("✅ Step 3: Admin approved listing")
        
        # 4. Check seller got notification
        time.sleep(1)
        notifs = api_client.get(
            f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {seller_token}"}
        ).json()
        assert len(notifs.get("notifications", [])) > 0
        assert notifs["notifications"][0]["type"] == "listing_approved"
        print("✅ Step 4: Seller received approval notification")
        
        # 5. Create buyer
        buyer_email = f"test_flow_buyer_{random_string()}@test.com"
        buyer_reg = api_client.post(f"{BASE_URL}/api/auth/signup", json={
            "name": "Flow Test Buyer",
            "email": buyer_email,
            "password": "test123",
            "role": "buyer"
        })
        assert buyer_reg.status_code == 201
        buyer_token = buyer_reg.json()["token"]
        print("✅ Step 5: Buyer registered")
        
        # 6. Buyer adds to wishlist
        wishlist_response = api_client.post(
            f"{BASE_URL}/api/user/wishlist/{listing_id}",
            headers={"Authorization": f"Bearer {buyer_token}"}
        )
        assert wishlist_response.status_code == 200
        print("✅ Step 6: Buyer added to wishlist")
        
        # 7. Buyer starts chat
        chat_response = api_client.post(
            f"{BASE_URL}/api/chat/start",
            json={"listingId": listing_id},
            headers={"Authorization": f"Bearer {buyer_token}"}
        )
        assert chat_response.status_code == 200
        conv_id = chat_response.json()["conversation"]["_id"]
        print(f"✅ Step 7: Chat started (Conv ID: {conv_id})")
        
        # 8. Buyer sends message
        msg_response = api_client.post(
            f"{BASE_URL}/api/chat/send",
            json={"conversationId": conv_id, "text": "Hi, is this phone still available?"},
            headers={"Authorization": f"Bearer {buyer_token}"}
        )
        assert msg_response.status_code == 200
        print("✅ Step 8: Buyer sent message")
        
        # 9. Seller receives message notification
        time.sleep(1)
        seller_notifs = api_client.get(
            f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {seller_token}"}
        ).json()
        has_message_notif = any(n["type"] == "new_message" for n in seller_notifs.get("notifications", []))
        assert has_message_notif, "Seller should receive message notification"
        print("✅ Step 9: Seller received message notification")
        
        # 10. Buyer writes review
        review_response = api_client.post(
            f"{BASE_URL}/api/reviews",
            json={
                "sellerId": seller_id,
                "listingId": listing_id,
                "rating": 5,
                "comment": "Excellent seller, highly recommended!"
            },
            headers={"Authorization": f"Bearer {buyer_token}"}
        )
        assert review_response.status_code == 201
        print("✅ Step 10: Buyer wrote review")
        
        # 11. Verify review appears in seller's reviews
        reviews_response = api_client.get(f"{BASE_URL}/api/reviews/seller/{seller_id}")
        assert reviews_response.status_code == 200
        reviews_data = reviews_response.json()
        assert reviews_data["stats"]["totalRatings"] >= 1
        assert reviews_data["stats"]["avgRating"] == 5.0
        print("✅ Step 11: Review verified in seller's profile")
        
        print("\n🎉 FULL INTEGRATION FLOW PASSED!")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
