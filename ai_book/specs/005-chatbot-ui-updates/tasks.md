# Tasks: Chatbot UI Updates

**Input**: Design documents from `specs/005-chatbot-ui-updates/`
**Prerequisites**: plan.md, spec.md

## Phase 1: User Story 1 - Display Chatbot Icon in Navbar (Priority: P1) 🎯 MVP

**Goal**: To provide a clear and accessible entry point to the chatbot from the main navigation bar.

**Independent Test**: The chatbot icon should appear on the navbar, and clicking it should open and close the chatbot window.

### Implementation for User Story 1

- [x] T001 [US1] Create new context file at `humanoid-robotics-book/src/contexts/ChatbotContext.tsx`
- [x] T002 [US1] Define and export `ChatbotContext` and `ChatbotProvider` in `ChatbotContext.tsx` to manage the chatbot's `isOpen` state.
- [x] T003 [US1] Modify `humanoid-robotics-book/src/theme/Layout/index.tsx` to import and use `ChatbotProvider` to wrap the layout, making the state available globally.
- [x] T004 [US1] Modify `humanoid-robotics-book/src/theme/Layout/index.tsx` to render the `<Chatbot />` component so it is present on all pages.
- [x] T005 [US1] Refactor `humanoid-robotics-book/src/components/Chatbot/index.tsx` to consume `ChatbotContext` and rely on the shared `isOpen` state instead of its local state.
- [x] T006 [US1] Remove the existing floating chat button from `humanoid-robotics-book/src/components/Chatbot/index.tsx`.
- [x] T007 [P] [US1] Create a new component file at `humanoid-robotics-book/src/theme/Navbar/ChatbotIcon.tsx`.
- [x] T008 [P] [US1] Implement the `ChatbotIcon` component to display a clickable icon. The icon's `onClick` handler should toggle the chatbot's visibility using the `setIsOpen` function from `ChatbotContext`.
- [x] T009 [US1] Modify `humanoid-robotics-book/src/theme/Navbar/Content/index.tsx` to import and render the `ChatbotIcon` component within the right side of the navbar.

---

## Phase 2: User Story 2 - Add More Sections (Priority: P2)

**Goal**: To add more content sections to the website.

**Independent Test**: Not yet defined.

**Implementation for User Story 2**:
- Tasks for this user story are blocked pending clarification on what sections to add. See `spec.md` for details.
