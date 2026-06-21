# 09 — Forms System

> Schema-driven forms: **one zod schema → form validation + API payload**. react-hook-form + zod. Accordion multi-section forms (Add Patient pattern). All labels/errors from **i18n** (`19-i18n-and-text-registry.md`). Change-safe: extend via field config, never fork.

## File map
| Path | Export |
|------|--------|
| `src/components/forms/FormSection.tsx` | `FormSection` + `useExpandAll` |
| `src/components/forms/FormGrid.tsx` | `FormGrid` |
| `src/components/forms/FormField.tsx` | `FormField` |
| `src/components/forms/FormFooter.tsx` | `FormFooter` |
| `src/components/forms/AsyncAutocomplete.tsx` | `AsyncAutocomplete` |
| `src/components/forms/fields/FileUploadField.tsx` | controlled |
| `src/components/forms/fields/SignatureField.tsx` | controlled |
| `src/components/forms/fields/OtpField.tsx` | controlled |
| `src/features/patients/addPatient.schema.ts` | zod schema |

## Setup pattern
```tsx
const methods = useForm<PatientForm>({
  resolver: zodResolver(addPatientSchema),
  defaultValues, mode: 'onBlur',
});
return (
  <FormProvider {...methods}>
    <form onSubmit={methods.handleSubmit(onSubmit)}>{/* sections */}</form>
  </FormProvider>
);
```

## `FormField` — wrapper around every input
- Label from i18n; required → red asterisk; inline error **below** field; `aria-describedby` links error (WCAG AA).
```tsx
export function FormField({ name, labelKey, required, children }: FormFieldProps) {
  const { formState: { errors } } = useFormContext();
  const err = get(errors, name);
  const errId = `${name}-error`;
  return (
    <FormControl error={!!err} fullWidth>
      <FormLabel htmlFor={name}>
        {t(labelKey)}{required && <Box component="span" sx={{ color: 'error.main', ml: .5 }}>*</Box>}
      </FormLabel>
      {cloneElement(children, { id: name, 'aria-describedby': err ? errId : undefined })}
      {err && <FormHelperText id={errId}>{t(err.message as string)}</FormHelperText>}
    </FormControl>
  );
}
```
- `err.message` holds an **i18n key** (set in zod), so errors are translated too.

## `FormGrid` — responsive 1→N column field grid
```tsx
<FormGrid columns={{ xs: 1, sm: 2, md: 3 }} gap={2}>
  <FormField name="firstName" labelKey="labels.firstName" required>
    <Controller name="firstName" render={({ field }) => <TextField {...field} />} />
  </FormField>
  {/* … */}
</FormGrid>
```
- Wraps MUI `Grid`/CSS grid; field count agnostic. 8px spacing scale (`gap` × 8).

## `FormSection` accordion + Expand/Collapse All
```tsx
const { allOpen, toggleAll, isOpen, setOpen } = useExpandAll(SECTION_IDS);

<Button onClick={toggleAll}>
  {t(allOpen ? 'buttons.collapseAll' : 'buttons.expandAll')}
</Button>

<FormSection id="demographics" titleKey="titles.demographics"
  open={isOpen('demographics')} onToggle={setOpen}>
  <FormGrid columns={{ xs: 1, md: 2 }}>{/* fields */}</FormGrid>
</FormSection>
```
- `useExpandAll` keeps a `Set<string>` of open ids; `toggleAll` flips all. Section header shows error badge if any child field invalid.

## Conditional fields
```tsx
const hasInsurance = useWatch({ name: 'hasInsurance' });
{hasInsurance && (
  <FormField name="insuranceId" labelKey="labels.insuranceId" required>…</FormField>
)}
```
- Use `useWatch` (not `watch`) to scope re-renders. Conditional zod via `.superRefine`/`.refine`.

## Field arrays (`useFieldArray`)
```tsx
const { fields, append, remove } = useFieldArray({ name: 'medications' });
{fields.map((f, i) => (
  <Stack key={f.id} direction="row">
    <FormField name={`medications.${i}.name`} labelKey="labels.medication">…</FormField>
    <IconButton onClick={() => remove(i)} aria-label={t('buttons.remove')}><Trash2/></IconButton>
  </Stack>
))}
<Button onClick={() => append({ name: '' })}>{t('buttons.addMedication')}</Button>
```

