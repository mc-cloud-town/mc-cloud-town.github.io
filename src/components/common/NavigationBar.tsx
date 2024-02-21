import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Dropdown, Menu, MenuProps, Space } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import useScroll from '@/hooks/useScroll';

import CTEC_banner_white from '@/assets/brand/CTEC_banner_white.png';

const NavigationBarContainer = styled.div`
  position: fixed;
  width: 100%;
  z-index: 1000;
  top: 0;
  transition: top 0.3s, background-color 0.3s;

  &.hidden {
    top: -100px;
  }

  &.scrolled {
    background-color: #6f9b9c;

    li.ant-menu-item-selected::after {
      border-bottom-color: white;
    }
  }

  .anticon {
    color: white;
  }
`;

const Brand = styled.img`
  height: 40px;
  margin-right: 20px;
`;

const StyledMenu = styled(Menu)`
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
  const { t, i18n } = useTranslation();
  const { y, lastY } = useScroll();
  const [isHidden, setIsHidden] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsHidden(y > lastY && y > 150);
  }, [y, lastY]);

  const scrolled = y > window.innerHeight / 2;

  const changeLanguage = (lng: string | undefined) => {
    i18n.changeLanguage(lng).then();
  };

  const getDefaultSelectedKeys = () => {
    const path = location.pathname;
    return path === '/survival' ? ['survival'] : ['home'];
  };

  const languageItems: MenuProps['items'] = [
    { key: 'en', label: 'English', onClick: () => changeLanguage('en') },
    { key: 'zh_CN', label: '简体中文', onClick: () => changeLanguage('zh_CN') },
    { key: 'zh_TW', label: '繁體中文', onClick: () => changeLanguage('zh_TW') },
  ];

  const menuItems: MenuProps['items'] = [
    {
      key: 'brand',
      label: (
        <Link to="/">
          <Brand src={CTEC_banner_white} alt="Brand Logo" />
        </Link>
      ),
      disabled: true,
    },
    {
      key: 'home',
      label: (<Link to="/">{t('menu.home')}</Link>)
    },
    {
      key: 'survival',
      label: (<Link to="/survival">{t('menu.survivalProgress')}</Link>)
    },
    {
      key: '404',
      label: (<Link to="/404">{404}</Link>)
    },
    {
      key: 'language',
      label: (
        <Dropdown
          menu={{ items: languageItems, onClick: ({ key }) => changeLanguage(key) }}
          placement="bottom"
        >
          <a onClick={(e) => e.preventDefault()}>
            <Space>
              <GlobalOutlined /> Language
            </Space>
          </a>
        </Dropdown>
      ),
    },
  ];

  return (
    <NavigationBarContainer className={`${isHidden ? 'hidden' : ''} ${scrolled ? 'scrolled' : ''}`}>
      <StyledMenu
        theme="dark"
        mode="horizontal"
        items={[...menuItems]}
        defaultSelectedKeys={getDefaultSelectedKeys()}
        className={`${scrolled ? 'scrolled' : ''}`} />
    </NavigationBarContainer>
  );
};

export default NavigationBar;
