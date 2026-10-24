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
     - In general, for branch \`rev<number>a\`, use \`Revision <number>a\`.
   - Add a new section at the top of \`ATTEMPTS.md\` under the header:
     \`## Revision <number>a (successful)\`
     (for example: \`## Revision 2a (successful)\` if you are on \`rev2a\`).
   - Describe the revision idea, rationale, target token savings for fullstack applications, and concrete syntax changes.

5. **Plan Implementation**:
   - Create a concrete, step-by-step implementation plan detailing the affected compiler components (lexer/scanner, parser rules, AST transformations, code generator, and tests).

6. **Implement the Revision**:
   - Carry out the implementation of the syntax revision in the Civet codebase.
   - Ensure the compiler builds and run tests to verify correctness without regressing existing syntax.

7. **Update OPTIMIZATIONS.md**:
   - Edit \`OPTIMIZATIONS.md\` with detailed documentation on how the newly implemented syntax functions.
   - Include comparison examples showing the syntax changes and token savings compared to standard Civet.`;

export const benchmarkPrompt = ``;

export const nextStepsPrompt = ``;
