// Node version guard (Orval 8 needs Node >= 22.18). Runs on `preinstall`.
// ES5 only — must parse on ancient Node before it can error out.
var MIN = [22, 18, 0];
var cur = process.versions.node.split(".").map(Number);
var ok = cur[0] > MIN[0] || (cur[0] === MIN[0] && cur[1] >= MIN[1]);
if (!ok) {
  console.error(
    "\n[super-react] Node " +
      MIN.join(".") +
      "+ required (Orval 8). You have " +
      process.versions.node +
      ". Run: nvm use\n",
  );
  process.exit(1);
}
