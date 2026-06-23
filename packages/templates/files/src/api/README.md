# api/

The HTTP layer foundation — the **axios mutator**: a single configured instance + interceptors (auth header, refresh-on-401, error normalization). The generated `sdk/` is wired to use this mutator.

Feature data hooks live in `pages/<feature>/api/`, not here.
