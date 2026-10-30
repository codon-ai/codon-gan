import { GoogleGenAI } from "@google/genai";

// Run once to determine JS benchmark

export const prompt = `You are the Javascript benchmarking agent for the Codon optimization project at /workspace/codon.

Your task is to implement each benchmark prompt located in \`/workspace/codon/benchmark/\` in a corresponding Javascript source file.

### CRITICAL INSTRUCTION ON TOKEN CONSUMPTION:
The token-efficiency of Javascript is being measured directly by the tokens you output while writing these benchmark programs.
- **DO NOT** write explanations, commentaries, reviews, intros, or summaries about the language or code.
- **DO NOT** discuss the syntax, features, or token savings.
- Strictly perform the benchmarks with zero conversational filler. Output only what is necessary to inspect prompts, write the implementation files, and have train of thought.

### STRICT FAST-LOOP EXECUTION RULES:
- **DO NOT install any packages or dependencies** (e.g., do NOT run npm install, bun add, yarn add, apt, etc.).
- **DO NOT execute, run, test, or verify the scripts afterwards** (e.g., do NOT run node, bun, or any test commands).
- The philosophy is simply to write the code. Do not spend time running or verifying.
- Once the benchmark implementation file is written, finish immediately.

### Steps:
1. Discover all 100 benchmark prompts in the markdown files in \`/workspace/codon/benchmark/\`.
2. For every single prompt, write the complete implementation in a matching \`.js\` file in \`/workspace/codon/benchmark/\` with maximum conciseness.
3. Finish immediately without executing or installing anything.`;

function formatStepDetail(step: any): string {
    if (!step) return "";
    if (step.type === "function_call") {
        const name = step.name || "tool";
        const args = step.arguments || {};
        if (name === "bash" || name === "run_command") {
            const cmd = (args.command || args.CommandLine || args.cmd || "").trim();
            const firstLine = cmd.split("\n")[0] || "";
            const shortCmd = firstLine.length > 50 ? firstLine.slice(0, 47) + "..." : firstLine;
            return `[bash] ${shortCmd || "running command"}`;
        }
        if (name === "edit_file" || name === "write_file") {
            const path = (args.path || args.Path || args.filename || "").trim();
            const basename = path.split("/").pop() || "";
            return `[write_file] ${basename || path || "file"}`;
        }
        if (name === "read_file") {
            const path = (args.path || args.Path || args.filename || "").trim();
            const basename = path.split("/").pop() || "";
            return `[read_file] ${basename || path || "file"}`;
        }
        return `[tool] ${name}`;
    }
    if (step.type === "thought") {
        return "[thought] thinking...";
    }
    if (step.type === "code_execution_call") {
        return "[code_execution] executing code...";
    }
    return `[step] ${step.type || "active"}`;
}

function log(msg: string) {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] ${msg}`);
}

const client = new GoogleGenAI({});

async function cleanupEnvironments() {
    try {
        const existing = await client.environments.list();
        for (const env of existing.environments ?? []) {
            log(`Cleaning up environment ${env.id}...`);
            await client.environments.delete(env.id).catch(() => {});
        }
    } catch {}
}

process.on("SIGINT", async () => {
    log("Interrupted. Cleaning up remote environments...");
    await cleanupEnvironments();
    process.exit(130);
});

process.on("SIGTERM", async () => {
    await cleanupEnvironments();
    process.exit(143);
});

// Clean up any stale environments from previous runs before starting
await cleanupEnvironments();

log("Starting JavaScript benchmark interaction...");

const response = await client.interactions.create({
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
    stream: true,
});

log("Interaction stream connected. Awaiting steps...");

let usage: any;
let completedInteraction: any = null;

try {
    for await (const event of response as any) {
        if ("usage" in event && event.usage) {
            usage = event.usage;
        }

        if (event.event_type === "step.start") {
            const detail = formatStepDetail(event.step);
            if (detail) {
                log(detail);
            }
        } else if (event.event_type === "step.delta") {
            if (event.delta?.type === "text" && event.delta.text) {
                process.stdout.write(event.delta.text);
            }
        } else if (event.event_type === "interaction.completed") {
            completedInteraction = event.interaction;
            if (event.interaction?.usage) {
                usage = event.interaction.usage;
            }
            log("Interaction completed.");
        }
    }

    if (completedInteraction?.id && !completedInteraction.environment_id) {
        const full = await client.interactions.get(completedInteraction.id).catch(() => null);
        if (full?.environment_id) {
            completedInteraction.environment_id = full.environment_id;
        }
        if (!usage && full?.usage) {
            usage = full.usage;
        }
    }
} finally {
    const envId = completedInteraction?.environment_id;
    if (envId) {
        log(`Cleaning up environment ${envId}...`);
        await client.environments.delete(envId).catch(() => {});
    } else {
        await cleanupEnvironments();
    }
}

log(`JS usage: ${usage?.total_output_tokens ?? "unknown"} tokens`);