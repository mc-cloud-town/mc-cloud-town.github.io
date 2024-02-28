export interface Link {
  youtube?: string;
  discord?: string;
  bilibili?: string;
  facebook?: string;
  telegram?: string;
  Bahamut?: string;
  X?: string;
  other?: string;
}

export interface IPartnership {
  Partner: string;
  Image: string;
  ImageTitle: string;
  ModalTitle: string;
  Introduce: string[] | string;
  ModalFooter?: string;
  ShowVideo?: string;
  Link?: Link;
}
