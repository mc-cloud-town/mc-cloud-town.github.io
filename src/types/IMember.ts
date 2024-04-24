/**
 * Interface for member
 * @param uuid {string} - The uuid of the member.
 * @param name {string} - The name of the member.
 * @param introduction {string} - The introduction of the member.
 * @interface IMember - Interface for member
 */
export interface IMember {
  uuid: string;
  name: string;
  introduction?: string;
}

export interface IMembers {
  [group: string]: IMember[];
}
