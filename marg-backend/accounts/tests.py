from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class UserAuthTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('user-register')
        self.login_url = reverse('token_obtain_pair')
        self.profile_url = reverse('user-profile')
        self.health_url = reverse('health-check')
        
        self.user_data = {
            'email': 'testuser@example.com',
            'username': 'testuser',
            'password': 'testpassword123',
            'first_name': 'Test',
            'last_name': 'User',
            'phone_number': '1234567890',
            'role': 'customer'
        }

    def test_health_check(self):
        """Test the common health check view."""
        response = self.client.get(self.health_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['status'], 'healthy')

    def test_user_registration(self):
        """Test creating a new user through the registration endpoint."""
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['email'], self.user_data['email'])
        self.assertEqual(response.data['data']['role'], 'customer')

    def test_user_login(self):
        """Test logging in to obtain JWT tokens."""
        # First register
        self.client.post(self.register_url, self.user_data, format='json')
        
        # Then login
        login_data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_profile_retrieval_and_update(self):
        """Test viewing and updating user profile with JWT authentication."""
        # First register & login
        self.client.post(self.register_url, self.user_data, format='json')
        login_data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }
        login_response = self.client.post(self.login_url, login_data, format='json')
        access_token = login_response.data['access']
        
        # Authenticate client
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Test Get Profile
        profile_response = self.client.get(self.profile_url)
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        self.assertTrue(profile_response.data['success'])
        self.assertEqual(profile_response.data['data']['email'], self.user_data['email'])
        
        # Test Update Profile
        update_data = {
            'first_name': 'UpdatedName',
            'phone_number': '0987654321'
        }
        update_response = self.client.patch(self.profile_url, update_data, format='json')
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertTrue(update_response.data['success'])
        self.assertEqual(update_response.data['data']['first_name'], 'UpdatedName')
        self.assertEqual(update_response.data['data']['phone_number'], '0987654321')
