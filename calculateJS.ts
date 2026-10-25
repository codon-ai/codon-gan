import { GoogleGenAI } from "@google/genai";

// Run once to determine JS benchmark

export const prompt = `You are the Javascript benchmarking agent for the Codon optimization project at /workspace/codon.

Your task is to implement every single benchmark prompt located in \`/workspace/codon/benchmark/\` in a corresponding Javascript source file.

### CRITICAL INSTRUCTION ON TOKEN CONSUMPTION:
The token-efficiency of Javascript is being measured directly by the tokens you output while writing these benchmark programs.
- **DO NOT** write explanations, commentaries, reviews, intros, or summaries about the language or code.
- **DO NOT** discuss the syntax, features, or token savings.
- Strictly perform the benchmarks with zero conversational filler. Output only what is necessary to inspect prompts, write the implementation files, and have train of thought.

### Steps:
1. Discover all prompts in the markdown files in \`/workspace/codon/benchmark/\`.
2. For every prompt file, write the complete implementation in a matching \`.js\` file.
3. Ensure all 50 benchmark programs are implemented correctly.`;

let client = new GoogleGenAI({});
let response = await client.interactions.create({
    agent: "antigravity-preview-09-2026",
    input: prompt,
    environment: {
        type: "remote",
        sources: [
            {
                type: "repository",
                source: "https://github.com/codon-ai/codon",
                target: "/workspace/codon",
            },
        ],
    },
});

console.log("JS usage:", response.usage?.total_output_tokens);