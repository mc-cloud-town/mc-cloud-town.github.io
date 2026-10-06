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
}) => (
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
        <h3 className='serif' data-t='title'>
          {/* a title with a subtitle ("A：B", "A: B") stands on two lines, without the colon */}
          {name.split(/\s*[：:]\s*/).map((line, i) => (
            <Fragment key={line}>
              {i > 0 && <br />}
              {line}
            </Fragment>
          ))}
        </h3>
      </div>
    </article>
  </section>
);
