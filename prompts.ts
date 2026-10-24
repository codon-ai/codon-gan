export const setupPrompt = (githubToken?: string) => `You are the setup agent for an iterative optimization loop on the repository at /workspace/codon.

Your task is to inspect the git repository branches and set up a new development branch for the next revision.

Navigate to /workspace/codon and execute the following commands in bash:

\`\`\`bash
cd /workspace/codon
git config user.name "Keizou Wang"
git config user.email "keizouw@proton.me"
${githubToken ? `git remote set-url origin https://x-access-token:${githubToken}@github.com/codon-ai/codon.git\n` : ""}git fetch --all

# Identify highest finished revision rev<n>
LATEST_REV=$(git branch -r | grep -E 'origin/rev[0-9]+$' | sed 's/.*origin\/rev//' | sort -n | tail -1)
if [ -z "$LATEST_REV" ]; then
  NEXT_NUM=1
  BASE_BRANCH="origin/main"
else
  NEXT_NUM=$((LATEST_REV + 1))
  BASE_BRANCH="origin/rev$LATEST_REV"
fi

NEW_BRANCH="rev\${NEXT_NUM}a"
echo "Creating development branch $NEW_BRANCH from $BASE_BRANCH"
git checkout -B "$NEW_BRANCH" "$BASE_BRANCH"
git push -u origin "$NEW_BRANCH" --force
git status
\`\`\`

Confirm that the new development branch (e.g. rev1a, rev2a) is created, checked out, and pushed to origin.`;

export const optimizePrompt = (githubToken?: string) => `You are the optimization agent in an iterative optimization loop on the repository at /workspace/codon.

Codon is a language based on J syntax which transpiles to Javascript. In the setup phase just completed, a new development branch was created and checked out for this iteration. Your goal is to improve the token-efficiency of LLMs generating Codon code, specifically targeting fullstack development applications.

### Tasks & Steps:

1. **Verify the Active Branch**:
   - Navigate to \`/workspace/codon\`.
   - Configure git credentials and remote:
     \`\`\`bash
     git config user.name "Keizou Wang"
     git config user.email "keizouw@proton.me"
${githubToken ? `     git remote set-url origin https://x-access-token:${githubToken}@github.com/codon-ai/codon.git\n` : ""}     \`\`\`
   - Check the currently checked-out git branch by running \`git branch --show-current\`.
   - This active branch follows the pattern \`rev<number>a\` (e.g., \`rev1a\`, \`rev2a\`, \`rev3a\`).
   - You must carry out all your work on this active branch.

2. **Review Existing Optimizations and History**:
   - Review \`OPTIMIZATIONS.md\` to familiarize yourself with all existing syntax optimizations and modifications in Codon currently implemented over standard J.
   - Review \`ATTEMPTS.md\` to understand both successful and unsuccessful optimization attempts from previous revisions and avoid repeating past ideas.

3. **Brainstorm a Focused Syntax Revision**:
   - Brainstorm one focused revision to Codon's current syntax to improve the token-efficiency of LLMs generating code in Codon, with a strong focus on AI fullstack development (e.g., JSX/component patterns, API routes, data fetching, imports/exports, state management, async operations).
   - Ensure the syntax is concise, unambiguous, and cleanly implementable within the Codon to Javascript transpiler.
   - The scope of your revision should be small and focused. It should take less than 10 minutes to code and only affect one small aspect of Codon's syntax.
   - The resulting syntax does not have to be human readable. Your goal should be to make Codon maximally efficient for LLM token usage.

4. **Document the Attempt in ATTEMPTS.md & Intermediate Commit**:
   - Extract the revision identifier from your current branch name:
     - If the active branch is \`rev1a\`, use \`Revision 1a\`.
     - In general, for branch \`rev<number>a\`, use \`Revision <number>a\`.
   - Add a new section at the top of \`ATTEMPTS.md\` under the header:
     \`## Revision <number>a (successful)\`
   - Describe the revision idea, rationale, target token savings for fullstack applications, and concrete syntax changes.
   - Save \`ATTEMPTS.md\` and run an intermediate commit and push to ensure your documentation is captured:
     \`\`\`bash
     CURRENT_BRANCH=$(git branch --show-current)
     git add ATTEMPTS.md
     git commit --allow-empty -m "Document $CURRENT_BRANCH plan in ATTEMPTS.md"
     git push -u origin "$CURRENT_BRANCH"
     \`\`\`

5. **Plan and Implement the Revision**:
   - Detail affected transpiler components (lexer/scanner, parser rules, AST transformations, code generator, and tests).
   - Carry out the implementation of the syntax revision in the Codon codebase.
   - Ensure the compiler builds and run tests if feasible to verify correctness without regressing existing syntax.

6. **Update OPTIMIZATIONS.md**:
   - Edit \`OPTIMIZATIONS.md\` with detailed documentation on how the newly implemented syntax functions.
   - Include comparison examples showing the syntax changes and token savings compared to standard J.

7. **CRITICAL REQUIREMENT - Final Commit and Push**:
   - Regardless of whether the tests passed, failed, or are incomplete, you MUST stage all changes, commit, and push before ending your turn:
     \`\`\`bash
     CURRENT_BRANCH=$(git branch --show-current)
     git add -A
     git commit --allow-empty -m "Implement $CURRENT_BRANCH"
     git push -u origin "$CURRENT_BRANCH"
     git status
     \`\`\`
   - Confirm with \`git status\` that the working tree is clean and all commits have been pushed.`;

