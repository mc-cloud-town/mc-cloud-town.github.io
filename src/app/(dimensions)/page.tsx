import { HomePage } from '#/dimensions/home/HomePage';
import { LoaderBoot } from '#/dimensions/home/LoaderBoot';

export default function Page() {
  // (made here, where the site is built, and handed to the page to put behind its loader)
  return <HomePage boot={<LoaderBoot />} />;
}
