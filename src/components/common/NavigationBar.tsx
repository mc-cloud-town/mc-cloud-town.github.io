import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'antd';
import styled from 'styled-components';

import CTEC_banner_white from '@/assets/brand/CTEC_banner_white.png';

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
`

const Brand = styled.img`
    height: 40px;
`;

const StyledMenu = styled(Menu)`
    flex-grow: 1;
    line-height: 64px;
`;

const TopStyledMenu = styled(StyledMenu)`
    background-color: transparent;
    
    .ant-menu-title-content > a {
        color: white;
        
        &:hover {
            color: #6f9b9c;
        }
    }
`;

const NavigationBar = () => {
  const [visible, setVisible] = useState(true);
  const [prevScrollPos, setPrevScrollPos] = useState(window.scrollY);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      setVisible(currentScrollPos < prevScrollPos);
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
          <Brand src={CTEC_banner_white} alt="Brand Logo" />
        </Link>
      ),
      disabled: true,
    },
    {
      key: '2',
      label: (<Link to="/">首頁</Link>),
    },
    {
      key: '3',
      label: (<Link to="/servers">生存服進度</Link>),
    }
  ];

  const NavigationBarStyledComponent = visible ? VisibleNavigationBar : HiddenNavigationBar;
  const DisplayedMenu = window.scrollY < 100 ? TopStyledMenu : StyledMenu;

  return (
    <NavigationBarStyledComponent>
      <DisplayedMenu theme="light" mode="horizontal" items={menuItems} />
    </NavigationBarStyledComponent>
  );
};

export default NavigationBar;
