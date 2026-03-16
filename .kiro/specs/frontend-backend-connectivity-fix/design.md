# Frontend-Backend Connectivity Fix - Bugfix Design

## Overview

The frontend-backend integration is failing due to missing CORS middleware registration in Laravel, improper Bearer token handling in axios configuration, and misaligned authentication setup. The fix involves three key changes: (1) registering the CORS middleware in `bootstrap/app.php`, (2) correcting axios configuration to properly send Bearer tokens while removing conflicting `withCredentials`, and (3) ensuring Sanctum token validation works correctly. This fix will enable authenticated API calls to succeed without CORS errors.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when the frontend attempts to make authenticated API requests to the backend across different origins
- **Property (P)**: The desired behavior when the bug condition is met - API requests should succeed with proper CORS headers and Bearer token authentication
- **Preservation**: Existing behavior for public endpoints, rate limiting, invalid tokens, and cross-origin blocking that must remain unchanged
- **CORS Middleware**: Laravel middleware that handles Cross-Origin Resource Sharing by responding to preflight OPTIONS requests with appropriate headers
- **Bearer Token**: Authentication token sent in the `Authorization: Bearer <token>` header for API authentication
- **Sanctum**: Laravel's lightweight API authentication package that validates Bearer tokens
- **withCredentials**: Axios configuration that sends cookies with requests; conflicts with Bearer token authentication when both are used together

## Bug Details

### Bug Condition

The bug manifests when the frontend makes API requests from `http://localhost:5173` to the backend at `http://localhost:8000` with Bearer token authentication. The requests fail because:
1. The CORS middleware is not registered in the Laravel application bootstrap
2. The axios configuration sends `withCredentials: true` which conflicts with Bearer token authentication
3. The CORS preflight OPTIONS request is blocked before the Authorization header can be validated

**Formal Specification:**
```
FUNCTION isBugCondition(request)
  INPUT: request of type APIRequest
  OUTPUT: boolean
  
  RETURN request.origin IN ['http://localhost:5173']
         AND request.destination IN ['http://localhost:8000/api/*']
         AND request.method IN ['POST', 'PUT', 'DELETE', 'PATCH']
         AND request.headers.Authorization CONTAINS 'Bearer'
         AND corsMiddlewareNotRegistered()
         AND withCredentialsConflictExists()
END FUNCTION
```

### Examples

- **Example 1 - Login Flow**: User logs in at `http://localhost:5173/login`, receives token, stores in localStorage. Subsequent GET request to `/api/user` fails with CORS error because preflight OPTIONS request is blocked.
- **Example 2 - Protected Resource Access**: User attempts to access `/api/articles/drafts` with Bearer token. Request fails with 401 Unauthorized because CORS headers are not present to allow the Authorization header through.
- **Example 3 - Token Validation**: Backend receives request but cannot validate Sanctum token because CORS middleware is not present to handle the preflight request properly.
- **Example 4 - withCredentials Conflict**: Frontend sends request with both `withCredentials: true` and `Authorization: Bearer <token>`. Backend CORS configuration rejects this combination because credentials mode conflicts with Bearer token authentication.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Public endpoints like `/api/articles/public` and `/api/categories` must continue to work without authentication
- Rate limiting on endpoints like `/api/login` and `/api/register` must continue to be enforced correctly
- Invalid or expired tokens must continue to return 401 Unauthorized responses
- Requests from origins not in the CORS allowed list must continue to be blocked
- Development access from `http://localhost:5173` must continue to be allowed as configured

**Scope:**
All inputs that do NOT involve authenticated API requests with Bearer tokens should be completely unaffected by this fix. This includes:
- Public API endpoints (no authentication required)
- Rate-limited endpoints (authentication not involved)
- Invalid token requests (should still return 401)
- Cross-origin requests from disallowed origins (should still be blocked)
- Non-API requests (web routes, health checks)

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Missing CORS Middleware Registration**: The CORS middleware is not registered in `bootstrap/app.php`. While `config/cors.php` is properly configured, the middleware is not applied to the application, so preflight OPTIONS requests are not handled.

2. **Conflicting withCredentials Configuration**: The axios configuration sets `withCredentials: true` which tells the browser to send cookies with requests. This conflicts with Bearer token authentication because CORS credentials mode has specific requirements that don't align with Bearer token usage.

3. **Incorrect Authorization Header Handling**: The axios interceptor adds the Bearer token correctly, but the CORS preflight request is blocked before the Authorization header can be validated by the backend.

4. **Sanctum Configuration Mismatch**: While Sanctum is configured to accept Bearer tokens, the CORS middleware is not present to allow the preflight request to complete, preventing token validation from occurring.

## Correctness Properties

Property 1: Bug Condition - Authenticated API Requests with Bearer Tokens

_For any_ API request where the frontend sends a Bearer token from `http://localhost:5173` to `http://localhost:8000/api/*`, the fixed application SHALL handle the CORS preflight OPTIONS request with appropriate headers, allow the Authorization header through, and validate the Sanctum token successfully, resulting in the request being processed and a 200 response returned.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Preservation - Public and Non-Authenticated Requests

