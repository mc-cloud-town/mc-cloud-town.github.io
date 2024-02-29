export interface ILink {
  youtube?: string;
  bilibili?: string;
  twitch?: string;
  tiktok?: string;
  discord?: string;
  facebook?: string;
  weibo?: string;
  Instagram?: string;
  X?: string;
  QQ?: string;
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
