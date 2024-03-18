/**
 * "portfolio": {
 *   "Portfolio": ""
 * }
 */
export interface IPortfolio {
  Portfolio: string;
  Title: string;
  Creator: string;
  Modal: IPortfolioModal;
}

export interface IPortfolioModal {
  Title: string;
  Creator: string | string[];
  Tage: string[];
  Introduce: string | string[];
  Link?: IModalLink;
}

export interface IModalLink {
  share?: string;
  download?: string;
}
