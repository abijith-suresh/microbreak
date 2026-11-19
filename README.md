# Microbreak

Short puzzle games for the minutes you spend waiting on a build, a test run, or a deploy.
Play one round, then get back to work.

Play at [microbreak.vercel.app](https://microbreak.vercel.app).

## Games

- [Sudoku](https://microbreak.vercel.app/sudoku): 4×4, 6×6, or 9×9 boards
- [Wordle](https://microbreak.vercel.app/wordle): 4, 5, or 6 letter words
- [Minesweeper](https://microbreak.vercel.app/minesweeper): presets sized for phones and desktops
- [2048](https://microbreak.vercel.app/2048): swipe or use the arrow keys

A round takes a few minutes. There are no ads, accounts, tracking, streaks,
notifications, or leaderboards. Your progress stays in your browser.

## Run it locally

You need Bun and Node 22. Exact versions are in `mise.toml`.

```bash
git clone https://github.com/abijith-suresh/microbreak.git
cd microbreak
bun install
bun run dev
```

To contribute, read [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. Fonts (DM Sans, Instrument Serif) are under the SIL Open Font License; see
[public/fonts/](public/fonts/).
