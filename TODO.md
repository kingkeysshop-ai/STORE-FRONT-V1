# Task: Fix Next.js build failures due to missing Medusa backend during static generation

## Plan Steps:
- [ ] 1. Update next.config.js: Add `output: 'standalone'`
- [ ] 2. Update src/app/[countryCode]/(main)/categories/[...category]/page.tsx: Wrap generateStaticParams in try/catch + add `export const dynamic = 'force-dynamic'`
- [ ] 3. Update src/app/[countryCode]/(main)/collections/[handle]/page.tsx: Wrap generateStaticParams in try/catch + add `export const dynamic = 'force-dynamic'`
- [ ] 4. Update src/app/[countryCode]/(main)/products/[handle]/page.tsx: Add `export const dynamic = 'force-dynamic'`
- [ ] 5. Test: Run `npm run build` to verify fix

Current progress: All edits complete. Ready for testing.

## Plan Steps:
- [x] 1. Update next.config.js: Add `output: 'standalone'`
- [x] 2. Update src/app/[countryCode]/(main)/categories/[...category]/page.tsx: Wrap generateStaticParams in try/catch + add `export const dynamic = 'force-dynamic'`
- [x] 3. Update src/app/[countryCode]/(main)/collections/[handle]/page.tsx: Wrap generateStaticParams in try/catch + add `export const dynamic = 'force-dynamic'`
- [x] 4. Update src/app/[countryCode]/(main)/products/[handle]/page.tsx: Add `export const dynamic = 'force-dynamic'`
- [ ] 5. Test: Run `npm run build` to verify fix
