import PageHeader from '#/common/PageHeader.tsx';

import background from "@/assets/notFound/background.png";

const NotFoundPage = () => (
  <>
    <PageHeader
      backgroundComponent={<img src={background} alt="background" />}
      headerTextArray={['404 Not Found', 'Seems like it has already been burnt into ashes...']}
    />
  </>
);

export default NotFoundPage;
