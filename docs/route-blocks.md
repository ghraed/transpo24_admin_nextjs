# Route Blocks — M5

The Operations Route Blocks resource uses existing ADMIN authentication and the
M4 `/admin/route-blocks` endpoints. It lists explicit blocks only. Countries are
ISO alpha-2 codes aligned with the API validator, not active-market restrictions.
The API remains authoritative for permissions, validation and duplicate handling.

The list uses server page/limit and exact origin/destination/type/status filters.
A specific-type filter does not include null/all-type rules, matching M4 semantics;
the UI explains this. Create/edit and status changes show direction/type before
saving. Updates use PATCH, preserving audited inactive history. Creator is shown
as the ID currently returned by the API. No names or unsupported fields are guessed.

Existing accepted/in-progress jobs are never automatically cancelled. M7–M9 must
still integrate current policy into matching and offers. The temporary rollout
warning should be removed only after those milestones are implemented and deployed.

## Verification

From `admin`:

```sh
npm run typecheck
npm test
npm run lint
npm run build
```

Browser test (all API responses mocked; no real backend writes):

```sh
npm install --prefix /tmp/transpo24-m5-browser --no-package-lock --ignore-scripts playwright-core
# Starts a local mock API and the admin development server:
NODE_PATH=/tmp/transpo24-m5-browser/node_modules npm run test:browser
```

`CHROME_PATH` overrides `/usr/bin/google-chrome`. The runner uses local ports 3215 and 3216. Browser tooling stays outside project dependencies. The script checks
anonymous/non-admin access, server pagination and all filters, cancellation without
writes, deactivation, duplicate reactivation and retry, directional create, edit,
same-country/null-all-types/null-reason payloads, bearer auth, missing records,
API permission failures and retry, mobile width and runtime errors.

2026-09-24: all checks above passed, plus 97 existing API regressions across the
five tenant/geography/route-policy/admin suites. Browser verification used mocks,
not a live migrated API. Existing build warnings: multiple lockfiles and the
unrelated pickup-proof image element. No production deployment performed.
