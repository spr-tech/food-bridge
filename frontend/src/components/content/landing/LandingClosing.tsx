// Landing closing band and footer. The band opens like a lens, the words fly in from the
// sides and the accented end ("go to waste.") drops in letter by letter (src/styles/landing.css).
// The heading is one translation; parseAccentHeading splits whatever the language says.
import { Fragment, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ROUTES } from '@/utilities/constants/routes'
import { letterDelay, parseAccentHeading, wordDirection } from '@/utilities/helpers/accent-heading'

// Each letter of the accent, and the gap between its words, takes one position in the drop.
function accentPositions(accent: string[][]) {
  let position = 0
  const words = accent.map((letters, index) => ({
    gap: index > 0 ? position++ : null,
    letters: letters.map((letter) => ({ letter, position: position++ })),
  }))
  return { words, count: position }
}

const delay = (position: number, count: number) => ({ '--i': letterDelay(position, count) }) as CSSProperties

export function LandingClosing() {
  const { t } = useTranslation(['landing', 'common'])
  const heading = parseAccentHeading(t('closing.heading'))
  const accent = accentPositions(heading.accent)
  return (
    <>
      <section className='landing-photo landing-iris text-on-dark-heading'>
        <div className='mx-auto flex max-w-250 flex-col items-center gap-8 px-6 py-35 text-center'>
          {/* LOGO: the icon only, 72px tall, with the class landing-zoom */}

          <h2 className='m-0 font-display text-5xl leading-[1.08] font-normal sm:text-[64px]'>
            {/* Screen readers hear the sentence once; the animated letters are hidden from them. */}
            <span className='sr-only'>{heading.text}</span>
            <span aria-hidden='true'>
              {heading.words.map((word, index) => (
                <span key={index}>
                  <span className={`landing-word landing-word-${wordDirection(index, heading.words.length)} inline-block`}>{word}</span>{' '}
                </span>
              ))}
              {accent.count > 0 && (
                <>
                  <br />
                  <span className='inline-block text-highlight-on-dark italic'>
                    {accent.words.map((word, index) => (
                      <Fragment key={index}>
                        {word.gap !== null && (
                          <span className='landing-letter inline-block w-[0.3em]' style={delay(word.gap, accent.count)} />
                        )}
                        {/* A word never breaks between its letters. */}
                        <span className='inline-block whitespace-nowrap'>
                          {word.letters.map(({ letter, position }) => (
                            <span key={position} className='landing-letter inline-block' style={delay(position, accent.count)}>
                              {letter}
                            </span>
                          ))}
                        </span>
                      </Fragment>
                    ))}
                  </span>
                </>
              )}
            </span>
          </h2>

          <Link
            to={ROUTES.signIn}
            className='landing-pulse inline-flex min-h-13.5 items-center rounded-xl bg-highlight-on-dark px-7 text-[17px] font-bold text-sidebar-dark no-underline'
          >
            {t('closing.signIn')}
          </Link>
        </div>
      </section>

      <footer className='mx-auto flex max-w-295 flex-wrap justify-between gap-3 px-6 pt-8 pb-10 text-sm text-text-muted'>
        <span>{t('footer.credit')}</span>
        <span>{t('common:demoData')}</span>
      </footer>
    </>
  )
}