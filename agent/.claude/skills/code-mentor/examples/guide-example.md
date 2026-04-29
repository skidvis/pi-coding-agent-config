# Todo App with Authentication — Phase 1: Project Setup & Database

**Contract**: ./contract-example.md
**Phase**: 1 of 3
**Estimated time**: 2-3 hours
**Difficulty**: Intermediate

## What You're Building in This Phase

In Phase 1, you'll set up the project structure, connect to a PostgreSQL database, and define the data model for users and todos. By the end, you won't have a running app yet — but you'll have the foundation everything else is built on.

**At the end of this phase, you'll have:**

- A Node.js project with Express and Prisma installed and configured
- A running PostgreSQL database (local)
- A schema with `User` and `Todo` tables with a proper relationship
- Prisma migrations applied and a working database connection you can verify

## What You'll Learn

- How to structure a Node.js backend project
- What an ORM is and why Prisma is a good choice here
- How to define a database schema and run migrations
- How to model a one-to-many relationship (one user has many todos)

## Prerequisites

**Tools and software:**

- Node.js v18+ installed (`node --version` to check)
- PostgreSQL installed and running locally — [install guide](https://www.postgresql.org/download/)
- A code editor (VS Code recommended)
- Basic comfort with the terminal

**Knowledge:**

- Comfortable with JavaScript (functions, async/await, modules)
- Know what a database and SQL table are, even if you haven't used them much

---

## Background: What is an ORM?

When your app needs to talk to a database, you have two choices: write raw SQL queries, or use an ORM (Object-Relational Mapper). An ORM lets you work with your database using the same language as the rest of your code — in our case, JavaScript/TypeScript.

Prisma is the ORM we're using. You define your database tables in a schema file, and Prisma generates a type-safe client that lets you do things like `prisma.user.findMany()` instead of `SELECT * FROM users`.

The schema file also drives **migrations** — SQL scripts Prisma generates and runs to create or update your tables. You'll write the schema; Prisma writes the SQL.

---

## Steps

---

### Step 1: Create your project folder and initialize Node

Create a new folder and initialize a Node.js project.

```bash
mkdir todo-app
cd todo-app
npm init -y
```

The `-y` flag accepts all defaults so npm doesn't ask you a series of setup questions.

**Verify**: You should see a `package.json` file in your folder. Run `cat package.json` — it should show your project name and a `"main": "index.js"` entry.

---

### Step 2: Install dependencies

Install Express (your web server), Prisma (your ORM), and a few utilities.

```bash
npm install express
npm install --save-dev prisma typescript ts-node @types/express @types/node
npm install @prisma/client
```

A note on what each does:
- **express** — the HTTP server framework
- **prisma** — the CLI tool for generating migrations and your schema
- **@prisma/client** — the runtime library your app uses to query the database
- **typescript + ts-node** — lets us write TypeScript and run it without a build step during development

**Verify**: Your `package.json` should now have `express` and `@prisma/client` in `dependencies`, and the others in `devDependencies`.

---

### Step 3: Initialize TypeScript

```bash
npx tsc --init
```

This creates a `tsconfig.json` with TypeScript compiler settings. Open it and make sure `"strict": true` is uncommented — this catches type errors early.

**Verify**: A `tsconfig.json` file exists in your project root.

---

### Step 4: Initialize Prisma

```bash
npx prisma init --datasource-provider postgresql
```

**Verify**: Two things were created:
1. A `prisma/` folder with a `schema.prisma` file
2. A `.env` file with a `DATABASE_URL` variable

Open `.env` — you'll see a placeholder connection string. You'll update this in the next step.

---

### Step 5: Create your PostgreSQL database and update the connection string

Open your terminal and create a new PostgreSQL database:

```bash
createdb todoapp
```

Now update your `.env` file with the correct connection string. Replace the placeholder with:

```
DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/todoapp"
```

Replace `YOUR_USERNAME` with your system username. On Mac, this is usually the same as your login name. On Linux, it may be `postgres`.

**Verify**: Test the connection by running:

```bash
npx prisma db pull
```

If the connection works, Prisma will print `The database is already in sync with the Prisma schema.` (because it's empty). If you see a connection error, double-check your username and that PostgreSQL is running (`pg_isready` to check).

---

### Step 6: Define your schema

Open `prisma/schema.prisma` and replace the contents with this:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           Int      @id @default(autoincrement())
  email        String   @unique          // Emails must be unique — no two accounts with same email
  passwordHash String                    // We store a hash, never the plain password
  createdAt    DateTime @default(now())
  todos        Todo[]                    // A User has many Todos (one-to-many relationship)
}

model Todo {
  id        Int      @id @default(autoincrement())
  text      String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
  userId    Int                          // Foreign key — which user owns this todo
  user      User     @relation(fields: [userId], references: [id])
}
```

The `todos Todo[]` on `User` and `user User` on `Todo` define the relationship — Prisma uses this to let you do things like `user.todos` to get all todos for a user.

**Verify**: The file saves without errors. Prisma schema syntax errors will show up as red underlines if you have the Prisma VS Code extension installed (recommended).

---

### Step 7: Run your first migration

```bash
npx prisma migrate dev --name init
```

This command:
1. Generates a SQL migration file in `prisma/migrations/`
2. Applies it to your database (creating the `User` and `Todo` tables)
3. Regenerates the Prisma Client so it knows about your schema

**Verify**: You should see output ending in `Your database is now in sync with your Prisma schema.`

Run this to double-check your tables exist:

```bash
npx prisma studio
```

A browser window should open showing your `User` and `Todo` tables (both empty). Close it with Ctrl+C in the terminal.

---

## Common Problems

**`createdb: command not found`**

*Why this happens:* PostgreSQL's CLI tools aren't in your PATH.
*Fix:* On Mac with Homebrew: `brew link postgresql`. On Linux: make sure `postgresql-client` is installed. Alternatively, open `psql` and run `CREATE DATABASE todoapp;` directly.

---

**`Error: P1001: Can't reach database server`**

*Why this happens:* PostgreSQL isn't running.
*Fix:* Start it with `brew services start postgresql` (Mac/Homebrew) or `sudo service postgresql start` (Linux). Then re-run the failing command.

---

**`Error: Authentication failed for user "..."`**

*Why this happens:* The username in your `DATABASE_URL` doesn't match a PostgreSQL user.
*Fix:* Run `psql -l` to see which databases exist (it'll show you the owner username). Use that username in your `DATABASE_URL`.

---

**TypeScript errors after installing packages**

*Why this happens:* TypeScript's type definitions weren't found.
*Fix:* Make sure you installed `@types/express` and `@types/node`. Run `npm install --save-dev @types/express @types/node` again if unsure.

---

## Checkpoint

Before moving to Phase 2, confirm all of these:

- [ ] `package.json` exists with all dependencies listed
- [ ] `prisma/schema.prisma` contains both `User` and `Todo` models
- [ ] Running `npx prisma migrate status` shows migrations as applied
- [ ] `npx prisma studio` opens and shows your two empty tables
- [ ] No errors when running `npx tsc --noEmit` (type check passes)

If any aren't true, re-read the relevant steps or check the Common Problems section above before continuing.

---

## What's Next

Phase 2 covers user authentication: building the sign-up and log-in API endpoints, hashing passwords with bcrypt, and issuing JWTs. By the end of Phase 2, you'll have a working auth system you can test with a tool like Postman or curl.
