// The dark green welcome panel on sign-in (1-sign-in, m1-sign-in). Desktop: logo,
// headline, description and three icons, with two faint rings in the corner. Phone: a
// short header with the logo and headline only, so the form fits one screen.
// The headline is styled text, not a heading: "Welcome back" is the page's h1.
import type { ReactNode } from "react";
import { Logo } from "@/components/layout/Logo";

const HEADLINE = "Good food deserves another table.";

function PanelIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-count)"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

const POINTS: { label: [string, string]; icon: ReactNode }[] = [
  {
    label: ["Reduce", "food waste"],
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M7 17c0-6 4-10 10-10 0 6-4 10-10 10z" />
        <path d="M7 17 13 11" />
      </>
    ),
  },
  {
    label: ["Support", "communities"],
    icon: (
      <>
        <circle cx="8" cy="8" r="3" />
        <circle cx="16" cy="8" r="3" />
        <path d="M2 20c.6-3 3-5 6-5s5.4 2 6 5M12 20c.6-3 3-5 6-5" />
      </>
    ),
  },
  {
    label: ["Build a", "stronger Lagos"],
    icon: (
      <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
    ),
  },
];

const RING = "pointer-events-none absolute rounded-full border-solid";
const RING_COLOUR =
  "border-[color-mix(in_srgb,var(--color-surface)_5%,transparent)]";

export function SignInPanelDesktop() {
  return (
    <div className="relative flex flex-col overflow-hidden bg-sidebar-dark px-[clamp(40px,6.25vw,90px)] pt-21 pb-16 text-on-dark-heading">
      <Logo variant="dark" size="lg" />
      <p className="relative mt-14 mb-6 max-w-140 font-display text-[clamp(44px,4.6vw,66px)] leading-[1.04] font-semibold">
        {HEADLINE}
      </p>
      <p className="relative m-0 max-w-107.5 text-[17px] leading-[1.65] text-footer-on-dark">
        A practical way for food businesses, community groups and charities to
        share surplus food and reduce waste in Lagos.
      </p>
      <ul className="relative mt-auto flex pt-10">
        {POINTS.map((point, index) => (
          <li
            key={point.label.join(" ")}
            className={
              index === 0
                ? "flex flex-col gap-3 pr-8.5"
                : "flex flex-col gap-3 border-l border-[color-mix(in_srgb,var(--color-surface)_18%,transparent)] px-8.5"
            }
          >
            <PanelIcon>{point.icon}</PanelIcon>
            <span className="text-[17px] leading-[1.4] font-medium text-on-dark-label">
              {point.label[0]}
              <br />
              {point.label[1]}
            </span>
          </li>
        ))}
      </ul>
      <div
        aria-hidden="true"
        className={`${RING} ${RING_COLOUR} -right-57.5 -bottom-62.5 size-175 border-70`}
      />
      <div
        aria-hidden="true"
        className={`${RING} -right-22.5 -bottom-27.5 size-105 border-44 border-[color-mix(in_srgb,var(--color-surface)_4%,transparent)]`}
      />
    </div>
  );
}

export function SignInPanelPhone() {
  return (
    <div className="relative overflow-hidden bg-sidebar-dark px-5 pt-5.5 pb-6.5 text-on-dark-heading">
      <Logo variant="dark" size="md" />
      <p className="relative mt-4.5 mb-0 font-display text-[30px] leading-[1.1] font-semibold">
        {HEADLINE}
      </p>
      <div
        aria-hidden="true"
        className={`${RING} ${RING_COLOUR} -right-27.5 -bottom-37.5 size-75 border-38`}
      />
    </div>
  );
}
