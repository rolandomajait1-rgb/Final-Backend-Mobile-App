# Authentication OTP Separation Bugfix

## Introduction

The authentication system currently uses a single OTP token system for both email verification during registration and password reset flows. This creates confusion, inefficiency, and security concerns. Additionally, email sending is synchronous and blocks API responses, causing slow registration and password reset endpoints. This bugfix separates the OTP system into two distinct types with async email delivery to improve performance and security.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user registers with an email address THEN the system generates a single OTP token that can be used for both email verification and password reset, creating ambiguity about the OTP's purpose

1.2 WHEN a user initiates password reset THEN the system generates an OTP token using the same table and logic as registration verification, making it impossible to distinguish between the two flows

1.3 WHEN the system sends an OTP email during registration THEN the email sending is synchronous and blocks the API response, causing the registration endpoint to be slow

1.4 WHEN the system sends an OTP email during password reset THEN the email sending is synchronous and blocks the API response, causing the password reset endpoint to be slow

1.5 WHEN a user receives an OTP for email verification THEN the OTP can technically be used to trigger a password reset flow if the user manually calls the password reset endpoint with that OTP, creating a security concern

### Expected Behavior (Correct)

2.1 WHEN a user registers with an email address THEN the system generates an OTP token specifically marked as type "email_verification" that can ONLY be used to verify the email during registration

2.2 WHEN a user initiates password reset THEN the system generates an OTP token specifically marked as type "password_reset" that can ONLY be used to reset the password

2.3 WHEN the system sends an OTP email during registration THEN the email sending is asynchronous and does NOT block the API response, allowing the registration endpoint to return quickly

2.4 WHEN the system sends an OTP email during password reset THEN the email sending is asynchronous and does NOT block the API response, allowing the password reset endpoint to return quickly

2.5 WHEN a user attempts to use an email verification OTP for password reset THEN the system SHALL reject the request because the OTP type does not match the requested operation

2.6 WHEN a user attempts to use a password reset OTP for email verification THEN the system SHALL reject the request because the OTP type does not match the requested operation

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user successfully verifies their email with a valid OTP THEN the system SHALL CONTINUE TO mark the user's email as verified and allow them to log in

3.2 WHEN a user successfully resets their password with a valid OTP THEN the system SHALL CONTINUE TO update the user's password and allow them to log in with the new password

3.3 WHEN a user provides an invalid or expired OTP THEN the system SHALL CONTINUE TO reject the verification or reset request with an appropriate error message

3.4 WHEN a user provides a valid OTP THEN the system SHALL CONTINUE TO delete the OTP token after successful verification to prevent reuse

3.5 WHEN a user requests password reset for a non-existent email THEN the system SHALL CONTINUE TO return a generic success message to prevent user enumeration

3.6 WHEN a user requests email verification resend for a non-existent email THEN the system SHALL CONTINUE TO return a generic success message to prevent user enumeration

3.7 WHEN a user logs in with correct credentials THEN the system SHALL CONTINUE TO authenticate them successfully regardless of the OTP system changes

3.8 WHEN a user changes their password while logged in THEN the system SHALL CONTINUE TO work correctly without requiring OTP verification
