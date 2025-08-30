# Testing Setup for JW-Site

This directory contains automated tests for the JW-Site portfolio to ensure code quality and functionality.

## Test Structure

```
src/test/
├── setup.ts              # Test environment configuration
├── integration.test.js   # Integration tests
├── GameManager.test.js   # Game system tests
├── resume.test.js        # Resume data validation
├── siteMeta.test.js      # Site metadata tests
└── projects.test.js      # Projects data validation
```

## Running Tests

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests with UI

```bash
npm run test:ui
```

### Run Tests Once (CI mode)

```bash
npm run test:run
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

## Test Categories

### Unit Tests

- **GameManager.test.js**: Tests the core game management system
- **resume.test.js**: Validates resume data structure and consistency
- **siteMeta.test.js**: Ensures site metadata consistency
- **projects.test.js**: Validates project data and demo configurations

### Integration Tests

- **integration.test.js**: Tests overall system integration and deployment readiness

## Test Coverage

The test suite covers:

- ✅ Name consistency across all files ("Joe Whittle")
- ✅ Resume data structure and content validation
- ✅ Game system functionality
- ✅ Project data integrity
- ✅ Site metadata consistency
- ✅ Deployment configuration validation

## Manual Testing

For manual testing of games and interactive features, use:

- `test-games.html` - Test all game systems
- `test-asteroids.html` - Test Asteroids game specifically

## CI/CD Integration

Tests are configured to run in CI/CD pipelines and will:

- Validate code changes
- Ensure deployment readiness
- Catch regressions early
- Maintain code quality standards

## Adding New Tests

1. Create test files in `src/test/` with `.test.js` or `.spec.js` extension
2. Use Vitest testing framework
3. Follow existing patterns for consistency
4. Run tests locally before committing

## Test Environment

Tests run in a jsdom environment that mocks:

- Canvas API for game testing
- Audio API for sound effects
- Browser timing functions
- Basic DOM interactions
