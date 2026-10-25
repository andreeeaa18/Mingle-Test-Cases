# Mingle Test Cases

Automated UI and end-to-end tests for **Mingle**, a furniture and home-decor platform with AR and AI features. The tests are written with [Playwright](https://playwright.dev) and check the flows that matter most to a user, so regressions are caught quickly and repetitive manual checks are reduced.

## What is tested

Five modules were picked as priorities, based on how critical they are to the user experience and how many components they involve.

### Authentication
Gatekeeper for everything personalised.
- Sign up, log in, log out
- Valid and invalid credentials, duplicate registration, empty fields
- Session expiry (cookie removed) and redirects for already-logged-in users

### Shopping cart
Implemented through the wishlist slice and shown to the user as the cart page.
- Add and remove products, from both the collection page and the product detail page
- Login is required for cart actions
- Product counter, empty cart, access without an account
- Data persistence through backend wishlist updates

### Chatbot
Responses are dynamic, so assertions check meaning rather than exact text.
- Natural-language product discovery
- Filtering by colour, brand, category, price and dimensions, including combined criteria
- Discounted vs. non-discounted products
- Invalid, vague or nonsensical queries
- Follow-up questions that rely on earlier context
- UI behaviour: open, close, persistence while navigating

### Collection and products
The main browsing path, before a user reaches the cart.
- Catalog loaded from the backend
- Search by name, filter by category, sort by price and alphabetically
- Navigation from collection cards to product pages
- Product details: description, category, colour, stock
- 3D model interaction: fullscreen, annotations, variant switching

### AR and QR
- QR code generation and deep-link content
- QR redirect to the correct product page
- AR mode availability on compatible devices
- 3D manipulation in fullscreen, colour and rotation interactions

## Repository structure

```
tests/
  TC1.spec.js                 Log in
  TC2.spec.js                 Sign up
  TC3.spec.js                 Log out
  API.spec.js                 API check (order)
  mingle-e2e/                 Full frontend suite
    playwright-tests/
      Authentification/       signUp, signIn, logOut
      Adding&RemovingFromCart/
      ChatBot/                replies and UI behaviour
      Collection/             browse, filter, search by category
      Products/               product details, QR code
      E2E/                    complete user journeys
    fixtures/                 reusable setup (auth, sign-up, filters, 3D rotation)
    test-data/                test users and chatbot messages
    homepage.spec.js
utils.js                      shared helpers (login)
playwright.config.js          config for TC1-TC3 and API tests
playwright.mingle.config.js   config for the mingle-e2e suite
docs/PLAN DE TESTARE.docx     full test plan
.github/agents/               AI agent prompts for test work
.github/workflows/test.yml    CI run for the TC and API tests
```

Tests are grouped by functional module, so scenarios map directly to requirements. Fixtures centralise common setup such as logging in, and test data is kept controlled and reusable so runs stay predictable.

## Running the tests

```bash
npm install
npx playwright install
```

Create a `.env` file (see `.env.example`) with the account used by TC1, TC2 and the `login` helper:

```
TEST_EMAIL=your-test-account@example.com
TEST_PASSWORD=your-test-password
```

In GitHub Actions, add the same two values as repository secrets (`TEST_EMAIL`, `TEST_PASSWORD`). Never commit `.env`.

**TC1-TC3 and API tests** run against the deployed app:

```bash
npm test
```

**Full frontend suite** runs against `http://localhost:3000`, so start the Mingle frontend first (change `baseURL` in `playwright.mingle.config.js` to target another environment):

```bash
npm run test:mingle
```

The mingle suite runs one test at a time on Chromium, Firefox and WebKit, and always records a trace and video. Screenshots are taken on failure. An HTML report is generated after each run (`npx playwright show-report` to reopen it).

## Prerequisites and exit criteria

Testing needs a stable environment, reachable backend services, and prepared user and product data.

A run is considered complete when all critical scenarios have passed, there are no high-severity defects blocking normal use, and the execution reports are available.

## Known risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Unstable UI selectors | Flaky tests, false negatives | Stable locators resistant to markup changes |
| Dynamic chatbot answers | False negatives in assertions | Semantic and pattern-based checks |
| Changes in product data | Wrong expectations in filters and chatbot results | Keep a stable dataset for automated runs |
| Session problems | Auth and cart flows fail unpredictably | Dedicated fixtures and controlled session setup |
| Variable 3D interactions | Inconsistent AR checks across devices | Controlled, repeatable interaction steps |

Uncontrolled changes to the product catalog are the main source of instability in this suite.
