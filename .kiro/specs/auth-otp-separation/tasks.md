# Implementation Plan - OTP Type Separation Bugfix

## Overview

This implementation plan follows the exploratory bugfix workflow:
1. **Explore** - Write tests to surface the bug before fixing
2. **Preserve** - Write tests for non-buggy behavior to ensure no regressions
3. **Implement** - Apply the fix with understanding
4. **Validate** - Verify fix works and doesn't break anything

---

## Phase 1: Bug Condition Exploration

- [x] 1. Write bug condition exploration test - OTP Type Mismatch
  - **Property 1: Bug Condition** - OTP Type Mismatch Detection
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate OTPs can be misused across different purposes
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to concrete failing cases:
    - Email verification OTP used for password reset
    - Password reset OTP used for email verification
  - Test implementation details from Bug Condition in design:
    - Generate email verification OTP for user@example.com
    - Attempt to use it for password reset (should fail on fixed code)
    - Generate password reset OTP for user@example.com
    - Attempt to use it for email verification (should fail on fixed code)
  - The test assertions should match the Expected Behavior Properties from design
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause:
    - "Email verification OTP can be used for password reset on unfixed code"
    - "Password reset OTP can be used for email verification on unfixed code"
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2, 2.5, 2.6_

- [x] 2. Write bug condition exploration test - Synchronous Email Blocking
  - **Property 1: Bug Condition** - Synchronous Email Blocking Detection
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **GOAL**: Surface counterexample that email sending blocks API response
  - **Scoped PBT Approach**: Measure registration endpoint response time
  - Test implementation details from Bug Condition in design:
    - Call registration endpoint with valid email
    - Measure response time
    - Verify that response time includes email sending delay (1-3 seconds)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS - response time is > 1 second (proves synchronous blocking)
  - Document counterexample found:
    - "Registration endpoint takes 1-3 seconds due to synchronous email sending"
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.3, 2.4_

---

## Phase 2: Preservation Tests

- [x] 3. Write preservation property tests - Valid OTP Verification
  - **Property 2: Preservation** - Valid OTP Verification Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for valid OTP verification:
    - Generate valid email verification OTP
    - Verify it works correctly (email marked as verified)
    - Generate valid password reset OTP
    - Verify it works correctly (password updated)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - For all valid email verification OTPs: verification succeeds and user email is marked verified
    - For all valid password reset OTPs: verification succeeds and user password is updated
    - For all valid OTPs: OTP is deleted after successful use
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Write preservation property tests - Invalid/Expired OTP Rejection
  - **Property 2: Preservation** - Invalid/Expired OTP Rejection Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for invalid/expired OTPs:
    - Attempt to verify with invalid OTP code
    - Attempt to verify with expired OTP
    - Attempt to verify with non-existent email
  - Write property-based tests capturing observed behavior patterns:
    - For all invalid OTPs: verification fails with appropriate error
    - For all expired OTPs: verification fails with expiration error
    - For all non-existent emails: generic success message returned (prevent enumeration)
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.5, 3.6, 3.7_

- [x] 5. Write preservation property tests - User Authentication Flows
  - **Property 2: Preservation** - User Authentication Flow Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for complete authentication flows:
    - User registration with email verification
    - User login after email verification
    - User password reset
    - User login with new password
    - User login with correct credentials (non-OTP flow)
  - Write property-based tests capturing observed behavior patterns:
    - For all valid registration flows: user can log in after email verification
    - For all valid password reset flows: user can log in with new password
    - For all valid login attempts with correct credentials: authentication succeeds
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7_

---

## Phase 3: Implementation

