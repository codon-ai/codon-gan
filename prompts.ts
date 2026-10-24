export const setupPrompt = (githubToken?: string) => `You are the setup agent for an iterative optimization loop on the repository at /workspace/civet-optimized.

Your task is to inspect the git repository branches and set up a new development branch for the next revision.

### Steps:
1. Navigate to the repository directory: \`/workspace/civet-optimized\`.
2. Configure git identity and remote:
   \`\`\`bash
   git config user.name "Keizou Wang"
   git config user.email "keizouw@proton.me"
${githubToken ? `   git remote set-url origin https://x-access-token:${githubToken}@github.com/codon-ai/civet-optimized.git\n` : ""}   git fetch --all
   \`\`\`
3. List and inspect all branches (both local and remote) to identify the revision history:
   - Branches follow the naming convention: \`rev1a\`, \`rev1\`, \`rev2a\`, \`rev2\`, etc.
   - \`rev<i>a\` is the development branch for revision \`i\`.
   - \`rev<i>\` is the finished/released revision \`i\`.
   - The larger the integer number, the later the revision.
4. Determine the latest finished revision \`rev<n>\` (the highest numbered branch matching the pattern \`rev<n>\` without the \`a\` suffix).
   - If no \`rev<n>\` branches exist yet on remote, the base branch is \`origin/main\` and the new branch will be \`rev1a\`.
   - If the latest finished branch is \`rev3\`, the new branch will be \`rev4a\` branched from \`origin/rev3\`.
5. Create and switch to the new development branch:
   \`\`\`bash
   # Example: for rev1a
   git checkout -b rev1a origin/main
   # Or if rev1 already exists, for rev2a:
   # git checkout -b rev2a origin/rev1
   \`\`\`
6. Push the new development branch to GitHub:
   \`\`\`bash
   CURRENT_BRANCH=$(git branch --show-current)
   git push -u origin "$CURRENT_BRANCH"
   \`\`\`
7. Confirm the working tree is clean and print a confirmation stating the latest revision found and the new branch created.`;

export const optimizePrompt = (githubToken?: string) => `You are the optimization agent in an iterative optimization loop on the repository at /workspace/civet-optimized.

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
   - The scope of the revision should be small and focused. It should take less than 10 minutes to code and only affect one small aspect of Civet's syntax.

4. **Document the Attempt in ATTEMPTS.md**:
   - Extract the revision identifier from your current branch name:
     - If the active branch is \`rev1a\`, use \`Revision 1a\`.
     - If the active branch is \`rev2a\`, use \`Revision 2a\`.
     - In general, for branch \`rev<number>a\`, use \`Revision <number>a\`.
   - Add a new section at the top of \`ATTEMPTS.md\` under the header:
     \`## Revision <number>a (successful)\`
     (for example: \`## Revision 1a (successful)\` if you are on \`rev1a\`).
   - Describe the revision idea, rationale, target token savings for fullstack applications, and concrete syntax changes.

5. **Plan Implementation**:
   - Create a concrete, step-by-step implementation plan detailing the affected compiler components (lexer/scanner, parser rules, AST transformations, code generator, and tests).

6. **Implement the Revision**:
   - Carry out the implementation of the syntax revision in the Civet codebase.
   - Ensure the compiler builds and run tests to verify correctness without regressing existing syntax.

7. **Update OPTIMIZATIONS.md**:
   - Edit \`OPTIMIZATIONS.md\` with detailed documentation on how the newly implemented syntax functions.
   - Include comparison examples showing the syntax changes and token savings compared to standard Civet.

8. **Commit and Push Revision to Codebase**:
   - Stage and commit all changes across the codebase (compiler modifications, tests, OPTIMIZATIONS.md, and ATTEMPTS.md):
     \`\`\`bash
     git config user.name "Keizou Wang"
     git config user.email "keizouw@proton.me"
     CURRENT_BRANCH=$(git branch --show-current)
     git add -A
     git commit -m "Implement $CURRENT_BRANCH"
${githubToken ? `     git remote set-url origin https://x-access-token:${githubToken}@github.com/codon-ai/civet-optimized.git\n` : ""}     git push -u origin "$CURRENT_BRANCH"
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

