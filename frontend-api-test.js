// Simple test to verify API connection
// Run this in browser console when on the admin dashboard

async function testBuybackAPI() {
  console.log('🧪 Testing Buyback API Connection...');
  
  // Check if user is logged in
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  console.log('Token exists:', !!token);
  console.log('User:', user);
  console.log('User role:', user.role);
  
  if (!token) {
    console.error('❌ No authentication token found. Please log in as admin.');
    return;
  }
  
  if (user.role !== 'admin') {
    console.error('❌ User is not admin. Current role:', user.role);
    return;
  }
  
  try {
    // Test API connection
    const response = await fetch('http://localhost:3001/api/buyback/admin/all-requests', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error:', errorData);
      return;
    }
    
    const data = await response.json();
    console.log('✅ API Response successful!');
    console.log('Buyback requests count:', data.length);
    console.log('Sample request:', data[0]);
    
    return data;
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
}

// Auto-run the test
testBuybackAPI();