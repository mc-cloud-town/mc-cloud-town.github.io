const images = import.meta.glob('/src/assets/**/*', {
  query: '?url',
  eager: true,
  import: 'default',
});

/**
 * Get the URL of an image in the assets folder
 * @param snippet {string} - The snippet of the image URL
 */
const getImageUrl = (snippet: string) => {
  return images[`/src/assets/${snippet}`] ?? '';
};

export default getImageUrl;
