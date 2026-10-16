# 「三個維度」改版（第一期）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把首頁、進度頁、成員頁改成定稿的「三個維度」設計，並建立新外框與設計基礎，舊頁面維持原樣運作。

**Architecture:** 用 Next.js 路由群組把新頁面（`(dimensions)`）與舊頁面（`(legacy)`）隔開，各有自己的外框。新頁面的樣式是掛在 `.dim` 範圍下的純 CSS，直接由設計稿移植。首頁所有捲動動畫集中在一個 `choreography.ts`，依頁面順序建立，元件本身只是帶資料屬性的靜態標記。

**Tech Stack:** Next.js 16（靜態輸出）、React 19、TypeScript、i18next、GSAP + ScrollTrigger、Lenis、Playwright。

**Spec:** `docs/superpowers/specs/2026-10-07-dimensions-redesign-design.md`
**視覺基準:** `docs/design-demos/dimensions-v2.html`、`progress.html`、`members.html`、`inner.css`

## Global Constraints

- 套件管理用 `yarn`（4.12）。不要用 npm。
- 匯入別名：`@/` 對應 `src/`，`#/` 對應 `src/components/`。
- Prettier：單引號、JSX 單引號、結尾逗號、CRLF。提交前 hook 會跑 `yarn format` 與 `yarn lint --fix`，然後執行 `git add .`。**提交前工作目錄不能有無關的檔案，否則會被一起提交。**
- 新元件不使用 antd，也不使用 styled-components。樣式寫在 `src/styles/dimensions/*.css`，所有規則都包在 `.dim { … }` 內。
- 捲動驅動的動畫只改 `transform` 與 `opacity`。不對滿版圖層用 `clip-path`、`filter: blur`。
- 所有 ScrollTrigger 依頁面由上到下的順序建立，而且只在 `src/lib/dimensions/choreography.ts` 建立。
- 所有畫面文字來自 i18n 的 `dimensions.*`，三個語言檔（`zh_TW`、`zh_CN`、`en`）同步新增。不在元件裡寫死中文。
- 三種語言用同一個版面：首頁主標題一律是「雲鎮工藝」；維度名稱一律直排在右側（英文字母轉 90 度）；不為任何語言另訂字級。
- 日期格式 `YYYY.MM.DD`，數字用千分位。
- 字體：`'Chiron Sung HK'`（700、900）、`'Chiron Hei HK'`（400、500、700）、`'JetBrains Mono'`（400、500）。
- 斷點預設只有 860px。九個驗收視窗：360×740、390×844、844×390、768×1024、1024×768、1280×720、1440×900、1920×1080、2560×1440。
- 寬度 1024px 以下，`.dim` 內所有 `a`、`button`、`input`、`select` 的點擊範圍不小於 44×44px。
- 內文不小於 14px，標註不小於 11px。
- 版本庫不放 Mojang 的圖檔。傳送門用程式產生。
- 網址不變：`/`、`/home/`、`/survivalProgress/`、`/survival/`、`/member/`。
- 每個任務結束前執行 `yarn lint`、`yarn typecheck`、`yarn build`，三者都必須成功。
- 提交訊息結尾加上 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`。

## Review Focus

1. **資料請求失敗或很慢**：成員、進度、GitHub 任一請求失敗時，頁面仍可用，首頁數字保留預設值，清單頁顯示說明與重試。（Task 3、4、8 有測試）
2. **在捲動途中改變視窗大小或旋轉裝置**：場景仍與所在段落一致，不會卡在錯的圖。（Task 9 有測試）
3. **從新頁面點到舊頁面再回來**：平滑捲動、ScrollTrigger、`<html data-dim>` 都被清乾淨，舊頁面不受影響，回到首頁能重新建立。（Task 9 有測試）
4. **帶錨點直接進首頁**（例如 `/#nether`）：載入後停在該段，場景與維度正確。（Task 9 有測試）
5. **很長的字串**：超長的成員名稱、英文翻譯比中文長很多時，不溢出、不重疊。（Task 3、10 有測試）

## File Structure

```
src/app/
  layout.tsx                              修改：加字體，移除 <Layout>
  not-found.tsx                           修改：自己包 <Layout>
  (legacy)/layout.tsx                     新增：現有外框
  (legacy)/{join,hardware,openSource,partner,collaborative,
            redstoneCollection,architectureCollection}/page.tsx   搬移
  (dimensions)/layout.tsx                 新增：新外框
  (dimensions)/page.tsx                   首頁
  (dimensions)/home/page.tsx              首頁別名
  (dimensions)/member/page.tsx            成員頁
  (dimensions)/survivalProgress/page.tsx  進度頁
  (dimensions)/survival/page.tsx          進度頁別名

src/i18n/useI18nBoot.ts                   新增：兩個外框共用的 i18n 啟動
src/i18n/locales/*/translation.json       修改：加 dimensions 命名空間

src/constants/scenes.ts                   場景與換場清單
src/constants/progressDimensions.ts       進度的維度對照表

src/lib/dimensions/format.ts              日期、天數、數字格式
src/lib/dimensions/choreography.ts        首頁所有捲動動畫
src/lib/dimensions/transitions.ts         六種換場的時間軸

src/components/dimensions/
  DimensionProvider.tsx   SiteBar.tsx   SiteFooter.tsx   VerticalLabel.tsx
  InnerHeader.tsx   Toolbar.tsx   MemberRoster.tsx   ProgressLog.tsx
  home/ HomePage.tsx  World.tsx  Loader.tsx  PortalCanvas.tsx  Starfield.tsx
        DimensionRail.tsx  Hero.tsx  DimensionOpening.tsx  WorkSection.tsx
        NetherLedger.tsx  RankStatement.tsx  Credits.tsx  Respawn.tsx

src/styles/dimensions/
  tokens.css  shell.css  inner.css  home.css

tests/helpers/dimensions.ts               測試共用：視窗清單、響應式與語言檢查
tests/dimensions-shell.spec.ts            外框
tests/dimensions-members.spec.ts          成員頁
tests/dimensions-progress.spec.ts         進度頁
tests/dimensions-home.spec.ts             首頁
tests/dimensions-matrix.spec.ts           九個視窗 × 三種語言 × 兩個主題
tests/parity.spec.ts                      修改：移除已改版的路由
```

**CSS 移植規則（所有任務通用）：** 步驟寫「移植」時，從設計稿的 `<style>` 逐字複製列出的選擇器，包進 `.dim { … }`，並做三個替換：

1. 設計稿裡以 `:root` 或 `[data-theme]`、`[data-dim]` 開頭的規則，改寫成 `.dim`、`[data-theme='light'] .dim`、`[data-dim='nether'] .dim` 的形式。
2. 類別名稱保持不變，但頂列的 `.bar` 改為 `.dim-bar`，頁尾的 `.foot` 改為 `.dim-foot`（避免和舊頁面的類別撞名）。
3. 不複製 `* { margin: 0 }`、`html`、`body` 這些全域規則；改成 `.dim` 自己設定 `min-height: 100vh; background: var(--bg); color: var(--fg); font-family: var(--sans); line-height: 1.8;`，以及 `.dim *, .dim *::before, .dim *::after { box-sizing: border-box; margin: 0; padding: 0; }`。

**測試執行方式（所有任務通用）：** 測試跑在靜態輸出上。

```bash
yarn build && yarn test:e2e tests/<檔名> --project=desktop
```

測試會連到 `mc-ctec.org` 取得真實資料，需要網路。

---

### Task 1: 路由群組，把現有外框隔離到 `(legacy)`

**Files:**

- Create: `src/i18n/useI18nBoot.ts`、`src/app/(legacy)/layout.tsx`
- Modify: `src/app/layout.tsx`、`src/Layout.tsx`、`src/app/not-found.tsx`
- Move: `src/app/{join,hardware,openSource,partner,collaborative,redstoneCollection,architectureCollection,home,member,survival,survivalProgress}` 與 `src/app/page.tsx` 全部搬進 `src/app/(legacy)/`
- Test: `tests/dimensions-shell.spec.ts`

**Interfaces:**

- Produces: `useI18nBoot(): void`（在客戶端啟動 i18n 並偵測語言，可重複呼叫）。`(legacy)/layout.tsx` 讓所有現有頁面維持原樣。

- [ ] **Step 1: 寫失敗的測試**

```ts
// tests/dimensions-shell.spec.ts
import { expect, test } from '@playwright/test';

const LEGACY = [
  '/join/',
  '/hardware/',
  '/openSource/',
  '/partner/',
  '/collaborative/',
  '/redstoneCollection/',
  '/architectureCollection/',
];

test.describe('legacy shell', () => {
  for (const route of LEGACY) {
    test(`${route} still renders inside the legacy shell`, async ({ page }) => {
      const res = await page.goto(route);
      expect(res?.status()).toBe(200);
      await expect(page.locator('[data-shell="legacy"]')).toBeVisible();
      await expect(page.locator('.dim')).toHaveCount(0);
    });
  }
});
```

- [ ] **Step 2: 確認測試失敗**

Run: `yarn build && yarn test:e2e tests/dimensions-shell.spec.ts --project=desktop`
Expected: FAIL，找不到 `[data-shell="legacy"]`。

- [ ] **Step 3: 抽出 i18n 啟動**

```ts
// src/i18n/useI18nBoot.ts
'use client';

import { useEffect } from 'react';
import initI18n, { detectLanguage } from '@/i18n/i18nConfig';

initI18n();

let detected = false;

/** Start i18n on the client. Safe to call from more than one shell. */
export const useI18nBoot = () => {
  useEffect(() => {
    if (detected) return;
    detected = true;
    detectLanguage();
  }, []);
};
```

在 `src/Layout.tsx`：刪除 `import initI18n, { detectLanguage } from '@/i18n/i18nConfig';`、`initI18n();` 與呼叫 `detectLanguage()` 的 `useEffect`，改為在 `Layout` 函式開頭呼叫 `useI18nBoot();`（匯入自 `@/i18n/useI18nBoot`）。把 `AppContainer` 加上屬性 `data-shell='legacy'`。

- [ ] **Step 4: 建立 legacy 版面並搬移頁面**

```tsx
// src/app/(legacy)/layout.tsx
import { Layout } from '@/Layout';

export default function LegacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}
```

```bash
mkdir -p "src/app/(legacy)"
git mv src/app/page.tsx "src/app/(legacy)/page.tsx"
for d in join hardware openSource partner collaborative redstoneCollection architectureCollection home member survival survivalProgress; do git mv "src/app/$d" "src/app/(legacy)/$d"; done
```

在 `src/app/layout.tsx`：移除 `import { Layout } from '@/Layout';`，把 `<Layout>{children}</Layout>` 改成 `{children}`。

在 `src/app/not-found.tsx`：用 `Layout` 包住現有內容。

```tsx
// src/app/not-found.tsx
import NotFoundPage from '@/views/NotFoundPage';
import { Layout } from '@/Layout';

export default function NotFound() {
  return (
    <Layout>
      <NotFoundPage />
    </Layout>
  );
}
```

（若現有檔案的匯入名稱不同，保留原本的元件，只加上 `<Layout>` 包裹。）

- [ ] **Step 5: 確認測試通過**

Run: `yarn lint && yarn typecheck && yarn build && yarn test:e2e tests/dimensions-shell.spec.ts --project=desktop`
Expected: 7 passed。

- [ ] **Step 6: 提交**

```bash
git add -A && git commit -m "refactor: isolate the existing shell in a (legacy) route group"
```

---

### Task 2: 設計基礎與新外框

**Files:**

- Create: `src/styles/dimensions/tokens.css`、`src/styles/dimensions/shell.css`、`src/components/dimensions/DimensionProvider.tsx`、`SiteBar.tsx`、`SiteFooter.tsx`、`src/lib/dimensions/format.ts`、`src/app/(dimensions)/layout.tsx`、`tests/helpers/dimensions.ts`
- Modify: `src/app/layout.tsx`（字體）、三個 `translation.json`、`package.json`（加 `gsap`、`lenis`）
- Move: `src/app/(legacy)/member` → `src/app/(dimensions)/member`（暫時仍渲染舊的 `Members` 視圖，Task 3 會換掉）
- Test: `tests/dimensions-shell.spec.ts`

**Interfaces:**

- Consumes: `useI18nBoot()`（Task 1）、`useTheme()`（現有，回傳 `{ theme, toggleTheme, isDark }`）。
- Produces:

  - `type Dimension = 'overworld' | 'nether' | 'end' | 'respawn'`
  - `<DimensionProvider initial?: Dimension>`、`useDimension(): { dim: Dimension; setDim: (d: Dimension) => void }`。`setDim` 會同步寫入 `document.documentElement.dataset.dim`；卸載時移除該屬性。
  - `<SiteBar variant: 'home' | 'inner' current?: 'progress' | 'members'>`、`<SiteFooter />`
  - `formatDate(raw: string): string`、`daysSince(startMs: number, nowMs: number): number`、`SERVER_START_MS: number`
  - `tests/helpers/dimensions.ts`：`VIEWPORTS`、`LOCALES`、`openPage()`、`expectNoHorizontalScroll()`、`expectTextFits()`、`expectTapTargets()`、`expectNoMissingKeys()`
  - i18n：整個 `dimensions.*` 命名空間（後續任務都用這裡定義的鍵，不再新增）

- [ ] **Step 1: 安裝套件**

```bash
yarn add gsap lenis
```

- [ ] **Step 2: 寫測試共用工具**

```ts
// tests/helpers/dimensions.ts
import { expect, type Page } from '@playwright/test';

export const VIEWPORTS = [
  { name: 'phone-s', width: 360, height: 740 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'phone-land', width: 844, height: 390 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'tablet-land', width: 1024, height: 768 },
  { name: 'laptop', width: 1280, height: 720 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'desktop-l', width: 1920, height: 1080 },
  { name: 'ultrawide', width: 2560, height: 1440 },
] as const;

export const LOCALES = ['zh_TW', 'zh_CN', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export type ThemeName = 'light' | 'dark';

/** Open a page with a fixed theme and language, analytics and ads blocked. */
export const openPage = async (
  page: Page,
  path: string,
  opts: { theme?: ThemeName; locale?: Locale; reducedMotion?: boolean } = {},
) => {
  const { theme = 'dark', locale = 'zh_TW', reducedMotion = false } = opts;
  await page.route(/googletagmanager|googlesyndication|google-analytics/, (r) =>
    r.abort(),
  );
  if (reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(
    ([t, l]) => {
      try {
        localStorage.setItem('ctec-theme-preference', t);
        localStorage.setItem('i18nextLng', l);
      } catch {}
    },
    [theme, locale],
  );
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.locator('.dim').waitFor();
  await page.evaluate(() => document.fonts.ready);
};

export const expectNoHorizontalScroll = async (page: Page) => {
  const [scroll, inner] = await page.evaluate(() => [
    document.documentElement.scrollWidth,
    window.innerWidth,
  ]);
  expect(scroll, 'page must not scroll sideways').toBeLessThanOrEqual(inner);
};

/**
 * Every visible [data-t] block in the viewport must stay inside the viewport width,
 * must not overflow its own box, must not overlap another [data-t] block,
 * and must not sit under the fixed bar.
 */
export const expectTextFits = async (page: Page) => {
  const problems = await page.evaluate(() => {
    const out: string[] = [];
    const vw = window.innerWidth,
      vh = window.innerHeight;
    const bar = document.querySelector('.dim-bar')?.getBoundingClientRect();
    const label = (el: Element) =>
      `${el.getAttribute('data-t')}:"${(el.textContent ?? '').trim().slice(0, 24)}"`;
    const els = [...document.querySelectorAll<HTMLElement>('[data-t]')].filter(
      (el) => {
        const r = el.getBoundingClientRect(),
          s = getComputedStyle(el);
        return (
          r.width > 0 &&
          r.height > 0 &&
          r.bottom > 0 &&
          r.top < vh &&
          s.visibility !== 'hidden' &&
          +s.opacity > 0.5
        );
      },
    );
    const rects = els.map((el) => el.getBoundingClientRect());
    els.forEach((el, i) => {
      const r = rects[i];
      if (r.left < -1 || r.right > vw + 1)
        out.push(`outside viewport: ${label(el)}`);
      if (el.scrollWidth > el.clientWidth + 1)
        out.push(`overflows its box: ${label(el)}`);
      if (
        bar &&
        !el.closest('.dim-bar') &&
        r.top < bar.bottom - 1 &&
        r.bottom > bar.top + 1 &&
        r.top >= 0
      )
        out.push(`under the bar: ${label(el)}`);
      for (let j = i + 1; j < els.length; j++) {
        if (el.contains(els[j]) || els[j].contains(el)) continue;
        const q = rects[j];
        const w = Math.min(r.right, q.right) - Math.max(r.left, q.left),
          h = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top);
        if (w > 2 && h > 2)
          out.push(`overlap: ${label(el)} × ${label(els[j])}`);
      }
    });
    return out;
  });
  expect(problems, problems.join('\n')).toEqual([]);
};

/** Below 1025px every control must be at least 44 × 44. Text sizes must respect the floors. */
export const expectTapTargets = async (page: Page) => {
  const problems = await page.evaluate(() => {
    const out: string[] = [];
    const vh = window.innerHeight;
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect(),
        s = getComputedStyle(el);
      return (
        r.width > 0 &&
        r.height > 0 &&
        r.bottom > 0 &&
        r.top < vh &&
        s.visibility !== 'hidden'
      );
    };
    if (window.innerWidth <= 1024) {
      document
        .querySelectorAll('.dim a, .dim button, .dim input, .dim select')
        .forEach((el) => {
          if (!visible(el)) return;
          const r = el.getBoundingClientRect();
          if (r.width < 43.5 || r.height < 43.5)
            out.push(
              `tap target ${Math.round(r.width)}×${Math.round(r.height)}: ${el.tagName} "${(el.textContent ?? '').trim().slice(0, 20)}"`,
            );
        });
    }
    document.querySelectorAll('.dim [data-t]').forEach((el) => {
      if (!visible(el)) return;
      const size = parseFloat(getComputedStyle(el).fontSize),
        floor = el.getAttribute('data-t') === 'note' ? 11 : 14;
      if (size < floor)
        out.push(
          `font ${size}px < ${floor}px: "${(el.textContent ?? '').trim().slice(0, 20)}"`,
        );
    });
    return out;
  });
  expect(problems, problems.join('\n')).toEqual([]);
};

/** A missing translation renders its key, which always starts with "dimensions.". */
export const expectNoMissingKeys = async (page: Page) => {
  const text = await page.evaluate(
    () => document.querySelector('.dim')?.textContent ?? '',
  );
  expect(text).not.toContain('dimensions.');
};
```

