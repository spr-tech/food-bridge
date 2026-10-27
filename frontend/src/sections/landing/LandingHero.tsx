// Landing header and hero: the photo sits behind, fixed, with the text centred.
import { Link } from 'react-router'
import { ROUTES } from '@/constants/routes'
import { Logo } from '@/components/layout/Logo'

const navLinks = [
  { href: '#story', label: 'The story' },
  { href: '#how', label: 'How it works' },
  { href: '#join', label: 'Join' },
]

export function LandingHero() {
  return (
    <>
      <header className='sticky top-0 z-10 border-b border-pill-on-dark bg-sidebar-dark'>
        <div className='mx-auto flex max-w-295 flex-wrap items-center justify-between gap-4 px-6 py-4'>
<a href='#top' className='no-underline'>
  <Logo variant='dark' size='md' />
</a>
          <nav aria-label='Main' className='flex flex-wrap items-center gap-1'>
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className='hidden px-3 py-2.5 font-medium text-on-dark-label no-underline sm:inline'
              >
                {link.label}
              </a>
            ))}
            <Link
              to={ROUTES.signIn}
              className='ml-2 rounded-md bg-highlight-on-dark px-4.5 py-2.75 font-bold text-sidebar-dark no-underline'
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <section id='top' className='landing-photo text-on-dark-heading'>
        <div className='mx-auto flex max-w-225 flex-col items-center gap-7 px-6 pt-32 pb-34 text-center'>
          <h1 className='m-0 font-display text-5xl leading-[1.04] font-normal tracking-[-1.5px] sm:text-6xl lg:text-[76px]'>
            Good food deserves <span className='text-highlight-on-dark italic'>another table.</span>
          </h1>
          <p className='m-0 max-w-160 text-lg leading-relaxed text-on-dark-label sm:text-[21px]'>
            At closing time, bakeries, caterers and restaurants share the food they can't sell. Community
            kitchens nearby collect it and serve it the same evening.
          </p>
          <div className='flex flex-wrap justify-center gap-3'>
            <Link
              to={ROUTES.signIn}
              className='inline-flex min-h-13 items-center rounded-xl bg-highlight-on-dark px-6 text-[17px] font-bold text-sidebar-dark no-underline'
            >
              Share surplus food
            </Link>
            <Link
              to={ROUTES.signIn}
              className='inline-flex min-h-13 items-center rounded-xl border border-outline-on-dark px-6 text-[17px] font-bold text-on-dark-heading no-underline'
            >
              Find food for your group
            </Link>
          </div>
          <a href='#story' className='mt-3 inline-flex items-center gap-2.5 text-[15px] text-footer-on-dark no-underline'>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
              <path d='M12 5v14M5 12l7 7 7-7' />
            </svg>
            Scroll to follow one evening
          </a>
        </div>
      </section>
    </>
  )
}