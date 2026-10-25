import { GoogleGenAI } from "@google/genai";
import yoctoSpinner from "yocto-spinner";
import { benchmarkPrompt, nextStepsPrompt, optimizePrompt, setupPrompt } from "./prompts";

const client = new GoogleGenAI({});
const spinner = yoctoSpinner({ stream: process.stdout });

const stepNames = ["Setup", "Optimize", "Benchmark", "Next steps"] as const;

function formatStepDetail(step: any): string {
    if (!step) return "";
    if (step.type === "function_call") {
        const name = step.name || "tool";
        const args = step.arguments || {};
        if (name === "bash" || name === "run_command") {
            const cmd = (args.command || args.CommandLine || args.cmd || "").trim();
            const firstLine = cmd.split("\n")[0] || "";
            const shortCmd = firstLine.length > 35 ? firstLine.slice(0, 32) + "..." : firstLine;
            return shortCmd ? `running ${shortCmd}` : "running command...";
        }
        if (name === "edit_file" || name === "write_file") {
            const path = (args.path || args.Path || args.filename || "").trim();
            const basename = path.split("/").pop() || "";
            return basename ? `editing ${basename}` : "editing file...";
        }
        if (name === "read_file") {
            const path = (args.path || args.Path || args.filename || "").trim();
            const basename = path.split("/").pop() || "";
            return basename ? `reading ${basename}` : "reading file...";
        }
        return `${name}...`;
    }
    if (step.type === "thought") {
        return "thinking...";
    }
    if (step.type === "code_execution_call") {
        return "executing code...";
    }
    return "";
}

function getStepLines(currentIndex: number, detail?: string): string {
    const lines: string[] = [];
    for (let idx = 0; idx < stepNames.length; idx++) {
        const name = stepNames[idx];
        if (idx === currentIndex) {
            const suffix = detail ? ` (in progress: ${detail})` : " (in progress)";
            lines.push(`${name}${suffix}`);
        } else if (idx > currentIndex) {
            lines.push(`_ ${name} (unstarted)`);
        }
    }
    return lines.join("\n");
}

async function runStep(stepIndex: number, createParams: any) {
    spinner.start(getStepLines(stepIndex));

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
                spinner.text = getStepLines(stepIndex, detail);
            }
        } else if (event.event_type === "interaction.completed") {
            completedInteraction = event.interaction;
            if (event.interaction?.usage) {
                lastUsage = event.interaction.usage;
            }
        }
    }

    if (!completedInteraction) {
        throw new Error(`Interaction for ${stepNames[stepIndex]} did not complete successfully.`);
    }

    if (completedInteraction.status === "failed") {
        throw new Error(`Interaction for ${stepNames[stepIndex]} failed: ${JSON.stringify(completedInteraction.errors || completedInteraction.output_text)}`);
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

    spinner.stop(`. ${stepNames[stepIndex]} (complete)`);
    return completedInteraction;
}

async function cleanupEnvironments() {
    try {
        const existing = await client.environments.list();
        for (const env of existing.environments ?? []) {
            await client.environments.delete(env.id).catch(() => {});
        }
    } catch {}
}

process.on("SIGINT", async () => {
    spinner.stop();
    console.log("\nInterrupted (SIGINT). Cleaning up remote environments...");
    await cleanupEnvironments();
    process.exit(130);
});

process.on("SIGTERM", async () => {
    spinner.stop();
    await cleanupEnvironments();
    process.exit(143);
});

// Clean up any stale environments from previous runs
await cleanupEnvironments();

for (let i = 1; true; i++) {
    console.log(`Iteration ${i}`);

    let setup: any;
    try {
        setup = await runStep(0, {
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

        let optimize = await runStep(1, {
            agent: "antigravity-preview-09-2026",
            input: optimizePrompt(process.env.GITHUB_TOKEN),
            environment: setup.environment_id,
            previous_interaction_id: setup.id,
        });

        let benchmark = await runStep(2, {
            agent: "antigravity-preview-09-2026",
            input: benchmarkPrompt,
            environment: setup.environment_id,
            previous_interaction_id: optimize.id,
        });

        const benchmarkTokens = benchmark.usage?.total_output_tokens ?? 0;

        let _nextSteps = await runStep(3, {
            agent: "antigravity-preview-09-2026",
            input: nextStepsPrompt(benchmarkTokens, process.env.GITHUB_TOKEN),
            environment: setup.environment_id,
            previous_interaction_id: benchmark.id,
        });
    } catch (error) {
        spinner.stop();
        throw error;
    } finally {
        if (setup?.environment_id) {
            await client.environments.delete(setup.environment_id).catch(() => {});
        } else {
            await cleanupEnvironments();
        }
    }
}
