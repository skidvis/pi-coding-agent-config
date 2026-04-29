# Todo App with Authentication — Project Contract

**Created**: 2026-04-15
**Developer Level**: Intermediate
**Confidence Score**: 97/100
**Status**: Approved

## What You're Building

A simple but complete todo application with user authentication. Users sign up with an email and password, log in, and manage a personal list of tasks — add them, check them off, and delete them. Each user's todos are private to their account.

This isn't a novel idea, but it's the perfect scope for learning how authentication, a database, and a backend API fit together. By the end, you'll have a working full-stack app you built yourself and a clear mental model for how these pieces connect.

## Goals

1. **Build user authentication** — sign up, log in, log out using email and password
2. **Implement a todo CRUD API** — create, read, update (toggle complete), and delete todos
3. **Persist data** — use a relational database (PostgreSQL) so todos survive server restarts
4. **Protect routes** — only authenticated users can see or modify their own todos
5. **Understand JWTs** — learn how session management works without storing sessions on the server

## Success Criteria

- [ ] A user can sign up with email and password
- [ ] A user can log in and receive a session that persists through page refreshes
- [ ] A logged-in user can add, complete, and delete todos
- [ ] Todos are private — User A cannot see User B's todos
- [ ] Logging out clears the session
- [ ] API returns proper 401 errors for unauthenticated requests

## Scope Boundaries

### In Scope

- User authentication (email + password)
- Todo CRUD operations (create, toggle complete, delete)
- PostgreSQL database with Prisma ORM
- REST API (Express or similar)
- Minimal frontend to demonstrate the app working (basic HTML or React)
- JWT-based session management

### Out of Scope

- OAuth / "Login with Google" — adds complexity; build the basics first
- Password reset / forgot password flow — deferred to a stretch goal
- Todo categories, tags, or priorities — out of scope for v1
- Mobile app — just web for now
- Deployment / hosting — run locally for this project

### Future Ideas

- Add "Login with GitHub" via OAuth
- Password reset email flow
- Todo categories or projects
- Shared todos / collaboration
- Deploy to Railway or Fly.io

## What You'll Learn

- How password hashing works (bcrypt) and why you never store plain passwords
- What a JWT is, how it's signed, and how your server verifies it
- How to design a relational database schema with foreign keys
- How to write a REST API with authenticated routes (middleware pattern)
- How frontend and backend communicate via HTTP and headers
- The request/response lifecycle for an authenticated API call