`data-t` 的取值：`title`、`body`、`label`、`note`、`control`。之後每個任務的元件都要替主要文字區塊加上這個屬性。

- [ ] **Step 3: 在外框測試檔加入失敗的測試**

```ts
// tests/dimensions-shell.spec.ts（附加）
import {
  expectNoHorizontalScroll,
  expectNoMissingKeys,
  expectTapTargets,
  expectTextFits,
  openPage,
  VIEWPORTS,
} from './helpers/dimensions';

test.describe('dimensions shell', () => {
  test('member page renders inside the new shell with the new typefaces', async ({
    page,
  }) => {
    await openPage(page, '/member/');
    await expect(page.locator('.dim-bar')).toBeVisible();
    await expect(page.locator('.dim-foot')).toBeVisible();
    await expect(page.locator('[data-shell="legacy"]')).toHaveCount(0);
    const fonts = await page.evaluate(() =>
      [...document.fonts]
        .filter((f) => f.status === 'loaded')
        .map((f) => f.family.replace(/"/g, '')),
    );
    expect(fonts).toContain('Chiron Hei HK');
  });

  test('theme toggle switches data-theme and survives a reload', async ({
    page,
  }) => {
    await openPage(page, '/member/', { theme: 'dark' });
    await page.locator('.dim-bar [data-action="theme"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('language select changes the nav copy', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/member/');
    await page
      .locator('.dim-bar select[data-action="language"]')
      .selectOption('en');
    await expect(page.locator('.dim-bar nav')).toContainText('Overworld');
    await expectNoMissingKeys(page);
  });

  test('narrow screens get a menu that reaches every link', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page, '/member/');
    await expect(page.locator('.dim-bar nav')).toBeHidden();
    await page.locator('.dim-bar [data-action="menu"]').click();
    const sheet = page.locator('.dim-sheet');
    await expect(sheet).toBeVisible();
    await expect(sheet.locator('a')).toHaveCount(6);
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
  });

  for (const vp of VIEWPORTS) {
    test(`shell fits ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await openPage(page, '/member/');
      await expectNoHorizontalScroll(page);
      await expectTapTargets(page);
      await page.locator('.dim-foot').scrollIntoViewIfNeeded();
      await expectTextFits(page);
    });
  }
});
```

Run: `yarn build && yarn test:e2e tests/dimensions-shell.spec.ts --project=desktop`
Expected: 新增的測試 FAIL（找不到 `.dim`）。

- [ ] **Step 4: 加字體**

在 `src/app/layout.tsx` 把 Google Fonts 連結的 `href` 換成：

```
https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@100..900&family=Noto+Serif+TC:wght@200..900&family=Chiron+Sung+HK:wght@700;900&family=Chiron+Hei+HK:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap
```

（保留思源，舊頁面還在用。）

- [ ] **Step 5: 設計變數**

```css
/* src/styles/dimensions/tokens.css */
/* Tokens for the "three dimensions" pages. Everything lives under .dim so legacy pages are untouched. */
.dim {
  --bg: #06080b;
  --panel: #0e1217;
  --fg: #f2f4f6;
  --muted: #a3adb8;
  --v: 6, 8, 11;
  --line: rgba(242, 244, 246, 0.18);
  --accent: #86cdff;
  --logo: invert(1);
  /* veil stops: solid where text sits, clear where it does not */
  --s1: 0.92;
  --s2: 0.7;
  --s3: 0.2;
  --s4: 0.32;
  --f1: 0.95;
  --f2: 0.5;
  --f3: 0.28;
  --h1: 0.82;
  --h2: 0.4;
  --h3: 0.12;
  --h4: 0.62;
  --h5: 0.78;
  --serif: 'Chiron Sung HK', 'Noto Serif TC', serif;
  --sans: 'Chiron Hei HK', 'Noto Sans TC', system-ui, sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, monospace;
  --gutter: clamp(20px, 6vw, 96px);
  --measure: 40em;

  min-height: 100vh;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--sans);
  line-height: 1.8;
  -webkit-font-smoothing: antialiased;
  overflow-x: clip;
  transition:
    background 0.4s,
    color 0.4s;
}
.dim *,
.dim *::before,
.dim *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.dim a {
  color: inherit;
  text-decoration: none;
}
.dim img {
  display: block;
  max-width: 100%;
}
.dim ul,
.dim ol {
  list-style: none;
}
.dim button,
.dim input,
.dim select {
  font: inherit;
  color: inherit;
  background: none;
  border: 0;
}
.dim button,
.dim select {
  cursor: pointer;
}
.dim :focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
}
.dim ::selection {
  background: var(--accent);
  color: #000;
}
.dim .mono {
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.04em;
}
.dim .acc {
  color: var(--accent);
  transition: color 0.5s;
}
.dim .serif {
  font-family: var(--serif);
  font-weight: 900;
  line-height: 1.14;
  letter-spacing: 0.02em;
  text-wrap: balance;
}

[data-theme='light'] .dim {
  --bg: #eef2f5;
  --panel: #ffffff;
  --fg: #0f1418;
  --muted: #414c57;
  --v: 238, 242, 245;
  --line: rgba(15, 20, 24, 0.24);
  --logo: none;
  --accent: #0b6fb5;
  --s1: 0.97;
  --s2: 0.92;
  --s3: 0.22;
  --s4: 0;
  --f1: 0.97;
  --f2: 0.6;
  --f3: 0;
  --h1: 0.96;
  --h2: 0.74;
  --h3: 0;
  --h4: 0.9;
  --h5: 0.97;
}
[data-dim='nether'] .dim {
  --accent: #ff6a45;
}
[data-dim='end'] .dim {
  --accent: #cdb0ff;
}
[data-theme='light'][data-dim='nether'] .dim {
  --accent: #c2330f;
}
[data-theme='light'][data-dim='end'] .dim {
  --accent: #6234c4;
}
/* The End has no daylight: on the home page the interface goes dark for this one dimension. */
[data-theme='light'][data-dim='end'] .dim.dim--home {
  --bg: #06080b;
  --fg: #f2f4f6;
  --muted: #a3adb8;
  --v: 6, 8, 11;
  --line: rgba(242, 244, 246, 0.18);
  --logo: invert(1);
  --accent: #cdb0ff;
  --s1: 0.92;
  --s2: 0.7;
  --s3: 0.2;
  --s4: 0.32;
  --f1: 0.95;
  --f2: 0.5;
  --f3: 0.28;
}

/* touch sizes: every control is at least 44 × 44 up to tablet landscape */
@media (max-width: 1024px) {
  .dim a,
  .dim button,
  .dim select,
  .dim input {
    min-height: 44px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
  }
}
```

- [ ] **Step 6: 格式工具**

```ts
// src/lib/dimensions/format.ts
/** 2022-07-23 00:00 UTC+8 */
export const SERVER_START_MS = Date.UTC(2022, 6, 22, 16, 0, 0);

export const daysSince = (startMs: number, nowMs: number): number =>
  Math.floor((nowMs - startMs) / 86_400_000);

const two = (n: string) => n.padStart(2, '0');

/**
 * Normalise the dates used in static-data to YYYY.MM.DD (or YYYY.MM when the day is unknown).
 * Accepts "2022/7/23", "2022/09/23～09/28", "2023/6-2023/7", "2023/01".
 */
export const formatDate = (raw: string): string => {
  const [y = '', m = '', d = ''] = raw
    .split(/[～~-]/)[0]
    .trim()
    .split('/');
  return [y, m && two(m), d && two(d)].filter(Boolean).join('.');
};

export const yearOf = (raw: string): string => raw.split('/')[0].trim();
```

- [ ] **Step 7: 維度狀態**

```tsx
// src/components/dimensions/DimensionProvider.tsx
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type Dimension = 'overworld' | 'nether' | 'end' | 'respawn';

interface DimensionContextValue {
  dim: Dimension;
  setDim: (d: Dimension) => void;
}

const DimensionContext = createContext<DimensionContextValue | undefined>(
  undefined,
);

export const DimensionProvider = ({
  initial = 'overworld',
  children,
}: {
  initial?: Dimension;
  children: ReactNode;
}) => {
  const [dim, setDimState] = useState<Dimension>(initial);

  const setDim = useCallback((d: Dimension) => setDimState(d), []);

  // <html data-dim> drives the accent colour; remove it when leaving for a legacy page.
  useEffect(() => {
    document.documentElement.dataset.dim = dim;
  }, [dim]);
  useEffect(
    () => () => {
      delete document.documentElement.dataset.dim;
    },
    [],
  );

  const value = useMemo(() => ({ dim, setDim }), [dim, setDim]);
  return (
    <DimensionContext.Provider value={value}>
      {children}
    </DimensionContext.Provider>
  );
};

export const useDimension = (): DimensionContextValue => {
  const ctx = useContext(DimensionContext);
  if (!ctx)
    throw new Error('useDimension must be used within a DimensionProvider');
  return ctx;
};
```

- [ ] **Step 8: i18n 命名空間**

在三個語言檔的最外層物件加入 `"dimensions"` 鍵。`zh_TW`：

```json
"dimensions": {
  "nav": { "home": "雲鎮工藝 首頁", "overworld": "主世界", "nether": "地獄", "end": "終界", "progress": "進度", "members": "成員", "join": "加入我們", "menu": "選單", "close": "關閉", "theme": "切換白天或夜晚", "language": "語言" },
  "dim": { "overworld": "主世界", "nether": "地獄", "end": "終界", "all": "世界紀錄" },
  "hero": { "since": "開服 2022.07.23", "uptime": "已運行 {{days}} 天 {{clock}}", "lead": "在 Minecraft 原版規則裡研究紅石、蓋建築，經營一個開服至今沒有重置過的生存世界。", "cta": "加入我們", "cue": "往下捲，走過三個維度", "loading": "正在建置地形" },
  "overworld": {
    "tag": "維度 01 / 03",
    "say": ["紅石是工程。", "建築是作品。", "生存是一場不重置的長期實驗。"],
    "body": "雲鎮工藝是來自亞洲的技術生存社群。成員來自不同專業，和多個國際技術伺服器往來，所有東西都在生存模式裡完成。",
    "stats": { "days": "天，同一個世界", "milestones": "個生存服里程碑", "members": "位正式成員", "repos": "個開源專案" },
    "more": "完整的世界紀錄，{{count}} 個里程碑",
    "works": [
      { "meta": "建築 · 2024.03.22", "name": "進撃の巨人：瑪莉亞之牆" },
      { "meta": "建築 · 2023.07", "name": "新出生點" },
      { "meta": "生存 · 倉儲 · 2023.08.20", "name": "全編碼全物品" }
    ]
  },
  "nether": {
    "tag": "維度 02 / 03",
    "say": ["穿過傳送門，", "就是我們的工廠。"],
    "body": "地獄大廳、空置域、豬布林交易、岩漿立方怪農場。這些機器不是擺在創造模式裡看的，它們在生存世界裡實際運轉、實際產出。",
    "ledger": [
      { "date": "2022.08.08", "name": "地獄大廳" },
      { "date": "2023.01.17", "name": "Y0 切門豬人農場" },
      { "date": "2023.04.23", "name": "地獄 1k 空置域" },
      { "date": "2024.02.13", "name": "雙維度百萬豬布林交易" },
      { "date": "2024.09.05", "name": "地獄大廳主砲" },
      { "date": "2025.02.11", "name": "刷花機（地獄）" }
    ],
    "rankLabel": "農場世界紀錄持有量",
    "rank": ["世界第六", "亞洲第一"],
    "rankBody": "我們設計的農場有多項取得世界紀錄認證。"
  },
  "end": {
    "tag": "維度 03 / 03",
    "say": ["終界之後，", "是製作名單。"],
    "body": "終界大廳、月宮、終界農業區，都蓋在虛空上。看完這三處，就是把這個世界蓋出來的人。",
    "works": [
      { "meta": "建築 · 2023.09.29", "name": "月宮" },
      { "meta": "生存 · 2022.12.03", "name": "終界農業區" }
    ],
    "credits": {
      "tools": "開源工具", "member": "正式成員", "trial": "新秀成員",
      "roles": { "core": "遊戲核心", "server": "伺服器管理", "infra": "基礎設施", "community": "社群工具" },
      "more": "完整成員名冊", "fin": "還沒結束。"
    }
  },
  "respawn": {
    "label": "重生點：雲鎮", "title": "下一個里程碑，等你一起蓋。", "cta": "加入 Discord",
    "depts": [
      { "name": "紅石組", "body": "投稿你的紅石作品，我們會邀請優秀作品的作者加入。", "action": "到投稿頻道" },
      { "name": "建築組", "body": "審核看結構合理性、色彩運用與原創性。", "action": "填寫申請表單" },
      { "name": "後勤組", "body": "有基礎紅石知識、對遊戲有熱忱就可以申請。", "action": "填寫申請表單" }
    ]
  },
  "footer": { "support": "支持我們", "rights": "© 2022–{{year}} Cloud Town Exquisite Craft" },
  "progress": {
    "crumb": "生存服進度", "title": ["同一個世界，", "從第一天到現在。"],
    "lead": "2022 年 7 月 23 日開服，世界沒有重置過。這裡是全部 {{total}} 個里程碑，可以依維度或年份篩選。",
    "allDims": "全部維度", "allYears": "全部年份", "count": "{{n}} / {{total}} 項", "no": "第 {{n}} 項", "perYear": "{{n}} 個里程碑",
    "empty": "這個組合沒有里程碑，換一個維度或年份。", "loading": "載入中", "error": "進度資料載入失敗。", "retry": "重新整理", "next": "把這個世界蓋出來的人"
  },
  "members": {
    "crumb": "成員", "title": ["製作名單，", "完整版。"], "lead": "各領域優秀成員，共創伺服器精彩紀錄。",
    "search": "搜尋成員", "count": "{{n}} / {{total}} 位", "groupCount": "{{n}} 位",
    "groups": { "member": { "title": "正式成員", "line": "這些老江湖們已經在伺服器上留下了自己的痕跡" }, "trial": { "title": "新秀成員", "line": "新鮮肝臟，等待你的發掘" } },
    "empty": "沒有找到成員，換個名字試試。", "loading": "載入中", "error": "成員資料載入失敗。", "retry": "重新整理", "next": "下一個名字，可以是你"
  }
}
```

`zh_CN` 用同樣的結構，值如下（未列出的鍵，把 `zh_TW` 的值逐字轉成簡體）：

```json
"nav": { "home": "云镇工艺 首页", "overworld": "主世界", "nether": "地狱", "end": "末地", "progress": "进度", "members": "成员", "join": "加入我们", "menu": "菜单", "close": "关闭", "theme": "切换白天或夜晚", "language": "语言" },
"dim": { "overworld": "主世界", "nether": "地狱", "end": "末地", "all": "世界纪录" }
```

簡體使用中國大陸的遊戲譯名：終界→末地、地獄→下界以外一律用「地狱」、豬布林→猪灵、岩漿立方怪→岩浆怪、終界大廳→末地大厅、終界農業區→末地农业区、空置域→空置域、鞘翅→鞘翅。`members.groups` 的兩句與 `members.lead` 沿用 `zh_CN` 檔案中 `members` 現有的對應字串。

`en`：

```json
"dimensions": {
  "nav": { "home": "Cloud Town home", "overworld": "Overworld", "nether": "Nether", "end": "The End", "progress": "Progress", "members": "Members", "join": "Join us", "menu": "Menu", "close": "Close", "theme": "Switch day or night", "language": "Language" },
  "dim": { "overworld": "OVERWORLD", "nether": "THE NETHER", "end": "THE END", "all": "WORLD LOG" },
  "hero": { "since": "Since 2022.07.23", "uptime": "Running {{days}} days {{clock}}", "lead": "We study redstone and build in vanilla Minecraft, in one survival world that has never been reset.", "cta": "Join us", "cue": "Scroll through three dimensions", "loading": "Building terrain" },
  "overworld": {
    "tag": "Dimension 01 / 03",
    "say": ["Redstone is engineering.", "Building is the work.", "Survival is one long experiment."],
    "body": "CTEC is a technical survival community from Asia. Members come from many fields and work with technical servers worldwide. Everything is built in survival mode.",
    "stats": { "days": "days, one world", "milestones": "survival milestones", "members": "full members", "repos": "open-source projects" },
    "more": "The full world log, {{count}} milestones",
    "works": [
      { "meta": "Build · 2024.03.22", "name": "Attack on Titan: Wall Maria" },
      { "meta": "Build · 2023.07", "name": "The new spawn" },
      { "meta": "Survival · Storage · 2023.08.20", "name": "Fully encoded all-item sorter" }
    ]
  },
  "nether": {
    "tag": "Dimension 02 / 03",
    "say": ["Through the portal", "is our factory."],
    "body": "The nether hub, perimeters, piglin trading, magma cube farms. These machines are not creative-mode showpieces. They run and produce in the survival world.",
    "ledger": [
      { "date": "2022.08.08", "name": "Nether hub" },
      { "date": "2023.01.17", "name": "Y0 portal piglin farm" },
      { "date": "2023.04.23", "name": "1k nether perimeter" },
      { "date": "2024.02.13", "name": "Million-rate piglin trading" },
      { "date": "2024.09.05", "name": "Nether hub main cannon" },
      { "date": "2025.02.11", "name": "Flower farm (Nether)" }
    ],
    "rankLabel": "Farm world records held",
    "rank": ["6th in the world", "1st in Asia"],
    "rankBody": "Several farms we designed hold certified world records."
  },
  "end": {
    "tag": "Dimension 03 / 03",
    "say": ["After the End", "come the credits."],
    "body": "The end hub, the Moon Palace and the end farms all stand over the void. After these three come the people who built this world.",
    "works": [
      { "meta": "Build · 2023.09.29", "name": "Moon Palace" },
      { "meta": "Survival · 2022.12.03", "name": "End farming district" }
    ],
    "credits": {
      "tools": "OPEN-SOURCE TOOLS", "member": "FULL MEMBERS", "trial": "TRIAL MEMBERS",
      "roles": { "core": "Game core", "server": "Server management", "infra": "Infrastructure", "community": "Community tools" },
      "more": "Full member roster", "fin": "Not over yet."
    }
  },
  "respawn": {
    "label": "Respawn point: Cloud Town", "title": "The next milestone is waiting for you.", "cta": "Join the Discord",
    "depts": [
      { "name": "Redstone", "body": "Submit your redstone work. We invite the authors of outstanding builds.", "action": "Submission channel" },
      { "name": "Building", "body": "We review structure, use of colour and originality.", "action": "Application form" },
      { "name": "Logistics", "body": "Basic redstone knowledge and enthusiasm for the game are enough to apply.", "action": "Application form" }
    ]
  },
  "footer": { "support": "Support us", "rights": "© 2022–{{year}} Cloud Town Exquisite Craft" },
  "progress": {
    "crumb": "Survival progress", "title": ["One world,", "from day one until now."],
    "lead": "The server opened on 23 July 2022 and the world has never been reset. All {{total}} milestones are here. Filter by dimension or year.",
    "allDims": "All dimensions", "allYears": "All years", "count": "{{n}} / {{total}}", "no": "No. {{n}}", "perYear": "{{n}} milestones",
    "empty": "No milestones for this combination. Try another dimension or year.", "loading": "Loading", "error": "Could not load the progress data.", "retry": "Reload", "next": "The people who built this world"
  },
  "members": {
    "crumb": "Members", "title": ["The credits,", "in full."], "lead": "Outstanding members from every field, building the server's record together.",
    "search": "Search members", "count": "{{n}} / {{total}}", "groupCount": "{{n}}",
    "groups": { "member": { "title": "Full members", "line": "Veterans who have already left their mark on the server" }, "trial": { "title": "Trial members", "line": "Fresh hands, waiting to be discovered" } },
    "empty": "No member found. Try another name.", "loading": "Loading", "error": "Could not load the member data.", "retry": "Reload", "next": "The next name could be yours"
  }
}
```

- [ ] **Step 9: 頂列與頁尾**

```tsx
// src/components/dimensions/SiteBar.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { serverLink } from '@/constants';

