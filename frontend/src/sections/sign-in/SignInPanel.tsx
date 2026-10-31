// The welcome panel on sign-in (1-sign-in, m1-sign-in). The page paints the handover
// photo behind everything, so the panel has no background of its own.
// Desktop: logo, headline, description and three icons. Phone: the logo only, so the
// form card fits one screen.
// The headline is styled text, not a heading: "Welcome back" is the page's h1.
import type { ReactNode } from 'react'
import { Logo } from '@/components/layout/Logo'

const HEADLINE = "Tonight's surplus is waiting."
const DESCRIPTION = "Share what's left at closing time, or find good food nearby to collect this evening."
function PanelIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      width='34'
      height='34'
      viewBox='0 0 24 24'
      fill='none'
      stroke='var(--color-count)'
      strokeWidth={1.9}
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
      focusable='false'
    >
      {children}
    </svg>
  )
}

const POINTS: { label: [string, string]; icon: ReactNode }[] = [
  {
    label: ['Reduce', 'food waste'],
    icon: (
      <>
        <rect x='3' y='3' width='18' height='18' rx='3' />
        <path d='M7 17c0-6 4-10 10-10 0 6-4 10-10 10z' />
        <path d='M7 17 13 11' />
      </>
    ),
  },
  {
    label: ['Support', 'communities'],
    icon: (
      <>
        <circle cx='8' cy='8' r='3' />
        <circle cx='16' cy='8' r='3' />
        <path d='M2 20c.6-3 3-5 6-5s5.4 2 6 5M12 20c.6-3 3-5 6-5' />
      </>
    ),
  },
  {
    label: ['Build a', 'stronger Lagos'],
    icon: <path d='M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z' />,
  },
]

export function SignInPanelDesktop() {
  return (
    <div className='flex flex-col px-[clamp(40px,6.25vw,90px)] pt-21 pb-16 text-on-dark-heading'>
      <Logo variant='dark' size='lg' />
      <p className='mt-14 mb-6 max-w-140 font-display text-[clamp(44px,4.6vw,66px)] leading-[1.04] font-semibold'>
        {HEADLINE}
      </p>
      <p className='m-0 max-w-107.5 text-[17px] leading-[1.65] text-on-dark-label'>{DESCRIPTION}</p>
      <ul className='mt-auto flex pt-10'>
        {POINTS.map((point, index) => (
          <li
            key={point.label.join(' ')}
            className={
              index === 0
                ? 'flex flex-col gap-3 pr-8.5'
                : 'flex flex-col gap-3 border-l border-[color-mix(in_srgb,var(--color-surface)_22%,transparent)] px-8.5'
            }
          >
            <PanelIcon>{point.icon}</PanelIcon>
            <span className='text-[17px] leading-[1.4] font-medium text-on-dark-label'>
              {point.label[0]}
              <br />
              {point.label[1]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}


export function SignInPanelPhone() {
  return (
    <div className='px-5 pt-6 pb-2 text-on-dark-heading md:mx-auto md:w-full md:max-w-125 md:px-0 md:pt-16 md:pb-8'>
      <Logo variant='dark' size='md' />
      <p className='mt-8 mb-3 hidden font-display text-5xl leading-[1.05] font-semibold md:block'>{HEADLINE}</p>
      <p className='m-0 hidden text-[17px] leading-[1.65] text-on-dark-label md:block '>{DESCRIPTION}</p>
    </div>
  )
}