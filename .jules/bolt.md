## 2026-03-18 - Concurrent Prisma Queries in Dashboard
**Learning:** The dashboard statistics endpoint (`getFinanceStats`) was executing 6 sequential database queries/fetches, leading to a waterfall effect. This is a common anti-pattern in Next.js/Prisma setups where independent data aggregations are awaited sequentially.
**Action:** Always look for independent `prisma.*` calls (like `aggregate`, `count`, `findMany`) that are executed sequentially and wrap them in a `Promise.all()` array to fetch them concurrently, reducing total latency to the longest single query.
