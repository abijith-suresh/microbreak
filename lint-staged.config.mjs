export default {
  "*.{js,mjs,cjs,ts,tsx,astro}": ["bunx eslint --fix", "bunx prettier --write"],
  "*.{json,md,css,yml,yaml}": ["bunx prettier --write"],
};
