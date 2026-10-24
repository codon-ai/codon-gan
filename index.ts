import { GoogleGenAI } from "@google/genai";
import { benchmarkPrompt, nextStepsPrompt, optimizePrompt, setupPrompt } from "./prompts";

const client = new GoogleGenAI({});

for (let i = 1; true; i++) {
    let setup = await client.interactions.create({
        agent: "antigravity-preview-09-2026",
        input: setupPrompt,
        environment: {
            type: "remote",
            sources: [
                {
                    type: "repository",
                    source: "https://github.com/codon-ai/civet-optimized",
                    target: "/workspace/civet-optimized"
                }
            ]
        }
    });
    
    let optimize = await client.interactions.create({
        agent: "antigravity-preview-09-2026",
        input: optimizePrompt,
        environment: setup.environment_id,
        previous_interaction_id: setup.id,
    });
    
    let benchmark = await client.interactions.create({
        agent: "antigravity-preview-09-2026",
        input: benchmarkPrompt,
        environment: setup.environment_id,
        previous_interaction_id: optimize.id,
    });

    let nextSteps = await client.interactions.create({
        agent: "antigravity-preview-09-2026",
        input: nextStepsPrompt,
        environment: setup.environment_id,
        previous_interaction_id: benchmark.id,
    });
}