import contentButton from '@/types/contentButton.ts';

/**
 * Interface for the imageContent object
 * @param imageUrl {string} - The URL of the image to display.
 * @param title {string} - The title of the image content.
 * @param subTitle {string?} - The subtitle of the image content.
 * @param paragraph {string?} - The paragraph of the image content.
 * @param features {string[]?} - The list of features to display.
 * @param buttons {contentButton[]?} - The list of buttons to display.
 * @interface imageContent - Interface for the imageContent object
 */
export interface imageContent {
  imageUrl: string;
  title: string;
  subTitle?: string;
  paragraph?: string;
  features?: string[];
  buttons?: contentButton[];
}
