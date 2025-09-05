---
applyTo: "**"
---

# GitHub Copilot Custom Instructions

## 🧠 Project Context

This repository utilizes the following technologies:

- **Next.js** v15.3 with the App Router
- **React** v19
- **Tailwind CSS** v4
- **Shadcn/UI** (latest version)
- **Supabase** (latest version)
- **Prisma** ORM
- **TypeScript** with strict type checking

## ✅ General Guidelines

- **Framework Usage**:

  - Use the **Next.js App Router** exclusively; avoid the Pages Router.
  - Implement **React Server Components (RSC)** where appropriate.
  - Utilize **`next/head`** for managing metadata and SEO.

- **Styling**:

  - Employ **Tailwind CSS v4** with the `@theme inline` directive.
  - Use **Shadcn/UI** components, ensuring compatibility with Tailwind v4 and React 19.
  - Implement responsive design using Tailwind's mobile-first approach.

- **State Management**:

  - Prefer **React's Context API** or **Zustand** for state management.
  - Minimize the use of `useState` and `useEffect`; leverage server-side data fetching when possible.

- **Data Handling**:

  - Use **Prisma** for database interactions.
  - Integrate **Supabase** for authentication and real-time features.
  - Validate data using **Zod** schemas.

- **Code Quality**:
  - Write all code in **TypeScript**, favoring interfaces over types.
  - Avoid using enums; prefer union types or constants.
  - Ensure all code is **secure**, **performant**, and **free of deprecated practices**.

## 🧱 File and Directory Structure

- **Components**: Place reusable components in the `components/` directory.
- **Hooks**: Store custom hooks in the `hooks/` directory.
- **Utilities**: Keep utility functions in the `lib/` directory.
- **Styles**: Manage global styles in `styles/globals.css`.

## 🧪 Testing and Validation

- Write unit tests using **Jest** and **React Testing Library**.
- Validate forms and inputs with **Zod**.
- Ensure accessibility compliance using **axe-core**.

## 🚀 Performance Optimization

- Implement **lazy loading** for non-critical components.
- Optimize images using **Next.js Image Optimization**.
- Utilize **Incremental Static Regeneration (ISR)** for dynamic content.

## 📦 Package Management

- Use **pnpm** for package management.
- Maintain up-to-date dependencies, ensuring compatibility with React 19 and Tailwind v4.

## 📝 Documentation

- Document all components and utilities using **JSDoc** comments.
- Maintain a comprehensive `README.md` outlining project setup and usage.

## ⚠️ Avoid

- Using deprecated APIs or practices.
- Writing code without proper type annotations.
- Implementing features without corresponding tests.
