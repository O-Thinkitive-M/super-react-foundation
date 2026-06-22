import type { FeatureState, ProjectState } from "@super-react-foundation/core";

function featureStatus(f: FeatureState): string {
  if (f.ui && f.api && f.tests) return "done";
  if (f.plan && (f.ui || f.api)) return "building";
  if (f.plan) return "planned";
  return "no plan";
}

function recommendNext(state: ProjectState): string {
  const analyzed =
    Object.keys(state.features).length > 0 || state.foundation.complete;
  if (!analyzed) return "/analyze-project";
  if (!state.foundation.complete) return "/setup-project-foundation";
  const unfinished = Object.entries(state.features).find(
    ([, f]) => featureStatus(f) !== "done",
  );
  if (unfinished) return `/build-feature ${unfinished[0]}`;
  return "/review-project-architecture";
}

export function renderDashboard(state: ProjectState): string {
  const analyzed =
    Object.keys(state.features).length > 0 || state.foundation.complete;
  const lines: string[] = [];
  lines.push("================ super-react-foundation ================");
  lines.push("  guided React engineering");
  lines.push("--------------------------------------------");
  lines.push("PROJECT HEALTH");
  lines.push(`  Requirements analyzed: ${analyzed ? "yes" : "no"}`);
  lines.push(`  Foundation: ${state.foundation.complete ? "ready" : "not set up"}`);
  lines.push(`  Agent: ${state.agent}`);
  lines.push("");
  lines.push("FEATURES");
  const features = Object.entries(state.features);
  if (features.length === 0) {
    lines.push("  (none yet)");
  } else {
    for (const [name, f] of features) {
      lines.push(`  ${name} — ${featureStatus(f)}`);
    }
  }
  lines.push("");
  lines.push(`-> Recommended next step:  ${recommendNext(state)}`);
  lines.push("============================================");
  return lines.join("\n") + "\n";
}