type Current = 'progress' | 'members';

const LANGS = [
  { value: 'zh_TW', label: '繁' },
  { value: 'zh_CN', label: '简' },
  { value: 'en', label: 'EN' },
];

/** `zh` is the build-time default and is the same content as zh_TW. */
const normalise = (lng: string) => (lng === 'zh' ? 'zh_TW' : lng);

export const SiteBar = ({
  variant,
  current,
}: {
  variant: 'home' | 'inner';
  current?: Current;
}) => {
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  // On the home page the dimension links are in-page anchors; elsewhere they lead back to it.
  const anchor = (id: string) => (variant === 'home' ? `#${id}` : `/#${id}`);
  const links = [
    {
      href: anchor('overworld'),
      label: t('dimensions.nav.overworld'),
      d: 'overworld',
    },
    { href: anchor('nether'), label: t('dimensions.nav.nether'), d: 'nether' },
    { href: anchor('end'), label: t('dimensions.nav.end'), d: 'end' },
    {
      href: '/survivalProgress/',
      label: t('dimensions.nav.progress'),
      key: 'progress' as Current,
    },
    {
      href: '/member/',
      label: t('dimensions.nav.members'),
      key: 'members' as Current,
    },
    { href: anchor('respawn'), label: t('dimensions.nav.join'), d: 'respawn' },
  ];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const items = links.map((l) => (
    <a
      key={l.href}
      href={l.href}
      data-d={l.d}
      aria-current={l.key && l.key === current ? 'page' : undefined}
      data-t='control'
      onClick={() => setOpen(false)}
    >
      {l.label}
    </a>
  ));

  return (
    <>
      <header className='dim-bar'>
        <Link className='logo' href='/' aria-label={t('dimensions.nav.home')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src='/assets/brand/brand1.webp' alt='雲鎮工藝 CTEC' />
        </Link>
        <nav aria-label={t('dimensions.nav.menu')}>{items}</nav>
        <button
          className='pill'
          type='button'
          data-action='theme'
          aria-label={t('dimensions.nav.theme')}
          onClick={toggleTheme}
        >
          {isDark ? '夜' : '日'}
        </button>
        <select
          className='pill'
          data-action='language'
          aria-label={t('dimensions.nav.language')}
          value={normalise(i18n.language)}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
        >
          {LANGS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
        <a
          className='pill discord'
          href={serverLink.discord}
          target='_blank'
          rel='noopener noreferrer'
        >
          Discord
        </a>
        <button
          className='pill menu'
          type='button'
          data-action='menu'
          aria-expanded={open}
          aria-controls='dim-sheet'
          onClick={() => setOpen((v) => !v)}
        >
          {open ? t('dimensions.nav.close') : t('dimensions.nav.menu')}
        </button>
      </header>
      <div className='dim-sheet' id='dim-sheet' hidden={!open}>
        <nav aria-label={t('dimensions.nav.menu')}>{items}</nav>
      </div>
    </>
  );
};
```

```tsx
// src/components/dimensions/SiteFooter.tsx
'use client';

import { useTranslation } from 'react-i18next';
import { serverLink } from '@/constants';

export const SiteFooter = () => {
  const { t } = useTranslation();
  return (
    <footer className='dim-foot'>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src='/assets/brand/brand1.webp' alt='雲鎮工藝 CTEC' />
      <a href={serverLink.discord} data-t='control'>
        Discord
      </a>
      <a href={serverLink.youtube} data-t='control'>
        YouTube
      </a>
      <a href={serverLink.x} data-t='control'>
        X
      </a>
      <a href='https://github.com/mc-cloud-town' data-t='control'>
        GitHub
      </a>
      <a href={serverLink.paypal} data-t='control'>
        {t('dimensions.footer.support')}
      </a>
      <span data-t='note'>
        {t('dimensions.footer.rights', { year: new Date().getFullYear() })}
      </span>
    </footer>
  );
};
```

- [ ] **Step 10: 外框樣式**

建立 `src/styles/dimensions/shell.css`。依 CSS 移植規則，從 `docs/design-demos/inner.css` 移植 `.bar`（改名 `.dim-bar`，含 `.logo`、`nav`、`nav a`、`nav a:hover, nav a[aria-current]`）、`.pill`、`.pill:hover`、`.foot`（改名 `.dim-foot`，含 `img`、`a:hover`）。再加上設計稿沒有的部分：

```css
.dim {
  .dim-bar nav a.on {
    opacity: 1;
    border-bottom-color: var(--accent);
  } /* home page: the current dimension */
  .dim-bar select.pill {
    appearance: none;
    text-align: center;
  }
  .dim-bar .menu {
    display: none;
  }
  .dim-sheet {
    position: fixed;
    inset: 0;
    z-index: 49;
    padding: 96px var(--gutter) 40px;
    background: rgba(var(--v), 0.97);
    overflow-y: auto;
  }
  .dim-sheet[hidden] {
    display: none;
  }
  .dim-sheet nav {
    display: grid;
  }
  .dim-sheet a {
    font: 900 28px/1.2 var(--serif);
    padding: 14px 0;
    border-bottom: 1px solid var(--line);
  }
  .dim-sheet a[aria-current],
  .dim-sheet a.on {
    color: var(--accent);
  }
  .dim-foot {
    max-width: 2200px;
    margin-inline: auto;
  }

  @media (max-width: 860px) {
    .dim-bar {
      gap: 8px;
    }
    .dim-bar nav,
    .dim-bar .discord {
      display: none;
    }
    .dim-bar .menu {
      display: inline-flex;
    }
    .dim-foot img {
      flex-basis: 100%;
    }
  }
  @media (min-width: 861px) {
    .dim-sheet {
      display: none;
    }
  }
}
```

- [ ] **Step 11: 新外框的版面，並把成員頁搬進來**

```tsx
// src/app/(dimensions)/layout.tsx
'use client';

import { useI18nBoot } from '@/i18n/useI18nBoot';
import { DimensionProvider } from '#/dimensions/DimensionProvider';

import '@/styles/dimensions/tokens.css';
import '@/styles/dimensions/shell.css';

export default function DimensionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useI18nBoot();
  return <DimensionProvider>{children}</DimensionProvider>;
}
```

每個頁面自己渲染 `<div className='dim'>`、`<SiteBar>`、`<SiteFooter>`，因為首頁與內頁的頂列形式不同。

```bash
mkdir -p "src/app/(dimensions)"
git mv "src/app/(legacy)/member" "src/app/(dimensions)/member"
```

```tsx
// src/app/(dimensions)/member/page.tsx
'use client';

import { SiteBar } from '#/dimensions/SiteBar';
import { SiteFooter } from '#/dimensions/SiteFooter';

export default function Page() {
  return (
    <div className='dim'>
      <SiteBar variant='inner' current='members' />
      <main style={{ minHeight: '100vh' }} />
      <SiteFooter />
    </div>
  );
}
```

- [ ] **Step 12: 確認測試通過**

Run: `yarn lint && yarn typecheck && yarn build && yarn test:e2e tests/dimensions-shell.spec.ts --project=desktop`
Expected: 全部通過（7 個舊外框 + 4 個行為 + 9 個視窗）。

- [ ] **Step 13: 提交**

```bash
git add -A && git commit -m "feat: add the dimensions shell, tokens, typefaces and i18n namespace"
```

---

### Task 3: 成員頁

**Files:**

- Create: `src/components/dimensions/VerticalLabel.tsx`、`InnerHeader.tsx`、`Toolbar.tsx`、`MemberRoster.tsx`、`src/styles/dimensions/inner.css`、`tests/dimensions-members.spec.ts`
- Modify: `src/app/(dimensions)/member/page.tsx`、`src/app/(dimensions)/layout.tsx`（匯入 `inner.css`）

**Interfaces:**

- Consumes: `SiteBar`、`SiteFooter`、`useDimension()`、`useApi<T>(url)`（現有，回傳 `{ data: T | null; loading: boolean; error: { message: string } | null }`）、`IMembers`（`@/types/IMember.ts`，形狀 `{ [group: string]: { uuid: string; name: string }[] }`）、`STATIC_DATA_API`。
- Produces:

  - `<VerticalLabel>{text}</VerticalLabel>`：直排標籤，`aria-hidden`。
  - `<InnerHeader image: string dim: Dimension crumbs: { href?: string; label: string }[] title: string[] lead: string label: string />`
  - `<Toolbar count: string>{children}</Toolbar>`
  - `<MemberRoster />`

- [ ] **Step 1: 寫失敗的測試**

```ts
// tests/dimensions-members.spec.ts
import { expect, test } from '@playwright/test';
import {
  expectNoHorizontalScroll,
  expectNoMissingKeys,
  expectTextFits,
  openPage,
} from './helpers/dimensions';

const DATA = 'https://mc-ctec.org/static-data/member.json';

test.describe('members page', () => {
  test('lists every full and trial member', async ({ page, request }) => {
    const data = await (await request.get(DATA)).json();
    const total = data.member.length + data.trial.length;
    await openPage(page, '/member/');
    await expect(page.locator('.person')).toHaveCount(total);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
    await expect(page.locator('.head h1')).toContainText('製作名單');
    await expectNoMissingKeys(page);
  });

  test('search filters the roster and says so when nothing matches', async ({
    page,
  }) => {
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    await page.locator('.search').fill('xiaoyu');
    await expect(page.locator('.person:visible')).toHaveCount(1);
    await page.locator('.search').fill('zzzzzz');
    await expect(page.locator('.person:visible')).toHaveCount(0);
    await expect(page.locator('.empty')).toBeVisible();
    await expect(page.locator('.group:visible')).toHaveCount(0);
  });

  test('a failed request shows an explanation and a retry control', async ({
    page,
  }) => {
    await page.route(DATA, (r) => r.abort());
    await openPage(page, '/member/');
    await expect(page.locator('.empty')).toContainText('成員資料載入失敗');
    await expect(page.locator('.empty button')).toBeVisible();
  });

  test('a very long name does not break the layout', async ({ page }) => {
    await page.route(DATA, (r) =>
      r.fulfill({
        json: {
          member: [
            {
              uuid: 'x',
              name: 'A_very_long_minecraft_name_that_keeps_going_0123456789',
            },
          ],
          trial: [],
        },
      }),
    );
    await page.setViewportSize({ width: 360, height: 740 });
    await openPage(page, '/member/');
    await page.locator('.person').waitFor();
    await expectNoHorizontalScroll(page);
    await expectTextFits(page);
  });
});
```

Run: `yarn build && yarn test:e2e tests/dimensions-members.spec.ts --project=desktop`
Expected: FAIL，找不到 `.person`。

- [ ] **Step 2: 共用的內頁元件**

```tsx
// src/components/dimensions/VerticalLabel.tsx
/** The upright name on the right of a section. Decorative: the same word is in the heading or the nav. */
export const VerticalLabel = ({ children }: { children: string }) => (
  <div className='vt' aria-hidden='true' data-t='label'>
    {children}
  </div>
);
```

```tsx
// src/components/dimensions/InnerHeader.tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useDimension, type Dimension } from './DimensionProvider';
import { VerticalLabel } from './VerticalLabel';

interface Crumb {
  href?: string;
  label: string;
}

export const InnerHeader = ({
  image,
  dim,
  crumbs,
  title,
  lead,
  label,
}: {
  image: string;
  dim: Dimension;
  crumbs: Crumb[];
  title: string[];
  lead: string;
  label: string;
}) => {
  const { setDim } = useDimension();
  useEffect(() => setDim(dim), [dim, setDim]);

  return (
    <div className='head'>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <div className='bg'>
        <img src={image} alt='' />
      </div>
      <div>
        <p className='crumb mono' data-t='note'>
          {crumbs.map((c, i) => (
            <span key={c.label}>
              {i > 0 && <span aria-hidden='true'> / </span>}
              {c.href ? (
                <Link href={c.href}>{c.label}</Link>
              ) : (
                <span className='acc'>{c.label}</span>
              )}
            </span>
          ))}
        </p>
        <h1 className='serif' data-t='title'>
          {title.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h1>
        <p data-t='body'>{lead}</p>
      </div>
      <VerticalLabel>{label}</VerticalLabel>
    </div>
  );
};
```

```tsx
// src/components/dimensions/Toolbar.tsx
import type { ReactNode } from 'react';

export const Toolbar = ({
  count,
  children,
}: {
  count: string;
  children: ReactNode;
}) => (
  <div className='tools'>
    {children}
    <span className='count mono' data-t='note' aria-live='polite'>
      {count}
    </span>
  </div>
);
```

- [ ] **Step 3: 名冊**

```tsx
// src/components/dimensions/MemberRoster.tsx
'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useApi from '@/hooks/useApi';
import { STATIC_DATA_API } from '@/constants';
import type { IMembers } from '@/types/IMember';
import { Toolbar } from './Toolbar';

const GROUPS = ['member', 'trial'] as const;

export const MemberRoster = () => {
  const { t } = useTranslation();
  const { data, loading, error } = useApi<IMembers>(
    `${STATIC_DATA_API}/member.json`,
  );
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GROUPS.map((key) => {
      const all = data?.[key] ?? [];
      return {
        key,
        total: all.length,
        people: all.filter((m) => m.name.toLowerCase().includes(q)),
      };
    });
  }, [data, query]);

  const total = groups.reduce((n, g) => n + g.total, 0);
  const shown = groups.reduce((n, g) => n + g.people.length, 0);

  return (
    <>
      <Toolbar
        count={data ? t('dimensions.members.count', { n: shown, total }) : ''}
      >
        <input
          className='search'
          type='search'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('dimensions.members.search')}
          aria-label={t('dimensions.members.search')}
        />
      </Toolbar>

      {loading && (
        <p className='empty' data-t='body'>
          {t('dimensions.members.loading')}
        </p>
      )}
      {error && (
        <p className='empty' data-t='body'>
          {t('dimensions.members.error')}{' '}
          <button
            type='button'
            className='pill'
            onClick={() => window.location.reload()}
          >
            {t('dimensions.members.retry')}
          </button>
        </p>
      )}

      {data &&
        groups
          .filter((g) => g.people.length > 0)
          .map((g) => (
            <section className='group' key={g.key}>
              <header>
                <h2 className='serif' data-t='title'>
                  {t(`dimensions.members.groups.${g.key}.title`)}
                </h2>
                <p data-t='body'>
                  {t(`dimensions.members.groups.${g.key}.line`)}
                </p>
                <span className='mono' data-t='note'>
                  {t('dimensions.members.groupCount', { n: g.total })}
                </span>
              </header>
              <ul className='people'>
                {g.people.map((m) => (
                  <li className='person' key={m.uuid} data-t='body'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      loading='lazy'
                      src={`https://mineskin.eu/helm/${m.uuid}/56.png`}
                      alt=''
                      width={28}
                      height={28}
                    />
                    <span>{m.name}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

      {data && shown === 0 && (
        <p className='empty' data-t='body'>
          {t('dimensions.members.empty')}
        </p>
      )}
    </>
  );
};
```

- [ ] **Step 4: 內頁樣式**

建立 `src/styles/dimensions/inner.css`。依移植規則：

- 從 `docs/design-demos/inner.css` 移植 `.head`（含 `.bg`、`.bg img`、`.bg::after`、`> *`、`.crumb`、`.crumb a:hover`、`h1`、`p`、`.vt`、亮色下的 `.vt`）、`.tools`、`.chips` 全部規則、`.tools .count`、`.search` 全部規則、`.empty`、`.next` 全部規則，以及 `@media (max-width: 860px)` 中對應的規則。
- 從 `docs/design-demos/members.html` 的 `<style>` 移植 `.group` 全部規則、`.people`、`.person` 全部規則。

再加上：

```css
.dim {
  .head h1 span {
    display: block;
  }
  .head,
  .tools,
  .group,
  .log,
  .empty,
  .next {
    max-width: 2200px;
    margin-inline: auto;
  }
  .head p[data-t='body'] {
    max-width: min(34em, var(--measure));
  }
  /* long names wrap instead of pushing the grid wider */
  .person {
    min-width: 0;
  }
  .person span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .group header p {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  /* English and other rotated labels: letters turn with the line */
  .vt {
    text-orientation: mixed;
  }
}
```

在 `src/app/(dimensions)/layout.tsx` 加上 `import '@/styles/dimensions/inner.css';`。

- [ ] **Step 5: 頁面**

```tsx
// src/app/(dimensions)/member/page.tsx
'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { SiteBar } from '#/dimensions/SiteBar';
import { SiteFooter } from '#/dimensions/SiteFooter';
import { InnerHeader } from '#/dimensions/InnerHeader';
import { MemberRoster } from '#/dimensions/MemberRoster';

export default function Page() {
  const { t } = useTranslation();
  return (
    <div className='dim'>
      <SiteBar variant='inner' current='members' />
      <main>
        <InnerHeader
          image='/assets/members/CTEC_Members.webp'
          dim='end'
          crumbs={[
            { href: '/', label: t('dimensions.nav.home') },
            { href: '/#end', label: t('dimensions.nav.end') },
            { label: t('dimensions.members.crumb') },
          ]}
          title={
            t('dimensions.members.title', { returnObjects: true }) as string[]
          }
          lead={t('dimensions.members.lead')}
          label={t('dimensions.dim.end')}
        />
        <MemberRoster />
        <div className='next'>
          <Link className='serif' href='/#respawn' data-t='title'>
            {t('dimensions.members.next')} →
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
```

- [ ] **Step 6: 確認測試通過**

Run: `yarn lint && yarn typecheck && yarn build && yarn test:e2e tests/dimensions-members.spec.ts tests/dimensions-shell.spec.ts --project=desktop`
Expected: 全部通過。

- [ ] **Step 7: 對照設計稿**

用瀏覽器並排開啟 `http://localhost:4173/member/`（`yarn start`）與 `docs/design-demos/members.html`，在 1440×900 暗色下確認頁首、工具列、名冊的版面一致。有差異就修到一致再提交。

- [ ] **Step 8: 提交**

```bash
git add -A && git commit -m "feat: rebuild the members page as the full credits roster"
```

---

### Task 4: 進度頁

**Files:**

- Create: `src/constants/progressDimensions.ts`、`src/components/dimensions/ProgressLog.tsx`、`tests/dimensions-progress.spec.ts`
- Modify: `src/styles/dimensions/inner.css`
- Move: `src/app/(legacy)/survivalProgress`、`src/app/(legacy)/survival` → `src/app/(dimensions)/`

**Interfaces:**

- Consumes: `InnerHeader`、`Toolbar`、`useDimension()`、`formatDate()`、`yearOf()`、`useApi`、`IImageContent`（`{ imageUrl: string; title: string; subTitle?: string }`，其中 `title` 是日期、`subTitle` 是名稱）。
- Produces:

  - `type ProgressDimension = 'overworld' | 'nether' | 'end'`
  - `dimensionOf(imageUrl: string): ProgressDimension | undefined`
  - `<ProgressLog />`

- [ ] **Step 1: 寫失敗的測試**

```ts
// tests/dimensions-progress.spec.ts
import { expect, test } from '@playwright/test';
import { expectNoMissingKeys, openPage } from './helpers/dimensions';

const DATA = /static-data\/[^/]+\/survivalProgress\.json/;

test.describe('progress page', () => {
  test('lists every milestone, newest first', async ({ page, request }) => {
    const list = await (
      await request.get(
        'https://mc-ctec.org/static-data/zh_TW/survivalProgress.json',
      )
    ).json();
    await openPage(page, '/survivalProgress/');
    await expect(page.locator('.entry')).toHaveCount(list.length);
    await expect(page.locator('.entry h2').first()).toHaveText(
      list[list.length - 1].subTitle,
    );
    await expectNoMissingKeys(page);
  });

  test('/survival/ is the same page', async ({ page }) => {
    await openPage(page, '/survival/');
    await expect(page.locator('.entry').first()).toBeVisible();
  });

  test('dimension and year filters combine, and an empty result explains itself', async ({
    page,
  }) => {
    await openPage(page, '/survivalProgress/');
    await page.locator('.entry').first().waitFor();
    await page.locator('[data-filter="dim"] button[data-v="end"]').click();
    const end = await page.locator('.entry:visible').count();
    expect(end).toBeGreaterThan(0);
    for (const e of await page.locator('.entry:visible').all())
      await expect(e).toHaveAttribute('data-dim', 'end');
    await page.locator('[data-filter="year"] button[data-v="2025"]').click();
    await expect(page.locator('.entry:visible')).toHaveCount(0);
    await expect(page.locator('.empty')).toBeVisible();
    await page.locator('[data-filter="dim"] button[data-v=""]').click();
    for (const e of await page.locator('.entry:visible').all())
      await expect(e).toHaveAttribute('data-year', '2025');
  });

  test('only confirmed entries carry a dimension tag', async ({ page }) => {
    await openPage(page, '/survivalProgress/');
    await page.locator('.entry').first().waitFor();
    const tagged = await page.locator('.entry .dimtag').count(),
      all = await page.locator('.entry').count();
    expect(tagged).toBeGreaterThan(0);
    expect(tagged).toBeLessThan(all);
  });

  test('the big year and the accent follow the entry being read', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/survivalProgress/');
    const first2022 = page.locator('.entry[data-year="2022"]').first();
    await first2022.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, window.innerHeight / 2));
    await expect(page.locator('.year b')).toHaveText('2022');
  });

  test('a failed request shows an explanation and a retry control', async ({
    page,
  }) => {
    await page.route(DATA, (r) => r.abort());
    await openPage(page, '/survivalProgress/');
    await expect(page.locator('.empty')).toContainText('進度資料載入失敗');
    await expect(page.locator('.empty button')).toBeVisible();
  });
});
```

Run: `yarn build && yarn test:e2e tests/dimensions-progress.spec.ts --project=desktop`
Expected: FAIL，找不到 `.entry`。

- [ ] **Step 2: 維度對照表**

```ts
// src/constants/progressDimensions.ts
export type ProgressDimension = 'overworld' | 'nether' | 'end';

/**
 * Which dimension a milestone belongs to, keyed by its image id.
 * Only confirmed entries are listed: the title names the dimension, or the team confirmed it.
 * Entries that are not listed show no dimension tag. Do not add guesses here.
 */
const CONFIRMED: Record<string, ProgressDimension> = {
  p4: 'nether', // 地獄大廳
  p8: 'nether', // 前往地獄1k空置域之臨時珍珠砲
  p10: 'nether', // Y0切門豬人農場地獄端
  p26: 'nether', // EOL地獄收集
  p11: 'nether', // EOL地獄收集翻新
  p12: 'nether', // 地獄1k空置域
  p49: 'nether', // 地獄大廳主炮
  p51: 'nether', // 刷花機（地獄）
  p34: 'overworld', // 主世界偽和平
  p5: 'overworld', // 主世界切門完成
  p24: 'overworld', // 主世界1k空置域
  p32: 'overworld', // Y0切門豬人農場主世界收集及裝飾
  p13: 'overworld', // EOL主世界裝飾
  p15: 'overworld', // 主世界豬人塔
  p6: 'end', // 終界農業區
  p21: 'end', // 終界大廳
  p14: 'end', // 月宮（團隊確認）
};

/** "survivalProgress/p14.webp" -> "end" */
export const dimensionOf = (imageUrl: string): ProgressDimension | undefined =>
  CONFIRMED[imageUrl.replace(/^.*\//, '').replace(/\.\w+$/, '')];
```

- [ ] **Step 3: 進度清單**

```tsx
// src/components/dimensions/ProgressLog.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useApi from '@/hooks/useApi';
import { STATIC_DATA_API } from '@/constants';
import {
  dimensionOf,
  type ProgressDimension,
} from '@/constants/progressDimensions';
import { formatDate, yearOf } from '@/lib/dimensions/format';
import type { IImageContent } from '@/types/IImageContent';
import { useDimension } from './DimensionProvider';
import { Toolbar } from './Toolbar';

const DIMS: ProgressDimension[] = ['overworld', 'nether', 'end'];

export const ProgressLog = () => {
  const { t, i18n } = useTranslation();
  const { setDim } = useDimension();
  const { data, loading, error } = useApi<IImageContent[]>(
    `${STATIC_DATA_API}/${i18n.language}/survivalProgress.json`,
  );
  const [dim, setFilterDim] = useState<ProgressDimension | ''>('');
  const [year, setYear] = useState('');
  const [nowYear, setNowYear] = useState('');
  const list = useRef<HTMLOListElement>(null);

  const items = useMemo(
    () =>
      (data ?? [])
        .map((x, i) => ({
          no: i + 1,
          year: yearOf(x.title),
          date: formatDate(x.title),
          name: x.subTitle ?? '',
          image: `${STATIC_DATA_API}/images/${x.imageUrl}`,
          dim: dimensionOf(x.imageUrl),
        }))
        .reverse(),
    [data],
  );
  const years = useMemo(() => [...new Set(items.map((i) => i.year))], [items]);
  const shown = items.filter(
    (i) => (!dim || i.dim === dim) && (!year || i.year === year),
  );
  const perYear = (y: string) => items.filter((i) => i.year === y).length;

  // The entry crossing the middle of the screen sets the big year and the accent colour.
  useEffect(() => {
    const root = list.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          setNowYear(el.dataset.year ?? '');
          if (el.dataset.dim) setDim(el.dataset.dim as ProgressDimension);
        }),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    root.querySelectorAll('.entry').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [shown.length, dim, year, setDim]);

  const bigYear = nowYear || shown[0]?.year || '';

  return (
    <>
      <Toolbar
        count={
          data
            ? t('dimensions.progress.count', {
                n: shown.length,
                total: items.length,
              })
            : ''
        }
      >
        <div
          className='chips'
          role='group'
          data-filter='dim'
          aria-label={t('dimensions.progress.allDims')}
        >
          <button
            type='button'
            data-v=''
            aria-pressed={dim === ''}
            onClick={() => setFilterDim('')}
          >
            {t('dimensions.progress.allDims')}
          </button>
          {DIMS.map((d) => (
            <button
              key={d}
              type='button'
              data-v={d}
              aria-pressed={dim === d}
              onClick={() => setFilterDim(d)}
            >
              {t(`dimensions.nav.${d}`)}
            </button>
          ))}
        </div>
        <div
          className='chips'
          role='group'
          data-filter='year'
          aria-label={t('dimensions.progress.allYears')}
        >
          <button
            type='button'
            data-v=''
            aria-pressed={year === ''}
            onClick={() => setYear('')}
          >
            {t('dimensions.progress.allYears')}
          </button>
          {years.map((y) => (
            <button
              key={y}
              type='button'
              data-v={y}
              aria-pressed={year === y}
              onClick={() => setYear(y)}
            >
              {y}
            </button>
          ))}
        </div>
      </Toolbar>

      {loading && (
        <p className='empty' data-t='body'>
          {t('dimensions.progress.loading')}
        </p>
      )}
      {error && (
        <p className='empty' data-t='body'>
          {t('dimensions.progress.error')}{' '}
          <button
            type='button'
            className='pill'
            onClick={() => window.location.reload()}
          >
            {t('dimensions.progress.retry')}
          </button>
        </p>
      )}

      {shown.length > 0 && (
        <div className='log'>
          <div className='year' aria-hidden='true'>
            <b>{bigYear}</b>
            <small data-t='note'>
              {t('dimensions.progress.perYear', { n: perYear(bigYear) })}
            </small>
          </div>
          <ol className='entries' ref={list}>
            {shown.map((it) => (
              <li
                className='entry'
                key={it.no}
                data-dim={it.dim}
                data-year={it.year}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <figure>
                  <img loading='lazy' src={it.image} alt={it.name} />
                </figure>
                <div>
                  <p className='meta mono' data-t='note'>
                    <span>{it.date}</span>
                    {it.dim && (
                      <span className={`dimtag ${it.dim}`}>
                        {t(`dimensions.nav.${it.dim}`)}
                      </span>
                    )}
                    <span className='no'>
                      {t('dimensions.progress.no', { n: it.no })}
                    </span>
                  </p>
                  <h2 className='serif' data-t='title'>
                    {it.name}
                  </h2>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {data && shown.length === 0 && (
        <p className='empty' data-t='body'>
          {t('dimensions.progress.empty')}
        </p>
      )}
    </>
  );
};
```

- [ ] **Step 4: 樣式**

在 `src/styles/dimensions/inner.css` 的 `.dim { … }` 內，從 `docs/design-demos/progress.html` 的 `<style>` 移植 `.log`、`.year`、`.year small`、`.entries`、`.entry` 全部規則（把 `.dim.overworld`、`.dim.nether`、`.dim.end` 三組顏色規則的選擇器改成 `.dimtag.overworld` 等，`.entry .dim` 改成 `.entry .dimtag`），以及 `@media (max-width: 860px)` 的對應規則。再加上：

```css
.dim {
  .year b {
    display: block;
    font: inherit;
  }
  .entry h2 {
    overflow-wrap: anywhere;
  }
  /* short landscape screens: the sticky year would cover the list */
  @media (max-height: 480px) {
    .year {
      position: static;
    }
  }
}
```

- [ ] **Step 5: 頁面與別名**

```bash
git mv "src/app/(legacy)/survivalProgress" "src/app/(dimensions)/survivalProgress"
git mv "src/app/(legacy)/survival" "src/app/(dimensions)/survival"
```

```tsx
// src/app/(dimensions)/survivalProgress/page.tsx
'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { SiteBar } from '#/dimensions/SiteBar';
import { SiteFooter } from '#/dimensions/SiteFooter';
import { InnerHeader } from '#/dimensions/InnerHeader';
import { ProgressLog } from '#/dimensions/ProgressLog';

export default function ProgressPage() {
  const { t } = useTranslation();
  return (
    <div className='dim'>
      <SiteBar variant='inner' current='progress' />
      <main>
        <InnerHeader
          image='/assets/homePage/CTEC_Building.webp'
          dim='overworld'
          crumbs={[
            { href: '/', label: t('dimensions.nav.home') },
            { label: t('dimensions.progress.crumb') },
          ]}
          title={
            t('dimensions.progress.title', { returnObjects: true }) as string[]
          }
          lead={t('dimensions.progress.lead', { total: 53 })}
          label={t('dimensions.dim.all')}
        />
        <ProgressLog />
        <div className='next'>
          <Link className='serif' href='/member/' data-t='title'>
            {t('dimensions.progress.next')} →
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
```

```tsx
// src/app/(dimensions)/survival/page.tsx
export { default } from '../survivalProgress/page';
```

- [ ] **Step 6: 確認測試通過**

Run: `yarn lint && yarn typecheck && yarn build && yarn test:e2e tests/dimensions-progress.spec.ts --project=desktop`
Expected: 6 passed。

- [ ] **Step 7: 對照設計稿**

並排比對 `/survivalProgress/` 與 `docs/design-demos/progress.html`（1440×900，暗色與亮色）。與設計稿唯一的預期差異：沒有確認維度的項目不顯示維度標籤。

- [ ] **Step 8: 提交**

```bash
git add -A && git commit -m "feat: rebuild the progress page as the full world log"
```

---

### Task 5: 首頁骨架：舞台、載入畫面、出生點

**Files:**

- Create: `src/constants/scenes.ts`、`src/lib/dimensions/transitions.ts`、`src/lib/dimensions/choreography.ts`、`src/components/dimensions/home/{HomePage,World,Loader,Hero}.tsx`、`src/styles/dimensions/home.css`、`tests/dimensions-home.spec.ts`
- Modify: `src/app/(dimensions)/layout.tsx`（匯入 `home.css`）
- Move: `src/app/(legacy)/page.tsx`、`src/app/(legacy)/home` → `src/app/(dimensions)/`

**Interfaces:**

- Consumes: `SiteBar`、`useDimension()`、`SERVER_START_MS`、`daysSince()`。
- Produces:

  - `type SceneId = 'spawn' | 'town' | 'w1' | 'w2' | 'w3' | 'nether' | 'hall' | 'moon' | 'farm' | 'end' | 'day1'`
  - `type Veil = 'hero' | 'side' | 'side-flip' | 'wide' | 'foot' | 'none'`
  - `interface SceneDef { id: SceneId; src?: string; veil: Veil }`、`SCENES: SceneDef[]`
  - `type Fx = 'push' | 'curtain' | 'slide' | 'portal' | 'fall' | 'wake'`
  - `interface TransitionDef { trigger: string; from: SceneId; to: SceneId; fx: Fx }`、`TRANSITIONS: TransitionDef[]`（依頁面順序）
  - `NETHER_IMAGES: string[]`（六張地獄設施圖，依序）
  - `addTransition(tl: gsap.core.Timeline, root: HTMLElement, def: TransitionDef): void`
  - `buildChoreography(root: HTMLElement, opts: { reduced: boolean; onDim: (d: Dimension) => void; onLedger: (index: number) => void }): () => void`（回傳清理函式）
  - 標記約定：場景圖層 `<div class="scene" data-scene="{id}">` 內含 `.zoom > .cam`；每個內容段落帶 `data-dim`；`<Loader>` 完成時在根元素設定 `data-ready="true"`。

- [ ] **Step 1: 寫失敗的測試**

```ts
// tests/dimensions-home.spec.ts
import { expect, test, type Page } from '@playwright/test';
import { expectNoMissingKeys, openPage } from './helpers/dimensions';

/** Ids of the scene layers that are actually on screen. */
export const visibleScenes = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.scene')]
      .filter((s) => {
        const c = getComputedStyle(s);
        return c.visibility !== 'hidden' && +c.opacity > 0.5;
      })
      .map((s) => s.dataset.scene),
  );

/** Scroll so that `selector` sits `offset` viewport-heights below the top, then let the scrub settle. */
export const scrollToSection = async (
  page: Page,
  selector: string,
  offset = 0.3,
) => {
  await page.evaluate(
    ([sel, off]) => {
      const el = document.querySelector(sel as string)!;
      window.scrollTo(
        0,
        el.getBoundingClientRect().top +
          window.scrollY +
          (off as number) * window.innerHeight,
      );
    },
    [selector, offset],
  );
  await page.waitForTimeout(1800);
};

export const ready = (page: Page) =>
  page.locator('.dim[data-ready="true"]').waitFor({ timeout: 20_000 });

test.describe('home: spawn', () => {
  test('the loader gives way to the title over the spawn scene', async ({
    page,
  }) => {
    await openPage(page, '/');
    await ready(page);
    await expect(page.locator('.loader')).toBeHidden();
    await expect(page.locator('.hero h1')).toHaveAttribute(
      'aria-label',
      '雲鎮工藝',
    );
    await expect(page.locator('.hero h1')).toBeVisible();
    expect(await visibleScenes(page)).toEqual(['spawn']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'overworld');
    await expectNoMissingKeys(page);
  });

  test('the title stays 雲鎮工藝 in English, with the English name beside it', async ({
    page,
  }) => {
    await openPage(page, '/', { locale: 'en' });
    await ready(page);
    await expect(page.locator('.hero h1')).toHaveAttribute(
      'aria-label',
      '雲鎮工藝',
    );
    await expect(page.locator('.hero-copy')).toContainText(
      'CLOUD TOWN EXQUISITE CRAFT',
    );
    await expect(page.locator('.hero-copy')).toContainText('Join us');
  });

  test('/home/ is the same page', async ({ page }) => {
    await openPage(page, '/home/');
    await ready(page);
    await expect(page.locator('.hero h1')).toBeVisible();
  });

  test('uptime counts days since 2022-07-23', async ({ page }) => {
    await openPage(page, '/');
    await ready(page);
    const days = Math.floor(
      (Date.now() - Date.UTC(2022, 6, 22, 16)) / 86_400_000,
    );
    await expect(page.locator('.hero-meta')).toContainText(String(days));
  });
});
```

Run: `yarn build && yarn test:e2e tests/dimensions-home.spec.ts --project=desktop`
Expected: FAIL，找不到 `.dim[data-ready]`。

- [ ] **Step 2: 場景與換場清單**

```ts
// src/constants/scenes.ts
import { STATIC_DATA_API } from '@/constants';

export type SceneId =
  | 'spawn'
  | 'town'
  | 'w1'
  | 'w2'
  | 'w3'
  | 'nether'
  | 'hall'
  | 'moon'
  | 'farm'
  | 'end'
  | 'day1';
export type Veil = 'hero' | 'side' | 'side-flip' | 'wide' | 'foot' | 'none';
export type Fx = 'push' | 'curtain' | 'slide' | 'portal' | 'fall' | 'wake';

export interface SceneDef {
  id: SceneId;
  src?: string;
  veil: Veil;
}
export interface TransitionDef {
  trigger: string;
  from: SceneId;
  to: SceneId;
  fx: Fx;
}

const progress = (id: string) =>
  `${STATIC_DATA_API}/images/survivalProgress/${id}.webp`;

/** Stacking order is DOM order: later scenes sit above earlier ones. */
export const SCENES: SceneDef[] = [
  { id: 'spawn', src: '/assets/members/CTEC_Members.webp', veil: 'hero' },
  { id: 'town', src: '/assets/homePage/CTEC_Building.webp', veil: 'side' },
  { id: 'w1', src: progress('p40'), veil: 'foot' }, // 瑪莉亞之牆
  { id: 'w2', src: progress('p33'), veil: 'side-flip' }, // 新出生點
  { id: 'w3', src: progress('p17'), veil: 'foot' }, // 全編碼全物品
  { id: 'nether', veil: 'wide' }, // six stacked images, see NETHER_IMAGES
  { id: 'hall', src: progress('p21'), veil: 'side' }, // 終界大廳
  { id: 'moon', src: progress('p14'), veil: 'foot' }, // 月宮
  { id: 'farm', src: progress('p6'), veil: 'side-flip' }, // 終界農業區
  { id: 'end', veil: 'none' }, // starfield
  { id: 'day1', src: progress('p2'), veil: 'side' }, // 開服當天
];

/** In the order of nether.ledger in the translations. */
export const NETHER_IMAGES = ['p4', 'p10', 'p12', 'p38', 'p49', 'p51'].map(
  progress,
);

/**
 * One transition per section, in page order. Neighbours never share an effect.
 * `trigger` is a selector inside the home page root.
 */
export const TRANSITIONS: TransitionDef[] = [
  { trigger: '#overworld', from: 'spawn', to: 'town', fx: 'push' },
  {
    trigger: '[data-work="overworld-0"]',
    from: 'town',
    to: 'w1',
    fx: 'curtain',
  },
  { trigger: '[data-work="overworld-1"]', from: 'w1', to: 'w2', fx: 'slide' },
  { trigger: '[data-work="overworld-2"]', from: 'w2', to: 'w3', fx: 'push' },
  { trigger: '#nether', from: 'w3', to: 'nether', fx: 'portal' },
  { trigger: '#end', from: 'nether', to: 'hall', fx: 'fall' },
  { trigger: '[data-work="end-0"]', from: 'hall', to: 'moon', fx: 'slide' },
  { trigger: '[data-work="end-1"]', from: 'moon', to: 'farm', fx: 'curtain' },
  { trigger: '#credits', from: 'farm', to: 'end', fx: 'push' },
  { trigger: '#respawn', from: 'end', to: 'day1', fx: 'wake' },
];
```

- [ ] **Step 3: 六種換場**

```ts
// src/lib/dimensions/transitions.ts
import type gsap from 'gsap';
import type { TransitionDef } from '@/constants/scenes';

const layer = (root: HTMLElement, id: string) => {
  const el = root.querySelector<HTMLElement>(`.scene[data-scene="${id}"]`);
  if (!el) throw new Error(`scene "${id}" is not in the world`);
  return { el, zoom: el.querySelector<HTMLElement>('.zoom')! };
};

/**
 * Write one scene change into a normalised 0..1 timeline. Whole layers move with transform and opacity only.
 *   push     dissolve while pushing in
 *   curtain  next scene rises from the bottom edge
 *   slide    next scene comes in from the right
 *   portal   the portal canvas covers the screen, the scene swaps behind it
 *   fall     old scene spins away and shrinks, next one turns into place
 *   wake     white-out, then the world again
 */
export const addTransition = (
  tl: gsap.core.Timeline,
  root: HTMLElement,
  def: TransitionDef,
) => {
  const A = layer(root, def.from),
    B = layer(root, def.to);
  const im = { immediateRender: false },
    io = 'power2.inOut';

  if (def.fx === 'curtain' || def.fx === 'slide') {
    const p = def.fx === 'curtain' ? 'yPercent' : 'xPercent';
    // the layer moves in while its content moves the opposite way by the same amount: the picture stays put and is revealed
    tl.set(B.el, { autoAlpha: 1 }, 0)
      .fromTo(B.el, { [p]: 100 }, { [p]: 0, duration: 1, ease: io, ...im }, 0)
      .fromTo(
        B.zoom,
        { [p]: -100 },
        { [p]: 0, duration: 1, ease: io, ...im },
        0,
      )
      .fromTo(A.zoom, { [p]: 0 }, { [p]: -14, duration: 1, ease: io }, 0)
      .set(A.el, { autoAlpha: 0 }, 1);
  } else if (def.fx === 'portal' || def.fx === 'wake') {
    const cover = root.querySelector<HTMLElement>(
      def.fx === 'portal' ? '.portal' : '.flash',
    );
    tl.fromTo(
      cover,
      { autoAlpha: 0, scale: 1 },
      { autoAlpha: 1, scale: 1.25, duration: 0.5, ease: 'power2.in' },
      0,
    )
      .fromTo(
        A.zoom,
        { scale: 1 },
        { scale: 1.25, duration: 0.5, ease: 'power2.in' },
        0,
      )
      .set(A.el, { autoAlpha: 0 }, 0.5)
      .set(B.el, { autoAlpha: 1 }, 0.5)
      .fromTo(
        B.zoom,
        { scale: 1.3 },
        { scale: 1, duration: 0.5, ease: 'power3.out', ...im },
        0.5,
      )
      .to(
        cover,
        { autoAlpha: 0, scale: 1.5, duration: 0.5, ease: 'power2.out' },
        0.5,
      );
  } else if (def.fx === 'fall') {
    tl.fromTo(
      A.zoom,
      { scale: 1, rotate: 0 },
      { scale: 0.55, rotate: 24, duration: 1, ease: 'power2.in' },
      0,
    )
      .to(A.el, { autoAlpha: 0, duration: 0.5, ease: 'power1.in' }, 0.5)
      .fromTo(
        B.el,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.6, ease: 'none', ...im },
        0.2,
      )
      .fromTo(
        B.zoom,
        { scale: 1.7, rotate: -40 },
        { scale: 1, rotate: 0, duration: 1, ease: 'power2.out', ...im },
        0,
      );
  } else {
    tl.fromTo(
      A.zoom,
      { scale: 1 },
      { scale: 1.22, duration: 1, ease: 'power2.in' },
      0,
    )
      .to(A.el, { autoAlpha: 0, duration: 0.6, ease: 'power1.in' }, 0.4)
      .fromTo(
        B.el,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.6, ease: 'none', ...im },
        0.2,
      )
      .fromTo(
        B.zoom,
        { scale: 1.18 },
        { scale: 1, duration: 1, ease: 'power2.out', ...im },
        0,
      );
  }
};
```

- [ ] **Step 4: 編排（本任務只處理出生點）**

```ts
// src/lib/dimensions/choreography.ts
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { TRANSITIONS, type TransitionDef } from '@/constants/scenes';
import type { Dimension } from '#/dimensions/DimensionProvider';
import { addTransition } from './transitions';

gsap.registerPlugin(ScrollTrigger);

export interface ChoreographyOptions {
  reduced: boolean;
  onDim: (d: Dimension) => void;
  onLedger: (index: number) => void;
}

/**
 * Every scroll-driven animation on the home page is created here, top to bottom.
 * Order matters: the pinned nether ledger adds scroll length, so any trigger below it
 * must be created after it or its position is measured wrong.
 * Returns a cleanup function.
 */
export const buildChoreography = (
  root: HTMLElement,
  opts: ChoreographyOptions,
): (() => void) => {
  const q = <T extends HTMLElement = HTMLElement>(sel: string) =>
    root.querySelector<T>(sel);
  const has = (def: TransitionDef) =>
    Boolean(
      q(def.trigger) &&
        q(`.scene[data-scene="${def.to}"]`) &&
        q(`.scene[data-scene="${def.from}"]`),
    );

  let lenis: Lenis | null = null;
  const raf = (t: number) => lenis?.raf(t * 1000);

  const ctx = gsap.context(() => {
    // which dimension the reader is in
    gsap.utils.toArray<HTMLElement>('[data-dim]', root).forEach((el) =>
      ScrollTrigger.create({
        trigger: el,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (s) => s.isActive && opts.onDim(el.dataset.dim as Dimension),
      }),
    );

    if (opts.reduced) {
      // no scrubbed motion: the scene simply switches when its section reaches the middle of the screen
      const show = (id: string) =>
        gsap.utils
          .toArray<HTMLElement>('.scene', root)
          .forEach((s) =>
            gsap.set(s, { autoAlpha: s.dataset.scene === id ? 1 : 0 }),
          );
      ScrollTrigger.create({
        trigger: q('.hero'),
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: (s) => s.isActive && show('spawn'),
      });
      TRANSITIONS.filter(has).forEach((def) =>
        ScrollTrigger.create({
          trigger: q(def.trigger),
          start: 'top 50%',
          end: 'bottom 50%',
          onToggle: (s) => s.isActive && show(def.to),
        }),
      );
      return;
    }

    // Lenis does the easing, so scrubbed timelines follow the scroll position directly
    lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const change = (def: TransitionDef) => {
      if (!has(def)) return;
      addTransition(
        gsap.timeline({
          scrollTrigger: {
            trigger: q(def.trigger),
            start: 'top bottom',
            end: 'top top',
            scrub: true,
          },
        }),
        root,
        def,
      );
    };

    // ── spawn ──
    gsap
      .timeline({
        scrollTrigger: {
          trigger: q('.hero'),
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })
      .to(q('.hero .vt'), { yPercent: -30, opacity: 0, ease: 'power1.in' }, 0)
      .to(
        root.querySelectorAll('.hero-copy, .hero-meta'),
        { y: -80, opacity: 0, duration: 0.5 },
        0,
      );

    // ── later tasks append here, in page order ──
    TRANSITIONS.slice(0, 1).forEach(change);
  }, root);

  return () => {
    gsap.ticker.remove(raf);
    lenis?.destroy();
    ctx.revert();
  };
};
```

- [ ] **Step 5: 舞台、載入畫面、出生點**

```tsx
// src/components/dimensions/home/World.tsx
import { NETHER_IMAGES, SCENES } from '@/constants/scenes';

const VEIL: Record<string, string> = {
  hero: 'veil veil--hero',
  side: 'veil veil--side',
  'side-flip': 'veil veil--side veil--flip',
  wide: 'veil veil--wide',
  foot: 'veil veil--foot',
};

/** The fixed stage. Scenes are stacked layers; choreography.ts decides which one is showing. */
export const World = ({ children }: { children?: React.ReactNode }) => (
  <div className='world' aria-hidden='true'>
    {SCENES.map((s, i) => (
      <div
        className={`scene${i === 0 ? ' is-first' : ''}`}
        data-scene={s.id}
        key={s.id}
      >
        <div className='zoom'>
          <div className='cam'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {s.src && (
              <img src={s.src} alt='' loading={i === 0 ? 'eager' : 'lazy'} />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {s.id === 'nether' &&
              NETHER_IMAGES.map((src, k) => (
                <img
                  key={src}
                  src={src}
                  alt=''
                  loading='lazy'
                  data-ledger={k}
                  style={{ opacity: k === 0 ? 1 : 0 }}
                />
              ))}
            {s.id === 'end' && children}
            {VEIL[s.veil] && <div className={VEIL[s.veil]} />}
          </div>
        </div>
      </div>
    ))}
  </div>
);
```

```tsx
// src/components/dimensions/home/Loader.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useTranslation } from 'react-i18next';

const TONES = [
  '#3f6f3a',
  '#4f8a45',
  '#2f5d7a',
  '#6aa34f',
  '#7a6a45',
  '#35607f',
];

/** Chunks load outward from the centre, like the game's world-load map. Calls onDone once, then removes itself. */
export const Loader = ({
  reduced,
  onDone,
}: {
  reduced: boolean;
  onDone: () => void;
}) => {
  const { t } = useTranslation();
  const grid = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const cells = [...(grid.current?.children ?? [])] as HTMLElement[];
    const order = cells
      .map((el, i) => ({
        el,
        d:
          Math.max(Math.abs((i % 7) - 3), Math.abs(Math.floor(i / 7) - 3)) +
          Math.random() * 0.6,
      }))
      .sort((a, b) => a.d - b.d);
    const p = { v: 0 };
    const fill = gsap.to(p, {
      v: 1,
      duration: reduced ? 0.1 : 1.5,
      ease: 'power1.inOut',
      onUpdate: () => {
        setPct(Math.round(p.v * 100));
        order.forEach((o, i) => {
          if (i < p.v * 49)
            o.el.style.background =
              o.el.style.background || TONES[i % TONES.length];
        });
      },
    });
    let cancelled = false;
    Promise.all([document.fonts.ready, fill.then()]).then(() => {
      if (cancelled) return;
      setGone(true);
      onDone();
    });
    return () => {
      cancelled = true;
      fill.kill();
    };
  }, [reduced, onDone]);

  if (gone) return null;
  return (
    <div className='loader' aria-hidden='true'>
      <div className='loader-in'>
        <div className='chunks' ref={grid}>
          {Array.from({ length: 49 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
        <p>
          <span>{t('dimensions.hero.loading')}</span>
          <span>{pct}%</span>
        </p>
      </div>
    </div>
  );
};
```

```tsx
// src/components/dimensions/home/Hero.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { daysSince, SERVER_START_MS } from '@/lib/dimensions/format';

const pad = (n: number) => String(n).padStart(2, '0');

export const Hero = () => {
  const { t } = useTranslation();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const ms = now === null ? 0 : now - SERVER_START_MS;
  const clock = `${pad(Math.floor(ms / 3_600_000) % 24)}:${pad(Math.floor(ms / 60_000) % 60)}:${pad(Math.floor(ms / 1000) % 60)}`;

  return (
    <section className='hero' id='top' data-dim='overworld'>
      <div className='hero-meta mono'>
        <span data-t='note'>{t('dimensions.hero.since')}</span>
        <strong data-t='note'>
          {now === null
            ? ''
            : t('dimensions.hero.uptime', {
                days: daysSince(SERVER_START_MS, now),
                clock,
              })}
        </strong>
      </div>
      {/* The brand name is the same in every language. */}
      <h1 className='vt' aria-label='雲鎮工藝' data-t='title'>
        {[...'雲鎮工藝'].map((ch) => (
          <i key={ch}>
            <b>{ch}</b>
          </i>
        ))}
      </h1>
      <div className='hero-copy'>
        <p className='en up' data-t='note'>
          CLOUD TOWN EXQUISITE CRAFT
        </p>
        <p className='lead up' data-t='body'>
          {t('dimensions.hero.lead')}
        </p>
        <a className='btn up' href='#respawn' data-t='control'>
          {t('dimensions.hero.cta')} <span aria-hidden='true'>→</span>
        </a>
        <div className='cue up' data-t='note'>
          <i />
          {t('dimensions.hero.cue')}
        </div>
      </div>
    </section>
  );
};
```

```tsx
// src/components/dimensions/home/HomePage.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SiteBar } from '#/dimensions/SiteBar';
import { useDimension } from '#/dimensions/DimensionProvider';
import { buildChoreography } from '@/lib/dimensions/choreography';
import { World } from './World';
import { Loader } from './Loader';
import { Hero } from './Hero';

export const HomePage = () => {
  const root = useRef<HTMLDivElement>(null);
  const { setDim } = useDimension();
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState<boolean | null>(null);
  const [, setLedger] = useState(0);

  useEffect(
    () =>
      setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches),
    [],
  );

  // Build once the loader is done, so measurements see the final fonts and layout.
  useEffect(() => {
    if (!ready || reduced === null || !root.current) return;
    const el = root.current;
    const dispose = buildChoreography(el, {
      reduced,
      onDim: setDim,
      onLedger: setLedger,
    });
    if (!reduced) {
      gsap.from(el.querySelectorAll('.hero .vt b'), {
        yPercent: 105,
        duration: 1.3,
        stagger: 0.12,
        ease: 'expo.out',
      });
      gsap.from(el.querySelectorAll('.hero .up, .hero-meta'), {
        y: 22,
        opacity: 0,
        duration: 1,
        stagger: 0.06,
        ease: 'power3.out',
        delay: 0.3,
      });
    }
    ScrollTrigger.refresh();
    return dispose;
  }, [ready, reduced, setDim]);

  const onDone = useCallback(() => setReady(true), []);

  return (
    <div className='dim dim--home' ref={root} data-ready={ready}>
      <World />
      <div className='flash' aria-hidden='true' />
      {reduced !== null && <Loader reduced={reduced} onDone={onDone} />}
      <SiteBar variant='home' />
      <main>
        <Hero />
      </main>
    </div>
  );
};
```

- [ ] **Step 6: 樣式**

建立 `src/styles/dimensions/home.css`。依移植規則，從 `docs/design-demos/dimensions-v2.html` 的 `<style>` 移植：`.world`、`.scene`、`.scene.is-first`、`.zoom, .cam`、`.cam img`、`.veil`、`.veil--side`、`.veil--wide`、`.veil--flip`、亮色下較窄的 `.veil--side`、`.veil--foot`、`.veil--hero`、`.flash`、`.loader` 全部規則、`.chunks` 全部規則、`main`、`.vt` 全部規則、`.btn` 全部規則、`.hero` 全部規則、`.hero-meta` 全部規則、`.hero-copy` 全部規則、`.cue` 全部規則與 `@keyframes cue`，以及兩個媒體查詢中對應的規則。

亮色主題選擇器的寫法：設計稿的 `[data-theme='light']:not([data-dim='end']) .veil--side` 改成 `[data-theme='light']:not([data-dim='end']) .dim .veil--side`。

在首頁，頂列是透明的。再加上：

```css
.dim.dim--home {
  .dim-bar {
    background: none;
    backdrop-filter: none;
    border-bottom: 0;
  }
  .dim-bar::before {
    content: '';
    position: absolute;
    inset: 0 0 -28px;
    z-index: -1;
    pointer-events: none;
    background: linear-gradient(
      180deg,
      rgba(var(--v), 0.92) 35%,
      rgba(var(--v), 0)
    );
  }
  main > * {
    max-width: 2200px;
    margin-inline: auto;
  }
  .vt {
    text-orientation: mixed;
  }
  /* short landscape screens: the title would run off the bottom */
  @media (max-height: 480px) {
    .hero {
      min-height: 0;
    }
    .hero .vt {
      font-size: 15vh;
    }
    .hero-copy {
      bottom: 24px;
    }
    .hero-copy p.lead {
      margin: 6px 0 12px;
    }
    .cue {
      display: none;
    }
  }
}
```

在 `src/app/(dimensions)/layout.tsx` 加上 `import '@/styles/dimensions/home.css';`。

- [ ] **Step 7: 頁面與別名**

```bash
git mv "src/app/(legacy)/page.tsx" "src/app/(dimensions)/page.tsx"
git mv "src/app/(legacy)/home" "src/app/(dimensions)/home"
```

```tsx
// src/app/(dimensions)/page.tsx
import { HomePage } from '#/dimensions/home/HomePage';

export default function Page() {
  return <HomePage />;
}
```

```tsx
// src/app/(dimensions)/home/page.tsx
export { default } from '../page';
```

- [ ] **Step 8: 確認測試通過**

Run: `yarn lint && yarn typecheck && yarn build && yarn test:e2e tests/dimensions-home.spec.ts --project=desktop`
Expected: 4 passed。

- [ ] **Step 9: 提交**

```bash
git add -A && git commit -m "feat: home page stage, loader and spawn section"
```

---

### Task 6: 主世界

**Files:**

- Create: `src/components/dimensions/home/DimensionOpening.tsx`、`WorkSection.tsx`
- Modify: `HomePage.tsx`、`choreography.ts`、`home.css`、`tests/dimensions-home.spec.ts`

**Interfaces:**

- Consumes: `VerticalLabel`、`TRANSITIONS`、`useApi`、`IMembers`、`GITHUB_API`、`daysSince`。
- Produces:

  - `<DimensionOpening id: 'overworld' | 'nether' | 'end' tag: string say: string[] body: string label: string>{children}</DimensionOpening>`：`<section class="open" id={id} data-dim={id}>`，宣言每行一個 `<span>`。
  - `<WorkSection group: 'overworld' | 'end' index: number meta: string name: string />`：`<section class="work-sec" data-work="{group}-{index}" data-dim={group}>`。位置樣式依 `index % 3`：0 是左下（`work--bl`），1 是右側置中（`work--tr`），2 是底部置中（`work--bc`）。

- [ ] **Step 1: 寫失敗的測試**

```ts
// tests/dimensions-home.spec.ts（附加）
test.describe('home: overworld', () => {
  test('the town scene shows behind the statement, with the label upright on the right', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#overworld');
    expect(await visibleScenes(page)).toEqual(['town']);
    const label = page.locator('#overworld .vt');
    await expect(label).toHaveCSS('writing-mode', 'vertical-rl');
    const [box, say] = await Promise.all([
      label.boundingBox(),
      page.locator('#overworld .say').boundingBox(),
    ]);
    expect(box!.x).toBeGreaterThan(say!.x + say!.width);
  });

  test('stats show the day count and live member count', async ({
    page,
    request,
  }) => {
    const members = (
      await (
        await request.get('https://mc-ctec.org/static-data/member.json')
      ).json()
    ).member.length;
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#overworld');
    await expect(page.locator('[data-stat="members"]')).toHaveText(
      String(members),
    );
    await expect(page.locator('#overworld a.more')).toHaveAttribute(
      'href',
      '/survivalProgress/',
    );
  });

  test('stats keep their defaults when the requests fail', async ({ page }) => {
    await page.route(/member\.json|api\.github\.com/, (r) => r.abort());
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#overworld');
    await expect(page.locator('[data-stat="members"]')).toHaveText('116');
    await expect(page.locator('[data-stat="repos"]')).toHaveText('29');
  });

  test('each of the three builds shows its own scene', async ({ page }) => {
    await openPage(page, '/');
    await ready(page);
    for (const [i, scene] of ['w1', 'w2', 'w3'].entries()) {
      await scrollToSection(page, `[data-work="overworld-${i}"]`, 0.2);
      expect(await visibleScenes(page), `build ${i}`).toEqual([scene]);
      await expect(
        page.locator(`[data-work="overworld-${i}"] h3`),
      ).toBeVisible();
    }
  });

  test('halfway into a build both scenes are on screen', async ({ page }) => {
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '[data-work="overworld-0"]', -0.5);
    expect(await visibleScenes(page)).toEqual(['town', 'w1']);
  });
});
```

Run: `yarn build && yarn test:e2e tests/dimensions-home.spec.ts --project=desktop -g overworld`
Expected: FAIL，找不到 `#overworld`。

- [ ] **Step 2: 元件**

```tsx
// src/components/dimensions/home/DimensionOpening.tsx
import type { ReactNode } from 'react';
import { VerticalLabel } from '#/dimensions/VerticalLabel';

export const DimensionOpening = ({
  id,
  tag,
  say,
  body,
  label,
  children,
}: {
  id: 'overworld' | 'nether' | 'end';
  tag: string;
  say: string[];
  body: string;
  label: string;
  children?: ReactNode;
}) => (
  <section className='open' id={id} data-dim={id}>
    <div>
      <div className='tag mono' data-t='note'>
        <span className='acc'>{tag}</span>
      </div>
      <p className='say' data-say data-t='title'>
        {say.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </p>
      <p className='body rise' data-t='body'>
        {body}
      </p>
      {children}
    </div>
    <VerticalLabel>{label}</VerticalLabel>
  </section>
);
```

```tsx
// src/components/dimensions/home/WorkSection.tsx
const PLACE = ['work--bl', 'work--tr', 'work--bc'];

/** One full-screen build. The picture is the scene behind it; this is only the caption. */
export const WorkSection = ({
  group,
  index,
  meta,
  name,
}: {
  group: 'overworld' | 'end';
  index: number;
  meta: string;
  name: string;
}) => (
  <section
    className='work-sec'
    data-work={`${group}-${index}`}
    data-dim={group}
  >
    <article className={`work ${PLACE[index % 3]}`}>
      <div>
        <p className='mono acc' data-t='note'>
          {meta}
        </p>
        <h3 className='serif' data-t='title'>
          {name}
        </h3>
      </div>
    </article>
  </section>
);
```

在 `HomePage.tsx`：加入資料請求與主世界段落。

```tsx
// HomePage.tsx 內，其他 hook 旁邊
const { t } = useTranslation();
const { data: members } = useApi<IMembers>(`${STATIC_DATA_API}/member.json`);
const { data: repos } = useApi<{ name: string }[]>(
  `${GITHUB_API}?per_page=100`,
);
const [days, setDays] = useState<number | null>(null);
useEffect(() => setDays(daysSince(SERVER_START_MS, Date.now())), []);
const works = t('dimensions.overworld.works', { returnObjects: true }) as {
  meta: string;
  name: string;
}[];
```

```tsx
// <Hero /> 之後
<DimensionOpening
  id='overworld'
  tag={t('dimensions.overworld.tag')}
  say={t('dimensions.overworld.say', { returnObjects: true }) as string[]}
  body={t('dimensions.overworld.body')}
  label={t('dimensions.dim.overworld')}
>
  <div className='stats rise'>
    <div>
      <b data-stat='days'>
        {days === null ? '' : days.toLocaleString('en-US')}
      </b>
      <span data-t='note'>{t('dimensions.overworld.stats.days')}</span>
    </div>
    <div>
      <b data-stat='milestones'>53</b>
      <span data-t='note'>{t('dimensions.overworld.stats.milestones')}</span>
    </div>
    <div>
      <b data-stat='members'>{members?.member?.length ?? 116}</b>
      <span data-t='note'>{t('dimensions.overworld.stats.members')}</span>
    </div>
    <div>
      <b data-stat='repos'>
        {repos ? repos.filter((r) => !r.name.startsWith('.')).length : 29}
      </b>
      <span data-t='note'>{t('dimensions.overworld.stats.repos')}</span>
    </div>
  </div>
  <a className='more rise' href='/survivalProgress/' data-t='control'>
    {t('dimensions.overworld.more', { count: 53 })}{' '}
    <span aria-hidden='true'>→</span>
  </a>
</DimensionOpening>;
{
  works.map((w, i) => (
    <WorkSection
      key={w.name}
      group='overworld'
      index={i}
      meta={w.meta}
      name={w.name}
    />
  ));
}
```

匯入：`useTranslation`、`useApi`、`IMembers`、`STATIC_DATA_API`、`GITHUB_API`、`daysSince`、`SERVER_START_MS`、`DimensionOpening`、`WorkSection`。

- [ ] **Step 3: 編排**

在 `choreography.ts` 把 `TRANSITIONS.slice(0, 1).forEach(change);` 換成：

```ts
// shared reveals
const reveals = () => {
  gsap.utils.toArray<HTMLElement>('[data-say]', root).forEach((el) =>
    gsap.to(el.querySelectorAll('span'), {
      opacity: 1,
      stagger: 0.5,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top 72%',
        end: 'bottom 40%',
        scrub: true,
      },
    }),
  );
  gsap.utils.toArray<HTMLElement>('.open .vt', root).forEach((el) =>
    gsap.from(el, {
      yPercent: 12,
      opacity: 0,
      duration: 1.4,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    }),
  );
  gsap.utils.toArray<HTMLElement>('.rise', root).forEach((el) =>
    gsap.from(el, {
      y: 44,
      opacity: 0,
      duration: 1.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 86%' },
    }),
  );
};

// each build drifts its own way while it is on screen
const CAM = [
  [{ scale: 1.14 }, { scale: 1.04 }],
  [
    { scale: 1.06, xPercent: 2 },
    { scale: 1.06, xPercent: -2 },
  ],
  [
    { scale: 1.04, yPercent: 1.5 },
    { scale: 1.1, yPercent: -1.5 },
  ],
] as const;
const work = (def: TransitionDef, i: number) => {
  if (!has(def)) return;
  const sec = q(def.trigger)!,
    cam = q(`.scene[data-scene="${def.to}"] .cam`);
  change(def);
  gsap.fromTo(cam, CAM[i % 3][0], {
    ...CAM[i % 3][1],
    ease: 'none',
    immediateRender: false,
    scrollTrigger: {
      trigger: sec,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
    },
  });
  gsap.from(sec.querySelectorAll('.work > div > *'), {
    y: 36,
    opacity: 0,
    duration: 0.9,
    stagger: 0.08,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: sec,
      start: 'top 30%',
      toggleActions: 'play none none reverse',
    },
  });
};
const drift = (
  trigger: string,
  scene: string,
  from: gsap.TweenVars,
  to: gsap.TweenVars,
) => {
  if (!q(trigger)) return;
  gsap.fromTo(q(`.scene[data-scene="${scene}"] .cam`), from, {
    ...to,
    ease: 'none',
    scrollTrigger: {
      trigger: q(trigger),
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });
};

// ── overworld ──
change(TRANSITIONS[0]);
drift(
  '#overworld',
  'town',
  { xPercent: -1.5, scale: 1.05 },
  { xPercent: 1.5, scale: 1.12 },
);
TRANSITIONS.slice(1, 4).forEach(work);

// ── later tasks append here, in page order ──

reveals();
```

- [ ] **Step 4: 樣式**

在 `home.css` 的 `.dim { … }` 內，從設計稿移植：`.open` 全部規則（含 `> div:first-child`、`.vt`、`.tag`、`.tag::after`、亮色下 `.open .vt` 的紙色底）、`.say`、`.say span`、`.open p.body`、`.stats` 全部規則、`.more`、`.more:hover`、`.work-sec`、`.work` 全部規則（含 `--bl`、`--tr`、`--tr > div`、`--bc`）、兩個媒體查詢的對應規則。再加上：

```css
.dim {
  .open p.body {
    max-width: min(30em, var(--measure));
  }
  .work h3 {
    overflow-wrap: anywhere;
  }
  /* short landscape screens */
  @media (max-height: 480px) {
    .open {
      min-height: 0;
      padding-block: 96px 64px;
    }
    .work {
      padding-block: 72px 24px;
    }
  }
}
```

- [ ] **Step 5: 確認測試通過**

Run: `yarn lint && yarn typecheck && yarn build && yarn test:e2e tests/dimensions-home.spec.ts --project=desktop`
Expected: 9 passed。

- [ ] **Step 6: 提交**

```bash
git add -A && git commit -m "feat: home page overworld section with three builds"
```

---

### Task 7: 地獄

**Files:**

- Create: `src/components/dimensions/home/PortalCanvas.tsx`、`NetherLedger.tsx`、`RankStatement.tsx`
- Modify: `HomePage.tsx`、`choreography.ts`、`home.css`、`tests/dimensions-home.spec.ts`

**Interfaces:**

- Consumes: `DimensionOpening`、`NETHER_IMAGES`、`buildChoreography` 的 `onLedger`。
- Produces:

  - `<PortalCanvas />`：`<canvas class="portal">`，程式產生的紫色像素動畫，只在可見時重繪。
  - `<NetherLedger index: number items: { date: string; name: string }[] />`：`<section id="ledger" data-dim="nether">` 內含 `.ledger-stage`；`index` 是目前的設施。
  - `<RankStatement label: string lines: string[] body: string />`：`<section class="rank" data-dim="nether">`。

- [ ] **Step 1: 寫失敗的測試**

```ts
// tests/dimensions-home.spec.ts（附加）
test.describe('home: nether', () => {
  test('the portal covers the screen mid-transition and no game texture is requested', async ({
    page,
  }) => {
    const requested: string[] = [];
    page.on('request', (r) => requested.push(r.url()));
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#nether', -0.5);
    const portal = page.locator('canvas.portal');
    await expect(portal).toBeVisible();
    const painted = await portal.evaluate((c: HTMLCanvasElement) => {
      const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i + 2] > 60) n++;
      return n / (d.length / 4);
    });
    expect(painted).toBeGreaterThan(0.9);
    expect(requested.filter((u) => /nether_portal|\/mc\//.test(u))).toEqual([]);
  });

  test('after the portal the reader is in the nether', async ({ page }) => {
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#nether');
    expect(await visibleScenes(page)).toEqual(['nether']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'nether');
    await expect(page.locator('canvas.portal')).toBeHidden();
  });

  test('the ledger walks through all six facilities and ends on the last', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#ledger', 0.05);
    await expect(page.locator('.ledger-now h3')).toHaveText('地獄大廳');
    await scrollToSection(page, '.rank', -1.05);
    await expect(page.locator('.ledger-now h3')).toHaveText('刷花機（地獄）');
    await expect(page.locator('.ledger-list li.on')).toHaveCount(1);
    const shown = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[data-ledger]')]
        .filter((i) => +getComputedStyle(i).opacity > 0.5)
        .map((i) => i.dataset.ledger),
    );
    expect(shown).toEqual(['5']);
  });

  test('the rank statement follows the ledger', async ({ page }) => {
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '.rank', -0.3);
    await expect(page.locator('.rank h2')).toContainText('世界第六');
    await expect(page.locator('.rank h2 em')).toHaveText('亞洲第一');
  });
});
```

Run: `yarn build && yarn test:e2e tests/dimensions-home.spec.ts --project=desktop -g nether`
Expected: FAIL，找不到 `#nether`。

- [ ] **Step 2: 傳送門**

```tsx
// src/components/dimensions/home/PortalCanvas.tsx
'use client';

import { useEffect, useRef } from 'react';

const COLS = 32,
  ROWS = 18,
  FRAME_MS = 60;

/**
 * A procedurally generated pixel portal: drifting purple cells, drawn small and scaled up with hard pixels.
 * No game asset is used. Redraws only while the canvas is on screen.
 */
export const PortalCanvas = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current,
      ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    // one fixed random phase per cell, so the pattern is stable and only shimmers
    const phase = Array.from(
      { length: COLS * ROWS },
      (_, i) => (Math.sin(i * 12.9898) * 43758.5453) % 1,
    );
    let t = 0;
    const draw = () => {
      if (getComputedStyle(canvas).visibility === 'hidden') return;
      t += 0.12;
      for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++) {
          const p = phase[y * COLS + x];
          const swirl =
            Math.sin(x * 0.55 + t + p * 6.28) +
            Math.cos(y * 0.7 - t * 0.8 + p * 6.28) +
            Math.sin((x + y) * 0.3 + t * 1.3);
          const k = (swirl + 3) / 6; // 0..1
          ctx.fillStyle = `rgb(${Math.round(60 + 110 * k)}, ${Math.round(10 + 40 * k)}, ${Math.round(120 + 135 * k)})`;
          ctx.fillRect(x, y, 1, 1);
        }
    };
    draw();
    const id = window.setInterval(draw, FRAME_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <canvas
      className='portal'
      ref={ref}
      width={COLS}
      height={ROWS}
      aria-hidden='true'
    />
  );
};
```

（初次 `draw()` 在畫布仍隱藏時會略過；`setInterval` 在它變為可見後開始繪製。）

- [ ] **Step 3: 設施清單與排名**

```tsx
// src/components/dimensions/home/NetherLedger.tsx
const pad = (n: number) => String(n).padStart(2, '0');

/** Pinned while the reader scrolls through the facilities. choreography.ts reports which one is current. */
export const NetherLedger = ({
  index,
  items,
}: {
  index: number;
  items: { date: string; name: string }[];
}) => (
  <section id='ledger' data-dim='nether'>
    <div className='ledger-stage'>
      <ol className='ledger-list'>
        {items.map((it, i) => (
          <li
            key={it.name}
            className={i === index ? 'on' : undefined}
            data-t='note'
          >
            <span className='mono'>{pad(i + 1)}</span>
            <span>{it.name}</span>
          </li>
        ))}
      </ol>
      <div className='ledger-now' aria-live='polite'>
        <p className='mono' data-t='note'>
          <span className='acc'>{items[index]?.date}</span>
        </p>
        <h3 className='serif' data-t='title' key={index}>
          {items[index]?.name}
        </h3>
      </div>
    </div>
  </section>
);
```

```tsx
// src/components/dimensions/home/RankStatement.tsx
export const RankStatement = ({
  label,
  lines,
  body,
}: {
  label: string;
  lines: string[];
  body: string;
}) => (
  <section className='rank' data-dim='nether'>
    <p className='mono acc' data-t='note'>
      {label}
    </p>
    <h2 className='serif rise' data-t='title'>
      {lines[0]}
      <em>{lines[1]}</em>
    </h2>
    <p className='rise' data-t='body'>
      {body}
    </p>
  </section>
);
```

在 `HomePage.tsx`：把 `const [, setLedger] = useState(0);` 改成 `const [ledger, setLedger] = useState(0);`，在 `<World />` 後面加 `<PortalCanvas />`，並在主世界作品之後加入：

```tsx
<DimensionOpening id='nether' tag={t('dimensions.nether.tag')} say={t('dimensions.nether.say', { returnObjects: true }) as string[]} body={t('dimensions.nether.body')} label={t('dimensions.dim.nether')} />
<NetherLedger index={ledger} items={t('dimensions.nether.ledger', { returnObjects: true }) as { date: string; name: string }[]} />
<RankStatement label={t('dimensions.nether.rankLabel')} lines={t('dimensions.nether.rank', { returnObjects: true }) as string[]} body={t('dimensions.nether.rankBody')} />
```

- [ ] **Step 4: 編排**

在 `choreography.ts` 的 `// ── later tasks append here, in page order ──` 之前加入：

```ts
// ── nether ──
change(TRANSITIONS[4]);
const stage = q('.ledger-stage');
if (stage) {
  const imgs = gsap.utils.toArray<HTMLElement>('[data-ledger]', root);
  let cur = 0;
  const show = (i: number) => {
    if (i === cur) return;
    cur = i;
    imgs.forEach((im, k) =>
      gsap.to(im, {
        opacity: k === i ? 1 : 0,
        scale: k === i ? 1 : 1.06,
        duration: 0.9,
        ease: 'power2.out',
        overwrite: true,
      }),
    );
    opts.onLedger(i);
  };
  // Pinning needs a full screen of height. On short landscape screens the stage scrolls normally instead.
  const pin = window.innerHeight >= 480;
  ScrollTrigger.create({
    trigger: q('#ledger'),
    start: 'top top',
    end: () => `+=${window.innerHeight * 3}`,
    pin: pin ? stage : false,
    onUpdate: (s) =>
      show(Math.min(imgs.length - 1, Math.floor(s.progress * imgs.length))),
  });
}
```

- [ ] **Step 5: 樣式**

在 `home.css` 的 `.dim { … }` 內，從設計稿移植：`.portal`（保留 `image-rendering: pixelated` 與 `object-fit: cover`）、`.ledger-stage`、`.ledger-list` 全部規則、`.ledger-now` 全部規則、`.rank` 全部規則，以及兩個媒體查詢的對應規則。再加上：

```css
.dim {
  .ledger-now h3 {
    animation: ledger-in 0.45s cubic-bezier(0.16, 1, 0.3, 1);
    overflow-wrap: anywhere;
  }
  @keyframes ledger-in {
    from {
      transform: translateY(110%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .ledger-now h3 {
      animation: none;
    }
  }
  /* short landscape screens: not pinned, so the stage is as tall as its content */
  @media (max-height: 480px) {
    .ledger-stage {
      height: auto;
      min-height: 100vh;
      padding-block: 80px 24px;
    }
    .ledger-list {
      display: none;
    }
    .rank {
      padding-block: 96px;
    }
  }
}
```

- [ ] **Step 6: 確認測試通過**

Run: `yarn lint && yarn typecheck && yarn build && yarn test:e2e tests/dimensions-home.spec.ts --project=desktop`
Expected: 13 passed。

- [ ] **Step 7: 提交**

```bash
git add -A && git commit -m "feat: home page nether section with a generated portal"
```

---

### Task 8: 終界與製作名單

**Files:**

- Create: `src/components/dimensions/home/Starfield.tsx`、`Credits.tsx`
- Modify: `HomePage.tsx`、`choreography.ts`、`home.css`、`tests/dimensions-home.spec.ts`

**Interfaces:**

- Consumes: `DimensionOpening`、`WorkSection`、`World`（`children` 會放進 `end` 場景）、`IMembers`。
- Produces:

  - `<Starfield reduced: boolean />`：三層星空，放進 `World` 的 `children`。
  - `<Credits members: IMembers | null />`：`<section class="credits" id="credits" data-dim="end">`。

- [ ] **Step 1: 寫失敗的測試**

```ts
// tests/dimensions-home.spec.ts（附加）
test.describe('home: the end', () => {
  test('three End builds each show their own scene, then the stars', async ({
    page,
  }) => {
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#end');
    expect(await visibleScenes(page)).toEqual(['hall']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
    await scrollToSection(page, '[data-work="end-0"]', 0.2);
    expect(await visibleScenes(page)).toEqual(['moon']);
    await expect(page.locator('[data-work="end-0"] h3')).toHaveText('月宮');
    await scrollToSection(page, '[data-work="end-1"]', 0.2);
    expect(await visibleScenes(page)).toEqual(['farm']);
    await scrollToSection(page, '#credits', 0.3);
    expect(await visibleScenes(page)).toEqual(['end']);
  });

  test('credits list every full and trial member and link to the roster', async ({
    page,
    request,
  }) => {
    const data = await (
      await request.get('https://mc-ctec.org/static-data/member.json')
    ).json();
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#credits', 0.3);
    await expect(
      page.locator('#credits [data-names="member"] span'),
    ).toHaveCount(data.member.length);
    await expect(
      page.locator('#credits [data-names="trial"] span'),
    ).toHaveCount(data.trial.length);
    await expect(page.locator('#credits .roles a').first()).toHaveAttribute(
      'href',
      /github\.com\/mc-cloud-town\//,
    );
    await expect(page.locator('#credits a.more')).toHaveAttribute(
      'href',
      '/member/',
    );
  });

  test('when the member request fails the tools stay and the member lists are hidden', async ({
    page,
  }) => {
    await page.route(/member\.json/, (r) => r.abort());
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#credits', 0.3);
    await expect(page.locator('#credits .roles')).toBeVisible();
    await expect(page.locator('#credits [data-names]')).toHaveCount(0);
  });

  test('the day theme turns dark in the End and light again after it', async ({
    page,
  }) => {
    await openPage(page, '/', { theme: 'light' });
    await ready(page);
    const bg = () =>
      page.evaluate(
        () => getComputedStyle(document.querySelector('.dim')!).backgroundColor,
      );
    await scrollToSection(page, '#overworld');
    expect(await bg()).toBe('rgb(238, 242, 245)');
    await scrollToSection(page, '#end');
    expect(await bg()).toBe('rgb(6, 8, 11)');
    await scrollToSection(page, '#overworld');
    expect(await bg()).toBe('rgb(238, 242, 245)');
  });
});
```

Run: `yarn build && yarn test:e2e tests/dimensions-home.spec.ts --project=desktop -g "the end"`
Expected: FAIL，找不到 `#end`。

- [ ] **Step 2: 星空**

```tsx
// src/components/dimensions/home/Starfield.tsx
'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const LAYERS = [
  { size: 512, dur: 90, opacity: 0.9 },
  { size: 820, dur: 60, opacity: 0.6 },
  { size: 1300, dur: 40, opacity: 0.45 },
];
const COLOURS = ['#9fe8d8', '#c9a7ff', '#6fb7ff', '#ffffff', '#58d6b0'];

/** One generated tile of specks, used at three depths that drift slowly. */
export const Starfield = ({ reduced }: { reduced: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const x = c.getContext('2d');
    if (!x) return;
    for (let i = 0; i < 150; i++) {
      x.fillStyle = COLOURS[i % COLOURS.length];
      x.globalAlpha = Math.random() * 0.8 + 0.2;
      const s = Math.random() < 0.12 ? 3 : Math.random() < 0.4 ? 2 : 1;
      x.fillRect(
        Math.floor(Math.random() * 512),
        Math.floor(Math.random() * 512),
        s,
        s,
      );
    }
    const url = c.toDataURL();
    const layers = [...host.children] as HTMLElement[];
    layers.forEach((l) => (l.style.backgroundImage = `url(${url})`));
    if (reduced) return;
    const tweens = layers.map((l, i) =>
      gsap.to(l, {
        x: i % 2 ? 160 : -160,
        y: -220,
        duration: LAYERS[i].dur,
        ease: 'none',
        repeat: -1,
        yoyo: true,
      }),
    );
    return () => tweens.forEach((t) => t.kill());
  }, [reduced]);

  return (
    <div className='starfield' ref={ref}>
      {LAYERS.map((l) => (
        <i
          key={l.size}
          style={{ backgroundSize: `${l.size}px`, opacity: l.opacity }}
        />
      ))}
    </div>
  );
};
```

- [ ] **Step 3: 製作名單**

```tsx
// src/components/dimensions/home/Credits.tsx
'use client';

import { useTranslation } from 'react-i18next';
import type { IMembers } from '@/types/IMember';

const ROLES: [string, string[]][] = [
  [
    'core',
    [
      'Carpet-CTEC-Addition',
      'carpetmod112',
      'Carpet-Vastech-Addition',
      'carpet-shadow-117',
      'scarpet',
    ],
  ],
  [
    'server',
    [
      'ChatBridgeE',
      'MCDR-LocationMarker',
      'TimeBackup',
      'join-reminder',
      'VelocityCT',
    ],
  ],
  ['infra', ['grafana-docker', 'static-data', 'dashboard-api', 'info-command']],
  [
    'community',
    [
      'cloud-town-discord-bot',
      'TTS-Discord-Bot',
      'minecraft-resource-emoji',
      'mc-cloud-town.github.io',
    ],
  ],
];

/** The end credits: the tools first, then everyone. Member lists are left out if the data did not arrive. */
export const Credits = ({ members }: { members: IMembers | null }) => {
  const { t } = useTranslation();
  return (
    <section className='credits' id='credits' data-dim='end'>
      <h2 data-t='note'>{t('dimensions.end.credits.tools')}</h2>
      <dl className='roles'>
        {ROLES.map(([key, repos]) => (
          <div key={key}>
            <dt data-t='body'>{t(`dimensions.end.credits.roles.${key}`)}</dt>
            <dd>
              {repos.map((r) => (
                <a
                  key={r}
                  href={`https://github.com/mc-cloud-town/${r}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  data-t='body'
                >
                  {r}
                </a>
              ))}
            </dd>
          </div>
        ))}
      </dl>
      {(['member', 'trial'] as const).map((group) =>
        members?.[group]?.length ? (
          <div key={group}>
            <h2 data-t='note'>{t(`dimensions.end.credits.${group}`)}</h2>
            <p className='names' data-names={group}>
              {members[group].map((m) => (
                <span key={m.uuid}>{m.name}</span>
              ))}
            </p>
          </div>
        ) : null,
      )}
      <p>
        <a className='more' href='/member/' data-t='control'>
          {t('dimensions.end.credits.more')} <span aria-hidden='true'>→</span>
        </a>
      </p>
      <p className='serif fin' data-t='title'>
        {t('dimensions.end.credits.fin')}
      </p>
    </section>
  );
};
```

在 `HomePage.tsx`：把 `<World />` 改成 `<World>{reduced !== null && <Starfield reduced={reduced} />}</World>`，並在 `<RankStatement>` 之後加入：

```tsx
{
  (() => {
    const endWorks = t('dimensions.end.works', { returnObjects: true }) as {
      meta: string;
      name: string;
    }[];
    return (
      <>
        <DimensionOpening
          id='end'
          tag={t('dimensions.end.tag')}
          say={t('dimensions.end.say', { returnObjects: true }) as string[]}
          body={t('dimensions.end.body')}
          label={t('dimensions.dim.end')}
        />
        {endWorks.map((w, i) => (
          <WorkSection
            key={w.name}
            group='end'
            index={i}
            meta={w.meta}
            name={w.name}
          />
        ))}
        <Credits members={members} />
      </>
    );
  })();
}
```

名單在資料抵達後才變長，會改變頁面高度。在 `HomePage.tsx` 加一個效果，資料到了就重新量測：

```tsx
useEffect(() => {
  if (ready && members) ScrollTrigger.refresh();
}, [ready, members]);
```

- [ ] **Step 4: 編排**

在 `choreography.ts` 的 `// ── later tasks append here, in page order ──` 之前加入。這段必須排在地獄的釘住段落之後：

