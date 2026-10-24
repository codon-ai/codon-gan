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

export const optimizePrompt = ``;

export const benchmarkPrompt = ``;

export const nextStepsPrompt = ``;
