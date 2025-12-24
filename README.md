# Agent 9 - Vertical Image Stack Component

A Next.js project with TypeScript, Tailwind CSS, and shadcn/ui integration featuring a beautiful vertical image stack component.

## Project Structure

This project follows the shadcn/ui structure:
- `/components/ui` - UI components (shadcn convention)
- `/app` - Next.js app directory
- `/lib` - Utility functions

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the component in action.

## Component Location

The `VerticalImageStack` component is located at:
- `/components/ui/vertical-image-stack.tsx`

## Why `/components/ui`?

The `/components/ui` folder is the standard location for shadcn/ui components. This structure:
- Follows shadcn/ui conventions
- Makes components easily discoverable
- Allows shadcn CLI to manage components properly
- Maintains consistency with the shadcn ecosystem

## Features

- Vertical image stack with 3D perspective
- Drag to navigate
- Mouse wheel support
- Navigation dots
- Smooth animations with Framer Motion
- Responsive design
- Dark mode support (via shadcn theme)

## Dependencies

- **next** - React framework
- **framer-motion** - Animation library
- **lucide-react** - Icon library
- **tailwindcss** - Styling
- **typescript** - Type safety

