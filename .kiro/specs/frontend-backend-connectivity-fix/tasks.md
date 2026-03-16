# Implementation Plan: Frontend-Backend Connectivity Fix

## Phase 1: Bug Condition Exploration

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Authenticated API Requests with Bearer Tokens
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test implementation details from Bug Condition in design:
    - Simulate OPTIONS preflight request from `http://localhost:5173` to `/api/user`
    - Assert response includes `Access-Control-Allow-Origin: http://localhost:5173`
    - Assert response includes `Access-Control-Allow-Headers: Authorization`
    - Simulate GET request to `/api/user` with `Authorization: Bearer <valid_token>` from `http://localhost:5173`
    - Assert request succeeds with 200 status
    - Simulate POST request to `/api/articles/drafts` with Bearer token from `http://localhost:5173`
    - Assert request is processed and returns appropriate response
  - The test assertions should match the Expected Behavior Properties from design (Requirements 2.1, 2.2, 2.3, 2.4, 2.5)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause:
    - CORS preflight request returns 404 or missing CORS headers
    - Authorization header is not included in the actual request
    - Sanctum token validation fails because preflight request was blocked
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

## Phase 2: Preservation Testing

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Public and Non-Authenticated Requests
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs:
    - Observe: `/api/articles/public` returns data without authentication
    - Observe: `/api/categories` returns data without authentication
    - Observe: `/api/login` with rate limiting continues to enforce limits
    - Observe: Request with invalid token returns 401 Unauthorized
    - Observe: Request from disallowed origin is blocked with CORS error
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - Public endpoints work without authentication (Requirements 3.1)
    - Rate limiting is enforced on protected endpoints (Requirements 3.2)
    - Invalid tokens return 401 Unauthorized (Requirements 3.3)
    - Disallowed origins are blocked (Requirements 3.4)
    - Development origin `http://localhost:5173` is allowed (Requirements 3.5)
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

## Phase 3: Implementation

- [x] 3. Fix for Frontend-Backend Connectivity

  - [x] 3.1 Register CORS middleware in backend/bootstrap/app.php
    - Add CORS middleware registration to the middleware configuration
    - This ensures preflight OPTIONS requests are handled with proper CORS headers
    - The middleware will allow the Authorization header through for Bearer token authentication
    - Verify `config/cors.php` includes `http://localhost:5173` in allowed origins
    - Verify `config/cors.php` includes all required methods (GET, POST, PUT, DELETE, PATCH, OPTIONS)
    - _Bug_Condition: corsMiddlewareNotRegistered() from design_
    - _Expected_Behavior: Backend SHALL respond with proper CORS headers allowing requests to proceed (Requirements 2.1, 2.4)_
    - _Preservation: Public endpoints and rate limiting SHALL continue to work (Requirements 3.1, 3.2)_
    - _Requirements: 2.1, 2.4, 3.1, 3.2_

  - [x] 3.2 Fix axios configuration in frontend/src/utils/axiosConfig.js
    - Remove `axios.defaults.withCredentials = true` because it conflicts with Bearer token authentication
    - Bearer token authentication does not require credentials mode
    - This prevents CORS errors related to credentials mode conflicts
    - Verify the axios interceptor correctly adds `Authorization: Bearer <token>` header
    - Ensure the token is retrieved from localStorage before each request
    - _Bug_Condition: withCredentialsConflictExists() from design_
    - _Expected_Behavior: Frontend SHALL send Bearer token in Authorization header without conflicting credentials mode (Requirements 2.2, 2.3)_
    - _Preservation: Public endpoints and non-authenticated requests SHALL continue to work (Requirements 3.1, 3.5)_
    - _Requirements: 2.2, 2.3, 3.1, 3.5_

  - [x] 3.3 Verify Sanctum and CORS configuration
    - Confirm `backend/config/sanctum.php` stateful domains include `localhost:5173`
    - Confirm `backend/config/sanctum.php` guard is set to `['web']` for Bearer token validation
    - Confirm `backend/config/cors.php` supports Bearer token authentication correctly
    - Verify that token validation works correctly after CORS middleware is registered
    - _Expected_Behavior: Backend SHALL validate Sanctum tokens successfully (Requirements 2.2, 2.4)_
    - _Preservation: Invalid tokens SHALL continue to return 401 Unauthorized (Requirements 3.3)_
    - _Requirements: 2.2, 2.4, 3.3_

  - [x] 3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Authenticated API Requests with Bearer Tokens
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify that CORS preflight requests are handled correctly
    - Verify that Bearer tokens are accepted and validated
    - Verify that protected resources are accessible with valid tokens
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Public and Non-Authenticated Requests
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)
    - Verify public endpoints continue to work without authentication
    - Verify rate limiting continues to be enforced
    - Verify invalid tokens continue to return 401 Unauthorized
    - Verify disallowed origins continue to be blocked
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

## Phase 4: Validation

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise
  - Verify bug condition exploration test passes (confirms bug is fixed)
  - Verify preservation tests pass (confirms no regressions)
  - Verify integration tests pass (confirms full login and API flow works)
  - Document any issues or unexpected behavior
