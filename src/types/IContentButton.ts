/**
 * Interface for the contentButton object
 * @param text {string} - The text to display on the button.
 * @param link {string?} - The link to navigate to when the button is clicked.
 * @param href {string?} - The href to navigate to when the button is clicked.
 * @param action {() => void?} - The action to perform when the button is clicked. If a link is provided, this will be ignored.
 * @param type {'primary' | 'default' | 'link' | 'text' | 'dashed'?} - The type of the button.
 * @interface IContentButton - Interface for the contentButton object
 */
export interface IContentButton {
  text: string;
  link?: string;
  href?: string;
  action?: () => void;
  type?: 'primary' | 'default' | 'link' | 'text' | 'dashed';
}
