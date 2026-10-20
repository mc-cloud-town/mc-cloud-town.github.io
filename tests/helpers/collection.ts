import fs from 'node:fs';
import path from 'node:path';
import { expect, type Page } from '@playwright/test';

/** A picture of this repository stands in for every picture of the collections: no test waits for the real ones. */
const PICTURE = path.resolve('tests/fixtures/hero-cover.jpg');

export type CollectionKind = 'redstone' | 'architecture';

/** Where a collection's list is asked for, in any language. */
export const collectionData = (kind: CollectionKind) =>
  new RegExp(`static-data/[^/]+/${kind}Collection\\.json`);

/**
 * Four works that between them have everything a work can have: one picture or several, a video, a download,
 * credits with and without a link, an introduction, two names in one creator string — and one with almost nothing.
 */
export const WORKS = [
  {
    title: 'Star Bow Mini',
    imageUrl: 'redstoneCollection/star_bow.png',
    date: '2024-03-17',
    downloadUrl: 'https://discord.com/channels/1/2/3',
    videosUrl: [
      {
        url: 'https://www.youtube.com/embed/gFAjlbvHx0o?si=abc',
        thumbnailUrl: 'redstoneCollection/star_bow_video.webp',
      },
    ],
    galleryImagesUrl: [
      'redstoneCollection/star_bow.png',
      'redstoneCollection/star_bow_1.png',
      'redstoneCollection/star_bow_2.png',
    ],
    creator: ['FlandreLed'],
    introductions: ['一台很小的珍珠炮。', '第二段說明。'],
    credits: [
      { name: 'Emir', url: 'https://www.youtube.com/@emiraleph' },
      { name: 'NoLink' },
    ],
    tags: ['紅石', 'TNT', '珍珠炮'],
  },
  {
    title: '粉末複製機',
    imageUrl: 'redstoneCollection/powder.webp',
    date: '2024-03-03',
    galleryImagesUrl: ['redstoneCollection/powder.png'],
    creator: ['Alice,Bob'],
    tags: ['紅石', '粉末複製'],
  },
  {
    title: '出生點雕塑',
    imageUrl: 'architectureCollection/spawn.webp',
    date: '2023-12-25',
    galleryImagesUrl: [
      'architectureCollection/spawn.png',
      'architectureCollection/spawn_1.png',
    ],
    creator: ['Carol'],
    tags: ['建築', '雕塑'],
  },
  {
    title: 'Bare Work',
    imageUrl: 'architectureCollection/bare.webp',
    date: '2023-01-02',
    creator: ['Dave'],
  },
];

/** Serve `works` as a collection's list, and the stand-in picture for every picture of the static data. */
export const routeCollection = async (
  page: Page,
  kind: CollectionKind,
  works: unknown[] = WORKS,
) => {
  await page.route(collectionData(kind), (r) => r.fulfill({ json: works }));
  await page.route(/static-data\/images\//, (r) =>
    r.fulfill({ contentType: 'image/jpeg', body: fs.readFileSync(PICTURE) }),
  );
};

export const detail = (page: Page) => page.locator('.dim .work-detail');

/** The detail is open and has finished coming in. */
export const detailOpen = async (page: Page) => {
  await expect(detail(page)).toHaveAttribute('data-open', 'true');
  await expect(detail(page)).toHaveCSS('opacity', '1');
};

/** The detail has gone from sight. */
export const detailGone = async (page: Page) => {
  await expect(detail(page)).toHaveAttribute('data-open', 'false');
  await expect(detail(page)).toHaveCSS('visibility', 'hidden');
};
