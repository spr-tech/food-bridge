// Landing closing band and footer. The band opens like a lens, the words fly in
// from four sides and "go to waste." drops in letter by letter (src/styles/landing.css).
import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { ROUTES } from '@/constants/routes'

const words = ['Tonight,', 'let', 'nothing', 'good']
const accent = 'go to waste.'

export function LandingClosing() {
  return (
    <>
      <section className='landing-photo landing-iris text-on-dark-heading'>
        <div className='mx-auto flex max-w-250 flex-col items-center gap-8 px-6 py-35 text-center'>
          {/* LOGO: the icon only, 72px tall, with the class landing-zoom */}

          <h2 className='m-0 font-display text-5xl leading-[1.08] font-normal sm:text-[64px]'>
            {/* Screen readers hear the sentence once; the animated letters are hidden from them. */}
            <span className='sr-only'>Tonight, let nothing good go to waste.</span>
            <span aria-hidden='true'>
              {words.map((word, index) => (
                <span key={word}>
                  <span className={`landing-word landing-word-${index + 1} inline-block`}>{word}</span>{' '}
                </span>
              ))}
              <br />
              <span className='inline-block text-highlight-on-dark italic'>
                {accent.split('').map((char, index) => (
                  <span
                    key={index}
                    className={`landing-letter inline-block ${char === ' ' ? 'w-[0.3em]' : ''}`}
                    style={{ '--i': index } as CSSProperties}
                  >
                    {char === ' ' ? '' : char}
                  </span>
                ))}
              </span>
            </span>
          </h2>

          <Link
            to={ROUTES.signIn}
            className='landing-pulse inline-flex min-h-13.5 items-center rounded-xl bg-highlight-on-dark px-7 text-[17px] font-bold text-sidebar-dark no-underline'
          >
            Sign in to FoodBridge
          </Link>
        </div>
      </section>

      <footer className='mx-auto flex max-w-295 flex-wrap justify-between gap-3 px-6 pt-8 pb-10 text-sm text-text-muted'>
        <span>FoodBridge · TeSA Cohort 6 · Team 1</span>
        <span>Demonstration data · organisations and people are fictional</span>
      </footer>
    </>
  )
}