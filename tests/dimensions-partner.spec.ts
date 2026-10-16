import { expect, test, type Page } from '@playwright/test';
import {
  expectNoHorizontalScroll,
  expectNoMissingKeys,
  LOCALES,
  openPage,
} from './helpers/dimensions';

/** The three lists of the page, in every language. */
const DATA = /static-data\/[\w]+\/partner(Teams|LongTerm|Creators)\.json/;
const EMBED = 'https://www.youtube.com/embed/KCmrEJYBGec?si=S7eoTvLw8KWHNBqt';

const LISTS: Record<string, unknown[]> = {
  Teams: [
    {
      Partner: '鬼鯨伺服器',
      Image: 'partner/鬼鯨伺服器.webp',
      ModalTitle: 'GhostWhaleServer【鬼鯨伺服器】',
      Introduce: ['我們是華語圈的建築伺服器—鬼鯨，', '歡迎來我們的社群！'],
      ShowVideo: EMBED,
      Link: {
        discord: 'https://discord.gg/QY24s8DVx3',
        youtube: 'https://www.youtube.com/@ghostwhaleserver',
        other: 'https://www.ghostwhalestudio.com/',
      },
    },
  ],
  LongTerm: [
    {
      Partner: '小柯',
      Image: 'partner/小柯.jpg',
      ModalTitle: '小柯',
      LongPartnership: true,
      Introduce: '大家好，我是小柯！',
      Link: { x: 'https://twitter.com/tomh0206' },
    },
  ],
  Creators: [
    {
      Partner: '脏小豆',
      Image: 'partner/脏小豆.avif',
      ModalTitle: '脏小豆',
      Introduce: '哈嘍我是臟小豆',
      ShowVideo:
        'https://player.bilibili.com/player.html?aid=1850762515&bvid=BV1mW421P7Cb',
      Link: { bilibili: 'https://space.bilibili.com/5836069' },
    },
    {
      Partner: 'A_partner_without_links_or_a_video_and_a_very_long_name',
      Image: 'partner/none.webp',
      ModalTitle: 'A_partner_without_links_or_a_video_and_a_very_long_name',
      Introduce: '',
    },
  ],
};

const serve = async (page: Page) => {
  await page.route(DATA, (r) =>
    r.fulfill({ json: LISTS[DATA.exec(r.request().url())![1]] }),
  );
  // the players themselves are never reached
  await page.route(/youtube\.com\/embed|player\.bilibili\.com/, (r) =>
    r.fulfill({ contentType: 'text/html', body: '<p>player</p>' }),
  );
};

test.describe('partner page', () => {
  for (const locale of LOCALES)
    test(`partners and teams, in the new shell and in the End (${locale})`, async ({
      page,
    }) => {
      await serve(page);
      await openPage(page, '/partner/', { locale });
      await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
      await expect(page.locator('.dim-bar')).toBeVisible();
      await expect(page.locator('.partner')).toHaveCount(4);
      await expect(page.locator('.contact a')).toHaveCount(3);
      await expectNoMissingKeys(page);
    });

  test('three groups, each partner with its words and its links; the way to reach us', async ({
    page,
  }) => {
    await serve(page);
    await openPage(page, '/partner/');
    await expect(page.locator('.head h1')).toContainText('夥伴');
    await expect(page.locator('.group h2')).toHaveText([
      '合作團隊',
      '長期合作創作者',
      '合作創作者',
    ]);
    const whale = page.locator('.partner').first();
    await expect(whale.locator('h3')).toHaveText(
      'GhostWhaleServer【鬼鯨伺服器】',
    );
    await expect(whale).toContainText('歡迎來我們的社群！');
    await expect(whale.locator('.links a')).toHaveCount(3);
    for (const href of Object.values(
      (LISTS.Teams[0] as { Link: Record<string, string> }).Link,
    ))
      await expect(whale.locator(`.links a[href="${href}"]`)).toHaveAttribute(
        'target',
        '_blank',
      );
    // said in the old page's dialog title
    await expect(page.locator('.partner').nth(1).locator('.tag')).toHaveText(
      '長期合作創作者',
    );
    await expect(page.locator('.contact a')).toHaveText([
      'Email',
      'Discord',
      'YouTube',
    ]);
    await expect(page.locator('.contact a').first()).toHaveAttribute(
      'href',
      'mailto:cloudtown0723@gmail.com',
    );
    await expect(page.locator('.contact a').nth(1)).toHaveAttribute(
      'href',
      'https://discordapp.com/users/525640608228966400',
    );
    await expect(page.locator('.contact a').nth(2)).toHaveAttribute(
      'href',
      'https://www.youtube.com/@CTEC_',
    );
  });

  test('a video is not loaded until it is asked for', async ({ page }) => {
    const asked: string[] = [];
    page.on('request', (r) => {
      if (/youtube\.com\/embed|bilibili/.test(r.url())) asked.push(r.url());
    });
    await serve(page);
    await openPage(page, '/partner/');
    const whale = page.locator('.partner').first();
    await expect(page.locator('.video button')).toHaveCount(2);
    await expect(page.locator('iframe')).toHaveCount(0);
    expect(asked).toEqual([]);
    await whale.locator('.video button').click();
    const frame = whale.locator('.video iframe');
    await expect(frame).toHaveAttribute('src', /embed\/KCmrEJYBGec\?/);
    await expect(frame).toHaveAttribute('src', /autoplay=1/);
    await expect(frame).toBeFocused();
    await expect(frame).toHaveCSS('opacity', '1');
    // only the one that was asked for
    await expect(page.locator('iframe')).toHaveCount(1);
    await expect(page.locator('.video button')).toHaveCount(1);
  });

  test('/collaborative/ is the same page', async ({ page }) => {
    await serve(page);
    await openPage(page, '/collaborative/');
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
    await expect(page.locator('.head h1')).toContainText('夥伴');
    await expect(page.locator('.partner')).toHaveCount(4);
  });

  test('a failed request is explained, and the retry brings the lists', async ({
    page,
  }) => {
    await page.route(DATA, (r) => r.abort());
    await openPage(page, '/partner/');
    const failed = page.locator('.empty[data-state="error"]');
    await expect(failed).toContainText('載入失敗');
    await expect(page.locator('.partner')).toHaveCount(0);
    // the way to reach us does not depend on the lists
    await expect(page.locator('.contact a')).toHaveCount(3);
    await page.unroute(DATA);
    await serve(page);
    await failed.locator('button').click();
    await expect(page.locator('.partner')).toHaveCount(4);
    await expect(failed).toHaveCount(0);
  });

  for (const [width, height] of [
    [390, 844],
    [1440, 900],
  ])
    test(`nothing runs off the side at ${width}`, async ({ page }) => {
      await serve(page);
      await page.setViewportSize({ width, height });
      await openPage(page, '/partner/');
      await page.locator('.partner').first().waitFor();
      await expectNoHorizontalScroll(page);
      await page.locator('.contact').scrollIntoViewIfNeeded();
      await expectNoHorizontalScroll(page);
    });
});
