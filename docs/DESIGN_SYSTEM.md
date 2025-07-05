# Design System

## Colors

### Light Theme
```css
--background: #ffffff;
--foreground: #09090b;
--primary: #2563eb;
--primary-foreground: #ffffff;
--secondary: #f4f4f5;
--muted: #f4f4f5;
--accent: #f4f4f5;
```

### Dark Theme (Default)
```css
--background: #09090b;
--foreground: #fafafa;
--primary: #3b82f6;
--primary-foreground: #ffffff;
--secondary: #27272a;
--muted: #27272a;
--accent: #27272a;
```

## Typography

### Font Families
- **UI**: Inter (system font fallback)
- **Monospace**: JetBrains Mono (code, technical content)
- **Headings**: Inter, font-weight 600-700

### Type Scale
| Size | Usage | Class |
|------|-------|-------|
| xs | Captions, labels | `text-xs` |
| sm | Secondary text | `text-sm` |
| base | Body text | `text-base` |
| lg | Emphasized body | `text-lg` |
| xl | Subheadings | `text-xl` |
| 2xl | Headings | `text-2xl` |
| 3xl | Page titles | `text-3xl` |

## Spacing

4px base unit (Tailwind default):
- `p-4`: 16px
- `p-6`: 24px
- `p-8`: 32px

## Components

### Buttons
```tsx
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
```

### Inputs
```tsx
<Input placeholder="Enter text..." />
<Textarea placeholder="Enter text..." />
```

### Cards
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Subtitle</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

## Icons

Lucide React icons:
```tsx
import { FileText, Settings, User } from 'lucide-react';

<FileText className="h-5 w-5" />
```

## Layout

### Grid System
- Container: `max-w-7xl mx-auto`
- Sidebar: `w-64`
- Main content: `flex-1`

### Responsive Breakpoints
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px

## Animations

```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide in */
@keyframes slideIn {
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

## Dark Mode

Toggle via `ThemeToggle` component. Persists to localStorage.

Tailwind class: `dark:bg-background dark:text-foreground`
