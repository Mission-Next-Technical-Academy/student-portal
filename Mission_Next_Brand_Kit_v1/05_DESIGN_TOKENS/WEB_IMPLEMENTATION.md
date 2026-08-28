# Mission Next Web Implementation Notes

Use `mission-next-tokens.css` as the default source for web CSS variables. The JSON and JS files provide the same system for design tools, React, and component libraries.

## Recommended loading order
1. Brand fonts when your site license/source permits them: Roboto, Open Sans, JetBrains Mono.
2. `mission-next-tokens.css`
3. Site/component CSS that consumes the tokens.

## Example
```css
.mn-button-primary {
  background: var(--mn-signal-orange);
  color: var(--mn-white);
  border-radius: var(--mn-radius-pill);
  font-family: var(--mn-font-heading);
  font-weight: 700;
}

.mn-card {
  background: var(--mn-white);
  border: 1px solid var(--mn-light-slate);
  border-radius: var(--mn-radius-md);
  box-shadow: var(--mn-shadow-card);
}
```

## Accessibility
Mission Blue, Mission Blue Dark, Steel Gray, Ink, and White are the preferred small-text colors in their approved high-contrast combinations. Signal Orange, Electric Blue, and Cyber Teal should generally be accents, non-text elements, or large display text on white.

## Program accents
- Mission Next: IT Help Desk & Career Accelerator -> Electric Blue
- Mission Next: Security Operation Center (SOC) Analyst -> Cyber Teal
- Mission Next: Foundations of AI & Machine Learning -> Cyber Teal, with selective Signal Orange for differentiation

Program accents never replace Mission Blue as the master institutional color.
