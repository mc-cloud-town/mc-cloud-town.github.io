import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'antd';
import styled from 'styled-components';

import CTEC_banner from '@/assets/brand/CTEC_banner.png';

const VisibleNavigationBar = styled.div`
  position: fixed;
  width: 100%;
  z-index: 1000;
  top: 0;
  background-color: transparent;
  color: white;
  transition: top 0.3s;
  display: flex;
  justify-content: center;
`;

const HiddenNavigationBar = styled(VisibleNavigationBar)`
  top: -100px;
`;

const NavigationBar = () => {
  const [visible, setVisible] = useState(true);
  const [prevScrollPos, setPrevScrollPos] = useState(window.scrollY);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      setVisible(
        (prevScrollPos > currentScrollPos &&
          prevScrollPos - currentScrollPos > 100) ||
          currentScrollPos < 100,
      );
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos]);

  const menuItems = [
    {
      key: '1',
      label: (
        <Link to="/">
          <img src={CTEC_banner} alt="Brand Logo" />
        </Link>
      ),
    },
    {
      key: '2',
      label: <Link to="/">首頁</Link>,
    },
    {
      key: '3',
      label: <Link to="/servers">生存服進度</Link>,
    },
  ];

  const NavigationBarStyledComponent = visible
    ? VisibleNavigationBar
    : HiddenNavigationBar;

  return (
    <NavigationBarStyledComponent>
      <Menu
        theme="dark"
        mode="horizontal"
        items={menuItems}
        style={{
          lineHeight: '64px',
          backgroundColor: 'transparent',
          width: '100%',
        }}
      />
    </NavigationBarStyledComponent>
  );
};

export default NavigationBar;