```ts
// ── the end ── (created after the pinned ledger, see the note at the top of this file)
change(TRANSITIONS[5]);
drift(
  '#end',
  'hall',
  { scale: 1.1, yPercent: 2 },
  { scale: 1.02, yPercent: -2 },
);
TRANSITIONS.slice(6, 8).forEach((def, i) => work(def, i + 1));
change(TRANSITIONS[8]);
```

- [ ] **Step 5: 樣式**

在 `home.css` 的 `.dim { … }` 內，從設計稿移植：`.starfield`、`.starfield i`、`.credits` 全部規則（含 `h2`、`h2:first-child`、`.fin`）、`.roles` 全部規則、`.names`，以及媒體查詢的對應規則。再加上：

```css
.dim {
  .roles dd {
    display: grid;
    justify-items: start;
  }
  .credits > div > h2 {
    margin: 22vh 0 40px;
  }
  .names span {
    overflow-wrap: anywhere;
  }
  @media (max-width: 860px) {
    .roles dd {
      justify-items: center;
    }
  }
}
```

- [ ] **Step 6: 確認測試通過**

Run: `yarn lint && yarn typecheck && yarn build && yarn test:e2e tests/dimensions-home.spec.ts --project=desktop`
Expected: 17 passed。

- [ ] **Step 7: 提交**