- [x] 6. Implement OTP type separation fix

  - [x] 6.1 Create database migration to add type column
    - Create migration file: `database/migrations/YYYY_MM_DD_HHMMSS_add_type_to_otp_tokens_table.php`
    - Add `type` column as enum with values "email_verification" and "password_reset"
    - Add index on (email, type) for efficient lookups
    - Make type non-nullable with default value "email_verification" for backward compatibility
    - Add down() method to drop the column
    - _Bug_Condition: isBugCondition(input) where otp_tokens.type IS NULL_
    - _Expected_Behavior: OTP type is stored and can be validated_
    - _Preservation: Existing OTP records continue to work with default type_
    - _Requirements: 2.1, 2.2_

  - [x] 6.2 Update OTPToken model with type field and constants
    - Update `backend/app/Models/OTPToken.php`
    - Add `type` to `$fillable` array
    - Add `type` to `$casts` array (as string or enum if using Laravel 11+)
    - Add constants: `TYPE_EMAIL_VERIFICATION = 'email_verification'` and `TYPE_PASSWORD_RESET = 'password_reset'`
    - Add validation rules for type field
    - _Bug_Condition: isBugCondition(input) where OTPToken lacks type field_
    - _Expected_Behavior: OTPToken model can store and retrieve type_
    - _Preservation: Existing OTPToken functionality unchanged_
    - _Requirements: 2.1, 2.2_

  - [x] 6.3 Update AuthService to generate OTPs with type
    - Update `backend/app/Services/AuthService.php`
    - Create new method `generateOTP(email, type)` that accepts type parameter
    - Update `createUserWithVerification()` to pass `type: OTPToken::TYPE_EMAIL_VERIFICATION`
    - Update `initiatePasswordReset()` to pass `type: OTPToken::TYPE_PASSWORD_RESET`
    - Ensure OTP is created with correct type in database
    - _Bug_Condition: isBugCondition(input) where OTP generated without type_
    - _Expected_Behavior: OTP generated with correct type_
    - _Preservation: Existing OTP generation logic preserved_
    - _Requirements: 2.1, 2.2_

  - [x] 6.4 Update AuthService to verify OTPs with type validation
    - Update `backend/app/Services/AuthService.php`
    - Update `verifyOTP()` to validate that OTP type is 'password_reset' before processing
    - Update `verifyRegistrationOTP()` to validate that OTP type is 'email_verification' before processing
    - Add type mismatch error handling
    - Ensure OTP is deleted after successful verification
    - _Bug_Condition: isBugCondition(input) where OTP verified without type check_
    - _Expected_Behavior: OTP verified only if type matches expected type_
    - _Preservation: Existing OTP verification logic preserved for matching types_
    - _Requirements: 2.5, 2.6_

  - [x] 6.5 Create SendOTPEmailJob queue job for async email sending
    - Create new file: `backend/app/Jobs/SendOTPEmailJob.php`
    - Extend `Illuminate\Bus\Queueable` and `Illuminate\Contracts\Queue\ShouldQueue`
    - Implement `handle()` method that sends OTP email
    - Add retry logic (max 3 retries)
    - Add timeout configuration (30 seconds)
    - Add failed job handling with logging
    - Accept user and OTP code as constructor parameters
    - _Bug_Condition: isBugCondition(input) where email sent synchronously_
    - _Expected_Behavior: Email sent asynchronously via queue_
    - _Preservation: Email content and delivery unchanged_
    - _Requirements: 2.3, 2.4_

  - [x] 6.6 Update MailService to dispatch queue jobs
    - Update `backend/app/Services/MailService.php`
    - Update `sendOTPEmail()` to dispatch `SendOTPEmailJob` instead of sending directly
    - Extract email sending logic to separate method that can be called by queue job
    - Return immediately without waiting for email delivery
    - _Bug_Condition: isBugCondition(input) where email sent synchronously_
    - _Expected_Behavior: Email queued for async delivery, response returns immediately_
    - _Preservation: Email content and delivery mechanism unchanged_
    - _Requirements: 2.3, 2.4_

  - [x] 6.7 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - OTP Type Mismatch Prevention
    - **IMPORTANT**: Re-run the SAME tests from tasks 1 and 2 - do NOT write new tests
    - The tests from tasks 1 and 2 encode the expected behavior
    - When these tests pass, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from task 1 (OTP Type Mismatch)
    - **EXPECTED OUTCOME**: Test PASSES (confirms OTP type mismatch is prevented)
    - Run bug condition exploration test from task 2 (Synchronous Email Blocking)
    - **EXPECTED OUTCOME**: Test PASSES (confirms email is sent asynchronously)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 6.8 Verify preservation tests still pass
    - **Property 2: Preservation** - All Preservation Tests
    - **IMPORTANT**: Re-run the SAME tests from tasks 3, 4, and 5 - do NOT write new tests
    - Run preservation property tests from task 3 (Valid OTP Verification)
    - **EXPECTED OUTCOME**: Test PASSES (confirms valid OTP behavior unchanged)
    - Run preservation property tests from task 4 (Invalid/Expired OTP Rejection)
    - **EXPECTED OUTCOME**: Test PASSES (confirms rejection behavior unchanged)
    - Run preservation property tests from task 5 (User Authentication Flows)
    - **EXPECTED OUTCOME**: Test PASSES (confirms authentication flows unchanged)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

