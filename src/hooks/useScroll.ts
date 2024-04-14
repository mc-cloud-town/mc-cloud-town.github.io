import { useState, useEffect } from 'react';

/**
 * useScroll hook to track the scroll position of the window.
 * @returns {Object{ x: number, y: number, lastX: number, lastY: number }} The scroll position of the window.
 */
const useScroll = (): {
  x: number;
  y: number;
  lastX: number;
  lastY: number;
} => {
  const [scroll, setScroll] = useState({
    x: 0,
    y: 0,
    lastX: 0,
    lastY: 0,
  });

  useEffect(() => {
    const handleScroll = () => {
      setScroll((prevState) => ({
        x: window.scrollX,
        y: window.scrollY,
        lastX: prevState.x,
        lastY: prevState.y,
      }));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scroll;
};

export default useScroll;
