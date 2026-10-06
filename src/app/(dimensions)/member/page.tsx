'use client';

import Members from '@/views/Members';
import { SiteBar } from '#/dimensions/SiteBar';
import { SiteFooter } from '#/dimensions/SiteFooter';

export default function Page() {
  return (
    <div className='dim'>
      <SiteBar variant='inner' current='members' />
      <main style={{ minHeight: '100vh', paddingTop: 72 }}>
        <Members />
      </main>
      <SiteFooter />
    </div>
  );
}
