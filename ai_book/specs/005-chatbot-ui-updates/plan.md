# Implementation Plan: Chatbot UI Updates

**Branch**: `005-chatbot-ui-updates` | **Date**: 2025-12-07 | **Spec**: `spec.md`
**Input**: Feature specification from `specs/005-chatbot-ui-updates/spec.md`

## Summary

This plan outlines the steps to add a chatbot icon to the navbar of the Docusaurus website. The icon will control the visibility of the existing chatbot component. This will be achieved by refactoring the chatbot to use a shared React Context for its visibility state. The plan also notes that the request to "add more sections" requires clarification before implementation.

## Technical Context

**Language/Version**: TypeScript
**Primary Dependencies**: React, Docusaurus
**Target Platform**: Web
**Project Type**: Web application (Docusaurus)

## Project Structure

The changes will affect the `humanoid-robotics-book` project. The relevant files are within `humanoid-robotics-book/src/`.

### Source Code (repository root)

```text
humanoid-robotics-book/
└── src/
    ├── components/
    │   └── Chatbot/
    │       └── index.tsx      # To be modified
    ├── contexts/
    │   └── ChatbotContext.tsx # To be created
    └── theme/
        ├── Layout/
        │   └── index.tsx      # To be modified
        └── Navbar/
            ├── Content/
            │   └── index.tsx  # To be modified
            └── ChatbotIcon.tsx  # To be created
```

**Structure Decision**: The implementation will follow the existing Docusaurus project structure, using component swizzling and creating a new React Context for shared state.

## Implementation Steps

1.  **Create `ChatbotContext.tsx`**:
    -   Location: `humanoid-robotics-book/src/contexts/ChatbotContext.tsx`
    -   Purpose: Create and export a `ChatbotContext` and `ChatbotProvider`.
    -   State: The context will manage an `isOpen` boolean state and a `setIsOpen` function.

2.  **Update `Layout/index.tsx`**:
    -   Location: `humanoid-robotics-book/src/theme/Layout/index.tsx`
    -   Modification:
        -   Import `ChatbotProvider` and wrap the main layout with it. This will make the chatbot state available to all components.
        -   Import and render the `<Chatbot />` component within the layout so it's available on all pages.

3.  **Refactor `Chatbot/index.tsx`**:
    -   Location: `humanoid-robotics-book/src/components/Chatbot/index.tsx`
    -   Modification:
        -   Remove the local `isOpen` state management.
        -   Use the `useContext(ChatbotContext)` hook to get the `isOpen` state from the shared context.
        -   Remove the floating `chatButton` from the component's render method. The chatbot's visibility will now be controlled externally.

4.  **Create `ChatbotIcon.tsx`**:
    -   Location: `humanoid-robotics-book/src/theme/Navbar/ChatbotIcon.tsx`
    -   Purpose: A new component that will render a clickable chatbot icon.
    -   Functionality:
        -   Use the `useContext(ChatbotContext)` hook to get `setIsOpen`.
        -   On click, it will call `setIsOpen` to toggle the chatbot's visibility.
        -   For the icon, a simple SVG or an emoji can be used.

5.  **Update `Navbar/Content/index.tsx`**:
    -   Location: `humanoid-robotics-book/src/theme/Navbar/Content/index.tsx`
    -   Modification:
        -   Import the new `ChatbotIcon` component.
        -   Add the `<ChatbotIcon />` component to the right side of the navbar, next to the color mode toggle or search bar.

## Clarification needed

The request to "add more sections" is vague. The following questions need to be answered before this part of the feature can be planned and implemented:
-   What are the new sections?
-   What content will they contain?
-   Where should they appear in the site's navigation or structure?
