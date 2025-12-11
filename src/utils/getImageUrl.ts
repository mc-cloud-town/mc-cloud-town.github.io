const images = import.meta.glob('/src/assets/**/*', {
  eager: true,
}) as Record<string, { default: string }>;

/**
 * Get the URL of an image in the assets folder
 * @param snippet {string} - The snippet of the image URL
 */
const getImageUrl = (snippet: string) => {
  const key = `/src/assets/${snippet}`;
  return images[key]?.default ?? '';
};

export default getImageUrl;
