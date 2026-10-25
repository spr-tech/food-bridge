// Textarea
// Owner: Muizz Jamiu
//
// Done when:
// - [x] Works inside FormField
// - [x] Forwards ref (React Hook Form)
// - [x] Keyboard (checked from code 2026-10-24): native <textarea>, no tabindex, so it sits in
//       DOM Tab order; typing works and Enter adds a new line (it never submits the form);
//       Tab leaves it; the character count is plain text and never takes focus
// - [ ] Screen reader checked once: pending manual check (Muizz)
// - [x] Typed props, no `any`, colours from tokens.css
// - [ ] Reviewed by one other interface engineer
//
// Use inside FormField so it gets its label, hint and error wiring:
//   <FormField label="Delivery notes" hint="Gate code, landmarks" error={errors.notes?.message}>
//     {(field) => <Textarea {...field} {...register("notes")} maxLength={500} showCount />}
//   </FormField>
//
// - forwardRef makes it work with React Hook Form's register(). Formik's getFieldProps() works too.
// - Error styling switches on automatically from aria-invalid, which FormField sets.
// - rows defaults to 4. Users can resize it vertically only, so it never breaks the layout's width.
// - showCount, together with maxLength, shows "120 / 500" under the field. The count is part of
//   the field's description (aria-describedby), so screen readers hear it on focus. It only
//   becomes a polite live region in the last 20 characters, so they aren't interrupted on every
//   keystroke. Without maxLength, showCount does nothing.

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "../../lib/cn";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** Show "120 / 500" under the field. Needs maxLength. */
  showCount?: boolean;
};

// The count starts announcing itself once this many characters or fewer are left.
const ANNOUNCE_WHEN_REMAINING = 20;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    className,
    rows = 4,
    showCount = false,
    maxLength,
    value,
    defaultValue,
    onChange,
    "aria-describedby": describedBy,
    ...rest
  },
  ref,
) {
  const countId = useId();
  const innerRef = useRef<HTMLTextAreaElement | null>(null);

  // register() leaves the field uncontrolled (no value prop), so track its length here.
  const [uncontrolledLength, setUncontrolledLength] = useState(
    () => String(defaultValue ?? "").length,
  );

  // React Hook Form's reset() and setValue() change the DOM value without a change event.
  // Re-read it after each render so the count never goes stale.
  useEffect(() => {
    const node = innerRef.current;
    if (value === undefined && node && node.value.length !== uncontrolledLength) {
      setUncontrolledLength(node.value.length);
    }
  });

  // Keep our own ref and still hand the element to the caller's ref (e.g. register()).
  const setRefs = useCallback(
    (node: HTMLTextAreaElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setUncontrolledLength(event.target.value.length);
    onChange?.(event);
  }

  const length = value !== undefined ? String(value).length : uncontrolledLength;
  const counting = showCount && maxLength !== undefined;
  const nearLimit = counting && maxLength - length <= ANNOUNCE_WHEN_REMAINING;

  const textarea = (
    <textarea
      ref={setRefs}
      rows={rows}
      maxLength={maxLength}
      value={value}
      defaultValue={defaultValue}
      onChange={handleChange}
      aria-describedby={[describedBy, counting ? countId : null].filter(Boolean).join(" ") || undefined}
      className={cn(
        "block min-h-20 w-full resize-y rounded-[var(--radius-md)] px-3 py-2 text-sm",
        "bg-[var(--color-bg)] text-[var(--color-text)] font-[family-name:var(--font-sans)]",
        "border border-[var(--color-border-input)]",
        "placeholder:text-[var(--color-text-muted)]",
        "focus-visible:[outline:var(--focus-ring-width)_solid_var(--color-focus)]",
        "focus-visible:[outline-offset:var(--focus-ring-offset)]",
        "aria-[invalid=true]:border-2 aria-[invalid=true]:border-[var(--color-danger)]",
        "disabled:cursor-not-allowed disabled:bg-[var(--color-surface)] disabled:opacity-60",
        className,
      )}
      {...rest}
    />
  );

  if (!counting) return textarea;

  return (
    <div className="flex w-full flex-col gap-1">
      {textarea}
      {/* Visible as "120 / 500"; screen readers get the same count in words. */}
      <p
        id={countId}
        aria-live={nearLimit ? "polite" : undefined}
        aria-atomic={nearLimit || undefined}
        className="self-end text-sm tabular-nums text-[var(--color-text-muted)]"
      >
        <span aria-hidden="true">
          {length} / {maxLength}
        </span>
        <span className="sr-only">
          {length} of {maxLength} characters used
        </span>
      </p>
    </div>
  );
});