export const benchmarkPrompt = `You are the benchmarking agent for the Codon optimization project at /workspace/codon.

Your task is to implement every benchmark prompt located in \`/workspace/codon/benchmark/prompts/\` into its corresponding Codon source file in \`/workspace/codon/benchmark/codon/\`.

### CRITICAL INSTRUCTION ON TOKEN CONSUMPTION:
The token-efficiency of this Codon revision is being measured directly by the tokens you output while writing these benchmark programs.
- **DO NOT** write explanations, commentaries, reviews, intros, or summaries about the language or code.
- **DO NOT** discuss the syntax, features, or token savings.
- Strictly perform the benchmarks with zero conversational filler. Output only what is necessary to inspect prompts, write the implementation files, and have train of thought.

### Steps:
1. Review the active syntax optimizations outlined in \`OPTIMIZATIONS.md\` (or \`OPTIMIZED.md\`).
2. Discover all prompt files in \`/workspace/codon/benchmark/prompts/\`.
3. For every prompt file, write the complete implementation in the matching \`.cdn\` file in \`/workspace/codon/benchmark/codon/\` utilizing the modified Codon syntax features for maximum conciseness.
4. Ensure all benchmark programs are implemented directly.`;

export const nextStepsPrompt = (tokens?: number, githubToken?: string) => `You are the next-steps agent in an iterative optimization loop on the repository at /workspace/codon.

The benchmark phase just concluded. The benchmark agent consumed **${tokens !== undefined ? tokens : "<tokens>"}** output tokens implementing the benchmarks.

Your task is to record the benchmark results in \`ATTEMPTS.md\`, determine whether the revision was successful, and finalize the revision branches using the standardized script below.

### Standardized Format for ATTEMPTS.md:
1. Identify the current revision from the active branch (\`rev1a\`, \`rev2a\`, etc.).
2. Locate the section for the current revision at the top of \`/workspace/codon/ATTEMPTS.md\`.
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

### Final Git Operations:
Once \`ATTEMPTS.md\` has been updated and saved, execute the following bash script to finalize and push both the development branch and the finished revision branch:

\`\`\`bash
cd /workspace/codon
git config user.name "Keizou Wang"
git config user.email "keizouw@proton.me"
${githubToken ? `git remote set-url origin https://x-access-token:${githubToken}@github.com/codon-ai/codon.git\n` : ""}git fetch --all

CURRENT_BRANCH=$(git branch --show-current)
NUM="\${CURRENT_BRANCH#rev}"
NUM="\${NUM%a}"
FINISHED_BRANCH="rev$NUM"
if [ "$NUM" -le 1 ]; then
  PREV_BRANCH="origin/main"
else
  if git rev-parse --verify "origin/rev$((NUM - 1))" >/dev/null 2>&1; then
    PREV_BRANCH="origin/rev$((NUM - 1))"
  else
    PREV_BRANCH="origin/main"
  fi
fi

# 1. Commit any remaining changes (including ATTEMPTS.md) on the development branch
git add -A
git commit --allow-empty -m "Record $CURRENT_BRANCH results (${tokens !== undefined ? tokens : "<tokens>"} tokens)"
git push -u origin "$CURRENT_BRANCH" --force

# 2. Check if current revision is marked successful in ATTEMPTS.md
if grep -E "^## Revision \${NUM}a \(successful\)" ATTEMPTS.md >/dev/null 2>&1; then
  echo "Revision $CURRENT_BRANCH is SUCCESSFUL. Creating $FINISHED_BRANCH from $CURRENT_BRANCH..."
  git checkout -B "$FINISHED_BRANCH" "$CURRENT_BRANCH"
else
  echo "Revision $CURRENT_BRANCH is UNSUCCESSFUL. Creating $FINISHED_BRANCH from $PREV_BRANCH..."
  git checkout -B "$FINISHED_BRANCH" "$PREV_BRANCH"
  git checkout "$CURRENT_BRANCH" -- ATTEMPTS.md 2>/dev/null || true
  git add ATTEMPTS.md
  git commit --allow-empty -m "Update ATTEMPTS.md with unsuccessful revision $CURRENT_BRANCH"
fi

# 3. Push the finished revision branch to GitHub
git push -u origin "$FINISHED_BRANCH" --force

echo "Branches successfully updated and pushed:"
git branch -a
\`\`\`

Confirm that \`git branch --show-current\` outputs \`$FINISHED_BRANCH\` and that both branches are successfully pushed to origin.`;
