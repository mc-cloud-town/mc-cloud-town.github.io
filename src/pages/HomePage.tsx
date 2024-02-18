import NavigationBar from '#/common/NavigationBar.tsx';
import PageHeader from '#/homePage/PageHeader.tsx';
import { ClientOnly } from 'vite-react-ssg';

const HomePage = () => (
  <>
    <ClientOnly>{() => <NavigationBar />}</ClientOnly>
    <PageHeader />
  </>
);

export default HomePage;
