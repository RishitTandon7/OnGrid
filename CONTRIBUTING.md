# Contributing to OnGrid

Thank you for your interest in contributing to OnGrid! 🚀 We are excited to build the future of 3D geofenced attendance systems with you.

By contributing to this project, you agree to abide by our Code of Conduct and help maintain a welcoming, inclusive, and collaborative environment.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Submitting Pull Requests](#submitting-pull-requests)
- [Local Development Setup](#local-development-setup)
- [Style Guide & Best Practices](#style-guide--best-practices)
  - [Commit Message Conventions](#commit-message-conventions)
  - [Branch Naming Conventions](#branch-naming-conventions)
  - [TypeScript & Code Standards](#typescript--code-standards)
- [Contact & Support](#contact--support)

---

## Code of Conduct

We expect all contributors and maintainers to treat each other with respect, kindness, and professionalism. Be welcoming, collaborative, and constructive in discussions, code reviews, and issue tracking.

---

## How Can I Contribute?

### Reporting Bugs

If you find a bug:
1. Search the [Issues](https://github.com/rishittandon7/ongrid/issues) tab to see if it has already been reported.
2. If it hasn't, open a new issue using our **Bug Report** template.
3. Provide a clear description, reproduction steps, expected vs. actual behavior, and screenshots or logs if possible.

### Suggesting Features

We welcome new feature requests!
1. Check the [Issues](https://github.com/rishittandon7/ongrid/issues) tab and our [Roadmap](README.md#roadmap) to see if it is already planned.
2. Open a new issue using our **Feature Request** template.
3. Explain why the feature is needed, how it should work, and any potential design mockups or examples.

### Submitting Pull Requests

1. **Find an Issue**: Look for issues labeled `good first issue` or `help wanted` to get started. Let us know in the comments if you want to work on it!
2. **Fork the Repository**: Create your own copy of the repository on GitHub.
3. **Clone & Setup**: Follow the [Local Development Setup](#local-development-setup) instructions below.
4. **Create a Branch**: Create a feature/bugfix branch from `main` using our [branch naming conventions](#branch-naming-conventions).
5. **Implement Changes**: Write clean, commented, and self-documenting code. Keep your commits small and focused.
6. **Verify & Test**: Ensure the application compiles without errors (`npm run build`) and behaves correctly.
7. **Submit the PR**: Open a Pull Request against the `main` branch. Complete the PR template checklist.
8. **Code Review**: Address any feedback or changes requested by maintainers during the review process.

---

## Local Development Setup

Follow these steps to set up the codebase on your local machine:

1. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ongrid.git
   cd ongrid
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the sample environment file:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in the required variables (e.g., PostgreSQL connection string, NextAuth secret, etc.).

4. **Initialize the Database**:
   Apply migrations to your local database:
   ```bash
   npx prisma migrate dev
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## Style Guide & Best Practices

### Commit Message Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This helps us generate clean, automated changelogs:

- `feat: <description>` — A new feature
- `fix: <description>` — A bug fix
- `docs: <description>` — Documentation-only changes
- `style: <description>` — Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc.)
- `refactor: <description>` — A code change that neither fixes a bug nor adds a feature
- `perf: <description>` — A code change that improves performance
- `test: <description>` — Adding missing tests or correcting existing tests
- `chore: <description>` — Changes to the build process, auxiliary tools, or libraries

*Example:* `feat: add barometric pressure calibration for classrooms`

### Branch Naming Conventions

Use lowercase, hyphen-separated names prefixed by the category of the change:

- `feat/feature-name`
- `fix/bug-description`
- `docs/update-readme`
- `refactor/clean-sensors`
- `chore/update-dependencies`

### TypeScript & Code Standards

- **Strict Type Checking**: Avoid the use of `any` types. Provide interfaces or types for all objects, props, and API payloads.
- **Component Design**: Break down large components into smaller, reusable UI components. Use clean, Tailwind CSS for styling.
- **API Design**: Return consistent JSON structures from `/api/*` endpoints. Use proper HTTP response codes (200, 201, 400, 401, 403, 500).
- **Prisma Transactions**: Use transactions where multi-row mutations are interdependent.
- **Sensor Safety**: Always verify sensor presence before attempting to instantiate them (e.g., `if (typeof window !== 'undefined' && 'AbsolutePressureSensor' in window)`).

---

## Contact & Support

If you have questions, feel free to:
- Open a discussion in our [GitHub Discussions](https://github.com/rishittandon7/ongrid/discussions) section.
- Join our [Discord Server](https://discord.gg/your-invite) and ask in the `#development` channel.
- Reach out to the maintainers directly through their profile links.

Happy coding! 👩‍💻👨‍💻
