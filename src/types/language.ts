export type LanguageId =
  | "python"
  | "javascript"
  | "typescript"
  | "go"
  | "rust"
  | "java"
  | "cpp";

export interface Language {
  id: LanguageId;
  label: string;
  monaco: string;
  starter: string;
}

export const LANGUAGES: readonly Language[] = [
  {
    id: "python",
    label: "Python",
    monaco: "python",
    starter: `# Welcome to Quode. Press Ctrl+Enter to run.\n\ndef greet(name: str) -> str:\n    return f"Hello, {name}!"\n\nprint(greet("Duck"))\n`,
  },
  {
    id: "javascript",
    label: "JavaScript",
    monaco: "javascript",
    starter: `// Welcome to Quode. Press Ctrl+Enter to run.\n\nfunction greet(name) {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet("Duck"));\n`,
  },
  {
    id: "typescript",
    label: "TypeScript",
    monaco: "typescript",
    starter: `// Welcome to Quode. Press Ctrl+Enter to run.\n\nfunction greet(name: string): string {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet("Duck"));\n`,
  },
  {
    id: "go",
    label: "Go",
    monaco: "go",
    starter: `package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hello, Duck!")\n}\n`,
  },
  {
    id: "rust",
    label: "Rust",
    monaco: "rust",
    starter: `fn main() {\n    println!("Hello, Duck!");\n}\n`,
  },
  {
    id: "java",
    label: "Java",
    monaco: "java",
    starter: `class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Duck!");\n    }\n}\n`,
  },
  {
    id: "cpp",
    label: "C++",
    monaco: "cpp",
    starter: `#include <iostream>\n\nint main() {\n    std::cout << "Hello, Duck!" << std::endl;\n    return 0;\n}\n`,
  },
] as const;

export const DEFAULT_LANGUAGE: LanguageId = "python";

export function getLanguage(id: LanguageId): Language {
  return LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0];
}