```bash
git add -A && git commit -m "feat: home page End section and credits"
```

---

### Task 9: 重生點、維度軌道、減少動態與穩健性

**Files:**

- Create: `src/components/dimensions/home/Respawn.tsx`、`DimensionRail.tsx`
- Modify: `HomePage.tsx`、`SiteBar.tsx`、`choreography.ts`、`home.css`、`tests/dimensions-home.spec.ts`

**Interfaces:**

- Consumes: `SiteFooter`、`useDimension()`、`serverLink`。
- Produces:

  - `<Respawn />`：`<section class="respawn" id="respawn" data-dim="respawn">`，內含 `<SiteFooter />`。
  - `<DimensionRail />`：`<div class="rail">`，內含 `<b>`（進度）與三個連結 `a[data-d]`。
  - `buildChoreography` 另外處理：頁內錨點的平滑捲動、帶錨點進站、軌道進度。

- [ ] **Step 1: 寫失敗的測試**

```ts
// tests/dimensions-home.spec.ts（附加）
test.describe('home: respawn and robustness', () => {
  test('the page ends on day one with the join call', async ({ page }) => {
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#respawn', 0);
    expect(await visibleScenes(page)).toEqual(['day1']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'respawn');
    await expect(page.locator('#respawn a.btn')).toHaveAttribute('href', /discord\.gg/);
    await expect(page.locator('#respawn .depts li')).toHaveCount(3);
    // each department leads straight to where it takes applications
    const actions = page.locator('#respawn .depts li a');
    await expect(actions.nth(0)).toHaveAttribute('href', /discord.com/channels//);
    await expect(actions.nth(1)).toHaveAttribute('href', /forms.gle//);
    await expect(actions.nth(2)).toHaveAttribute('href', /forms.gle//);
    await expect(page.locator('#respawn .dim-foot')).toBeVisible();
  });

  test('the bar and the rail mark the current dimension', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#nether');
    await expect(page.locator('.dim-bar nav a.on')).toHaveAttribute('data-d', 'nether');
    await expect(page.locator('.rail a.on')).toHaveAttribute('data-d', 'nether');
  });

  test('a nav anchor scrolls to its section', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    await page.locator('.dim-bar nav a[data-d="end"]').click();
    await page.waitForTimeout(3500);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
  });

  test('arriving with #nether lands in the nether', async ({ page }) => {
    await openPage(page, '/#nether');
    await ready(page);
    await page.waitForTimeout(3000);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'nether');
    expect(await visibleScenes(page)).toEqual(['nether']);
  });

  test('resizing mid-scroll keeps the scene in step with the section', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '[data-work="end-0"]', 0.2);
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(1200);
    await scrollToSection(page, '[data-work="end-0"]', 0.2);
    expect(await visibleScenes(page)).toEqual(['moon']);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1200);
    await scrollToSection(page, '#credits', 0.3);
    expect(await visibleScenes(page)).toEqual(['end']);
  });

  test('leaving for a legacy page cleans up, and coming back rebuilds', async ({ page }) => {
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#nether');
    await page.goto('/join/');
    await expect(page.locator('[data-shell="legacy"]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.hasAttribute('data-dim'))).toBe(false);
    expect(await page.evaluate(() => document.documentElement.classList.contains('lenis'))).toBe(false);
    await page.goBack();
    await ready(page);
    await scrollToSection(page, '#overworld');
    expect(await visibleScenes(page)).toEqual(['town']);
  });

  test('with reduced motion nothing is scrubbed, every section is readable and scenes still change', async ({ page }) => {
    await openPage(page, '/', { reducedMotion: true });
    await ready(page);
    expect(await page.evaluate(() => document.documentElement.classList.contains('lenis'))).toBe(false);
    for (const [sel, scene] of [['#overworld', 'town'], ['[data-work="overworld-1"]', 'w2'], ['#nether', 'nether'], ['[data-work="end-0"]', 'moon'], ['#respawn', 'day1']] as const) {
      await page.locator(sel).scrollIntoViewIfNeeded();
      await page.evaluate((s) => document.querySelector(s)!.scrollIntoView({ block: 'center' }), sel);
      await page.waitForTimeout(400);
      expect(await visibleScenes(page), sel).toEqual([scene]);
    }
    await page.locator('#overworld .say').scrollIntoViewIfNeeded();
    for (const span of await page.locator('#overworld .say span').all()) await expect(span).toHaveCSS('opacity', '1');
    await expect(page.locator('.ledger-stage')).not.toHaveCSS('position', 'fixed');
  });
});
```