## Sticky `FormFooter`
```tsx
<FormFooter
  onCancel={onCancel}                    // buttons.cancel
  submitLabelKey="buttons.savePatient"
  submitting={methods.formState.isSubmitting}
/>
```
- `position: sticky; bottom: 0` + top border + blurred bg; always visible on long accordion forms. Submit disabled while submitting/invalid.

## `AsyncAutocomplete` (TanStack Query, debounced, paginated)
Used for pharmacy/lab/provider, ICD-10, patient search.
```tsx
export function AsyncAutocomplete<T>({ name, labelKey, fetchOptions, getLabel }: Props<T>) {
  const [input, setInput] = useState('');
  const term = useDebounce(input, 300);
  const { data, isFetching, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['autocomplete', name, term],
    queryFn: ({ pageParam }) => fetchOptions(term, pageParam),
    getNextPageParam: (l) => l.nextCursor, initialPageParam: undefined,
    enabled: term.length >= 2,
  });
  const options = data?.pages.flatMap((p) => p.items) ?? [];
  return (
    <Controller name={name} render={({ field }) => (
      <Autocomplete
        options={options} getOptionLabel={getLabel} loading={isFetching}
        onInputChange={(_, v) => setInput(v)}
        onChange={(_, v) => field.onChange(v)}
        ListboxProps={{ onScroll: (e) => nearBottom(e) && hasNextPage && fetchNextPage() }}
        renderInput={(p) => <TextField {...p} label={t(labelKey)} />}
      />)} />
  );
}
```
- Debounced (300ms), `enabled` after 2 chars, paginated on scroll. Same `getNextPageParam` discipline as `useInfiniteList`.

## Specialized controlled fields
| Field | Notes |
|-------|-------|
| `FileUploadField` | drag/drop + button; stores `File[]`; validates type/size in zod; progress; remove chips |
| `SignatureField` | canvas → dataURL on `field.onChange`; clear button; `aria-label` from i18n |
| `OtpField` | N single-char boxes (tabbable nav, paste-split); emits joined string |

All wrap `Controller` so they live in the same `useForm` state and validation.

## One schema → form + payload (Add Patient)
```ts
export const addPatientSchema = z.object({
  // section: demographics
  firstName: z.string().min(1, 'validation.required'),
  lastName:  z.string().min(1, 'validation.required'),
  dob:       z.string().min(1, 'validation.required'),
  // section: contact
  email:     z.string().email('validation.email'),
  phone:     z.string().regex(PHONE, 'validation.phone'),
  // section: insurance (conditional)
  hasInsurance: z.boolean().default(false),
  insuranceId:  z.string().optional(),
  // section: documents
  documents:    z.array(z.instanceof(File)).max(10, 'validation.maxFiles'),
  medications:  z.array(z.object({ name: z.string().min(1, 'validation.required') })),
}).superRefine((v, ctx) => {
  if (v.hasInsurance && !v.insuranceId)
    ctx.addIssue({ path: ['insuranceId'], code: 'custom', message: 'validation.required' });
});
export type PatientForm = z.infer<typeof addPatientSchema>;
```
- zod messages are **i18n keys** → `FormField` runs them through `t()`.
- `onSubmit(values)` maps `PatientForm` → API DTO (Orval hook). Single source of truth for shape + rules.

### Add-Patient layout shape
| Section (accordion) | Fields |
|---------------------|--------|
| Demographics | first/last name, DOB, gender, MRN (read-only) |
| Contact | email, phone, address (FormGrid 2-col) |
| Insurance | `hasInsurance` toggle → conditional provider/id |
| Documents | `FileUploadField` + `medications` field array |
- Header: Expand/Collapse All. Footer: sticky `FormFooter` (Cancel / Save Patient).

## Do / Don't
- ✅ One zod schema drives validation + types + payload; error messages are i18n keys.
- ✅ Every field via `FormField` (label/asterisk/error/aria wired once).
- ❌ No literal labels/errors, no per-screen form forks, no inline regex without i18n message key.
