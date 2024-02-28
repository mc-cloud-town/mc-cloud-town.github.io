/**
 * Interface for member
 * @param id {string} - The id of the member.
 * @param name {string} - The name of the member.
 * @param introduction {string} - The introduction of the member.
 * @interface IMember - Interface for member
 */
export interface IMember {
  id: string,
  name: string,
  introduction?: string,
}
