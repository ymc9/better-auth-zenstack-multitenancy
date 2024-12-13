This is the companion project of the blog post [When Embedded AuthN Meets Embedded AuthZ - Building Multi-Tenant Apps With Better-Auth and ZenStack](https://zenstack.dev/blog/better-auth).

The project is based on better-auth's [Next.js demo project](https://github.com/better-auth/better-auth/tree/main/demo/nextjs).

## Getting Started

1. Copy ".env.example" to ".env" and fill in the variables.
2. Install dependencies

    ```bash
    npm install
    ```

3. Prepare the database

    ```bash
    npx zenstack generate
    npx prisma db push
    ```

4. Start dev server

    ```bash
    npm run dev
    ```
