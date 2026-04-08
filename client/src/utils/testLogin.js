// Test script to verify login functionality
// This can be run in the browser console to test login

const testLogin = async () => {
  const testCases = [
    {
      name: 'Valid Owner Login',
      email: 'admin@epr.com',
      password: 'admin123',
      expectedRole: 'owner'
    },
    {
      name: 'Valid Franchise Login',
      email: 'dist@epr.com',
      password: 'dist123',
      expectedRole: 'franchise'
    },
    {
      name: 'Invalid Email',
      email: 'invalid@test.com',
      password: 'password123',
      shouldFail: true
    },
    {
      name: 'Invalid Password',
      email: 'admin@epr.com',
      password: 'wrongpassword',
      shouldFail: true
    },
    {
      name: 'Empty Fields',
      email: '',
      password: '',
      shouldFail: true
    }
  ];

  const API_BASE_URL = 'http://localhost:5000/api';

  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testCase.email,
          password: testCase.password
        })
      });

      const data = await response.json();

      if (testCase.shouldFail) {
        if (!response.ok) {
          console.log(`✅ ${testCase.name}: Failed as expected - ${data.message}`);
        } else {
          console.log(`❌ ${testCase.name}: Should have failed but succeeded`);
        }
      } else {
        if (response.ok && data.success) {
          console.log(`✅ ${testCase.name}: Success - User role: ${data.user.role}`);
          if (data.user.role !== testCase.expectedRole) {
            console.log(`⚠️  Expected role: ${testCase.expectedRole}, got: ${data.user.role}`);
          }
        } else {
          console.log(`❌ ${testCase.name}: Should have succeeded but failed - ${data.message}`);
        }
      }
    } catch (error) {
      console.log(`❌ ${testCase.name}: Network error - ${error.message}`);
    }
  }
  
  console.log('\n🎯 Login testing complete!');
};

// Export for use in browser console
window.testLogin = testLogin;
console.log('Login test function loaded. Run testLogin() in console to test.');
