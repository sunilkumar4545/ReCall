---
title: React 18 Fiber Reconciliation & Concurrent Mode
category: react
summary: How React 18 uses fiber nodes, work loops, and lane priority to interrupt rendering.
code_language: typescript
read_time: 6 min
youtube_url: ""
---

## Explanation
In legacy React (v15 and earlier), reconciliation was synchronous and recursive (Stack Reconciler). Once rendering started, it could not be paused, causing noticeable frame drops and UI freezes during large tree diffs.

React 16+ replaced the stack reconciler with **Fiber**:
- A **Fiber** is a plain JavaScript object representing a unit of work with `child`, `sibling`, and `return` pointers, turning the tree into a singly linked list.
- Because fibers are linked list nodes, React's work loop can pause execution during an idle callback (`requestIdleCallback` / `Scheduler`) to yield control back to the browser for user interactions, gestures, or animations.

In React 18 **Concurrent Mode**:
- Renders are prioritized using **Lanes** (bitmasks representing priority levels such as SyncLane, InputContinuousLane, DefaultLane).
- `useTransition` and `useDeferredValue` mark updates as non-urgent transitions, allowing high-priority keystrokes to interrupt ongoing rendering without tearing.

## Code
```typescript
import { useState, useTransition } from 'react';

export function SearchFilterVault({ allItems }: { allItems: string[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredList, setFilteredList] = useState(allItems);
  const [isPending, startTransition] = useTransition();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. High-priority urgent update: input reflects keystrokes immediately (60fps)
    const nextQuery = e.target.value;
    setSearchTerm(nextQuery);

    // 2. Low-priority non-blocking transition: computation can be interrupted
    startTransition(() => {
      const nextFiltered = allItems.filter(item => 
        item.toLowerCase().includes(nextQuery.toLowerCase())
      );
      setFilteredList(nextFiltered);
    });
  };

  return (
    <div>
      <input value={searchTerm} onChange={handleInputChange} />
      {isPending && <span className="opacity-50">Recalculating...</span>}
      <List items={filteredList} />
    </div>
  );
}
```
