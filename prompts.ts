export const setupPrompt = `You are the setup agent for an iterative optimization loop on the repository at /workspace/civet-optimized.

Your task is to inspect the git repository branches and set up a new development branch for the next revision.

### Steps:
1. Navigate to the repository directory: \`/workspace/civet-optimized\`.
2. Fetch all remote branches: \`git fetch --all\`.
3. List and inspect all branches (both local and remote) to identify the revision history:
   - Branches follow the naming convention: \`rev<i>a\`, \`rev<i>\`, \`rev<i+1>a\`, \`rev<i+1>\`, etc.
   - \`rev<i>a\` is the development branch for revision \`i\`.
   - \`rev<i>\` is the finished/released revision \`i\`.
   - The larger the integer number, the later the revision.
4. Determine the latest finished revision \`rev<n>\` (the highest numbered branch matching the pattern \`rev<n>\` without the \`a\` suffix).
5. Create and switch to a new development branch named \`rev<n+1>a\` branched directly off the latest finished revision \`rev<n>\`.
   - Example: If the latest finished branch is \`rev3\`, create and check out \`rev4a\` from \`rev3\`.
   - If no \`rev<n>\` branches exist yet, start with \`rev1a\` branched from the default branch (e.g. \`main\` or \`master\`).
6. Confirm the working tree is clean and that \`rev<n+1>a\` is the active branch.
7. Print a confirmation stating the latest revision found (\`rev<n>\`) and the newly created branch (\`rev<n+1>a\`).`;

export const optimizePrompt = `You are the optimization agent in an iterative optimization loop on the repository at /workspace/civet-optimized.

The repository is a fork of Civet's source code. In the setup phase just completed, a new development branch was created and checked out for this iteration. Your goal is to improve the token-efficiency of LLMs generating Civet code, specifically targeting fullstack development applications.

### Tasks & Steps:

1. **Identify the Active Branch**:
   - Navigate to \`/workspace/civet-optimized\`.
   - Check the currently checked-out git branch by running \`git branch --show-current\`.
   - This active branch was created in the setup phase and follows the pattern \`rev<number>a\` (e.g., \`rev1a\`, \`rev2a\`, \`rev3a\`).
   - You must carry out all your work on this active branch.

2. **Review Existing Optimizations and History**:
   - Review \`OPTIMIZATIONS.md\` to familiarize yourself with all existing syntax optimizations and modifications currently implemented over standard Civet.
   - Review \`ATTEMPTS.md\` to understand both successful and unsuccessful optimization attempts from previous revisions and avoid repeating past ideas.

3. **Brainstorm a Focused Syntax Revision**:
   - Brainstorm one focused revision to Civet's syntax to improve the token-efficiency of LLMs generating code in Civet, with a strong focus on fullstack development (e.g., JSX/component patterns, API routes, data fetching, imports/exports, state management, async operations).
   - Ensure the syntax is concise, unambiguous, and cleanly implementable within the Civet compiler.

4. **Document the Attempt in ATTEMPTS.md**:
   - Extract the revision identifier from your current branch name:
     - If the active branch is \`rev1a\`, use \`Revision 1a\`.
     - If the active branch is \`rev2a\`, use \`Revision 2a\`.
     - In general, for branch \`rev<number>a\`, use \`Revision <number>\`.
   - Add a new section at the top of \`ATTEMPTS.md\` under the header:
     \`## Revision <number>\`
     (for example: \`## Revision 2\` if you are on \`rev2a\`).
   - Describe the revision idea, rationale, target token savings for fullstack applications, and concrete syntax changes.

5. **Plan Implementation**:
   - Create a concrete, step-by-step implementation plan detailing the affected compiler components (lexer/scanner, parser rules, AST transformations, code generator, and tests).

6. **Implement the Revision**:
   - Carry out the implementation of the syntax revision in the Civet codebase.
   - Ensure the compiler builds and run tests to verify correctness without regressing existing syntax.

7. **Update OPTIMIZATIONS.md**:
   - Edit \`OPTIMIZATIONS.md\` with detailed documentation on how the newly implemented syntax functions.
   - Include comparison examples showing the syntax changes and token savings compared to standard Civet.

8. **Commit Revision to Codebase**:
   - Stage and commit all changes across the codebase (compiler modifications, tests, OPTIMIZATIONS.md, and ATTEMPTS.md):
     \`\`\`bash
     git add -A
     git commit -m "Implement Revision <number>a"
     \`\`\`
   - Verify with \`git status\` that the working tree is clean and ready for benchmarking.`;

