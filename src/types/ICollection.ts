export interface ICollection {
  Image: string;
  Title: string;
  Creator: string;
  Modal: ICollectionModal[];
}

export interface ICollectionModal {
  Title: string;
  Creator: string | string[];
  Tage: ITag[];
  VideoOrImage: string;
  Link?: IModalLink;
  Introduce: string | string[];
  Other?: IOther;
}

export interface IOther {
  Link: string;
  Image: string;
}

export interface ITag {
  Name: string;
  Link: string;
  Color: string;
}

export interface IModalLink {
  Share?: string;
  Download?: string;
}
