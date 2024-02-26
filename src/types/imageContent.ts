export interface imageContent {
  imageUrl: string,
  title: string,
  subTitle?: string,
  paragraph?: string,
  features?: (string | JSX.Element)[],
  buttonLink?: string,
  buttonText?: string,
}
