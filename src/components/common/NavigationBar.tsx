import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Dropdown, MenuProps, Button } from 'antd';
import {
  GlobalOutlined,
  SunOutlined,
  MoonOutlined,
  MenuOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import styled, { css, keyframes } from 'styled-components';
import useScroll from '@/hooks/useScroll';
import { useTheme } from '@/hooks/useTheme';

const slideDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const NavigationBarContainer = styled.div<{
  $hidden: boolean;
  $scrolled: boolean;
  $isDark: boolean;
}>`
  position: fixed;
  width: 100%;
  z-index: 1000;
  top: 0;
  padding: 0 var(--spacing-lg);
  transition:
    top 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    background 0.4s ease,
    backdrop-filter 0.4s ease,
    box-shadow 0.4s ease;
  animation: ${slideDown} 0.5s ease-out;

  ${(props) =>
    props.$hidden &&
    css`
      top: -100px;
    `};

  ${(props) =>
    props.$scrolled
      ? css`
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: var(--glass-shadow);
          border-bottom: 1px solid var(--glass-border);
        `
      : css`
          background: linear-gradient(
            180deg,
            rgba(0, 0, 0, 0.4) 0%,
            transparent 100%
          );
        `};
`;

const NavInner = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
`;

const Brand = styled(Link)<{ $scrolled?: boolean; $isDark?: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  transition:
    transform var(--transition-base),
    filter var(--transition-base);

  &:hover {
    transform: scale(1.02);
    filter: brightness(1.1);
  }

  img {
    height: 40px;
    /* Use dark brand in light mode when scrolled */
    filter: ${(props) =>
      props.$scrolled && !props.$isDark ? 'brightness(0.3)' : 'none'};
    transition: filter var(--transition-base);

    @media (max-width: 290px) {
      display: none;
    }
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-md);

  @media (max-width: 900px) {
    display: none;
  }
`;

const NavLink = styled(Link)<{ $active?: boolean; $scrolled?: boolean }>`
  position: relative;
  color: ${(props) => (props.$scrolled ? 'var(--text-primary)' : 'white')};
  font-weight: 500;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
  text-shadow: ${(props) =>
    props.$scrolled ? 'none' : '0 1px 3px rgba(0,0,0,0.3)'};
  text-decoration: none !important;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    height: 2px;
    background: var(--color-primary);
    transition: all var(--transition-base);
    transform: translateX(-50%);
    border-radius: 2px;
  }

  &:hover {
    color: var(--color-primary);
    text-decoration: none !important;

    &::after {
      width: 60%;
    }
  }

  ${(props) =>
    props.$active &&
    css`
      color: var(--color-primary) !important;

      &::after {
        width: 60%;
      }
    `}
`;

const DropdownTrigger = styled.span<{ $scrolled?: boolean }>`
  position: relative;
  color: ${(props) => (props.$scrolled ? 'var(--text-primary)' : 'white')};
  font-weight: 500;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
  cursor: pointer;
  text-shadow: ${(props) =>
    props.$scrolled ? 'none' : '0 1px 3px rgba(0,0,0,0.3)'};

  &:hover {
    color: var(--color-primary);
  }
`;

const NavActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
`;

const IconButton = styled(Button)<{ $scrolled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full) !important;
  border: 1px solid
    ${(props) =>
      props.$scrolled
        ? 'var(--border-color)'
        : 'rgba(255,255,255,0.3)'} !important;
  background: ${(props) =>
    props.$scrolled ? 'transparent' : 'rgba(255,255,255,0.1)'} !important;
  color: ${(props) =>
    props.$scrolled ? 'var(--text-primary)' : 'white'} !important;
  transition: all var(--transition-base) !important;
  box-shadow: none !important;

  &:hover {
    background: ${(props) =>
      props.$scrolled
        ? 'var(--color-primary-light)'
        : 'rgba(255,255,255,0.2)'} !important;
    border-color: var(--color-primary) !important;
    color: var(--color-primary) !important;
  }

  .anticon {
    font-size: 16px;
  }
`;

const MobileMenuButton = styled(IconButton)`
  display: none;

  @media (max-width: 900px) {
    display: flex;
  }
`;

const MobileMenu = styled.div<{ $open: boolean; $isDark: boolean }>`
  display: none;
  position: fixed;
  top: 70px;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: var(--spacing-xl);
  padding-bottom: calc(
    var(--spacing-xl) + 80px
  ); /* Extra padding for last item */
  transform: translateX(${(props) => (props.$open ? '0' : '100%')});
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 999;
  overflow-y: auto; /* Allow scrolling if content exceeds menu height */
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */

  @media (max-width: 900px) {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }
`;

const MobileNavLink = styled(Link)<{ $active?: boolean }>`
  display: block;
  color: var(--text-primary);
  font-size: 1.2rem;
  font-weight: 500;
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
  border-left: 3px solid transparent;
  text-decoration: none !important;

  &:hover {
    background: var(--color-primary-light);
    color: var(--color-primary);
    border-left-color: var(--color-primary);
  }

  ${(props) =>
    props.$active &&
    css`
      background: var(--color-primary-light);
      color: var(--color-primary);
      border-left-color: var(--color-primary);
    `}
`;

const LanguageButton = styled(IconButton)``;

/**
 * Modern Navigation bar component with glassmorphism effect and theme toggle.
 * Features: transparent on top, hides on scroll down, shows on scroll up, theme switching.
 */
const NavigationBar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { y, lastY } = useScroll();
  const { toggleTheme, isDark } = useTheme();
  const [isHidden, setIsHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (y === lastY) return;
    setIsHidden(y > lastY && y > 150);
  }, [y, lastY]);

  useEffect(() => {
    // Close mobile menu on route change and scroll to top
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const scrolled = y > 100;

  const changeLanguage = (lng: string | undefined) => {
    i18n.changeLanguage(lng).then();
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const languageItems: MenuProps['items'] = [
    { key: 'en', label: 'English' },
    { key: 'zh_CN', label: '简体中文' },
    { key: 'zh_TW', label: '繁體中文' },
  ];

  const membersDropdownItems: MenuProps['items'] = [
    {
      key: 'member',
      label: <Link to='/member/'>{t('menu.member')}</Link>,
    },
    {
      key: 'redstoneCollection',
      label: <Link to='/redstoneCollection/'>{t('menu.redstone')}</Link>,
    },
    {
      key: 'architectureCollection',
      label: <Link to='/architectureCollection/'>{t('menu.building')}</Link>,
    },
  ];

  return (
    <>
      <NavigationBarContainer
        $hidden={isHidden}
        $scrolled={scrolled}
        $isDark={isDark}
      >
        <NavInner>
          <Brand
            to='/'
            onClick={scrollToTop}
            $scrolled={scrolled}
            $isDark={isDark}
          >
            <img src='/brand.webp' alt='CTEC' />
          </Brand>

          <NavLinks>
            <NavLink to='/' $active={isActive('/')} $scrolled={scrolled}>
              {t('menu.home')}
            </NavLink>
            <NavLink
              to='/join/'
              $active={isActive('/join')}
              $scrolled={scrolled}
            >
              {t('menu.join')}
            </NavLink>
            <NavLink
              to='/survival/'
              $active={isActive('/survival')}
              $scrolled={scrolled}
            >
              {t('menu.survivalProgress')}
            </NavLink>
            <Dropdown menu={{ items: membersDropdownItems }} placement='bottom'>
              <DropdownTrigger $scrolled={scrolled}>
                {t('menu.memberAndWork')}
              </DropdownTrigger>
            </Dropdown>
            <NavLink
              to='/openSource/'
              $active={isActive('/openSource')}
              $scrolled={scrolled}
            >
              {t('menu.openSource')}
            </NavLink>
            <NavLink
              to='/partner/'
              $active={isActive('/partner')}
              $scrolled={scrolled}
            >
              {t('menu.partner')}
            </NavLink>
          </NavLinks>

          <NavActions>
            <IconButton
              $scrolled={scrolled}
              onClick={toggleTheme}
              aria-label='Toggle theme'
            >
              {isDark ? <SunOutlined /> : <MoonOutlined />}
            </IconButton>

            <Dropdown
              menu={{
                items: languageItems,
                onClick: ({ key }) => changeLanguage(key),
              }}
              placement='bottom'
            >
              <LanguageButton $scrolled={scrolled} aria-label='Change language'>
                <GlobalOutlined />
              </LanguageButton>
            </Dropdown>

            <MobileMenuButton
              $scrolled={scrolled}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label='Toggle menu'
            >
              {mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
            </MobileMenuButton>
          </NavActions>
        </NavInner>
      </NavigationBarContainer>

      <MobileMenu $open={mobileMenuOpen} $isDark={isDark}>
        <MobileNavLink to='/' $active={isActive('/')}>
          {t('menu.home')}
        </MobileNavLink>
        <MobileNavLink to='/join/' $active={isActive('/join')}>
          {t('menu.join')}
        </MobileNavLink>
        <MobileNavLink to='/survival/' $active={isActive('/survival')}>
          {t('menu.survivalProgress')}
        </MobileNavLink>
        <MobileNavLink to='/member/' $active={isActive('/member')}>
          {t('menu.member')}
        </MobileNavLink>
        <MobileNavLink
          to='/redstoneCollection/'
          $active={isActive('/redstoneCollection')}
        >
          {t('menu.redstone')}
        </MobileNavLink>
        <MobileNavLink
          to='/architectureCollection/'
          $active={isActive('/architectureCollection')}
        >
          {t('menu.building')}
        </MobileNavLink>
        <MobileNavLink to='/openSource/' $active={isActive('/openSource')}>
          {t('menu.openSource')}
        </MobileNavLink>
        <MobileNavLink to='/partner/' $active={isActive('/partner')}>
          {t('menu.partner')}
        </MobileNavLink>
      </MobileMenu>
    </>
  );
};

export default NavigationBar;
