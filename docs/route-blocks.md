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

From `admin/Transpo_24`:

```sh
npm run typecheck
npm run test:web-push
npx eslint src/app/route-blocks src/lib/route-blocks.ts src/providers/data-provider/index.ts src/app/_refine_context.tsx src/app/page.tsx src/components/refine-ui/layout/sidebar.tsx scripts/test-route-blocks-browser.cjs
npm run build
```

Browser test (all API responses mocked; no real backend writes):

```sh
npm install --prefix /tmp/transpo24-m5-browser --no-package-lock --ignore-scripts playwright-core
# In a separate terminal, start the local built app:
node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3215
# Then:
NODE_PATH=/tmp/transpo24-m5-browser/node_modules node scripts/test-route-blocks-browser.cjs
```

`CHROME_PATH` overrides `/usr/bin/google-chrome`; `ADMIN_TEST_URL` can override the
localhost URL. Browser tooling stays outside project dependencies. The script checks
anonymous/non-admin access, server pagination and all filters, cancellation without
writes, deactivation, duplicate reactivation and retry, directional create, edit,
same-country/null-all-types/null-reason payloads, bearer auth, missing records,
API permission failures and retry, mobile width and runtime errors.

2026-09-24: all checks above passed, plus 97 existing API regressions across the
five tenant/geography/route-policy/admin suites. Browser verification used mocks,
not a live migrated API. Existing build warnings: multiple lockfiles and the
unrelated pickup-proof image element. No production deployment performed.
