import NavigationBar from '#/common/NavigationBar.tsx';
import { ClientOnly } from 'vite-react-ssg';

const NotFoundPage = () => (
  <>
    <ClientOnly>{() => <NavigationBar />}</ClientOnly>
    <h1>404 Not Found</h1>
  </>
);

export default NotFoundPage;
