import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'antd';
import styled from 'styled-components';
import useScroll from '@/hooks/useScroll';

import CTEC_banner_white from '@/assets/brand/CTEC_banner_white.png';

const NavigationBarContainer = styled.div`
    position: fixed;
    width: 100%;
    z-index: 1000;
    top: 0;
    transition: top 0.3s, background-color 0.3s;
    display: flex;
    justify-content: center;

    &.hidden {
        top: -100px;
    }

    &.scrolled {
        background-color: #6f9b9c;
        
        li.ant-menu-item-selected::after {
            border-bottom-color: white;
        }
    }
`;

const Brand = styled.img`
    height: 40px;
    margin-right: 20px;
`;

const StyledMenu = styled(Menu)`
    flex-grow: 1;
    line-height: 64px;
    background-color: transparent;

    span.ant-menu-title-content > a {
        color: white;

        &:hover {
            color: #b1dde6;
        }
    }
`;

const NavigationBar = () => {
  const { y, lastY } = useScroll();
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    setIsHidden(y > lastY && y > 150);
  }, [y, lastY]);

  const scrolled = y > window.innerHeight;

  const menuItems = [
    {
      key: 'brand',
      label: (
        <Link to="/">
          <Brand src={CTEC_banner_white} alt="Brand Logo" />
        </Link>
      ),
      disabled: true
    },
    {
      key: 'home',
      label: (<Link to="/">首頁</Link>)
    },
    {
      key: 'servers',
      label: (<Link to="/servers">生存服進度</Link>)
    }
  ];

  return (
    <NavigationBarContainer className={`${isHidden ? 'hidden' : ''} ${scrolled ? 'scrolled' : ''}`}>
      <StyledMenu
        theme="dark"
        mode="horizontal"
        items={menuItems}
        defaultSelectedKeys={['home']}
        className={`${scrolled ? 'scrolled' : ''}`} />
    </NavigationBarContainer>
  );
};

export default NavigationBar;
