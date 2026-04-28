import { generate, type Difficulty, type GridSize } from "./sudoku";

self.addEventListener(
  "message",
  (event: MessageEvent<{ size: GridSize; difficulty: Difficulty }>) => {
    const { size, difficulty } = event.data;
    const result = generate(size, difficulty);
    self.postMessage(result);
  }
);
