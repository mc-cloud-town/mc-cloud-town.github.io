import { ClientOnly } from 'vite-react-ssg';

import NavigationBar from '#/common/NavigationBar.tsx';
import PageHeader from '#/homePage/PageHeader.tsx';
import CTEC_banner_white from '@/assets/brand/CTEC_banner_white.png';

const HomePage = () => (
  <>
    <ClientOnly>{() => <NavigationBar />}</ClientOnly>
    <PageHeader/>
    <img src={CTEC_banner_white} alt="Brand Logo" />
  </>
);

export default HomePage;
