/** The one claim of the nether: two lines, the second in the accent colour. */
export const RankStatement = ({
  label,
  lines,
  body,
}: {
  label: string;
  lines: string[];
  body: string;
}) => (
  <section className='rank' data-dim='nether'>
    <p className='mono acc' data-t='note'>
      {label}
    </p>
    <h2 className='serif rise' data-t='title'>
      {lines[0]}
      <em>{lines[1]}</em>
    </h2>
    <p className='rise' data-t='body'>
      {body}
    </p>
  </section>
);
