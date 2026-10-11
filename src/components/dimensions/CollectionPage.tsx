'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { useTranslation } from 'react-i18next';
import useApi from '@/hooks/useApi';
import { STATIC_DATA_API } from '@/constants';
import type { ICollection } from '@/types/ICollection';
import {
  addressNow,
  addressOf,
  addressServed,
  closeWork,
  onAddress,
  readAddress,
  setAddress,
  toWorks,
  type CollectionKind,
  type Work,
} from '@/lib/dimensions/works';
import type { Dimension } from './DimensionProvider';
import { SiteBar } from './SiteBar';
import { SiteFooter } from './SiteFooter';
import { InnerHeader } from './InnerHeader';
import { CollectionGallery } from './CollectionGallery';
import { WorkDetail } from './WorkDetail';

import '@/styles/dimensions/pages/collection.css';

/** What differs between the two collections besides their data and their words (`dimensions.collection.<kind>`). */
const PAGES: Record<
  CollectionKind,
  { dim: Exclude<Dimension, 'respawn'>; image: string; next: string }
> = {
  redstone: {
    dim: 'nether',
    image: '/assets/redstoneCollection/p30.webp',
    next: '/architectureCollection/',
  },
  architecture: {
    dim: 'overworld',
    image: '/assets/homePage/CTEC_Building.webp',
    next: '/redstoneCollection/',
  },
};

/** A collection of works: the gallery, and over it the detail of the work the address names. */
export const CollectionPage = ({ kind }: { kind: CollectionKind }) => {
  const { t, i18n } = useTranslation();
  const { dim, image, next } = PAGES[kind];
  const words = `dimensions.collection.${kind}`;
  const { data, loading, error, reload } = useApi<ICollection[]>(
    `${STATIC_DATA_API}/${i18n.language}/${kind}Collection.json`,
  );
  const works = useMemo(
    () => (Array.isArray(data) ? toWorks(data) : null),
    [data],
  );

  // what is open and what the list is narrowed to are in the address, and nowhere else
  const search = useSyncExternalStore(onAddress, addressNow, addressServed);
  const address = useMemo(() => readAddress(search), [search]);
  const named = useMemo(
    () => works?.find((w) => w.id === address.work) ?? null,
    [works, address.work],
  );
  // The work last shown stays in the detail while the detail goes, and while the list is asked for again in
  // another language (a work has the same name in every language's list).
  const [last, setLast] = useState<Work | null>(null);
  if (named && named !== last) setLast(named);
  const open =
    address.work !== null &&
    (named !== null || (works === null && last?.id === address.work));

  // Addresses that name a work some other way are rewritten to this page's own form: the old share link (the
  // work's place in the list), and a name the list does not have (the gallery, then).
  useEffect(() => {
    if (!works) return;
    const { shared, work, tags } = address;
    if (work === null && shared !== null)
      setAddress(addressOf({ work: works[shared]?.id, tags }), 'replace');
    else if (work !== null && !works.some((w) => w.id === work))
      setAddress(addressOf({ tags }), 'replace');
  }, [works, address]);

  const { tags } = address;
  const openWork = useCallback(
    (work: Work) => setAddress(addressOf({ work: work.id, tags }), 'push'),
    [tags],
  );
  const close = useCallback(() => closeWork(tags), [tags]);
  // from the gallery's chips, or from a tag of the open work: that closes it
  const setTags = useCallback(
    (to: string[]) => setAddress(addressOf({ tags: to }), 'replace'),
    [],
  );

  return (
    <div className='dim'>
      <SiteBar variant='inner' />
      <main>
        <InnerHeader
          image={image}
          dim={dim}
          crumbs={[
            { href: '/', label: t('dimensions.nav.homeShort') },
            { href: `/#${dim}`, label: t(`dimensions.nav.${dim}`) },
            { label: t(`${words}.crumb`) },
          ]}
          title={t(`${words}.title`, { returnObjects: true }) as string[]}
          lead={
            works
              ? t(`${words}.lead`, { total: works.length })
              : t(`${words}.leadPlain`)
          }
          label={t(`dimensions.dim.${dim}`)}
        />
        <CollectionGallery
          works={works}
          loading={loading}
          error={error}
          retry={reload}
          tags={tags}
          onTags={setTags}
          onOpen={openWork}
        />
        <div className='next'>
          <span className='mono' data-t='note'>
            {t('dimensions.nextLabel')}
          </span>
          <a className='serif' href={next} data-t='title'>
            {t(`${words}.next`)} →
          </a>
        </div>
      </main>
      <SiteFooter />
      <WorkDetail
        work={named ?? last}
        open={open}
        crumb={t(`${words}.crumb`)}
        onClose={close}
        onTag={(tag) => setTags([tag])}
      />
    </div>
  );
};
