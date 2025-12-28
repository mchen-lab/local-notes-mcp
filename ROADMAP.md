# Roadmap 🗺️

Our philosophy is **"The Sharp Knife"**: A focused, local-first tool that does one thing extremely well. We prioritize stability, privacy, and speed over feature bloat.

## 🚀 Phase 1: Polish & Stability (Current Priority)
*Goal: Ensure the "Out of the Box" experience is flawless.*

- [ ] **Docker "One-Liner"**: Verify and simplify the `docker run` command for non-technical users.
- [ ] **Mobile Layout Polish**: Ensure specific CSS tweaks for improved PWA/Mobile experience (sidebar toggles, font sizes).
- [ ] **Error Handling**: gracefully handle network disconnects during polling.

## 🔮 Future Ideas (Exploratory)
*Note: These are long-term ideas we are interested in but have not committed to building yet. We welcome community discussion and prototypes.*

- [ ] **Semantic Search**: Exploring ways to allow Agents to find notes by *concept*, potentially using local embeddings.
- [ ] **Audio Notes**: Investigating simple voice-to-text workflows.
- [ ] **Smart Context**: Methods to help Agents digest long notes efficiently.

## 🛠️ Maintenance & Refactoring
*Goal: Keep the codebase clean and approachable for new contributors.*

- [ ] **Extract Frontend Hooks**: Move complex logic from `App.jsx` into custom hooks (e.g., `useNotes`, `useAuth`).
- [ ] **Type definitions**: Improve JSDoc or migrate key files to TypeScript for better developer experience.

## ❌ What We Are NOT Building (Out of Scope)
- Cloud Sync (We are local-first)
- Team Real-time Collaboration (Complex CRDTs)
- Plugin System (We are a product, not a platform)
