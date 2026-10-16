import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import {
  type BootConfig,
  loaderBoot,
  loaderCore,
} from '@/lib/dimensions/loaderCore';

/**
 * What each script file of the site costs to fetch: its size as it is served (compressed), in kB, by its name.
 * Read from what the build has just written, when the page is built. Where there is nothing to read (the site is
 * not built: `next dev`), nothing is known, and the served script goes by what the browser says of each file as
 * it comes in (loaderCore.ts).
 */
const scriptSizes = () => {
  const sizes: BootConfig['sizes'] = {};
  try {
    const dir = join(process.cwd(), '.next', 'static', 'chunks');
    for (const name of readdirSync(dir))
      if (name.endsWith('.js'))
        sizes[name] =
          Math.round(gzipSync(readFileSync(join(dir, name))).length / 100) / 10;
  } catch {
    // (nothing known)
  }
  return sizes;
};

/**
 * The script the served home page runs as soon as its loader has been parsed: the loader's own source
 * (loaderCore.ts), as text, with what only the build knows. Rendered where the site is built, never in the
 * browser: the page's script does not carry it a second time.
 * It goes right behind the loader's markup (HomePage.tsx).
 */
export const LoaderBoot = () => {
  const config: BootConfig = {
    build: process.env.NEXT_PUBLIC_BUILD_ID ?? '',
    sizes: scriptSizes(),
  };
  return (
    <script
      id='loader-boot'
      dangerouslySetInnerHTML={{
        __html: `(${loaderBoot})((${loaderCore})(),${JSON.stringify(config)})`,
      }}
    />
  );
};
