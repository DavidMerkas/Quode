export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  signal: string | null;
  /** Compile-step error, for languages with a compile stage. */
  compileError?: string;
}
