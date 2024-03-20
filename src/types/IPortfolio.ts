/**
 * "collection": {
 *   "collection": ""
 * }
 */
export interface IPortfolio {
  Image: string;
  Title: string;
  Creator: string;
  Modal: IPortfolioModal[];
}

export interface IPortfolioModal {
  Title: string;
  Creator: string | string[];
  Tage: ITag[];
  Introduce: string | string[];
  Link?: IModalLink;
}

export interface ITag {
  Name: string;
  Link: string;
  Color: string;
}

export interface IModalLink {
  Video?: string;
  Share?: string;
  Download?: string;
}
