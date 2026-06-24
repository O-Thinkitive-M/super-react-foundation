// Repairs common OpenAPI spec defects at generation time so the generated SDK
// compiles. Never edit generated output — fix it here, with a comment on WHY.
// CommonJS: Orval loads transformers via require().
module.exports = (spec) => {
  // 1) Strip illegal properties off http/bearer security schemes (some generators
  //    emit `name`/`in`, which are invalid for these scheme types).
  const schemes = (spec.components && spec.components.securitySchemes) || {};
  for (const s of Object.values(schemes)) {
    delete s.name;
    delete s.in;
  }

  // 2) Inject path params present in the URL but missing from `parameters`,
  //    otherwise the generated hook lacks the required argument.
  for (const [path, item] of Object.entries(spec.paths || {})) {
    const inUrl = [...path.matchAll(/{(\w+)}/g)].map((m) => m[1]);
    for (const op of Object.values(item)) {
      if (typeof op !== "object" || !op || !op.responses) continue;
      op.parameters = op.parameters || [];
      const declared = new Set(op.parameters.map((p) => p.name));
      for (const name of inUrl) {
        if (!declared.has(name)) {
          op.parameters.push({ name, in: "path", required: true, schema: { type: "string" } });
        }
      }
    }
  }

  return spec;
};
