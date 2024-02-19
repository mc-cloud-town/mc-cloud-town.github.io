import PageHeader from '#/common/PageHeader.tsx';
import HeaderBackground from '#/homePage/HeaderBackground.tsx';

const HomePage = () => {
  const headerTextArray = ['Welcome to Cloud Town Exquisite Craft', '歡迎來到雲鎮工藝 | CTEC', '欢迎来到云镇工艺 | CTEC'];
  return (
    <>
      <PageHeader
        backgroundComponent={<HeaderBackground />}
        headerTextArray={headerTextArray}
        useTyped={true}
      />
    </>
  );
};

export default HomePage;
