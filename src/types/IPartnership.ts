import type React from 'react';

export interface ILink {
  youtube?: string;
  bilibili?: string;
  twitch?: string;
  tiktok?: string;
  discord?: string;
  facebook?: string;
  weibo?: string;
  instagram?: string;
  x?: string;
  qq?: string;
  other?: string;
}

export interface IPartnership {
  Partner: string;
  Image: string;
  ModalTitle: string;
  LongPartnership?: boolean;
  Introduce: (string | React.JSX.Element)[] | string | React.JSX.Element;
  ShowVideo?: string;
  Link?: ILink;
}