_For any_ API request that does NOT involve Bearer token authentication (public endpoints, rate-limited endpoints, invalid tokens, disallowed origins), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality for public access, rate limiting, error handling, and cross-origin blocking.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File 1**: `backend/bootstrap/app.php`

**Change 1**: Register CORS Middleware
- Add CORS middleware registration to the middleware configuration
- This ensures preflight OPTIONS requests are handled with proper CORS headers
- The middleware will allow the Authorization header through for Bearer token authentication

**File 2**: `frontend/src/utils/axiosConfig.js`

**Change 2**: Remove withCredentials Configuration
- Remove `axios.defaults.withCredentials = true` because it conflicts with Bearer token authentication
- Bearer token authentication does not require credentials mode
- This prevents CORS errors related to credentials mode conflicts

**Change 3**: Ensure Bearer Token is Properly Set
- Verify the axios interceptor correctly adds `Authorization: Bearer <token>` header
- Ensure the token is retrieved from localStorage before each request
- This is already implemented correctly but will be verified

**File 3**: `backend/config/cors.php` (Verification Only)

**Change 4**: Verify CORS Configuration
- Confirm `allowed_origins` includes `http://localhost:5173`
- Confirm `allowed_methods` includes all required methods (GET, POST, PUT, DELETE, PATCH, OPTIONS)
- Confirm `supports_credentials` is set appropriately for Bearer token usage
- This file is already correctly configured

**File 4**: `backend/config/sanctum.php` (Verification Only)

**Change 5**: Verify Sanctum Configuration
- Confirm stateful domains include `localhost:5173`
- Confirm guard is set to `['web']` for Bearer token validation
- This file is already correctly configured

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate authenticated API requests from the frontend to the backend and assert that the CORS preflight request is handled correctly and the Authorization header is accepted. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **CORS Preflight Request Test**: Simulate an OPTIONS request from `http://localhost:5173` to `/api/user`. Assert that the response includes `Access-Control-Allow-Origin: http://localhost:5173` and `Access-Control-Allow-Headers: Authorization`. (will fail on unfixed code)
2. **Bearer Token Authentication Test**: Simulate a GET request to `/api/user` with `Authorization: Bearer <valid_token>` from `http://localhost:5173`. Assert that the request succeeds with 200 status. (will fail on unfixed code)
3. **Protected Resource Access Test**: Simulate a POST request to `/api/articles/drafts` with Bearer token from `http://localhost:5173`. Assert that the request is processed and returns appropriate response. (will fail on unfixed code)
4. **Token Validation Test**: Simulate a request with an invalid Bearer token. Assert that the response is 401 Unauthorized. (may fail on unfixed code due to CORS blocking)

**Expected Counterexamples**:
- CORS preflight request returns 404 or missing CORS headers
- Authorization header is not included in the actual request
- Sanctum token validation fails because preflight request was blocked
- Possible causes: CORS middleware not registered, withCredentials conflict, incorrect header configuration

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL request WHERE isBugCondition(request) DO
  response := handleRequest_fixed(request)
  ASSERT response.status = 200 OR response.status = 401 (for invalid token)
  ASSERT response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
  ASSERT response.headers['Access-Control-Allow-Headers'] CONTAINS 'Authorization'
  ASSERT tokenValidation(request.headers.Authorization) succeeds
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL request WHERE NOT isBugCondition(request) DO
  ASSERT handleRequest_original(request) = handleRequest_fixed(request)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for public endpoints, rate-limited endpoints, and invalid tokens, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Public Endpoint Preservation**: Verify that `/api/articles/public` continues to work without authentication on both fixed and unfixed code
2. **Rate Limiting Preservation**: Verify that `/api/login` rate limiting continues to work correctly after fix
3. **Invalid Token Preservation**: Verify that requests with invalid tokens continue to return 401 Unauthorized
4. **Disallowed Origin Preservation**: Verify that requests from disallowed origins continue to be blocked
5. **Non-API Request Preservation**: Verify that web routes and health checks continue to work

### Unit Tests

- Test CORS middleware is registered and handles OPTIONS requests correctly
- Test axios interceptor adds Bearer token to requests
- Test axios configuration does not include conflicting withCredentials
- Test that public endpoints work without authentication
- Test that invalid tokens return 401 Unauthorized
- Test that rate limiting continues to work

### Property-Based Tests

- Generate random authenticated requests and verify CORS headers are present
- Generate random public endpoint requests and verify they work without authentication
- Generate random invalid token requests and verify 401 responses
- Generate random requests from various origins and verify CORS blocking works correctly
- Test that all non-buggy inputs produce identical results on fixed and unfixed code

### Integration Tests

- Test full login flow: user logs in, receives token, makes authenticated API request
- Test switching between authenticated and public endpoints
- Test token expiration and re-authentication flow
- Test CORS preflight request followed by actual request
- Test that visual feedback occurs when authenticated requests succeed
