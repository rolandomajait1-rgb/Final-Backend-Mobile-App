# Authentication OTP Separation Bugfix Design

## Overview

This design formalizes the fix for separating OTP types and implementing async email sending in the authentication system. The bug manifests when the system uses a single OTP token type for both email verification and password reset flows, creating security and performance issues. The fix introduces a `type` column to the `otp_tokens` table to distinguish between "email_verification" and "password_reset" OTPs, and implements async email sending using Laravel's queue system to prevent API response blocking.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when an OTP is generated without a type distinction, or when email sending blocks the API response
- **Property (P)**: The desired behavior when OTP type separation is implemented - OTPs can only be used for their intended purpose, and emails are sent asynchronously
- **Preservation**: Existing email verification, password reset, and login functionality that must remain unchanged by the fix
- **OTPToken**: The model in `backend/app/Models/OTPToken.php` that stores OTP tokens with email, code, expiration, and now type
- **AuthService**: The service in `backend/app/Services/AuthService.php` that handles OTP generation and verification
- **MailService**: The service in `backend/app/Services/MailService.php` that sends emails (currently synchronous)
- **type column**: New enum column in `otp_tokens` table with values "email_verification" or "password_reset"
- **Queue Job**: Async job that sends emails without blocking the API response

## Bug Details

### Bug Condition

The bug manifests when:
1. A user registers and receives an OTP for email verification, but that same OTP could theoretically be used for password reset
2. A user initiates password reset and receives an OTP, but that OTP could theoretically be used for email verification
3. The system sends OTP emails synchronously, blocking the API response and causing slow registration/password reset endpoints

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type OTPGenerationRequest or EmailSendingRequest
  OUTPUT: boolean
  
  RETURN (input.operation IN ['email_verification', 'password_reset']
          AND otp_tokens.type IS NULL)
         OR (input.operation = 'send_email'
             AND emailSending.isAsynchronous = FALSE)
