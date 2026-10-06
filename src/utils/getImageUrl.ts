/**
 * Get the URL of an image in the assets folder
 * @param snippet {string} - The snippet of the image URL
 */
const getImageUrl = (snippet: string) => {
  return snippet ? `/assets/${snippet}` : '';
};

export default getImageUrl;
