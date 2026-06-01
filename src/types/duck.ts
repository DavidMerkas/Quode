export interface ChatMessage {
  id: string;
  role: "user" | "duck";
  content: string;
  createdAt: number;
}
