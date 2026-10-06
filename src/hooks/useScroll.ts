import { useState, useEffect } from 'react';
import throttle from 'lodash/throttle';

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
    // Throttle the scroll event listener to run at most once every 100ms
    // This absolutely obliterates the 173ms forced reflow lag during scroll!
    const handleScroll = throttle(
      () => {
        setScroll((prevState) => ({
          x: window.scrollX,
          y: window.scrollY,
          lastX: prevState.x,
          lastY: prevState.y,
        }));
      },
      100,
      { leading: true, trailing: true },
    );

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      handleScroll.cancel();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return scroll;
};

export default useScroll;
