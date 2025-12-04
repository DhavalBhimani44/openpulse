# Contributing to OpenPulse

Thank you for your interest in contributing to OpenPulse! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/yourusername/openpulse.git
   cd openpulse
   ```
3. **Install dependencies**
   ```bash
   pnpm install
   ```
4. **Set up environment variables**
   - Copy `.env.example` to `.env` in both `apps/dashboard` and `apps/collector`
   - Fill in the required values
5. **Set up the database**
   ```bash
   cd packages/db
   pnpm db:migrate
   ```
6. **Start development servers**
   ```bash
   pnpm dev
   ```

## Development Workflow

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed
3. **Test your changes**
   - Test manually in the browser
   - Ensure no TypeScript errors
   - Check that migrations work if you changed the schema
4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```
5. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

## Code Style

- Use TypeScript for all new code
- Follow the existing code formatting (Prettier is configured)
- Use meaningful variable and function names
- Keep functions small and focused
- Add JSDoc comments for public APIs

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example:
```
feat: add real-time visitor count to dashboard
fix: resolve session tracking issue on page reload
docs: update installation instructions
```

## Pull Request Process

1. **Update documentation** if you've changed functionality
2. **Add tests** if applicable
3. **Ensure all checks pass** (linting, type checking)
4. **Request review** from maintainers
5. **Address feedback** promptly

## Project Structure

- `apps/dashboard` - Main dashboard application
- `apps/collector` - Event collection API
- `packages/db` - Database schema and Prisma client
- `packages/trpc` - tRPC routers and client setup
- `packages/ui` - Shared UI components

## Database Changes

If you need to modify the database schema:

1. Edit `packages/db/prisma/schema.prisma`
2. Create a migration:
   ```bash
   cd packages/db
   pnpm db:migrate
   ```
3. Test the migration on a fresh database
4. Update any affected code

## Adding New Features

1. **Plan your feature**
   - Check existing issues and PRs
   - Discuss major changes in an issue first
   - Consider backward compatibility
2. **Implement**
   - Follow the existing architecture
   - Add proper error handling
   - Consider performance implications
3. **Document**
   - Update README if needed
   - Add code comments
   - Update API documentation

## Reporting Bugs

When reporting bugs, please include:

- **Description**: Clear description of the bug
- **Steps to reproduce**: Detailed steps to reproduce the issue
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: OS, Node.js version, browser (if applicable)
- **Screenshots**: If applicable

## Questions?

- Open an issue for bug reports or feature requests
- Start a discussion for questions or ideas
- Check existing issues and discussions first

Thank you for contributing to OpenPulse!

