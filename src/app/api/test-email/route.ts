import { NextRequest, NextResponse } from 'next/server';

async function validateEmail(email: string): Promise<string | null> {
  console.log('🔍 Testing email validation for:', email);
  
  // Basic format validation first
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Invalid email format";
  }

  // EmailVerify.io API validation
  try {
    const emailVerifyKey = process.env.EMAILVERIFY_API_KEY;
    if (emailVerifyKey && emailVerifyKey.length > 10) {
      console.log('🔍 Validating with EmailVerify.io API...');
      
      const apiUrl = `https://app.emailverify.io/api/v1/validate?key=${emailVerifyKey}&email=${encodeURIComponent(email)}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MindVista-HRMS/1.0'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📧 EmailVerify.io API response:', JSON.stringify(data, null, 2));
        
        if (data.status === "valid" && data.sub_status === "permitted") {
          console.log('✅ EmailVerify.io: Email is valid and deliverable');
          return null;
        } else if (data.status === "invalid") {
          console.log('❌ EmailVerify.io: Email does not exist or cannot receive emails');
          return "This email address does not exist or cannot receive emails";
        } else if (data.status === "role_based") {
          console.log('✅ EmailVerify.io: Role-based email (business/generic email)');
          return null;
        } else {
          console.log('⚠️ EmailVerify.io: Uncertain status');
          return "Email validation uncertain - please verify manually";
        }
      } else {
        const errorText = await response.text();
        console.error('EmailVerify.io API error:', errorText);
        return "Email validation service error";
      }
    } else {
      return "Email validation service not configured";
    }
  } catch (error) {
    console.error('EmailVerify.io API error:', error);
    return "Email validation service error";
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  
  if (!email) {
    return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
  }
  
  const validationError = await validateEmail(email);
  
  return NextResponse.json({
    email,
    valid: validationError === null,
    error: validationError,
    timestamp: new Date().toISOString()
  });
}