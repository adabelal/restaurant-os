## 2024-05-18 - [CRITICAL] Exposed Sensitive Debug Endpoints
**Vulnerability:** Three API endpoints (`/api/public-test-bank`, `/api/public-debug`, and `/api/debug-tx`) were exposed as public routes in `middleware.ts`. These endpoints revealed sensitive financial data, such as bank balances and transactions, and could even perform database updates without any authentication checks. Furthermore, error handling in these endpoints exposed raw stack traces to the client.
**Learning:** Development and debug endpoints were accidentally left in the production configuration for `middleware.ts`, bypassing the authentication safeguards and directly exposing internal functionality and errors.
**Prevention:**
1. Never define debug or test endpoints in public route arrays in `middleware.ts`.
2. Ensure endpoints containing sensitive information, especially financial data, are strictly protected by authentication middleware.
3. Catch errors globally and log them server-side; do not leak `e.stack` to client responses.
