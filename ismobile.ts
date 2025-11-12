[33mcommit 3e484a42be91e53b53e0f92d66f620fb5347d62d[m[33m ([m[1;36mHEAD -> [m[1;32mupdate/mobile-fix[m[33m)[m
Author: MiniGit Developer <user@example.com>
Date:   Wed Nov 12 17:21:44 2025 +0530

    feat: improve mobile experience

 README.md                         | Bin [31m2579[m -> [32m1648[m bytes
 index.html                        |   6 [32m+[m[31m-[m
 public/manifest.json              |  10 [32m+[m[31m-[m
 public/service-worker.js          |  64 [32m+++[m[31m-[m
 src/components/TopNav.tsx         |  51 [32m++[m[31m--[m
 src/components/UnifiedScanner.tsx | 398 [32m++++++++++++++++++++++++[m
 src/hooks/useAuth.tsx             |  70 [32m++++[m[31m-[m
 src/index.css                     |  23 [32m++[m
 src/main.tsx                      |   6 [32m+[m
 src/pages/InventoryPage.tsx       | 620 [32m++++++++++++++++++++++++++++++[m[31m--------[m
 src/pages/ScanPage.tsx            | 387 [32m+++++++++++++++[m[31m---------[m
 src/pages/dashboard.tsx           | 189 [32m+++++++[m[31m-----[m
 src/pages/login.tsx               | 122 [32m+++++++[m[31m-[m
 src/pages/repairs.tsx             |  93 [32m++++[m[31m--[m
 src/pages/reports.tsx             |   8 [32m+[m[31m-[m
 src/pages/sales-records.tsx       |  83 [32m+++[m[31m--[m
 src/pages/settings.tsx            |   8 [32m+[m[31m-[m
 src/utils/isMobile.ts             |   7 [32m+[m
 tailwind.config.ts                |  18 [32m++[m
 19 files changed, 1705 insertions(+), 458 deletions(-)
