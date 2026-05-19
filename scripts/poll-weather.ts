import { runPoll } from "../src/lib/run-poll";

const dryRun = process.argv.includes("--dry-run");
const forceWindow = process.argv.includes("--force-window");

async function main() {
  const result = await runPoll({ dryRun, forceWindow });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
