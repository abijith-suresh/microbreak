import { generate, type Difficulty, type GridSize } from "./sudoku";

interface SudokuGeneratorResponse {
  puzzle: (number | null)[][];
  solution: (number | null)[][];
}

export async function requestSudokuPuzzle(size: GridSize, difficulty: Difficulty) {
  if (typeof Worker === "undefined") {
    return generate(size, difficulty);
  }

  const worker = new Worker(new URL("./sudoku.worker.ts", import.meta.url), { type: "module" });

  try {
    return await new Promise<SudokuGeneratorResponse>((resolve, reject) => {
      worker.addEventListener(
        "message",
        (event: MessageEvent<SudokuGeneratorResponse>) => {
          resolve(event.data);
        },
        { once: true }
      );
      worker.addEventListener(
        "error",
        (error) => {
          reject(error);
        },
        { once: true }
      );
      worker.postMessage({ size, difficulty });
    });
  } catch {
    return generate(size, difficulty);
  } finally {
    worker.terminate();
  }
}