export const benchmarkPrompt = `You are the benchmarking agent for the Civet optimization project at /workspace/civet-optimized.

Your task is to implement every benchmark prompt located in \`/workspace/civet-optimized/benchmark/prompts/\` into its corresponding Civet source file in \`/workspace/civet-optimized/benchmark/civet/\`.

### CRITICAL INSTRUCTION ON TOKEN CONSUMPTION:
The token-efficiency of the modified Civet language is being measured directly by the tokens you output while writing these benchmark programs.
- **DO NOT** write explanations, commentaries, reviews, intros, or summaries about the language or code.
- **DO NOT** discuss the syntax, features, or token savings.
- Strictly perform the benchmarks with zero conversational filler. Output only what is necessary to inspect prompts, write the implementation files, and have train of thought.

### Steps:
1. Review the active syntax optimizations outlined in \`OPTIMIZATIONS.md\` (or \`OPTIMIZED.md\`).
2. Discover all prompt files in \`/workspace/civet-optimized/benchmark/prompts/\`.
3. For every prompt file, write the complete implementation in the matching \`.civet\` file in \`/workspace/civet-optimized/benchmark/civet/\` utilizing the modified Civet syntax features for maximum conciseness.
4. Ensure all benchmark programs are implemented directly.`;

export const nextStepsPrompt = (tokens?: number) => `You are the next-steps agent in an iterative optimization loop on the repository at /workspace/civet-optimized.

The benchmark phase just concluded. The benchmark agent consumed **${tokens !== undefined ? tokens : "<tokens>"}** output tokens implementing the benchmarks.

Your task is to record the benchmark results in \`ATTEMPTS.md\`, determine whether the revision was successful, and finalize the revision branch \`rev<n>\` using a standardized git procedure.

### Standardized Format for ATTEMPTS.md:
1. Identify the current revision number \`<n>\` from the active branch (\`rev<n>a\`, e.g., if on \`rev2a\`, \`<n>\` is \`2\`).
2. Locate the section for the current revision at the top of \`/workspace/civet-optimized/ATTEMPTS.md\`.
3. Find the last prior successful attempt in \`ATTEMPTS.md\` (the most recent section with \`(successful)\` in its header) and read its recorded \`Tokens:\` value.
   - If there are no prior successful attempts recorded (e.g., this is Revision 1), treat this revision as successful.
4. Compare the current tokens (**${tokens !== undefined ? tokens : "<tokens>"}**) against the last successful attempt's tokens:
   - If current tokens < last successful tokens (or if this is the first revision):
     - The revision is **successful**.
     - Set the header line to:
       \`## Revision <n> (successful)\`
   - If current tokens >= last successful tokens:
     - The revision is **unsuccessful**.
     - Set the header line to:
       \`## Revision <n> (unsuccessful)\`
5. Immediately under the header line, add the standardized token line:
   \`- **Tokens:** ${tokens !== undefined ? tokens : "<tokens>"}\`

### Standardized Git Methodology:

Navigate to \`/workspace/civet-optimized\` and execute the following standardized steps:

1. **Commit All Changes on the current development branch (\`rev<n>a\`):**
   \`\`\`bash
   git add -A
   git commit -m "Record revision <n>a results (${tokens !== undefined ? tokens : "<tokens>"} tokens)"
   \`\`\`

2. **Branch Creation for \`rev<n>\`:**

   - **If SUCCESSFUL:**
     Create and check out \`rev<n>\` directly from \`rev<n>a\`:
     \`\`\`bash
     git checkout -b rev<n>
     \`\`\`

   - **If UNSUCCESSFUL (Revert code changes while keeping ATTEMPTS.md):**
     Create and check out \`rev<n>\` branched off \`rev<n-1>\` (or \`main\`/\`master\` if \`n=1\`) to revert the unsuccessful code changes:
     \`\`\`bash
     git checkout -b rev<n> rev<n-1>
     \`\`\`
     Bring \`ATTEMPTS.md\` from \`rev<n>a\` into \`rev<n>\` and commit it:
     \`\`\`bash
     git checkout rev<n>a -- ATTEMPTS.md
     git add ATTEMPTS.md
     git commit -m "Update ATTEMPTS.md with unsuccessful revision <n>a"
     \`\`\`

3. **Verification:**
   - Confirm \`git branch --show-current\` outputs \`rev<n>\`.
   - Ensure the working tree is clean (\`git status\`).
   - Print a clear summary stating the revision outcome (successful or unsuccessful), token comparison details, and the active branch.`;

