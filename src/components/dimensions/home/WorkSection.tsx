import { Fragment } from 'react';

const PLACE = ['work--bl', 'work--tr', 'work--bc'];

/** One full-screen build. The picture is the scene behind it; this is only the caption. */
export const WorkSection = ({
  group,
  index,
  meta,
  name,
}: {
  group: 'overworld' | 'end';
  index: number;
  meta: string;
  name: string;
}) => {
  const lines = name.split('\n');
  return (
    <section
      className='work-sec'
      data-work={`${group}-${index}`}
      data-dim={group}
    >
      <article className={`work ${PLACE[index % 3]}`}>
        <div>
          <p className='mono acc' data-t='note'>
            {meta}
          </p>
          {/* a newline in the copy is a line break; read aloud, the name is one phrase */}
          <h3
            className='serif'
            data-t='title'
            aria-label={lines.length > 1 ? lines.join(' ') : undefined}
          >
            {lines.map((line, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </h3>
        </div>
      </article>
    </section>
  );
};
