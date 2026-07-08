"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole, getCurrentEmployee, requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { EmploymentType, UserRole, WorkLocation, EmployeeStatus, PMRole } from "@/types/database";

// ─── Validation helpers ────────────────────────────────────────────────────

async function validateEmail(email: string): Promise<string | null> {
  console.log('🔍 Starting comprehensive email validation for:', email);
  
  // Basic format validation first
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Invalid email format";
  }

  const [localPart, domain] = email.split('@');
  const domainLower = domain.toLowerCase();
  const localPartLower = localPart.toLowerCase();
  
  // Suggest corrections for common typos
  const typoSuggestions: Record<string, string> = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com', 
    'yahooo.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
    'icould.com': 'icloud.com'
  };

  if (typoSuggestions[domainLower]) {
    return `Did you mean ${email.replace(domainLower, typoSuggestions[domainLower])}?`;
  }

  // Enhanced domain validation - check for obviously fake domains
  const suspiciousDomains = [
    'example.com', 'test.com', 'fake.com', 'dummy.com', 
    'placeholder.com', 'sample.com', 'invalid.com',
    'noemail.com', 'notemail.com', 'fakemail.com'
  ];

  if (suspiciousDomains.includes(domainLower)) {
    console.log('❌ Blocked: Suspicious domain detected');
    return "This appears to be a placeholder or test email address";
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🛡️ PRIMARY VALIDATION: Enhanced Pattern-Based Validation
  // ═══════════════════════════════════════════════════════════════════
  
  console.log('🔍 Applying comprehensive pattern validation...');
  
  const knownPersonalProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
  
  if (knownPersonalProviders.includes(domainLower)) {
    console.log('🔍 Applying strict validation for known provider:', domainLower);
    
    // 1. Block obviously fake names and test patterns
    const obviousFakeNames = [
      'omar', 'test', 'fake', 'demo', 'sample', 'temp', 'admin', 
      'user', 'email', 'name', 'john', 'jane', 'foo', 'bar',
      'abc', 'xyz', 'qwerty', 'asdf', 'hello', 'world', 'null',
      'undefined', 'dummy', 'placeholder', 'example', 'noone',
      'nobody', 'noreply', 'invalid', 'testuser', 'fakeuser',
      'contact', 'info', 'mail', 'webmaster', 'postmaster'
    ];
    
    if (obviousFakeNames.includes(localPartLower)) {
      console.log('❌ Pattern Blocked: Obvious fake name detected');
      return "This email address appears to be for testing purposes and is not allowed";
    }

    // 2. Block suspicious patterns with stricter rules
    const strictPatterns = [
      /^test/i, /^fake/i, /^dummy/i, /^sample/i, /^example/i,
      /^user\d*$/i, /^admin\d*$/i, /^email\d*$/i, /^name\d*$/i,
      /^noname/i, /^nobody/i, /^temp/i, /^omar$/i,
      /^[a-z]{1,3}$/i,  // Very short names (1-3 chars)
      /^\d+$/,          // Numbers only
      /^[a-z]\d+$/i,    // Single letter + numbers
      /^(aa+|bb+|cc+|dd+|ee+)$/i  // Repeated letters
    ];
    
    if (strictPatterns.some(pattern => pattern.test(localPartLower))) {
      console.log('❌ Pattern Blocked: Suspicious pattern detected');
      return "This email address appears to be invalid or for testing purposes";
    }

    // 3. Block emails that are too short for real people
    if (localPartLower.length < 4) {
      console.log('❌ Pattern Blocked: Email too short');
      return "Email address appears too short to be valid";
    }

    // 4. Block keyboard patterns and obviously fake combinations
    const keyboardPatterns = [
      'qwerty', 'asdf', 'zxcv', 'hjkl', 'yuiop', 
      '123456', 'abcdef', 'qwertyuiop', 'asdfgh'
    ];
    
    if (keyboardPatterns.some(pattern => localPartLower.includes(pattern))) {
      console.log('❌ Pattern Blocked: Keyboard pattern detected');
      return "Email address appears to be invalid or for testing purposes";
    }

    // 5. Block emails with suspicious characteristics
    const hasVowels = /[aeiou]/i.test(localPartLower);
    const hasRepeatedChars = /(.)\1{2,}/.test(localPartLower);
    
    if (!hasVowels && localPartLower.length < 6) {
      console.log('❌ Pattern Blocked: No vowels in short email');
      return "Email address appears to be invalid";
    }
    
    if (hasRepeatedChars) {
      console.log('❌ Pattern Blocked: Too many repeated characters');
      return "Email address appears to be invalid";
    }

    // 6. Advanced blocking for common fake email patterns
    const advancedFakePatterns = [
      /^(notexist|notreal|invalid|fake|test|temp|dummy).*@/i,
      /.*test.*@gmail\.com$/i,
      /.*fake.*@(gmail|yahoo|hotmail|outlook)\.com$/i,
      /^(a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z)@/i, // Single letters
    ];
    
    if (advancedFakePatterns.some(pattern => pattern.test(email))) {
      console.log('❌ Advanced Pattern Blocked: Fake email pattern detected');
      return "This email address appears to be invalid or for testing purposes";
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🔄 PRIMARY API VALIDATION: EmailVerify.io 
  // ═══════════════════════════════════════════════════════════════════
  
  try {
    const emailVerifyKey = process.env.EMAILVERIFY_API_KEY;
    if (emailVerifyKey && emailVerifyKey.length > 10) {
      console.log('🔍 Using EmailVerify.io API for validation...');
      
      // Use the correct endpoint from the documentation
      const apiUrl = `https://app.emailverify.io/api/v1/validate?key=${emailVerifyKey}&email=${encodeURIComponent(email)}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MindVista-HRMS/1.0'
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000) // 10 seconds timeout
      });
      
      console.log('📧 EmailVerify.io API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📧 EmailVerify.io API response:', JSON.stringify(data, null, 2));
        
        // According to the docs and test results:
        // status: "valid" + sub_status: "permitted" = email exists and can receive emails
        // status: "invalid" + various sub_status = email does not exist 
        // status: "role_based" = generic business email (info@, support@, etc.)
        if (data.status === "valid" && data.sub_status === "permitted") {
          console.log('✅ EmailVerify.io: Email is valid and deliverable');
          return null; // Email is valid and exists
        } else if (data.status === "invalid") {
          console.log('❌ EmailVerify.io: Email does not exist or cannot receive emails');
          console.log(`   Sub-status: ${data.sub_status}`);
          return "This email address does not exist or cannot receive emails";
        } else if (data.status === "role_based") {
          console.log('✅ EmailVerify.io: Role-based email (business/generic email)');
          // Role-based emails are typically valid business emails like info@, support@, contact@
          return null; // Allow role-based emails 
        } else {
          console.log('⚠️ EmailVerify.io: Uncertain status, proceeding with pattern validation');
          console.log(`   Status: ${data.status}, Sub-status: ${data.sub_status}`);
          // Continue to pattern validation for uncertain cases
        }
      } else {
        const errorText = await response.text();
        console.error('❌ EmailVerify.io API error:', response.status, errorText);
        
        // Check for specific error messages
        if (errorText.includes("Invalid API Key")) {
          console.error('❌ EmailVerify.io: Invalid API Key');
        } else if (errorText.includes("0 credits remaining")) {
          console.error('❌ EmailVerify.io: No credits remaining');
        }
        
        // Continue with pattern validation as fallback
        console.log('⚠️ Falling back to pattern validation due to API error');
      }
    } else {
      console.log('⚠️ EmailVerify.io API key not configured or invalid');
    }
  } catch (error) {
    console.error('EmailVerify.io API validation failed:', error.message);
    console.log('⚠️ Falling back to pattern validation');
    // Continue with other validations - don't fail the entire process
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🔄 BACKUP VALIDATION: MailboxValidator API (if available)
  // ═══════════════════════════════════════════════════════════════════
  
  try {
    const mailboxValidatorKey = process.env.MAILBOX_VALIDATOR_API_KEY;
    if (mailboxValidatorKey && mailboxValidatorKey.length > 10) {
      console.log('🔍 Trying MailboxValidator API as backup...');
      const response = await fetch(`https://api.mailboxvalidator.com/v2/validation/single?key=${mailboxValidatorKey}&format=json&email=${encodeURIComponent(email)}`, {
        signal: AbortSignal.timeout(5000)
      });
      const data = await response.json();
      
      if (!data.error) {
        console.log('📧 MailboxValidator API success:', JSON.stringify(data, null, 2));
        
        if (data.is_syntax === false || data.is_verified === false || data.is_domain === false) {
          console.log('❌ Blocked by MailboxValidator API');
          return "This email address does not exist or cannot receive emails";
        }
      } else {
        console.warn('MailboxValidator API error:', data.error?.error_message || 'Unknown error');
      }
    }
  } catch (error) {
    console.warn('MailboxValidator API error:', error.message);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🌐 FINAL CHECK: DNS MX Record Validation
  // ═══════════════════════════════════════════════════════════════════
  
  try {
    console.log('🔍 Checking DNS MX records for:', domainLower);
    const dnsResponse = await fetch(`https://dns.google/resolve?name=${domainLower}&type=MX`, {
      signal: AbortSignal.timeout(5000)
    });
    const dnsData = await dnsResponse.json();
    
    if (!dnsData.Answer || dnsData.Answer.length === 0) {
      console.log('❌ Blocked: No MX records found for domain');
      return "Email domain does not exist or cannot receive emails";
    } else {
      console.log('✅ DNS MX records found for domain');
    }
  } catch (error) {
    console.warn('DNS MX check failed:', error.message);
  }

  console.log('✅ Email passed all validation checks');
  return null;
}

function validateDob(dob: string | null): string | null {
  if (!dob) return "Date of birth is required";
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return "Invalid date of birth";
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const actualAge =
    monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ? age - 1
      : age;
  if (actualAge < 18) return "Employee must be at least 18 years old";
  return null;
}

function validateCnic(cnic: string | null): string | null {
  if (!cnic) return "CNIC is required";
  if (!/^\d{5}-\d{7}-\d{1}$/.test(cnic)) return "CNIC must be in format: 12345-1234567-1";
  return null;
}

export async function createEmployee(formData: FormData) {
  const employee = await requireAuth();
  
  // Allow admin, hr, developer roles OR legacy pm_role admin
  const hasAccess = employee.role === "admin" || 
                   employee.role === "hr" || 
                   employee.role === "developer" ||
                   employee.pm_role === "admin";
                   
  if (!hasAccess) {
    return { error: "Insufficient permissions" };
  }

  const adminClient = createAdminClient();
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;

  // Server-side validation
  const emailError = await validateEmail(email);
  if (emailError) return { error: emailError };

  const dobError = validateDob(formData.get("date_of_birth") as string | null);
  if (dobError) return { error: dobError };

  const cnicError = validateCnic(formData.get("cnic_number") as string | null);
  if (cnicError) return { error: cnicError };

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (authError) {
    console.error("Auth Error in createEmployee:", authError);
    return { error: authError.message };
  }

  const { error } = await supabase.from("employees").insert({
    user_id: authData.user.id,
    // employee_code is auto-assigned by DB trigger (5-digit unique-digit code)
    full_name: fullName,
    email,
    phone: (formData.get("phone") as string) || null,
    cnic_number: (formData.get("cnic_number") as string) || null,
    date_of_birth: (formData.get("date_of_birth") as string) || null,
    designation: (formData.get("designation") as string) || "Employee",
    department_id: (formData.get("department_id") as string) || null,
    manager_id: (formData.get("manager_id") as string) || null,
    lead_id: (formData.get("lead_id") as string) || null,
    employment_type: (formData.get("employment_type") as EmploymentType) || "full_time",
    work_location: (formData.get("work_location") as WorkLocation) || "onsite",
    role: (formData.get("role") as UserRole) || "employee",
    pm_role: (formData.get("pm_role") as PMRole) || "developer",
    joining_date: (formData.get("joining_date") as string) || new Date().toISOString().split("T")[0],
    basic_salary: formData.get("basic_salary")
      ? parseFloat(formData.get("basic_salary") as string)
      : null,
    allowances: formData.get("allowances")
      ? parseFloat(formData.get("allowances") as string)
      : 0,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/employees");
  return { success: true };
}

export async function updateEmployee(employeeId: string, formData: FormData) {
  const caller = await requireRole("admin");

  // Server-side validation
  const dobError = validateDob(formData.get("date_of_birth") as string | null);
  if (dobError) return { error: dobError };

  const cnicError = validateCnic(formData.get("cnic_number") as string | null);
  if (cnicError) return { error: cnicError };

  const supabase = await createClient();

  // Salary fields are restricted to admin callers only
  const isAdminCaller = caller.role === "admin";

  const { error } = await supabase
    .from("employees")
    .update({
      employee_code: (formData.get("employee_code") as string) || null,
      full_name: formData.get("full_name") as string,
      phone: (formData.get("phone") as string) || null,
      address: (formData.get("address") as string) || null,
      designation: formData.get("designation") as string,
      department_id: (formData.get("department_id") as string) || null,
      manager_id: (formData.get("manager_id") as string) || null,
      lead_id: (formData.get("lead_id") as string) || null,
      employment_type: formData.get("employment_type") as EmploymentType,
      work_location: formData.get("work_location") as WorkLocation,
      status: formData.get("status") as EmployeeStatus,
      role: formData.get("role") as UserRole,
      pm_role: formData.get("pm_role") as PMRole,
      cnic_number: (formData.get("cnic_number") as string) || null,
      date_of_birth: (formData.get("date_of_birth") as string) || null,
      joining_date: (formData.get("joining_date") as string) || undefined,
      emergency_contact_name: (formData.get("emergency_contact_name") as string) || null,
      emergency_contact_phone: (formData.get("emergency_contact_phone") as string) || null,
      // Only update salary fields if the caller is admin
      ...(isAdminCaller && {
        basic_salary: formData.get("basic_salary")
          ? parseFloat(formData.get("basic_salary") as string)
          : null,
        allowances: formData.get("allowances")
          ? parseFloat(formData.get("allowances") as string)
          : 0,
      }),
    })
    .eq("id", employeeId);

  if (error) return { error: error.message };

  revalidatePath("/admin/employees");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateProfile(formData: FormData) {
  const employee = await getCurrentEmployee();
  if (!employee) return { error: "Not authenticated" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("employees")
    .update({
      phone: (formData.get("phone") as string) || null,
      address: (formData.get("address") as string) || null,
      emergency_contact_name: (formData.get("emergency_contact_name") as string) || null,
      emergency_contact_phone: (formData.get("emergency_contact_phone") as string) || null,
    })
    .eq("id", employee.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { success: true };
}
