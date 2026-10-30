import { GoogleGenAI } from "@google/genai";

// Run once to determine JS benchmark

export const setupPrompt = (githubToken?: string) => {
    const token = githubToken || process.env.GITHUB_TOKEN;
    return `You are the setup agent for the Javascript benchmarking on the repository at /workspace/codon.

Your task is to configure git and set up a new development branch called "js-benchmarking" from origin/main.

Navigate to /workspace/codon and execute the following commands in bash:

\`\`\`bash
cd /workspace/codon

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
${token ? `git remote set-url origin https://x-access-token:${token}@github.com/codon-ai/codon.git\n` : ""}git fetch --all

git checkout -B js-benchmarking origin/main
git push -u origin js-benchmarking --force
git status
\`\`\`

Confirm that the new development branch "js-benchmarking" is created, checked out, and pushed to origin.`;
};

export const benchmarkPrompt = `You are the Javascript benchmarking agent for the Codon optimization project at /workspace/codon.

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

export const prompt = benchmarkPrompt;

export const pushPrompt = (githubToken?: string) => {
    const token = githubToken || process.env.GITHUB_TOKEN;
    return `You are the push agent for the Javascript benchmarking on the repository at /workspace/codon.

The benchmark phase just concluded. Your task is to stage all newly created Javascript benchmark files, commit them, and push the "js-benchmarking" branch to GitHub.

Navigate to /workspace/codon and execute the following commands in bash:

\`\`\`bash
cd /workspace/codon

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
${token ? `git remote set-url origin https://x-access-token:${token}@github.com/codon-ai/codon.git\n` : ""}git fetch --all

git add -A
git commit --allow-empty -m "Implement JavaScript benchmarks"
git push -u origin js-benchmarking --force
git status
\`\`\`

Confirm that all benchmark files are committed and that the "js-benchmarking" branch is successfully pushed to origin.`;
};

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
let activeEnvironmentId: string | null = null;

async function cleanupEnvironments() {
    try {
        const existing = await client.environments.list();
        for (const env of existing.environments ?? []) {
            log(`Cleaning up environment ${env.id}...`);
            await client.environments.delete(env.id).catch(() => {});
        }
    } catch {}
}

async function runStep(name: string, createParams: any) {
    log(`Starting ${name}...`);

    const stream = await client.interactions.create({
        ...createParams,
        stream: true,
    });

    let completedInteraction: any = null;
    let lastUsage: any = undefined;

    for await (const event of stream as any) {
        if ("usage" in event && event.usage) {
            lastUsage = event.usage;
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
                lastUsage = event.interaction.usage;
            }
            log(`Completed ${name}.`);
        }
    }

    if (!completedInteraction) {
        throw new Error(`Interaction for ${name} did not complete successfully.`);
    }

    if (completedInteraction.status === "failed") {
        throw new Error(`Interaction for ${name} failed: ${JSON.stringify(completedInteraction.errors || completedInteraction.output_text)}`);
    }

    if (!completedInteraction.usage && lastUsage) {
        completedInteraction.usage = lastUsage;
    }

    if (!completedInteraction.environment_id && createParams.environment && typeof createParams.environment === "string") {
        completedInteraction.environment_id = createParams.environment;
    }

    if (!completedInteraction.environment_id) {
        const full = await client.interactions.get(completedInteraction.id).catch(() => null);
        if (full?.environment_id) {
            completedInteraction.environment_id = full.environment_id;
        }
        if (!completedInteraction.usage && full?.usage) {
            completedInteraction.usage = full.usage;
        }
    }

    if (completedInteraction.environment_id) {
        activeEnvironmentId = completedInteraction.environment_id;
    }

    return completedInteraction;
}

process.on("SIGINT", async () => {
    log("Interrupted. Cleaning up remote environments...");
    if (activeEnvironmentId) {
        await client.environments.delete(activeEnvironmentId).catch(() => {});
    }
    await cleanupEnvironments();
    process.exit(130);
});

process.on("SIGTERM", async () => {
    if (activeEnvironmentId) {
        await client.environments.delete(activeEnvironmentId).catch(() => {});
    }
    await cleanupEnvironments();
    process.exit(143);
});

// Clean up any stale environments from previous runs before starting
await cleanupEnvironments();

let setup: any = null;

try {
    setup = await runStep("Setup (js-benchmarking branch)", {
        agent: "antigravity-preview-09-2026",
        input: setupPrompt(process.env.GITHUB_TOKEN),
        environment: {
            type: "remote",
            env: {
                GITHUB_TOKEN: process.env.GITHUB_TOKEN ?? "",
            },
            sources: [
                {
                    type: "repository",
                    source: "https://github.com/codon-ai/codon",
                    target: "/workspace/codon",
                },
            ],
        },
    });

    const benchmark = await runStep("Benchmark", {
        agent: "antigravity-preview-09-2026",
        input: benchmarkPrompt,
        environment: setup.environment_id,
        previous_interaction_id: setup.id,
    });

    const benchmarkTokens = benchmark.usage?.total_output_tokens ?? 0;

    await runStep("Push to GitHub", {
        agent: "antigravity-preview-09-2026",
        input: pushPrompt(process.env.GITHUB_TOKEN),
        environment: setup.environment_id,
        previous_interaction_id: benchmark.id,
    });

    log(`JS usage: ${benchmarkTokens} tokens`);
} finally {
    const envId = setup?.environment_id || activeEnvironmentId;
    if (envId) {
        log(`Cleaning up environment ${envId}...`);
        await client.environments.delete(envId).catch(() => {});
    } else {
        await cleanupEnvironments();
    }
}
