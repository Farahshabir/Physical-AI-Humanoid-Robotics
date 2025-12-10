---
sidebar_position: 8
---

# Appendix: The Book's Development Process (Spec-Kit Plus)

This book was written following a **Spec-Driven Development (SDD)** methodology, orchestrated by the tools and principles defined in the `.specify/` directory.

## A.1: The Constitution - Core Principles

The project adheres to a set of non-negotiable principles defined in `constitution.md`. These rules govern every aspect of development, from testing to integration.

- **Library-First**: Every feature begins as a standalone, testable library.
- **CLI Interface**: Functionality is exposed via a command-line interface with text-based I/O.
- **Test-First (TDD)**: Tests are written and approved *before* implementation begins, following a strict Red-Green-Refactor cycle.
- **Integration Testing**: Mandated for new library contracts, inter-service communication, and shared schemas.
- **Simplicity**: YAGNI ("You Aren't Gonna Need It") is a core tenet.

## A.2: The Workflow - Scripts & Tooling

A collection of PowerShell scripts in `.specify/scripts/powershell/` automates the development workflow, ensuring consistency and adherence to the constitution.

- **`create-new-feature.ps1`**: Initializes a new feature by creating a dedicated branch and `specs/` directory, ensuring isolation.
- **`check-prerequisites.ps1`**: Validates the environment before a command runs, checking for required files like `plan.md` and `tasks.md`.
- **`setup-plan.ps1`**: Prepares the `plan.md` file from a template for architectural planning.
- **`update-agent-context.ps1`**: Dynamically updates context files for AI agents (like this one) based on the latest architectural decisions in `plan.md`.

## A.3: The Artifacts - Document Templates

The SDD process relies on a series of structured Markdown templates to capture every stage of development, ensuring clarity and traceability.

- **`spec-template.md`**: Defines the "what" and "why" of a feature with user stories, functional requirements, and success criteria.
- **`plan-template.md`**: Outlines the "how" with technical context, architectural decisions, and a concrete project structure.
- **`tasks-template.md`**: Breaks down the plan into a list of discrete, testable implementation tasks, organized by user story to enable independent delivery.
- **`adr-template.md`**: Documents significant architectural decisions, their consequences, and the alternatives considered.
- **`phr-template.prompt.md`**: Creates a "Prompt History Record" for every interaction, capturing the user's request, the AI's response, and the outcome for continuous improvement.
- **`agent-file-template.md`**: A template used to generate context files that keep AI agents aligned with the project's evolving architecture and standards.
