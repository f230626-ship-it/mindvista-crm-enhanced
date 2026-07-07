/**
 * Email Validation Test Suite
 * 
 * This file tests the email validation logic with various email addresses
 * to ensure both existing and non-existing emails are properly handled.
 * 
 * Usage: Run this as a Node.js script or import in your testing framework
 */

// Mock environment variables for testing
process.env.EMAILVERIFY_API_KEY = "v0zKuSCoKUdefcU82x0NENjFDe0TL75M";
process.env.EMAILAWESOME_API_KEY = "V4HDBO1rZ741azS57UPwX8sTujy3px9lYEraO9ki";

// Import the validation function
// Note: This is a simplified version for testing. The actual function is in employees.ts
async function validateEmailForTesting(email: string): Promise<string | null> {
  console.log('🔍 Starting comprehensive email validation for:', email);
  
  // Basic format validation first
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Invalid email format";
  }

  const [localPart, domain] = email.split('@');
  const domainLower = domain.toLowerCase();
  const localPartLower = localPart.toLowerCase();
  
  // ═══════════════════════════════════════════════════════════════════
  // 🚀 PRIMARY VALIDATION: EmailVerify.io API
  // ═══════════════════════════════════════════════════════════════════
  
  const emailVerifyKey = process.env.EMAILVERIFY_API_KEY;
  if (emailVerifyKey && emailVerifyKey.length > 10) {
    try {
      console.log('🔍 Validating with EmailVerify.io API...');
      
      const response = await fetch(`https://api.emailverify.io/v1/verify?apikey=${emailVerifyKey}&email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MindVista-HRMS/1.0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📧 EmailVerify.io API response:', JSON.stringify(data, null, 2));
        
        if (data.deliverable === true) {
          console.log('✅ EmailVerify.io: Email is valid and deliverable');
          return null; // Email is valid
        } else if (data.deliverable === false) {
          console.log('❌ EmailVerify.io: Email is not deliverable');
          return "This email address does not exist or cannot receive emails";
        } else if (data.risky === true) {
          console.log('⚠️ EmailVerify.io: Email is risky, applying additional validation');
          return "This email address is flagged as risky";
        } else if (data.unknown === true) {
          console.log('⚠️ EmailVerify.io: Email status unknown');
          return "Unable to verify this email address";
        }
      } else {
        console.warn('EmailVerify.io API HTTP error:', response.status, response.statusText);
        const errorText = await response.text();
        console.warn('EmailVerify.io API error response:', errorText);
        return "API validation failed - please try again";
      }
      
    } catch (error) {
      console.warn('EmailVerify.io API error:', error.message);
      return "Network error during validation";
    }
  }

  return null; // Default to valid if no API validation
}

// Test cases
const testCases = {
  // Emails that should be BLOCKED (non-existing or fake)
  shouldBlock: [
    'omar@gmail.com',        // User's specific example - should be blocked
    'test@gmail.com',        // Common test email
    'fake@yahoo.com',        // Fake email
    'notreal@hotmail.com',   // Not real
    'dummy@outlook.com',     // Dummy email
    'nonexistent@gmail.com', // Non-existent
    'abc@gmail.com',         // Too short/fake
    'xyz@yahoo.com',         // Fake pattern
    'temp@gmail.com',        // Temporary
    'invalid@gmail.com',     // Invalid
    'user123@gmail.com',     // Generic pattern
    'testuser@hotmail.com',  // Test user
    'example@yahoo.com',     // Example email
    'noreply@gmail.com',     // No reply (usually system)
    'admin@gmail.com',       // Generic admin
  ],
  
  // Emails that should be ALLOWED (real existing emails - use known real ones)
  shouldAllow: [
    'support@gmail.com',          // Gmail support (real)
    'noreply@google.com',         // Google official
    'security@microsoft.com',     // Microsoft official
    'info@yahoo.com',            // Yahoo official
    'help@outlook.com',          // Outlook official
    'contact@apple.com',         // Apple official
    'news@linkedin.com',         // LinkedIn official
    'updates@facebook.com',      // Facebook official
    'notifications@twitter.com', // Twitter official
    'service@amazon.com',        // Amazon official
  ]
};

async function runEmailValidationTests() {
  console.log('\n🧪 EMAIL VALIDATION TEST SUITE');
  console.log('='.repeat(50));
  console.log(`Using EmailVerify.io API Key: ${process.env.EMAILVERIFY_API_KEY?.substring(0, 10)}...`);
  console.log('='.repeat(50));
  
  let passed = 0;
  let failed = 0;
  
  // Test emails that should be blocked
  console.log('\n❌ Testing emails that SHOULD BE BLOCKED:');
  console.log('-'.repeat(40));
  
  for (const email of testCases.shouldBlock) {
    try {
      const result = await validateEmailForTesting(email);
      if (result !== null) {
        console.log(`✅ CORRECT: ${email} was blocked - ${result}`);
        passed++;
      } else {
        console.log(`❌ FAILED: ${email} was allowed but should be blocked!`);
        failed++;
      }
    } catch (error) {
      console.log(`⚠️ ERROR: ${email} - ${error.message}`);
      failed++;
    }
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Test emails that should be allowed
  console.log('\n✅ Testing emails that SHOULD BE ALLOWED:');
  console.log('-'.repeat(40));
  
  for (const email of testCases.shouldAllow) {
    try {
      const result = await validateEmailForTesting(email);
      if (result === null) {
        console.log(`✅ CORRECT: ${email} was allowed`);
        passed++;
      } else {
        console.log(`❌ FAILED: ${email} was blocked but should be allowed - ${result}`);
        failed++;
      }
    } catch (error) {
      console.log(`⚠️ ERROR: ${email} - ${error.message}`);
      failed++;
    }
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n📊 TEST RESULTS SUMMARY:');
  console.log('='.repeat(30));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Email validation is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the validation logic.');
  }
}

// Export for use in other files
export { validateEmailForTesting, testCases, runEmailValidationTests };

// Run tests if this file is executed directly
if (require.main === module) {
  runEmailValidationTests().catch(console.error);
}