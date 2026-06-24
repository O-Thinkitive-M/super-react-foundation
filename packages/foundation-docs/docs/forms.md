# Forms System

> Foundation doc — copied into every project's `project-setup/forms.md`.
> **The architecture is fixed; the schemas/fields change per project.** Schema-driven forms: **one zod schema → validation + types + API payload.** react-hook-form + zod. All labels/errors from **i18n**. Extend via field config, never fork.
> This is a **project-variable** doc: the actual form schemas and field sets come from the project's **UI / SRS / MOM**. The primitives and patterns below are the fixed baseline.

## Stack & file map

`react-hook-form` + `zod` + `@hookform/resolvers` (added when forms are built — see `tech-stack.md`).

| Path | Export |
|---|---|
| `src/components/forms/FormField.tsx` | `FormField` (label/asterisk/error/aria wrapper) |
| `src/components/forms/FormGrid.tsx` | `FormGrid` (responsive 1→N column grid) |
| `src/components/forms/FormSection.tsx` | `FormSection` + `useExpandAll` (accordion) |
| `src/components/forms/FormFooter.tsx` | `FormFooter` (sticky submit/cancel) |
| `src/components/forms/AsyncAutocomplete.tsx` | debounced, paginated picker |
| `src/features/<feature>/<name>.schema.ts` | the zod schema (project-specific) |

## Setup pattern

```tsx
const methods = useForm<ItemForm>({ resolver: zodResolver(itemSchema), defaultValues, mode: "onBlur" });
return (
  <FormProvider {...methods}>
    <form onSubmit={methods.handleSubmit(onSubmit)}>{/* sections */}</form>
  </FormProvider>
);
```

## `FormField` — wrapper around every input

- Label from i18n; required → red asterisk + `aria-required`; inline error **below** the field; `aria-describedby` links the error (WCAG AA — see `accessibility.md`).

```tsx
export function FormField({ name, labelKey, required, children }: FormFieldProps) {
  const { formState: { errors } } = useFormContext();
  const err = get(errors, name);
  const errId = `${name}-error`;
  return (
    <FormControl error={!!err} fullWidth>
      <FormLabel htmlFor={name}>
        {t(labelKey)}{required && <Box component="span" sx={{ color: "error.main", ml: 0.5 }}>*</Box>}
      </FormLabel>
      {cloneElement(children, { id: name, "aria-describedby": err ? errId : undefined })}
      {err && <FormHelperText id={errId}>{t(err.message as string)}</FormHelperText>}
    </FormControl>
  );
}
```

- `err.message` holds an **i18n key** (set in the zod schema) → errors are translated too.

## `FormGrid` — responsive field grid

```tsx
<FormGrid columns={{ xs: 1, sm: 2, md: 3 }} gap={2}>
  <FormField name="firstName" labelKey="labels.firstName" required>
    <Controller name="firstName" render={({ field }) => <TextField {...field} />} />
  </FormField>
</FormGrid>
```

## `FormSection` accordion + Expand/Collapse All

```tsx
const { allOpen, toggleAll, isOpen, setOpen } = useExpandAll(SECTION_IDS);
<Button onClick={toggleAll}>{t(allOpen ? "buttons.collapseAll" : "buttons.expandAll")}</Button>
<FormSection id="contact" titleKey="titles.contact" open={isOpen("contact")} onToggle={setOpen}>
  <FormGrid columns={{ xs: 1, md: 2 }}>{/* fields */}</FormGrid>
</FormSection>
```

- Section header shows an error badge if any child field is invalid.

## Conditional fields & field arrays

```tsx
const hasX = useWatch({ name: "hasX" });                 // useWatch scopes re-renders
{hasX && <FormField name="xDetail" labelKey="labels.xDetail" required>…</FormField>}

const { fields, append, remove } = useFieldArray({ name: "items" });
```

- Conditional validation via zod `.superRefine`/`.refine`.

## Sticky `FormFooter`

```tsx
<FormFooter onCancel={onCancel} submitLabelKey="buttons.save" submitting={methods.formState.isSubmitting} />
```

- `position: sticky; bottom: 0`; submit disabled while submitting/invalid; always visible on long forms.

## `AsyncAutocomplete`

Debounced (300ms), enabled after 2 chars, paginated on scroll — same `getNextPageParam` discipline as `useInfiniteList` (see `data-display.md`). Wraps `Controller` so it lives in the same form state.

## Specialized controlled fields

| Field | Notes |
|---|---|
| `FileUploadField` | drag/drop + button; `File[]`; type/size validated in zod; progress; remove chips |
| `SignatureField` | canvas → dataURL on `field.onChange`; clear button; `aria-label` from i18n |
| `OtpField` | N single-char boxes (tabbable, paste-split); emits joined string |

All wrap `Controller` so they share one `useForm` state + validation.

## One schema → form + payload

```ts
export const itemSchema = z.object({
  firstName: z.string().min(1, "validation.required"),
  email:     z.string().email("validation.email"),
  hasX:      z.boolean().default(false),
  xDetail:   z.string().optional(),
}).superRefine((v, ctx) => {
  if (v.hasX && !v.xDetail)
    ctx.addIssue({ path: ["xDetail"], code: "custom", message: "validation.required" });
});
export type ItemForm = z.infer<typeof itemSchema>;
```

- zod messages are **i18n keys** → `FormField` runs them through `t()`.
- `onSubmit(values)` maps `ItemForm` → the API DTO. Single source of truth for shape + rules.

## Do / Don't

- ✅ One zod schema drives validation + types + payload; error messages are i18n keys.
- ✅ Every field via `FormField` (label/asterisk/error/aria wired once).
- ❌ No literal labels/errors, no per-screen form forks, no inline regex without an i18n message key.

## Adapt per project (from UI / SRS / MOM)

- Define each form's **zod schema** and **field/section layout** from the screen spec — this is the part that changes per project.
- Add the specialized fields (upload/signature/OTP) only where the spec requires them.
- The `FormField`/`FormGrid`/`FormSection`/`FormFooter` primitives and the "one schema" rule stay fixed.