Run: `yarn build && yarn test:e2e tests/dimensions-home.spec.ts --project=desktop -g "respawn and robustness"`
Expected: FAIL，找不到 `#respawn`。

- [ ] **Step 2: 元件**

```tsx
// src/components/dimensions/home/Respawn.tsx
'use client';

import { useTranslation } from 'react-i18next';
import { joinLink, serverLink } from '@/constants';
import { SiteFooter } from '#/dimensions/SiteFooter';

/** In the order of respawn.depts: redstone, building, logistics. */
const JOIN_LINKS = [
  joinLink.redstoneChannel,
  joinLink.applicationForm,
  joinLink.applicationForm,
];

export const Respawn = () => {
  const { t } = useTranslation();
  const depts = t('dimensions.respawn.depts', { returnObjects: true }) as {
    name: string;
    body: string;
    action: string;
  }[];
  return (
    <section className='respawn' id='respawn' data-dim='respawn'>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className='pal' src='/assets/logo/512x512.png' alt='' />
      <p className='mono acc' data-t='note'>
        {t('dimensions.respawn.label')}
      </p>
      <h2 className='serif rise' data-t='title'>
        {t('dimensions.respawn.title')}
      </h2>
      <a
        className='btn'
        href={serverLink.discord}
        target='_blank'
        rel='noopener noreferrer'
        data-t='control'
      >
        {t('dimensions.respawn.cta')} <span aria-hidden='true'>→</span>
      </a>
      <ul className='depts rise'>
        {depts.map((d, i) => (
          <li key={d.name}>
            <b data-t='title'>{d.name}</b>
            <span data-t='body'>{d.body}</span>
            <a
              className='more'
              href={JOIN_LINKS[i]}
              target='_blank'
              rel='noopener noreferrer'
              data-t='control'
            >
              {d.action} <span aria-hidden='true'>→</span>
            </a>
          </li>
        ))}
      </ul>
      <SiteFooter />
    </section>
  );
};
```

