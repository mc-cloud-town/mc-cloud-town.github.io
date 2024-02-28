export interface ILink {
  youtube?: string;
  discord?: string;
  bilibili?: string;
  facebook?: string;
  X?: string;
  other?: string;
}

export interface IPartnership {
  Partner: string;
  Image: string;
  ImageTitle: string;
  ModalTitle: string;
  Introduce: string[] | string;
  ShowVideo?: string;
  Link?: ILink;
}
