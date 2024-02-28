/**
 * Interface representing a GitHub repository.
 * This interface is extensible and can include any number of additional string properties.
 * @interface IRepoType
 * @property {string} id - The unique identifier of the repository.
 * @property {string} name - The name of the repository.
 * @property {string} html_url - The HTML URL of the repository, navigable in a web browser.
 * @property {string} description - A short description of the repository.
 */
export interface IRepoType {
  id: string;
  name: string;
  html_url: string;
  description: string;
}
