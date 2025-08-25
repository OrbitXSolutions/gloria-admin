This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

rowyda.rashedy@gmail.com
### Fixing Server Actions origin mismatch in Codespaces / remote containers

If you see an error like:

`x-forwarded-host header ... does not match origin header ... Invalid Server Actions request.`

This happens because the browser Origin might be `localhost:3000` while the forwarded host is something like `<workspace>-3000.app.github.dev`.

We address this by configuring `serverActions.allowedOrigins` in `next.config.ts` to include common localhost values and `*.app.github.dev`. If you still experience issues:

1. Copy `.env.example` to `.env.local` (or edit your existing env) and optionally set `NEXT_PUBLIC_SITE_HOST="<workspace>-3000.app.github.dev"`.
2. (Optional) For very permissive dev troubleshooting set `ALLOW_ALL_ORIGINS=1` then restart the dev server. Do NOT use this in production.
3. Restart the dev server: `pnpm dev`.

In production, replace the development allow‑list with your real domain(s) only.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
