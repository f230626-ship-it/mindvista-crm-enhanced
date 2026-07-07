#!/usr/bin/env node

/**
 * Email Validation Test Script
 * Tests the EmailVerify.io API with various email addresses
 */

const API_KEY = 'v0zKuSCoKUdefcU82x0NENjFDe0TL75M';

async function validateEmailAPI(email) {
  console.log(`\n🔍 Testing email: ${email}`);
  
  try {
    const apiUrl = `https://app.emailverify.io/api/v1/validate?key=${API_KEY}&email=${encodeURIComponent(email)}`;
    
    console.log(`📡 API URL: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MindVista-HRMS-Test/1.0'
      }
    });
    
    console.log(`📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`📧 Response Data:`, JSON.stringify(data, null, 2));
      
      const isValid = data.status === "valid" && data.sub_status === "permitted";
      const isInvalid = data.status === "invalid" || data.sub_status === "undeliverable" || data.sub_status === "rejected";
      
      console.log(`✅ Result: ${isValid ? 'VALID' : isInvalid ? 'INVALID' : 'UNCERTAIN'}`);
      
      return {
        email,
        valid: isValid,
        invalid: isInvalid,
        status: data.status,
        sub_status: data.sub_status,
        response: data
      };
    } else {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status} - ${errorText}`);
      return {
        email,
        error: `${response.status}: ${errorText}`
      };
    }
  } catch (error) {
    console.error(`❌ Request Error:`, error.message);
    return {
      email,
      error: error.message
    };
  }
}

async function runTests() {
  console.log('🧪 Starting Email Validation Tests');
  console.log('=' .repeat(50));
  
  // Test emails that should be INVALID (non-existent)
  const invalidEmails = [
    'omar@gmail.com',
    'test@gmail.com', 
    'fake@yahoo.com',
    'nonexistent@hotmail.com',
    'dummy@outlook.com',
    'notreal@gmail.com'
  ];
  
  // Test emails that should be VALID (existing)
  const validEmails = [
    'john.doe@gmail.com', // Common real-looking name
    'info@google.com',    // Known company email
    'support@github.com', // Known service email
    'hello@world.com'     // May or may not exist, but formatted properly
  ];
  
  console.log('\n📋 Testing INVALID emails (should be blocked):');
  console.log('-'.repeat(50));
  
  for (const email of invalidEmails) {
    const result = await validateEmailAPI(email);
    console.log(`${email}: ${result.error ? 'ERROR' : result.invalid ? '❌ BLOCKED' : result.valid ? '⚠️ ALLOWED' : '❓ UNCERTAIN'}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between requests
  }
  
  console.log('\n📋 Testing VALID emails (should be allowed):');
  console.log('-'.repeat(50));
  
  for (const email of validEmails) {
    const result = await validateEmailAPI(email);
    console.log(`${email}: ${result.error ? 'ERROR' : result.valid ? '✅ ALLOWED' : result.invalid ? '⚠️ BLOCKED' : '❓ UNCERTAIN'}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between requests
  }
  
  // Check account balance
  console.log('\n💳 Checking Account Balance:');
  console.log('-'.repeat(50));
  
  try {
    const balanceUrl = `https://app.emailverify.io/api/v2/check-account-balance?key=${API_KEY}`;
    const balanceResponse = await fetch(balanceUrl);
    
    if (balanceResponse.ok) {
      const balanceData = await balanceResponse.json();
      console.log('💰 Account Balance:', JSON.stringify(balanceData, null, 2));
    } else {
      console.log('❌ Could not fetch balance');
    }
  } catch (error) {
    console.log('❌ Balance check failed:', error.message);
  }
  
  console.log('\n🏁 Test completed!');
}

// Run the tests
runTests().catch(console.error);