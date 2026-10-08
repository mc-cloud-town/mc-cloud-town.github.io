/** The one claim of the nether: any number of lines, the last one in the accent colour. */
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
      {lines.map((line, i) =>
        // keyed by position: the same nodes carry every language
        i < lines.length - 1 ? (
          <span key={i}>{line}</span>
        ) : (
          <em key={i}>{line}</em>
        ),
      )}
    </h2>
    <p className='rise' data-t='body'>
      {body}
    </p>
  </section>
);
