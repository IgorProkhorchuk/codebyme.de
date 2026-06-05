# CodeByMe.de

A personal digital notebook, tech blog, and interactive lab environment built with modern web technologies. The site is designed to be fully bilingual (English / Ukrainian) and uses a Git-based CMS approach where content is driven by simple Markdown files.

## Features

- **Tech Blog**: Code snippets, architecture designs, and technical notes. Includes seamless code copying and automatic syntax highlighting.
- **Life Blog**: Thoughts, hobbies, and life outside the terminal.
- **SysAdmin Labs (Beta)**: Interactive Linux environments for practicing CLI commands right in the browser.
- **Bilingual Support**: Fully localized in English and Ukrainian, with a smart fallback system for untranslated articles.
- **Git-Based CMS**: Articles are written in Markdown (`.md`) and automatically parsed and rendered by SvelteKit via `mdsvex`. Diagrams are rendered natively using Mermaid.

## Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | **SvelteKit** | SSR, Reactive UI, Markdown Parsing (`mdsvex`), i18n routing. |
| **Backend** | **Spring Boot** | Core API, Business Logic. |
| **Language** | **Java / TypeScript** | |
| **Database** | **PostgreSQL** | Relational data persistence. |

## Local Development

If you want to run the project locally, you can start the frontend development server.

### Prerequisites

- Node.js 20+

### Running the Frontend Locally

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

### Running Tests (Frontend)

The frontend includes a suite of unit and component tests using Vitest and Playwright.

To run the tests locally:
```bash
cd frontend
npm run test
```
This will execute all tests, including localized UI component tests and i18n logic checks.

## Content Management

Adding a new article to the blog is as simple as creating a Markdown file!

1. Create a new `.md` file in `frontend/src/content/blog/en/` (for English) or `frontend/src/content/blog/uk/` (for Ukrainian).
2. Add the required frontmatter at the top of the file:
   ```yaml
   ---
   title: "My New Article"
   date: "2026-06-05"
   category: "TECH"
   ---
   ```
3. Write your content in Markdown. The site automatically handles code highlighting and renders Mermaid diagrams!
4. Commit and push your changes. The CI/CD pipeline will automatically deploy the new article to the live site.