---

## Phase 4: Integration Testing

- [x] 7. Write integration tests for complete registration flow
  - Create test file: `backend/tests/Feature/Auth/RegistrationWithOTPTest.php`
  - Test complete registration flow with email verification:
    - User submits registration form with email
    - System generates email verification OTP
    - Email is queued for async delivery
    - User receives OTP in email
    - User submits OTP for verification
    - User email is marked as verified
    - User can log in with credentials
  - Verify OTP type is "email_verification" in database
  - Verify OTP cannot be used for password reset
  - Verify email is sent asynchronously (response is fast)
  - _Requirements: 3.1, 3.3, 3.4_

- [x] 8. Write integration tests for complete password reset flow
  - Create test file: `backend/tests/Feature/Auth/PasswordResetWithOTPTest.php`
  - Test complete password reset flow:
    - User submits password reset request with email
    - System generates password reset OTP
    - Email is queued for async delivery
    - User receives OTP in email
    - User submits OTP and new password
    - User password is updated
    - User can log in with new password
  - Verify OTP type is "password_reset" in database
  - Verify OTP cannot be used for email verification
  - Verify email is sent asynchronously (response is fast)
  - _Requirements: 3.2, 3.3, 3.4_

- [x] 9. Write integration tests for OTP type validation
  - Create test file: `backend/tests/Feature/Auth/OTPTypeValidationTest.php`
  - Test OTP type mismatch scenarios:
    - Generate email verification OTP, attempt to use for password reset (should fail)
    - Generate password reset OTP, attempt to use for email verification (should fail)
    - Generate multiple OTPs for same email, verify each has correct type
    - Verify error messages are appropriate for type mismatches
  - _Requirements: 2.5, 2.6_

- [x] 10. Write integration tests for async email sending performance
  - Create test file: `backend/tests/Feature/Auth/AsyncEmailPerformanceTest.php`
  - Test that email sending does not block API response:
    - Measure registration endpoint response time
    - Verify response time is < 500ms (no email sending delay)
    - Verify email is queued in queue table
    - Verify email is eventually sent by queue worker
    - Test with multiple concurrent requests
  - _Requirements: 2.3, 2.4_

- [x] 11. Write integration tests for queue job retry logic
  - Create test file: `backend/tests/Feature/Jobs/SendOTPEmailJobTest.php`
  - Test SendOTPEmailJob queue job:
    - Job successfully sends email on first attempt
    - Job retries on failure (max 3 retries)
    - Job logs failures appropriately
    - Job handles invalid user/OTP gracefully
  - _Requirements: 2.3, 2.4_

---

## Phase 5: Checkpoint

- [x] 12. Checkpoint - Ensure all tests pass
  - Run all unit tests: `php artisan test --filter=OTP`
  - Run all integration tests: `php artisan test tests/Feature/Auth/`
  - Run all property-based tests
  - Verify no regressions in existing tests
  - Verify database migration runs successfully
  - Verify queue jobs are dispatched and processed correctly
  - Ensure all tests pass, ask the user if questions arise
  - _Requirements: All_
