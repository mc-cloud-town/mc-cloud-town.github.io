export const getBasePath = () => {
  if (window.location.hostname === 'localhost') {
    return window.location.origin;
  } else {
    return `${window.location.origin}/cloudtown-website`;
  }
};