END FUNCTION
```

### Examples

**Example 1: OTP Type Ambiguity**
- User registers with email "user@example.com"
- System generates OTP "123456" without type distinction
- User could manually call password reset endpoint with same OTP
- Expected: OTP should only work for email verification
- Actual: OTP could be misused for password reset

**Example 2: Synchronous Email Blocking**
- User calls registration endpoint with email "user@example.com"
- System generates OTP and sends email synchronously
- API response is delayed by email sending time (1-3 seconds)
- Expected: Email should be sent asynchronously, response returns immediately
- Actual: Response is blocked until email is sent

**Example 3: Password Reset OTP Misuse**
- User initiates password reset for "user@example.com"
- System generates OTP "654321" without type distinction
- User could manually call email verification endpoint with same OTP
- Expected: OTP should only work for password reset
- Actual: OTP could be misused for email verification

**Example 4: Edge Case - Multiple OTPs**
- User registers and receives OTP for email verification
- User immediately requests password reset
- System generates second OTP for password reset
- Without type distinction, both OTPs are ambiguous
- Expected: Each OTP has clear purpose and can only be used for that purpose
- Actual: Both OTPs are interchangeable

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Email verification during registration must continue to work exactly as before
- Password reset flow must continue to work exactly as before
- User login with correct credentials must continue to work
- User password change while logged in must continue to work
- Invalid/expired OTP rejection must continue to work
- OTP deletion after successful use must continue to work
- Generic success messages for non-existent emails must continue to work (prevent user enumeration)

**Scope:**
All inputs that do NOT involve OTP type separation or async email sending should be completely unaffected by this fix. This includes:
- Direct password login
- User profile updates
- Article management
- All non-authentication endpoints

## Hypothesized Root Cause

Based on the bug description, the issues are:

1. **Missing Type Column**: The `otp_tokens` table lacks a `type` column to distinguish between email verification and password reset OTPs
   - Current schema only has: id, email, otp, expires_at, created_at, updated_at
   - No way to enforce OTP purpose at database level
   - Verification logic must check type before processing

2. **Synchronous Email Sending**: The `MailService.sendOTPEmail()` method sends emails synchronously
   - Email sending is called directly in the request lifecycle
   - Network delays to email provider block the API response
   - No queue job exists to handle async email delivery

3. **Insufficient Verification Logic**: `AuthService.verifyOTP()` and `verifyRegistrationOTP()` don't validate OTP type
   - Methods only check email and OTP code
   - No type validation before processing
   - Same OTP could be used for multiple purposes

4. **No Queue Job Infrastructure**: No Laravel queue job exists for sending OTP emails
   - Email sending is tightly coupled to request handling
   - No retry mechanism for failed emails
   - No way to defer email sending

## Correctness Properties

Property 1: Bug Condition - OTP Type Enforcement

_For any_ OTP generation request where the operation is either "email_verification" or "password_reset", the fixed system SHALL store the OTP with the corresponding type in the database, and the fixed verification methods SHALL reject any attempt to use an OTP with a mismatched type.

**Validates: Requirements 2.1, 2.2, 2.5, 2.6**

Property 2: Async Email Sending

_For any_ OTP email sending request, the fixed system SHALL queue the email for asynchronous delivery and return the API response immediately without waiting for the email to be sent, reducing API response time.

**Validates: Requirements 2.3, 2.4**

Property 3: Preservation - Email Verification Flow

_For any_ valid email verification OTP that is used to verify a user's email, the fixed system SHALL mark the user's email as verified and allow them to log in, producing the same result as the original system.

**Validates: Requirements 3.1, 3.3, 3.4**

Property 4: Preservation - Password Reset Flow

_For any_ valid password reset OTP that is used to reset a user's password, the fixed system SHALL update the user's password and allow them to log in with the new password, producing the same result as the original system.

**Validates: Requirements 3.2, 3.3, 3.4**

Property 5: Preservation - Non-OTP Authentication

_For any_ login request with correct credentials, the fixed system SHALL authenticate the user successfully regardless of OTP system changes, producing the same result as the original system.

**Validates: Requirements 3.7**

Property 6: Preservation - User Enumeration Prevention

_For any_ password reset or email verification request for a non-existent email, the fixed system SHALL return a generic success message, producing the same result as the original system.

**Validates: Requirements 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File 1**: `backend/database/migrations/2026_03_19_create_otp_tokens_table.php`

**Change**: Create new migration to add `type` column to `otp_tokens` table
- Add `type` column as enum with values "email_verification" and "password_reset"
- Add index on (email, type) for efficient lookups
- Make type non-nullable with default value

**File 2**: `backend/app/Models/OTPToken.php`

**Changes**:
1. Add `type` to `$fillable` array
2. Add `type` to `$casts` array as enum (if using Laravel 11+) or string
3. Add constants for OTP types: `TYPE_EMAIL_VERIFICATION = 'email_verification'` and `TYPE_PASSWORD_RESET = 'password_reset'`

**File 3**: `backend/app/Services/AuthService.php`

**Changes**:
1. Update `createUserWithVerification()` to pass `type: 'email_verification'` when creating OTP
2. Update `initiatePasswordReset()` to pass `type: 'password_reset'` when creating OTP
3. Update `verifyOTP()` to validate that OTP type is 'password_reset' before processing
4. Update `verifyRegistrationOTP()` to validate that OTP type is 'email_verification' before processing
5. Update `sendOTPEmailAfterResponse()` to dispatch queue job instead of sending synchronously
6. Create new method `generateOTP()` that accepts type parameter

**File 4**: `backend/app/Services/MailService.php`

**Changes**:
1. Update `sendOTPEmail()` to dispatch `SendOTPEmailJob` queue job instead of sending directly
2. Keep the actual email sending logic in a separate method that can be called by the queue job

**File 5**: `backend/app/Jobs/SendOTPEmailJob.php` (NEW)

**Changes**:
1. Create new queue job class that extends `Queueable`
2. Implement `handle()` method that sends the OTP email
3. Add retry logic and timeout configuration
4. Add failed job handling

**File 6**: `backend/app/Http/Controllers/AuthController.php`

**Changes**:
1. No changes needed - controller already calls AuthService methods
2. Verify that error handling works with async email sending

### Implementation Details

**OTP Type Validation Logic:**
```
FUNCTION verifyOTP(email, otp, expectedType)
  otpRecord := database.query('SELECT * FROM otp_tokens WHERE email = ? AND otp = ?', email, otp)
  
  IF otpRecord IS NULL THEN
    RETURN error('Invalid OTP')
  END IF
  
  IF otpRecord.type != expectedType THEN
    RETURN error('OTP type mismatch')
  END IF
  
  IF otpRecord.expires_at < NOW() THEN
    RETURN error('OTP expired')
  END IF
  
  // Process verification
  DELETE FROM otp_tokens WHERE id = otpRecord.id
  RETURN success()