export const nextStepsPrompt = (tokens?: number, githubToken?: string) => `You are the next-steps agent in an iterative optimization loop on the repository at /workspace/civet-optimized.

The benchmark phase just concluded. The benchmark agent consumed **${tokens !== undefined ? tokens : "<tokens>"}** output tokens implementing the benchmarks.

Your task is to record the benchmark results in \`ATTEMPTS.md\`, determine whether the revision was successful, and finalize the revision branch using a standardized git procedure.

### Standardized Format for ATTEMPTS.md:
1. Identify the current revision from the active branch (\`rev1a\`, \`rev2a\`, etc.).
2. Locate the section for the current revision at the top of \`/workspace/civet-optimized/ATTEMPTS.md\`.
3. Find the last prior successful attempt in \`ATTEMPTS.md\` (the most recent section with \`(successful)\` in its header) and read its recorded \`Tokens:\` value.
   - If there are no prior successful attempts recorded (e.g., this is Revision 1a), treat this revision as successful.
4. Compare the current tokens (**${tokens !== undefined ? tokens : "<tokens>"}**) against the last successful attempt's tokens:
   - If current tokens < last successful tokens (or if this is the first revision):
     - The revision is **successful**.
     - Set the header line to:
       \`## Revision <number>a (successful)\`
   - If current tokens >= last successful tokens:
     - The revision is **unsuccessful**.
     - Set the header line to:
       \`## Revision <number>a (unsuccessful)\`
5. Immediately under the header line, add the standardized token line:
   \`- **Tokens:** ${tokens !== undefined ? tokens : "<tokens>"}\`

### Standardized Git Methodology:

Navigate to \`/workspace/civet-optimized\` and execute the following standardized steps:

1. **Commit All Changes on the current development branch:**
   \`\`\`bash
   git config user.name "Keizou Wang"
   git config user.email "keizouw@proton.me"
   CURRENT_BRANCH=$(git branch --show-current)
   git add -A
   git commit -m "Record $CURRENT_BRANCH results (${tokens !== undefined ? tokens : "<tokens>"} tokens)"
   \`\`\`

2. **Branch Creation for the finished revision:**
   \`\`\`bash
   CURRENT_BRANCH=$(git branch --show-current)
   NUM="\${CURRENT_BRANCH#rev}"
   NUM="\${NUM%a}"
   FINISHED_BRANCH="rev$NUM"
   if [ "$NUM" -le 1 ]; then
     PREV_BRANCH="main"
   else
     PREV_BRANCH="rev$((NUM - 1))"
   fi

   # If SUCCESSFUL:
   git checkout -b "$FINISHED_BRANCH"

   # If UNSUCCESSFUL (uncomment and run these instead):
   # git checkout -b "$FINISHED_BRANCH" "$PREV_BRANCH"
   # git checkout "$CURRENT_BRANCH" -- ATTEMPTS.md
   # git add ATTEMPTS.md
   # git commit -m "Update ATTEMPTS.md with unsuccessful revision $CURRENT_BRANCH"
   \`\`\`

3. **Push Branches to GitHub:**
   \`\`\`bash
${githubToken ? `   git remote set-url origin https://x-access-token:${githubToken}@github.com/codon-ai/civet-optimized.git\n` : ""}   git push -u origin "$CURRENT_BRANCH"
   git push -u origin "$FINISHED_BRANCH"
   \`\`\`

4. **Verification:**
   - Confirm \`git branch --show-current\` outputs \`$FINISHED_BRANCH\`.
   - Ensure the working tree is clean (\`git status\`).
   - Print a clear summary stating the revision outcome (successful or unsuccessful), token comparison details, and the active branch.`;