```tsx
// src/components/dimensions/home/DimensionRail.tsx
'use client';

import { useTranslation } from 'react-i18next';
import { useDimension } from '#/dimensions/DimensionProvider';

const STOPS = ['overworld', 'nether', 'end'] as const;

/** Desktop only: three stops and a line that fills with scroll progress. */
export const DimensionRail = () => {
  const { t } = useTranslation();
  const { dim } = useDimension();
  return (
    <div className='rail'>
      <b />
      {STOPS.map((d) => (
        <a
          key={d}
          href={`#${d}`}
          data-d={d}
          className={dim === d ? 'on' : undefined}
          aria-label={t(`dimensions.nav.${d}`)}
        />
      ))}
    </div>
  );
};
```

在 `src/constants/index.ts` 加入申請入口（網址取自現有 `join` 翻譯裡的按鈕）：

```ts
/** Where each department takes applications. The form needs a Google sign-in, so it opens in a new tab. */
export const joinLink = {
  redstoneChannel:
    'https://discord.com/channels/933290709589577728/1103568261683101696',
  applicationForm: 'https://forms.gle/sGUxUtUaskchiTfG7',
};
```

在 `SiteBar.tsx`：匯入 `useDimension`，取得 `const { dim } = useDimension();`，並在 `items` 的每個 `<a>` 加上 `className={variant === 'home' && l.d === dim ? 'on' : undefined}`。

在 `HomePage.tsx`：`<SiteBar variant='home' />` 之後加 `<DimensionRail />`，`<Credits>` 之後加 `<Respawn />`。

- [ ] **Step 3: 編排**

在 `choreography.ts`：

在 `// ── later tasks append here, in page order ──` 處加入：

