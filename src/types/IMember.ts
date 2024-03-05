/**
 * Interface for member
 * @param id {string} - The id of the member.
 * @param uuid {string} - The uuid of the member.
 * @param name {string} - The name of the member.
 * @param group {string} - The group of the members.
 * @param introduction {string} - The introduction of the member.
 * @interface IMember - Interface for member
 */
export interface IMember {
  id: string,
  uuid: string,
  name: string,
  group: string,
  introduction?: string,
}
