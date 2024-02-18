import PageHeader from '#/homePage/PageHeader.tsx';
import CTEC_banner_white from '@/assets/brand/CTEC_banner_white.png';

const HomePage = () => (
  <>
    <PageHeader />
    <img src={CTEC_banner_white} alt="Brand Logo" />
  </>
);

export default HomePage;
