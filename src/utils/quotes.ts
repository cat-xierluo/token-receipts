const QUOTES: string[] = [
  "Thank you for building!",
  "The only way to do great work is to love what you do. — Steve Jobs",
  "First, solve the problem. Then, write the code. — John Johnson",
  "Code is like humor. When you have to explain it, it's bad. — Cory House",
  "Simplicity is the soul of efficiency. — Austin Freeman",
  "Make it work, make it right, make it fast. — Kent Beck",
  "Talk is cheap. Show me the code. — Linus Torvalds",
  "Programs must be written for people to read. — Harold Abelson",
  "The best error message is the one that never shows up. — Thomas Fuchs",
  "Any fool can write code that a computer can understand. Good programmers write code that humans can understand. — Martin Fowler",
  "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away. — Antoine de Saint-Exupery",
  "The computer was born to solve problems that did not exist before. — Bill Gates",
  "In the middle of difficulty lies opportunity. — Albert Einstein",
  "We build our computers the way we build our cities — over time, without a plan, on top of ruins. — Ellen Ullman",
  "The art of programming is the art of organizing complexity. — Edsger Dijkstra",
];

export function getRandomQuote(): string {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}
