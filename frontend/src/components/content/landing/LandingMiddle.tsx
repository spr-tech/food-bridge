// Landing middle: the story (one evening), the food band, How it works,
// the promise and Join. Animations are classes from src/styles/landing.css.
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ROUTES } from '@/utilities/constants/routes'

// Text comes from landing.json; only the motion of each How it works card lives here.
const howMotion = ['landing-from-left', 'landing-pop', 'landing-from-right']

const eyebrow = 'mb-3 text-sm font-bold tracking-[3px] text-accent uppercase'
const sectionHeading = 'm-0 font-display text-4xl leading-[1.1] font-semibold sm:text-5xl'

function FoodRow({ reverse = false }: { reverse?: boolean }) {
  const { t } = useTranslation('landing')
  const foods = t('foodBand.foods', { returnObjects: true })
  const items = reverse ? [...foods].reverse() : foods
  // Two copies side by side, so the loop has no visible seam.
  const row = items.map((food, index) => (
    <span key={index} className='inline-flex items-center gap-10 pr-10'>
      {food}
      <span className='size-3 rounded-full bg-highlight-on-dark' />
    </span>
  ))
  return (
    <div aria-hidden='true'>
      <div className={`landing-marquee ${reverse ? 'landing-marquee-reverse' : ''} flex w-max font-display text-5xl leading-none whitespace-nowrap text-sidebar-dark opacity-15 sm:text-[64px]`}>
        <div className='flex'>{row}</div>
        <div className='flex'>{row}</div>
      </div>
    </div>
  )
}

export function LandingMiddle() {
  const { t } = useTranslation('landing')
  const storySteps = t('story.steps', { returnObjects: true })
  const howSteps = t('howItWorks.steps', { returnObjects: true })
  const sides = t('join.sides', { returnObjects: true })
  return (
    <>
      {/* The story */}
      <section id='story' className='mx-auto max-w-225 px-6 pt-30 pb-20'>
        <p className={`landing-reveal ${eyebrow}`}>{t('story.eyebrow')}</p>
        <h2 className={`landing-reveal mb-18 ${sectionHeading}`}>{t('story.heading')}</h2>
        <div className='relative'>
          <div aria-hidden='true' className='landing-line absolute top-2 bottom-2 left-6.75 w-0.75 rounded-sm bg-primary' />
          <ol className='relative m-0 list-none p-0'>
            {storySteps.map((step, index) => {
              const isLast = index === storySteps.length - 1
              return (
                <li key={index} className={`landing-reveal flex gap-7 ${isLast ? '' : 'pb-16'}`}>
                  <span className={`z-1 grid size-14.5 flex-none place-items-center rounded-full text-sm font-bold ${isLast ? 'bg-highlight-on-dark text-sidebar-dark' : 'bg-primary text-on-primary'}`}>
                    {step.badge}
                  </span>
                  <div>
                    <p className='mb-1.5 text-sm font-bold text-text-muted'>{step.time}</p>
                    <h3 className='mb-2.5 font-display text-2xl font-semibold sm:text-[32px]'>{step.title}</h3>
                    <p className='m-0 text-lg leading-relaxed text-text-body sm:text-[19px]'>{step.body}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
        <p className='mt-12 text-sm text-text-muted'>{t('story.note')}</p>
      </section>

      {/* Food band */}
      <section className='overflow-hidden border-y border-cream-border bg-cream'>
        <div className='flex flex-col gap-14 py-24'>
          <FoodRow />
          <div className='mx-auto max-w-250 px-6 text-center font-display text-4xl leading-[1.15] sm:text-[64px]'>
            <p className='landing-glow m-0 text-sidebar-dark'>{t('foodBand.line')}</p>
            <p className='landing-glow mt-4 mb-0 text-accent italic'>{t('foodBand.accentLine')}</p>
          </div>
          <FoodRow reverse />
        </div>
      </section>

      {/* How it works */}
      <section id='how' className='mx-auto max-w-295 px-6 py-30'>
        <p className={`landing-reveal ${eyebrow}`}>{t('howItWorks.eyebrow')}</p>
        <h2 className={`landing-reveal mb-12 ${sectionHeading}`}>{t('howItWorks.heading')}</h2>
        <ol className='m-0 grid list-none gap-5 p-0 md:grid-cols-3'>
          {howSteps.map((step, index) => (
            <li key={index} className={`landing-card ${howMotion[index]} flex flex-col gap-3 rounded-[20px] border border-border bg-surface p-8`}>
              <span className='font-display text-[44px] text-primary'>{index + 1}</span>
              <h3 className='m-0 text-[23px] font-bold'>{step.title}</h3>
              <p className='m-0 text-[17px] leading-relaxed text-text-secondary'>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* The promise */}
      <section className='landing-photo text-on-dark-heading'>
        <div className='landing-reveal mx-auto flex max-w-205 flex-col items-center gap-5 px-6 py-35 text-center'>
          <h2 className='m-0 font-display text-4xl leading-[1.1] font-semibold sm:text-[46px]'>{t('promise.heading')}</h2>
          <p className='m-0 text-lg leading-relaxed text-on-dark-label sm:text-[19px]'>
            {t('promise.body')}
          </p>
        </div>
      </section>

      {/* Join */}
      <section id='join' className='mx-auto max-w-295 px-6 py-30'>
        <h2 className={`landing-reveal mb-12 text-center ${sectionHeading}`}>{t('join.heading')}</h2>
        <div className='grid gap-6 md:grid-cols-2'>
          {sides.map((side, index) => (
            <div key={index} className='landing-reveal flex flex-col gap-4.5 rounded-3xl border border-border bg-surface p-10'>
              <p className={`m-0 ${eyebrow}`}>{side.eyebrow}</p>
              <h3 className='m-0 font-display text-3xl font-semibold sm:text-[34px]'>{side.title}</h3>
              <p className='m-0 text-lg leading-relaxed text-text-body'>{side.body}</p>
              <Link to={ROUTES.signIn} className='inline-flex min-h-12.5 items-center self-start rounded-xl bg-primary px-5.5 font-bold text-on-primary no-underline hover:bg-primary-hover'>
                {side.action}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}