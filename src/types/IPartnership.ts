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
  ModalTitle: string;
  LongPartnership: boolean;
  Introduce: (string | JSX.Element)[] | string | JSX.Element;
  ShowVideo?: string;
  Link?: ILink;
}
