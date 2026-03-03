# Implementation Plan

- [ ] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - Zod Schema Serialization and Validation
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing cases - routes with Zod schemas that return invalid data
  - Test that routes with Zod response schemas validate and serialize responses according to the schema
  - Create test cases:
    - Invalid response test: Route returns data violating schema (e.g., `status: "error"` when schema expects `z.literal("ok")`)
    - Type coercion test: Route returns wrong type (e.g., `Date` object when schema expects string)
    - Missing field test: Route omits required field from schema
  - Run test on UNFIXED code (before registering serializerCompiler/validatorCompiler)
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found:
    - Invalid responses return 200 status without validation errors
    - Types are not converted according to Zod schemas
    - Missing required fields do not cause errors
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Zod Routes Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for routes without Zod schemas
  - Write property-based tests capturing observed behavior patterns:
    - Routes without schemas continue to work normally
    - Logging system (pino/pino-pretty) remains unchanged
    - DI system (Awilix) remains unchanged
    - Plugin registration order is maintained
    - Error handling for non-validation errors remains the same
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Fix for Fastify Zod schema serialization

  - [ ] 3.1 Implement the fix in src/app.ts
    - Import `serializerCompiler` and `validatorCompiler` from `fastify-type-provider-zod`
    - Register `validatorCompiler` using `app.setValidatorCompiler(validatorCompiler)` after creating Fastify instance
    - Register `serializerCompiler` using `app.setSerializerCompiler(serializerCompiler)` after validator
    - Ensure compiladores are registered BEFORE any plugin or route registration
    - Keep `withTypeProvider<ZodTypeProvider>()` for TypeScript typing support
    - _Bug_Condition: isBugCondition(input) where input.route.schema.response contains ZodSchema AND serializerCompiler is NOT registered_
    - _Expected_Behavior: Responses are validated and serialized according to Zod schemas, throwing errors for invalid data_
    - _Preservation: Routes without Zod schemas, logging, DI, error handling, and plugin order remain unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Zod Schema Serialization and Validation
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify that:
      - Invalid responses now return error status (500 or 400) instead of 200
      - Types are correctly converted according to Zod schemas
      - Missing required fields now cause validation errors
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Zod Routes Behavior
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix:
      - Routes without Zod schemas work exactly as before
      - Logging, DI, error handling remain unchanged
      - No regressions in existing functionality

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
