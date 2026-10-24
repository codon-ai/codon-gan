import { GoogleGenAI } from "@google/genai";
import yoctoSpinner from "yocto-spinner";
import { benchmarkPrompt, nextStepsPrompt, optimizePrompt, setupPrompt } from "./prompts";

const client = new GoogleGenAI({});
const spinner = yoctoSpinner({ stream: process.stdout });

for (let i = 1; true; i++) {
    console.log(`Iteration ${i}`);

    spinner.start("Setup (in progress)\n_ Optimize (unstarted)\n_ Benchmark (unstarted)\n_ Next steps (unstarted)");
    let setup = await client.interactions.create({
        agent: "antigravity-preview-09-2026",
        input: setupPrompt,
        environment: {
            type: "remote",
            env: {
                GITHUB_TOKEN: process.env.GITHUB_TOKEN ?? "",
            },
            sources: [
                {
                    type: "repository",
                    source: "https://github.com/codon-ai/civet-optimized",
                    target: "/workspace/civet-optimized"
                }
            ]
        }
    });
    spinner.stop(". Setup (complete)");
    
    spinner.start("Optimize (in progress)\n_ Benchmark (unstarted)\n_ Next steps (unstarted)");
    let optimize = await client.interactions.create({
        agent: "antigravity-preview-09-2026",
        input: optimizePrompt,
        environment: setup.environment_id
    });
    spinner.stop(". Optimize (complete)");
    
    spinner.start("Benchmark (in progress)\n_ Next steps (unstarted)");
    let benchmark = await client.interactions.create({
        agent: "antigravity-preview-09-2026",
        input: benchmarkPrompt,
        environment: setup.environment_id,
        previous_interaction_id: optimize.id
    });
    spinner.stop(". Benchmark (complete)");

    spinner.start("Next steps (in progress)");
    let nextSteps = await client.interactions.create({
        agent: "antigravity-preview-09-2026",
        input: nextStepsPrompt(benchmark.usage?.total_output_tokens as number),
        environment: setup.environment_id,
        previous_interaction_id: benchmark.id
    });
    spinner.stop(". Next steps (complete)");
}
