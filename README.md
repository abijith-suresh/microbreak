# Microbreak

Puzzle games that make you think, for the minutes while your coding agents work.

Play at [microbreak.vercel.app](https://microbreak.vercel.app).

## Games

- [Sudoku](https://microbreak.vercel.app/sudoku): 4×4, 6×6, or 9×9 boards
- [Wordle](https://microbreak.vercel.app/wordle): 4, 5, or 6 letter words
- [Minesweeper](https://microbreak.vercel.app/minesweeper): presets sized for phones and desktops

Drop a game the moment your agent needs you. It saves as you play, so you pick up exactly where
you left off, even after closing the tab. Play as long as you like.

Everything stays in your browser. There are no accounts, ads, tracking, streaks, notifications,
or leaderboards.

## Run it locally

You need Bun and Node 24. Exact versions are in `mise.toml`.

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