```ts
// ── respawn ──
change(TRANSITIONS[9]);
const pal = q('.pal');
if (pal) {
  gsap.from(pal, {
    y: 160,
    rotate: 8,
    opacity: 0,
    duration: 1.5,
    ease: 'expo.out',
    scrollTrigger: { trigger: q('.respawn h2'), start: 'top 80%' },
  });
  gsap.to(pal, {
    yPercent: -3,
    rotation: -2,
    duration: 2.8,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
  });
}

// the rail fills with overall progress
const fill = q('.rail b');
if (fill) {
  const set = gsap.quickSetter(fill, 'scaleY');
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (s) => set(s.progress),
  });
}
```

在 `gsap.context(...)` 之後、`return` 之前，加入錨點處理（減少動態時也要能用，所以放在 context 外）：

```ts
// in-page anchors: smooth when Lenis is on, a plain jump otherwise
const onClick = (e: MouseEvent) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>(
    'a[href^="#"]',
  );
  const target = a && root.querySelector<HTMLElement>(a.getAttribute('href')!);
  if (!a || !target) return;
  e.preventDefault();
  if (lenis) lenis.scrollTo(target, { duration: 1.6 });
  else target.scrollIntoView();
  history.replaceState(null, '', a.getAttribute('href'));
};
root.addEventListener('click', onClick);

// arriving with a hash: jump there once everything is measured
const landing =
  window.location.hash && root.querySelector<HTMLElement>(window.location.hash);
if (landing) {
  ScrollTrigger.refresh();
  if (lenis) lenis.scrollTo(landing, { immediate: true });
  else landing.scrollIntoView();
}
```

清理函式改成：

```ts
return () => {
  root.removeEventListener('click', onClick);
  gsap.ticker.remove(raf);
  lenis?.destroy();
  ctx.revert();
  document.documentElement.classList.remove(
    'lenis',
    'lenis-smooth',
    'lenis-stopped',
    'lenis-scrolling',
  );
};
```

- [ ] **Step 4: 樣式**

在 `home.css` 的 `.dim { … }` 內，從設計稿移植：`.rail` 全部規則（`a span` 的規則不需要，設計稿已不顯示文字）、`.respawn` 全部規則、`.depts` 全部規則、`.pal`、媒體查詢的對應規則，以及 `html.lenis, html.lenis body { height: auto; }` 與 `.lenis.lenis-smooth { scroll-behavior: auto !important; }`（這兩條放在 `.dim` 之外）。設計稿裡絕對定位的 `.foot` 不移植，改為：

```css
.dim {
  .respawn {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .respawn .dim-foot {
    margin-top: auto;
    padding-inline: 0;
    width: 100%;
    border-top: 0;
  }
  .depts li {
    grid-template-columns: 7em 1fr auto;
    align-items: baseline;
  }
  .depts .more {
    margin-top: 0;
    white-space: nowrap;
  }
  @media (max-width: 860px) {
    .depts li {
      grid-template-columns: 1fr;
    }
    .depts .more {
      justify-self: start;
    }
  }
  @media (max-width: 860px) {
    .rail {
      display: none;
    }
  }
  @media (max-height: 480px) {
    .rail {
      display: none;
    }
    .respawn {
      min-height: 0;
      padding-block: 96px 24px;
    }
    .pal {
      display: none;
    }
  }
}
```

減少動態：確認 `home.css` 有 `@media (prefers-reduced-motion: reduce)` 內的 `.say span { opacity: 1; }`、`.ledger-stage { height: auto; overflow: visible; padding-block: 20vh; }`、`.cue i::after { animation: none; }`。

- [ ] **Step 5: 確認測試通過**

Run: `yarn lint && yarn typecheck && yarn build && yarn test:e2e tests/dimensions-home.spec.ts --project=desktop`
Expected: 24 passed。

- [ ] **Step 6: 對照設計稿**

`yarn start` 後並排比對首頁與 `docs/design-demos/dimensions-v2.html`（1440×900，暗色與亮色各一次），從頭捲到尾。預期的差異只有三處：傳送門是程式產生的；頂列多了語言選擇；左下與右下沒有固定文字（設計稿已註解掉）。其他差異修到一致再提交。

- [ ] **Step 7: 提交**

```bash
git add -A && git commit -m "feat: home page respawn section, rail, anchors and reduced motion"
```

---

### Task 10: 九個視窗 × 三種語言 × 兩個主題，以及收尾

**Files:**

- Create: `tests/dimensions-matrix.spec.ts`
- Modify: `tests/parity.spec.ts`、`playwright.config.ts`；視測試結果修改 `src/styles/dimensions/*.css` 與三個語言檔

**Interfaces:**

- Consumes: `tests/helpers/dimensions.ts` 的全部工具；`scrollToSection`、`ready`、`visibleScenes`（自 `tests/dimensions-home.spec.ts` 匯出）。

- [ ] **Step 1: 寫矩陣測試**

```ts
// tests/dimensions-matrix.spec.ts
import { expect, test } from '@playwright/test';
import {
  expectNoHorizontalScroll,
  expectNoMissingKeys,
  expectTapTargets,
  expectTextFits,
  LOCALES,
  openPage,
  VIEWPORTS,
  type Locale,
  type ThemeName,
} from './helpers/dimensions';
import { ready, scrollToSection, visibleScenes } from './dimensions-home.spec';

const THEMES: ThemeName[] = ['dark', 'light'];

/** Every stop on the home page that has its own layout, with the scene expected there. */
const HOME_STOPS = [
  ['#top', 0, 'spawn'],
  ['#overworld', 0.3, 'town'],
  ['[data-work="overworld-0"]', 0.2, 'w1'],
  ['[data-work="overworld-1"]', 0.2, 'w2'],
  ['[data-work="overworld-2"]', 0.2, 'w3'],
  ['#nether', 0.3, 'nether'],
  ['#ledger', 0.05, 'nether'],
  ['.rank', -0.3, 'nether'],
  ['#end', 0.3, 'hall'],
  ['[data-work="end-0"]', 0.2, 'moon'],
  ['[data-work="end-1"]', 0.2, 'farm'],
  ['#credits', 0.3, 'end'],
  ['#respawn', 0, 'day1'],
] as const;

const check = async (page: Parameters<typeof expectTextFits>[0]) => {
  await expectNoHorizontalScroll(page);
  await expectTextFits(page);
  await expectTapTargets(page);
};

for (const vp of VIEWPORTS) {
  for (const locale of LOCALES) {
    for (const theme of THEMES) {
      const tag = `${vp.name} ${locale} ${theme}`;

      test(`home ${tag}`, async ({ page }, info) => {
        test.slow();
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await openPage(page, '/', { locale: locale as Locale, theme });
        await ready(page);
        await expectNoMissingKeys(page);
        for (const [sel, off, scene] of HOME_STOPS) {
          await scrollToSection(page, sel, off);
          expect(await visibleScenes(page), `${sel} scene`).toContain(scene);
          await check(page);
          await info.attach(`home-${tag}-${sel}`.replace(/[^\w-]+/g, '_'), {
            body: await page.screenshot({ type: 'jpeg', quality: 60 }),
            contentType: 'image/jpeg',
          });
        }
      });

      for (const [name, path, first] of [
        ['progress', '/survivalProgress/', '.entry'],
        ['members', '/member/', '.person'],
      ] as const) {
        test(`${name} ${tag}`, async ({ page }, info) => {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await openPage(page, path, { locale: locale as Locale, theme });
          await page.locator(first).first().waitFor();
          await expectNoMissingKeys(page);
          await check(page);
          await info.attach(`${name}-${tag}-top`, {
            body: await page.screenshot({ type: 'jpeg', quality: 60 }),
            contentType: 'image/jpeg',
          });
          await page.locator(first).nth(3).scrollIntoViewIfNeeded();
          await check(page);
          await page.locator('.dim-foot').scrollIntoViewIfNeeded();
          await check(page);
        });
      }
    }
  }
}

// The same design in every language: same sections, same scenes in the same order, labels upright on the right.
for (const locale of LOCALES) {
  test(`structure is identical in ${locale}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/', { locale: locale as Locale });
    await ready(page);
    expect(await page.locator('main > section').count()).toBe(13);
    expect(
      await page
        .locator('.scene')
        .evaluateAll((s) => s.map((e) => (e as HTMLElement).dataset.scene)),
    ).toEqual([
      'spawn',
      'town',
      'w1',
      'w2',
      'w3',
      'nether',
      'hall',
      'moon',
      'farm',
      'end',
      'day1',
    ]);
    await expect(page.locator('.hero h1')).toHaveAttribute(
      'aria-label',
      '雲鎮工藝',
    );
    for (const id of ['overworld', 'nether', 'end']) {
      await scrollToSection(page, `#${id}`);
      const label = page.locator(`#${id} .vt`);
      await expect(label).toHaveCSS('writing-mode', 'vertical-rl');
      const [l, say] = await Promise.all([
        label.boundingBox(),
        page.locator(`#${id} .say`).boundingBox(),
      ]);
      expect(l!.x, `${id} label is right of the statement`).toBeGreaterThan(
        say!.x + say!.width,
      );
    }
  });
}
```

（`main > section` 共 13 個：出生點、主世界開場、三件作品、地獄開場、設施、排名、終界開場、兩件作品、製作名單、重生點。）

- [ ] **Step 2: 把矩陣限制在桌面專案**

矩陣自己設定視窗，不需要在 `mobile` 專案重跑。在 `playwright.config.ts` 的 `mobile` 專案加上 `testIgnore: /dimensions-matrix/`。

- [ ] **Step 3: 執行矩陣，逐項修正**

Run: `yarn build && yarn test:e2e tests/dimensions-matrix.spec.ts --project=desktop`

預期第一次會有失敗。每一個失敗訊息都會指出是哪個元素、哪種問題。修正的規則：

- **溢出或重疊**：先看是不是文案太長。英文字串超過長度上限（宣言每行 34 字元、名稱 40、按鈕 20）就縮短翻譯。文案沒問題才改 CSS，而且改的是該元件在該尺寸的規則（加一個針對該元件的媒體查詢），不改全站斷點，也不為單一語言寫規則。
- **被頂列蓋住**：增加該段落的上內距。
- **點擊範圍不足**：加內距，不縮小旁邊的元素。
- **字級過小**：調高該元素的 `clamp()` 下限。
- **超寬螢幕行長過長**：替該文字區塊加 `max-width`。

每修一類問題就重跑一次，直到全部通過。

Expected: 162 個矩陣測試（9 × 3 × 2 × 3 頁）加 3 個結構測試全部通過。

- [ ] **Step 4: 人工複查截圖**

Run: `yarn playwright show-report`

機器判斷不了構圖。逐一看每個視窗尺寸的截圖，確認：

- 場景圖片的主體沒有被裁到看不出是什麼。有問題的場景在 `home.css` 用 `.scene[data-scene='…'] img { object-position: … }` 指定對焦位置。
- 亮色主題下文字所在的那一側是紙色，另一側看得到照片原色（860px 以下除外）。
- 直排標題沒有壓到主要內容。

- [ ] **Step 5: 更新比對測試**

在 `tests/parity.spec.ts` 的 `ROUTES` 移除 `'/'`、`'/survival/'`、`'/member/'`。這三頁已改版，不再與線上版相同。

把檔案結尾的 404 測試改成不依賴外框：

```ts
test('unknown route renders the 404 page', async ({ page }) => {
  const res = await page.goto('/this-page-does-not-exist/');
  expect(res?.status()).toBe(404);
  await expect(page.locator('a[href="/home/"]')).toBeVisible();
  await expect(page.locator('[data-shell="legacy"]')).toBeVisible();
});
```

- [ ] **Step 6: 量測效能**

```ts
// tests/dimensions-home.spec.ts（附加）
test('scrolling through the builds and the portal stays smooth', async ({
  page,
}) => {
  test.skip(
    Boolean(process.env.CI),
    'frame timing is only meaningful on a real machine',
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPage(page, '/');
  await ready(page);
  const [from, to] = await page.evaluate(() =>
    ['[data-work="overworld-0"]', '#nether'].map(
      (s) =>
        document.querySelector(s)!.getBoundingClientRect().top + window.scrollY,
    ),
  );
  await page.evaluate((y) => window.scrollTo(0, y - window.innerHeight), from);
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const w = window as unknown as { __d: number[] };
    w.__d = [];
    let last = performance.now();
    const f = (t: number) => {
      w.__d.push(t - last);
      last = t;
      requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  });
  await page.mouse.move(700, 450);
  for (let i = 0; i < Math.ceil((to - from + 900) / 120); i++) {
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(1200);
  const frames = (
    await page.evaluate(() => (window as unknown as { __d: number[] }).__d)
  ).slice(2);
  const slow = frames.filter((d) => d > 33.4).length;
  expect(
    slow / frames.length,
    `${slow} of ${frames.length} frames over 33ms`,
  ).toBeLessThanOrEqual(13 / 319);
});
```

Run: `yarn build && yarn test:e2e tests/dimensions-home.spec.ts --project=desktop -g "stays smooth"`
Expected: PASS。若失敗，用瀏覽器的效能面板找出觸發重繪或排版的屬性，改成只用 `transform` 與 `opacity`。

- [ ] **Step 7: 全部驗證**

```bash
yarn lint && yarn typecheck && yarn build
yarn test:e2e tests/dimensions-shell.spec.ts tests/dimensions-members.spec.ts tests/dimensions-progress.spec.ts tests/dimensions-home.spec.ts
yarn test:e2e tests/dimensions-matrix.spec.ts --project=desktop
yarn test:e2e tests/parity.spec.ts
```

Expected: 全部通過。`yarn lint` 的警告數不高於改版前的 15 個。

確認版本庫裡沒有遊戲材質：

```bash
git ls-files | grep -E "(^|/)mc/|nether_portal" ; echo "exit=$?"
```

Expected: 沒有輸出，`exit=1`。

- [ ] **Step 8: 提交**

```bash
git add -A && git commit -m "test: responsive, language and theme matrix for the dimensions pages"
```

---

## 完成後

第一期結束時：首頁、進度頁、成員頁是新設計；其餘頁面仍是舊外框。第二期（作品集與詳情、開源、合作夥伴、硬體、加入、404、跨頁轉場、網址帶語言）另寫規格與計畫。
