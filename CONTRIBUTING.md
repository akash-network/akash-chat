# Contributing to Akash Chat

Thank you for your interest in contributing to Akash Chat! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone. Please be considerate in your interactions with other contributors. See the [Code of Conduct](CODE_OF_CONDUCT.md) for more details.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** to your local machine:
   ```bash
   git clone https://github.com/YOUR_USERNAME/akash-chat.git
   cd akash-chat
   ```
3. **Set up the upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_REPO/akash-chat.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Set up environment variables**:
   Create a `.env.local` file in the root directory with the necessary environment variables (refer to the README for required variables)

## Development Workflow

1. **Create a new branch** for your feature or bugfix:

   ```bash
   git checkout -b feature/your-feature-name
   ```

   or

   ```bash
   git checkout -b fix/issue-you-are-fixing
   ```

2. **Make your changes** and ensure they follow our coding standards.

3. **Run linting** to ensure code quality:

   ```bash
   npm run lint
   ```

4. **Test your changes** by running the development server:

   ```bash
   npm run dev
   ```

5. **Commit your changes** with a clear, descriptive message following the [Conventional Commits](https://www.conventionalcommits.org/) specification:

   ```bash
   git commit -m "feat: add new chat feature"
   ```

6. **Pull the latest changes** from upstream:

   ```bash
   git pull upstream main
   ```

7. **Push your branch** to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create a Pull Request** from your fork to the main repository.

## Project Structure

- `/app` - Next.js app directory containing pages and API routes
- `/components` - Reusable React components
- `/lib` - Utility functions and shared logic
- `/public` - Static assets
- `/hooks` - Custom React hooks

## Pull Request Guidelines

When submitting a Pull Request, please:

1. **Provide a clear description** of the changes and their purpose
2. **Reference any related issues** using GitHub's keyword references (e.g., "Fixes #123")
3. **Include any necessary documentation updates**
4. **Ensure the PR is up-to-date** with the main branch
5. **Test your changes** thoroughly, including:
   - Chat functionality
   - UI responsiveness
   - Error handling
   - API integration

## Adding New Features

When adding new features:

1. Follow the existing project structure and patterns
2. Use TypeScript for type safety
3. Implement proper error handling
4. Add appropriate tests if applicable
5. Update documentation as needed
6. Consider mobile responsiveness
7. Follow the existing styling conventions using Tailwind CSS

## Reporting Issues

When reporting issues, please:

1. **Use the issue template** provided
2. **Provide steps to reproduce** the issue
3. **Include relevant information** such as:
   - Node.js version
   - Operating system
   - Browser version
   - Relevant logs or error messages
   - Expected versus actual behavior
   - Screenshots if applicable

## Documentation

Improvements to documentation are always welcome! Please ensure:

1. Documentation is clear and concise
2. Code examples are correct and follow best practices
3. Any new functionality is properly documented
4. Update README.md if necessary

## License

By contributing to this project, you agree that your contributions will be licensed under the project's [Apache 2.0 License](LICENSE).

## Questions?

If you have any questions or need help with the contribution process, please open an issue marked as a question or contact the maintainers directly.

Thank you for contributing to Akash Chat!