END FUNCTION
```

**Async Email Sending Logic:**
```
FUNCTION sendOTPEmailAsync(user, otp)
  job := new SendOTPEmailJob(user, otp)
  queue.dispatch(job)
  RETURN immediately (do not wait for email)
END FUNCTION
```

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that attempt to use OTPs with mismatched types and verify that the unfixed code allows this misuse. Also measure email sending time to confirm synchronous blocking.

**Test Cases**:
1. **OTP Type Mismatch - Email Verification OTP for Password Reset**: Generate email verification OTP, attempt to use it for password reset (will succeed on unfixed code, should fail on fixed code)
2. **OTP Type Mismatch - Password Reset OTP for Email Verification**: Generate password reset OTP, attempt to use it for email verification (will succeed on unfixed code, should fail on fixed code)
3. **Synchronous Email Blocking**: Measure registration endpoint response time with and without email sending (will be slow on unfixed code, fast on fixed code)
4. **Multiple OTPs Ambiguity**: Generate both email verification and password reset OTPs, verify they're indistinguishable (will be ambiguous on unfixed code, distinct on fixed code)

**Expected Counterexamples**:
- Email verification OTP can be used for password reset on unfixed code
- Password reset OTP can be used for email verification on unfixed code
- Registration endpoint takes 1-3 seconds longer due to email sending on unfixed code
- No type information stored in database on unfixed code

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  IF input.operation = 'email_verification' THEN
    otp := generateOTP_fixed(email, type='email_verification')
    result := verifyOTP_fixed(email, otp, expectedType='email_verification')
    ASSERT result.success = TRUE
    
    result2 := verifyOTP_fixed(email, otp, expectedType='password_reset')
    ASSERT result2.success = FALSE
  END IF
  
  IF input.operation = 'password_reset' THEN
    otp := generateOTP_fixed(email, type='password_reset')
    result := verifyOTP_fixed(email, otp, expectedType='password_reset')
    ASSERT result.success = TRUE
    
    result2 := verifyOTP_fixed(email, otp, expectedType='email_verification')
    ASSERT result2.success = FALSE
  END IF
  
  IF input.operation = 'send_email' THEN
    startTime := NOW()
    response := sendOTPEmail_fixed(user, otp)
    endTime := NOW()
    ASSERT (endTime - startTime) < 100ms  // Should return immediately
    ASSERT response.status = 'queued'
  END IF
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  result_original := originalFunction(input)
  result_fixed := fixedFunction(input)
  ASSERT result_original = result_fixed
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for valid OTP verification, then write property-based tests capturing that behavior to ensure the fixed code produces identical results.

**Test Cases**:
1. **Valid Email Verification OTP**: Generate valid email verification OTP, verify it works correctly on both original and fixed code
2. **Valid Password Reset OTP**: Generate valid password reset OTP, verify it works correctly on both original and fixed code
3. **Expired OTP Rejection**: Generate expired OTP, verify rejection on both original and fixed code
4. **Invalid OTP Rejection**: Use invalid OTP, verify rejection on both original and fixed code
5. **OTP Deletion After Use**: Verify OTP is deleted after successful use on both original and fixed code
6. **User Login After Email Verification**: Verify user can log in after email verification on both original and fixed code
7. **User Login After Password Reset**: Verify user can log in after password reset on both original and fixed code
8. **Non-Existent Email Handling**: Request OTP for non-existent email, verify generic success message on both original and fixed code

### Unit Tests

- Test OTP generation with correct type assignment
- Test OTP verification with type validation
- Test OTP type mismatch rejection
- Test expired OTP rejection
- Test invalid OTP rejection
- Test OTP deletion after successful verification
- Test queue job dispatch for email sending
- Test email sending does not block API response

### Property-Based Tests

- Generate random valid OTPs and verify they work correctly with matching type
- Generate random OTPs with mismatched types and verify rejection
- Generate random email addresses and verify OTP behavior is consistent
- Generate random expiration times and verify expiration logic
- Test that all valid email verification OTPs can only be used for email verification
- Test that all valid password reset OTPs can only be used for password reset
- Test that queue jobs are dispatched for all email sending operations

### Integration Tests

- Test complete registration flow with email verification using OTP
- Test complete password reset flow using OTP
- Test switching between email verification and password reset flows
- Test that email is actually sent asynchronously
- Test that API response is fast even with email sending
- Test that failed queue jobs are retried
- Test that user can log in after successful OTP verification
