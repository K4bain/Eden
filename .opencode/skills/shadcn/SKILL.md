---
name: shadcn
description: Manages shadcn components — adding, searching, fixing, styling, and composing UI. Applies when working with shadcn/ui, component registries, or any project with a components.json file.
allowed-tools: Bash(npx shadcn@latest *), Bash(pnpm dlx shadcn@latest *), Bash(bunx --bun shadcn@latest *)
---

# shadcn/ui

Components are added as source code to the project via the CLI.

## Principles

1. **Use existing components first.** Check registries before writing custom UI.
2. **Compose, don't reinvent.** Settings = Tabs + Card + form controls. Dashboard = Sidebar + Card + Chart + Table.
3. **Use built-in variants before custom styles.** `variant="outline"`, `size="sm"`, etc.
4. **Use semantic colors.** `bg-primary`, `text-muted-foreground` — never raw values like `bg-blue-500`.

## Critical Rules

### Styling
- **`className` for layout, not styling.** Never override component colors/typography.
- **No `space-x-*` or `space-y-*`.** Use `flex` with `gap-*`.
- **Use `size-*` when width and height are equal.** `size-10` not `w-10 h-10`.
- **Use `truncate` shorthand.** Not `overflow-hidden text-ellipsis whitespace-nowrap`.
- **No manual `dark:` overrides.** Use semantic tokens.
- **Use `cn()` for conditional classes.**
- **No manual `z-index` on overlay components.**

### Forms
- **Forms use `FieldGroup` + `Field`.** Never raw `div` with `space-y-*`.
- **`InputGroup` uses `InputGroupInput`/`InputGroupTextarea`.**
- **Option sets (2–7 choices) use `ToggleGroup`.**
- **`FieldSet` + `FieldLegend` for grouping checkboxes/radios.**
- **Field validation: `data-invalid` on Field, `aria-invalid` on control.**

### Component Structure
- **Items always inside their Group.** `SelectItem` → `SelectGroup`.
- **Dialog, Sheet, Drawer always need a Title.** `DialogTitle` required for a11y.
- **Use full Card composition.** `CardHeader`/`CardTitle`/`CardContent`/`CardFooter`.
- **`TabsTrigger` must be inside `TabsList`.**
- **`Avatar` always needs `AvatarFallback`.**

### Icons
- **Icons in Button use `data-icon`.** `data-icon="inline-start"` or `data-icon="inline-end"`.
- **No sizing classes on icons inside components.**

## Component Selection

| Need | Use |
|------|-----|
| Button/action | `Button` with variant |
| Form inputs | `Input`, `Select`, `Combobox`, `Switch`, `Checkbox`, `RadioGroup` |
| Toggle 2–5 options | `ToggleGroup` + `ToggleGroupItem` |
| Data display | `Table`, `Card`, `Badge`, `Avatar` |
| Navigation | `Sidebar`, `NavigationMenu`, `Breadcrumb`, `Tabs` |
| Overlays | `Dialog`, `Sheet`, `Drawer`, `AlertDialog` |
| Feedback | `toast`, `Alert`, `Progress`, `Skeleton`, `Spinner` |
| Command palette | `Command` inside `Dialog` |
| Charts | `Chart` (wraps Recharts) |
| Layout | `Card`, `Separator`, `Resizable`, `ScrollArea`, `Accordion` |
| Empty states | `Empty` |
| Menus | `DropdownMenu`, `ContextMenu`, `Menubar` |
| Tooltips | `Tooltip`, `HoverCard`, `Popover` |

## CLI Commands

```bash
# Create new project
npx shadcn@latest init --name my-app --preset base-nova

# Add components
npx shadcn@latest add button card dialog
npx shadcn@latest add --all

# Search registries
npx shadcn@latest search @shadcn -q "sidebar"

# Get docs
npx shadcn@latest docs button dialog select

# Preview changes
npx shadcn@latest add button --dry-run
npx shadcn@latest add button --diff button.tsx

# Apply preset
npx shadcn@latest apply a2r6bw
npx shadcn@latest apply a2r6bw --only theme,font
```

## Key Patterns

```tsx
// Form layout: FieldGroup + Field
<FieldGroup>
  <Field>
    <FieldLabel htmlFor="email">Email</FieldLabel>
    <Input id="email" />
  </Field>
</FieldGroup>

// Spacing: gap-*, not space-y-*
<div className="flex flex-col gap-4">  // correct
<div className="space-y-4">           // wrong

// Equal dimensions: size-*, not w-* h-*
<Avatar className="size-10">   // correct
<Avatar className="w-10 h-10"> // wrong
```
