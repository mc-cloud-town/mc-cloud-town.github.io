import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Dropdown, Menu, MenuProps, Space } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import useScroll from '@/hooks/useScroll';

import CTEC_banner_white from '@/assets/brand/CTEC_banner_white.png';

const NavigationBarContainer = styled.div<{
  $hidden: boolean;
  $scrolled: boolean;
}>`
  position: fixed;
  width: 100%;
  z-index: 1000;
  top: 0;
  transition:
    top 0.3s,
    background-color 0.3s;

  ${(props) =>
    props.$hidden &&
    `
    top: -100px;
  `};

  ${(props) =>
    props.$scrolled &&
    `
    background-color: #6f9b9c;

    li.ant-menu-item-selected::after {
      border-bottom-color: white;
    }
  `};
`;

const Brand = styled.img`
  height: 40px;
  margin-right: 20px;

  @media (max-width: 290px) {
    display: none;
  }
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

  div.ant-menu-submenu-title > span {
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
    if (y === lastY) return;
    setIsHidden(y > lastY && y > 150);
  }, [y, lastY]);

  const scrolled = y > window.innerHeight / 2;

  const changeLanguage = (lng: string | undefined) => {
    i18n.changeLanguage(lng).then();
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
      label: <Link to="/">{t('menu.home')}</Link>,
    },
    {
      key: 'join',
      label: <Link to="/join">{t('menu.join')}</Link>,
    },
    {
      key: 'survival',
      label: <Link to="/survival">{t('menu.survivalProgress')}</Link>,
    },
    {
      key: 'membersAndWork',
      label: t('menu.memberAndWork'),
      children: [
        {
          key: 'member',
          label: <Link to="/member">{t('menu.member')}</Link>,
        },
        {
          key: 'RedstonePortfolio',
          label: <Link to="/RedstonePortfolio">{t('menu.redstone')}</Link>,
        },
        {
          key: 'BuildingPortfolio',
          label: <Link to="/BuildingPortfolio">{t('menu.building')}</Link>,
        },
      ],
    },
    {
      key: 'openSource',
      label: <Link to="/openSource">{t('menu.openSource')}</Link>,
    },
    {
      key: 'collaborative',
      label: <Link to={'/collaborative'}>{t('menu.partner')}</Link>,
    },
    {
      key: 'language',
      label: (
        <Dropdown
          menu={{
            items: languageItems,
            onClick: ({ key }) => changeLanguage(key),
          }}
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

  const getDefaultSelectedKeys = () => {
    const path = location.pathname;
    if (path === '/') return ['home'];
    return menuItems.find((item) => item?.key === path.slice(1))
      ? [path.slice(1)]
      : ['404'];
  };

  return (
    <NavigationBarContainer $hidden={isHidden} $scrolled={scrolled}>
      <StyledMenu
        theme="dark"
        mode="horizontal"
        items={[...menuItems]}
        defaultSelectedKeys={getDefaultSelectedKeys()}
      />
    </NavigationBarContainer>
  );
};

export default NavigationBar;
