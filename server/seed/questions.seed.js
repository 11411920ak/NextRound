require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Question = require('../models/Question');
const connectDB = require('../config/db');

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION BANK v2 — Expanded: 3-6 unique questions per topic/difficulty/role
// ─────────────────────────────────────────────────────────────────────────────
const questions = [

  // ══════════════════════════════════════════════════════════════════
  // SDE
  // ══════════════════════════════════════════════════════════════════

  // JavaScript — easy
  { role: 'SDE', topic: 'JavaScript', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What is the difference between let, var, and const in JavaScript?',
    ideal_answer: 'var is function-scoped and hoisted; let and const are block-scoped. const cannot be reassigned. Temporal Dead Zone applies to let/const.',
    tags: ['javascript', 'scope'] },

  { role: 'SDE', topic: 'JavaScript', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'Explain what a closure is in JavaScript with an example.',
    ideal_answer: 'A closure retains access to variables from its outer scope after the outer function has returned. Used for data encapsulation and factory functions.',
    tags: ['javascript', 'closure'] },

  { role: 'SDE', topic: 'JavaScript', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What is the difference between == and === in JavaScript?',
    ideal_answer: '== performs type coercion; === compares value AND type without coercion. Always prefer === to avoid unexpected bugs.',
    tags: ['javascript', 'equality'] },

  { role: 'SDE', topic: 'JavaScript', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'How does the "this" keyword work in JavaScript?',
    ideal_answer: '"this" refers to the execution context. In regular functions, it depends on how the function is called. In arrow functions, it is lexically bound to the enclosing scope.',
    tags: ['javascript', 'this'] },

  // JavaScript — medium
  { role: 'SDE', topic: 'JavaScript', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'Explain the JavaScript event loop — how do the call stack, task queue, and microtask queue work together?',
    ideal_answer: 'The event loop checks the call stack. When empty, it processes microtasks (Promises) first, then macrotasks (setTimeout). This enables non-blocking async behavior.',
    tags: ['javascript', 'event-loop'] },

  { role: 'SDE', topic: 'JavaScript', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: '1-2_years',
    text: 'What is the difference between Promise.all, Promise.allSettled, and Promise.race?',
    ideal_answer: 'Promise.all rejects on any rejection. Promise.allSettled waits for all. Promise.race resolves/rejects with the first settled.',
    tags: ['javascript', 'promises'] },

  { role: 'SDE', topic: 'JavaScript', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'Explain prototypal inheritance in JavaScript and how the prototype chain works.',
    ideal_answer: 'Every JS object has a [[Prototype]]. When a property is not found on an object, JS looks up the chain until null. Object.create() and class syntax use prototypal inheritance.',
    tags: ['javascript', 'prototype'] },

  { role: 'SDE', topic: 'JavaScript', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'What are generators in JavaScript? How does the yield keyword work?',
    ideal_answer: 'Generators can pause execution using yield and resume later via .next(). Used for lazy evaluation, infinite sequences, and async flows.',
    tags: ['javascript', 'generators'] },

  // JavaScript — hard
  { role: 'SDE', topic: 'JavaScript', category: 'technical', question_type: 'conceptual', difficulty: 'hard', experience_level: '3+_years',
    text: 'Explain how V8 engine optimizes JavaScript code. What are hidden classes and inline caching?',
    ideal_answer: 'V8 creates hidden classes for objects with the same property layout. Inline caching caches object types at call sites. Deoptimization occurs when type assumptions break.',
    tags: ['javascript', 'v8', 'performance'] },

  { role: 'SDE', topic: 'JavaScript', category: 'technical', question_type: 'conceptual', difficulty: 'hard', experience_level: '3+_years',
    text: 'How does memory management work in JavaScript? Explain the mark-and-sweep garbage collection algorithm.',
    ideal_answer: 'Mark-and-sweep: mark all reachable objects from roots, sweep unreachable ones. V8 uses generational GC. Memory leaks come from closures holding DOM refs, global variables, event listeners.',
    tags: ['javascript', 'memory', 'gc'] },

  // DSA — easy
  { role: 'SDE', topic: 'DSA', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'Explain the difference between an array and a linked list. When would you use each?',
    ideal_answer: 'Arrays: O(1) random access, O(n) insertion. Linked lists: O(n) access, O(1) insertion at known position. Use arrays for indexed access, linked lists for frequent insertion.',
    tags: ['dsa', 'arrays'] },

  { role: 'SDE', topic: 'DSA', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What is a stack and a queue? Give real-world examples of each.',
    ideal_answer: 'Stack: LIFO — function call stack, undo operations. Queue: FIFO — print queue, BFS, task scheduling.',
    tags: ['dsa', 'stack'] },

  { role: 'SDE', topic: 'DSA', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What is Big O notation? Explain O(1), O(n), O(log n), and O(n²) with examples.',
    ideal_answer: 'O(1): array index. O(n): linear search. O(log n): binary search. O(n²): nested loops/bubble sort. Describes worst-case time/space complexity.',
    tags: ['dsa', 'big-o'] },

  { role: 'SDE', topic: 'DSA', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What is a hash table and how does it handle collisions?',
    ideal_answer: 'Hash table maps keys to indices via hash function. Collisions handled by chaining (linked list per slot) or open addressing (linear probing). Average O(1) for get/set.',
    tags: ['dsa', 'hash-table'] },

  // DSA — medium
  { role: 'SDE', topic: 'DSA', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'What is the time and space complexity of common sorting algorithms? Which would you use in production?',
    ideal_answer: 'QuickSort O(n log n) avg. MergeSort O(n log n) stable. HeapSort O(n log n) O(1) space. In production use language built-ins (TimSort). Choose based on data and stability needs.',
    tags: ['dsa', 'sorting'] },

  { role: 'SDE', topic: 'DSA', category: 'technical', question_type: 'coding', difficulty: 'medium', experience_level: 'all',
    text: 'How would you detect a cycle in a linked list? Explain Floyd\'s Cycle Detection algorithm.',
    ideal_answer: 'Slow pointer moves 1 step, fast 2 steps. If they meet, there is a cycle. Time O(n), Space O(1). To find cycle start: reset slow to head and move both 1 step.',
    tags: ['dsa', 'linked-list'] },

  { role: 'SDE', topic: 'DSA', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'Explain binary search. What are its preconditions and when do you use it?',
    ideal_answer: 'Binary search: O(log n), requires sorted array. Halves search space each step. Also usable on answer spaces for optimization. Pitfall: integer overflow in mid — use low + (high - low) / 2.',
    tags: ['dsa', 'binary-search'] },

  { role: 'SDE', topic: 'DSA', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'What is dynamic programming? Explain with the Fibonacci example.',
    ideal_answer: 'DP breaks problems into overlapping subproblems and stores results (memoization/tabulation). Fibonacci: naive O(2^n) → DP O(n). Identify: optimal substructure + overlapping subproblems.',
    tags: ['dsa', 'dynamic-programming'] },

  // DSA — hard
  { role: 'SDE', topic: 'DSA', category: 'technical', question_type: 'coding', difficulty: 'hard', experience_level: '3+_years',
    text: 'Explain Dijkstra\'s algorithm. What data structure makes it efficient and what is its time complexity?',
    ideal_answer: 'Dijkstra finds shortest paths in a non-negative weighted graph using a min-heap. Time: O((V + E) log V). Fails with negative edges — use Bellman-Ford.',
    tags: ['dsa', 'graphs'] },

  { role: 'SDE', topic: 'DSA', category: 'technical', question_type: 'coding', difficulty: 'hard', experience_level: '3+_years',
    text: 'What are segment trees? When would you use one over a simple prefix sum array?',
    ideal_answer: 'Segment tree enables range queries AND point updates in O(log n). Prefix sum is O(1) query but O(n) update. Use segment tree when you need both frequent updates and range queries.',
    tags: ['dsa', 'segment-tree'] },

  // System Design — medium
  { role: 'SDE', topic: 'System Design', category: 'technical', question_type: 'system_design', difficulty: 'medium', experience_level: '1-2_years',
    text: 'What is the CAP theorem? How does it affect database selection for distributed systems?',
    ideal_answer: 'CAP: only 2 of 3 guaranteed — Consistency, Availability, Partition Tolerance. CP (MongoDB): consistency. AP (Cassandra): availability. No real system can be fully CA in distributed environments.',
    tags: ['system-design', 'cap-theorem'] },

  { role: 'SDE', topic: 'System Design', category: 'technical', question_type: 'system_design', difficulty: 'medium', experience_level: '1-2_years',
    text: 'Explain horizontal vs vertical scaling. What are the tradeoffs?',
    ideal_answer: 'Vertical: bigger machine — simpler but hardware limits. Horizontal: more machines — complex but unlimited scale. Stateless services scale horizontally; stateful require distributed state.',
    tags: ['system-design', 'scalability'] },

  { role: 'SDE', topic: 'System Design', category: 'technical', question_type: 'system_design', difficulty: 'medium', experience_level: 'all',
    text: 'What is a message queue and why is it used in distributed systems? Give examples.',
    ideal_answer: 'Message queues (Kafka, RabbitMQ) decouple producers/consumers, enable async processing, buffer traffic spikes, and guarantee delivery. Use for: email notifications, event streaming, order processing.',
    tags: ['system-design', 'message-queue'] },

  // System Design — hard
  { role: 'SDE', topic: 'System Design', category: 'technical', question_type: 'system_design', difficulty: 'hard', experience_level: '3+_years',
    text: 'Design a URL shortening service like bit.ly. Walk through the architecture, database design, and scalability.',
    ideal_answer: 'Base62 encoding, NoSQL for URL mappings with TTL, CDN for caching redirects, consistent hashing for distribution, rate limiting, analytics. 100M reads/day requires read replicas.',
    tags: ['system-design', 'scalability'] },

  { role: 'SDE', topic: 'System Design', category: 'technical', question_type: 'system_design', difficulty: 'hard', experience_level: '3+_years',
    text: 'Design a rate limiter for an API. What algorithms would you use across multiple servers?',
    ideal_answer: 'Algorithms: Token Bucket, Sliding Window Log, Fixed Window. Distributed: Redis atomic operations (INCR+TTL or Lua scripts) as shared state. Key per user/IP. Respond with 429 and Retry-After header.',
    tags: ['system-design', 'rate-limiting'] },

  { role: 'SDE', topic: 'System Design', category: 'technical', question_type: 'system_design', difficulty: 'hard', experience_level: '3+_years',
    text: 'Design a distributed cache system. How does consistent hashing work and why is it used?',
    ideal_answer: 'Consistent hashing assigns servers and keys positions on a hash ring. Keys map to nearest server clockwise. Adding/removing a server redistributes only ~K/N keys. Virtual nodes improve load distribution.',
    tags: ['system-design', 'consistent-hashing'] },

  // OOP — easy
  { role: 'SDE', topic: 'OOP', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'Explain the four pillars of OOP: Encapsulation, Inheritance, Polymorphism, and Abstraction.',
    ideal_answer: 'Encapsulation: hide internal state. Inheritance: extend parent class. Polymorphism: same interface, different implementations. Abstraction: expose only necessary details.',
    tags: ['oop', 'fundamentals'] },

  { role: 'SDE', topic: 'OOP', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What is the difference between an abstract class and an interface?',
    ideal_answer: 'Abstract class: can have implementation, state — single inheritance. Interface: method contracts, supports multiple inheritance. Use interface for contracts, abstract class for shared base behavior.',
    tags: ['oop', 'abstract-class'] },

  // OOP — medium
  { role: 'SDE', topic: 'OOP', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'What is the difference between composition and inheritance? When would you prefer composition?',
    ideal_answer: 'Inheritance: "is-a". Composition: "has-a". Composition preferred for flexibility — avoids rigid hierarchy and fragile base class problem. Follow "Favor composition over inheritance".',
    tags: ['oop', 'composition'] },

  { role: 'SDE', topic: 'OOP', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'Explain the SOLID principles with a practical example of the Single Responsibility Principle.',
    ideal_answer: 'S: one class one reason to change. O: open for extension closed for modification. L: Liskov Substitution. I: Interface Segregation. D: Dependency Inversion. SRP: separate UserRepository from UserService.',
    tags: ['oop', 'solid'] },

  // DBMS — easy
  { role: 'SDE', topic: 'DBMS', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What are ACID properties in database transactions?',
    ideal_answer: 'Atomicity: all or nothing. Consistency: valid state to valid state. Isolation: concurrent transactions do not interfere. Durability: committed changes persist after crashes.',
    tags: ['dbms', 'acid'] },

  { role: 'SDE', topic: 'DBMS', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What is the difference between SQL and NoSQL databases? When would you choose one over the other?',
    ideal_answer: 'SQL: structured schema, ACID, relational — best for complex queries, financial data. NoSQL: flexible schema, horizontal scaling — best for high volume, unstructured data.',
    tags: ['dbms', 'sql'] },

  // DBMS — medium
  { role: 'SDE', topic: 'DBMS', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'Explain database indexing. What are the tradeoffs of adding an index?',
    ideal_answer: 'Indexes speed reads using B-tree or hash structures. Tradeoffs: faster reads but slower writes, additional storage. Use on high-cardinality, frequently queried columns.',
    tags: ['dbms', 'indexing'] },

  { role: 'SDE', topic: 'DBMS', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'What are database isolation levels? Explain dirty reads, phantom reads, and non-repeatable reads.',
    ideal_answer: 'Dirty read: reading uncommitted data. Non-repeatable read: same row returns different data. Phantom read: re-run query returns different row set. Levels: Read Uncommitted → Committed → Repeatable Read → Serializable.',
    tags: ['dbms', 'isolation'] },

  // DBMS — hard
  { role: 'SDE', topic: 'DBMS', category: 'technical', question_type: 'conceptual', difficulty: 'hard', experience_level: '3+_years',
    text: 'Explain how B-Tree indexes work internally. Why are B+ trees preferred for databases?',
    ideal_answer: 'B-Tree: all nodes hold data. B+ Tree: only leaf nodes hold data, leaves linked for range scans. B+ trees preferred: better cache performance and efficient range queries.',
    tags: ['dbms', 'b-tree'] },

  // Behavioral — SDE
  { role: 'SDE', topic: 'Behavioral', category: 'behavioral', question_type: 'behavioral', difficulty: 'easy', experience_level: 'fresher',
    text: 'Tell me about yourself and what drew you to software development.',
    ideal_answer: 'Should cover background, relevant experience/projects, key skills, and genuine motivation. Concise 2-3 minutes.',
    tags: ['behavioral', 'introduction'] },

  { role: 'SDE', topic: 'Behavioral', category: 'behavioral', question_type: 'behavioral', difficulty: 'easy', experience_level: 'all',
    text: 'Why do you want to work at this company? What attracts you to this role?',
    ideal_answer: 'Show research about the company, alignment with values/products, specific role responsibilities, and genuine motivation.',
    tags: ['behavioral', 'motivation'] },

  { role: 'SDE', topic: 'Behavioral', category: 'behavioral', question_type: 'behavioral', difficulty: 'medium', experience_level: 'all',
    text: 'Describe a technically challenging problem you faced in a project. How did you approach solving it?',
    ideal_answer: 'STAR: describe problem, systematic debugging, tools used, resolution, lessons learned.',
    tags: ['behavioral', 'problem-solving'] },

  { role: 'SDE', topic: 'Behavioral', category: 'behavioral', question_type: 'behavioral', difficulty: 'medium', experience_level: 'all',
    text: 'Tell me about a time you had to meet a tight deadline. How did you manage your priorities?',
    ideal_answer: 'STAR: deadline description, task prioritization, communicating risks, cutting scope if needed, delivery. Show time management skills.',
    tags: ['behavioral', 'time-management'] },

  { role: 'SDE', topic: 'Behavioral', category: 'behavioral', question_type: 'behavioral', difficulty: 'hard', experience_level: '1-2_years',
    text: 'Tell me about a time you disagreed with a teammate\'s technical decision. How did you handle it?',
    ideal_answer: 'STAR: understanding their perspective, data-backed arguments, willingness to compromise, positive outcome. Shows conflict resolution.',
    tags: ['behavioral', 'conflict-resolution'] },

  { role: 'SDE', topic: 'Behavioral', category: 'behavioral', question_type: 'behavioral', difficulty: 'hard', experience_level: '3+_years',
    text: 'Tell me about a time you led a technical project. How did you handle competing priorities and keep the team aligned?',
    ideal_answer: 'Should cover: defining scope, risk identification, stakeholder communication, unblocking team, trade-off decisions, measurable outcome.',
    tags: ['behavioral', 'leadership'] },

  // ══════════════════════════════════════════════════════════════════
  // FULL STACK DEVELOPER
  // ══════════════════════════════════════════════════════════════════

  { role: 'Full Stack Developer', topic: 'React', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What is the Virtual DOM in React and why does it improve performance?',
    ideal_answer: 'Virtual DOM is an in-memory JS representation of the real DOM. React diffs the new virtual DOM with the previous and only updates changed parts.',
    tags: ['react', 'virtual-dom'] },

  { role: 'Full Stack Developer', topic: 'React', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What is JSX in React? How does it get compiled?',
    ideal_answer: 'JSX is a syntax extension that looks like HTML in JavaScript. Babel compiles JSX to React.createElement() calls.',
    tags: ['react', 'jsx'] },

  { role: 'Full Stack Developer', topic: 'React', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'Explain React hooks — what are useState, useEffect, useMemo, and useCallback?',
    ideal_answer: 'useState: local state. useEffect: side effects. useMemo: memoize computations. useCallback: memoize function references. useMemo/useCallback prevent unnecessary re-renders.',
    tags: ['react', 'hooks'] },

  { role: 'Full Stack Developer', topic: 'React', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'What is React Context API? How does it compare to Redux for state management?',
    ideal_answer: 'Context API: built-in simple global state. Redux: external library, more boilerplate but better for large apps with time-travel debugging and middleware.',
    tags: ['react', 'context', 'redux'] },

  { role: 'Full Stack Developer', topic: 'React', category: 'technical', question_type: 'conceptual', difficulty: 'hard', experience_level: '3+_years',
    text: 'Explain React\'s reconciliation algorithm (Fiber). How does React decide what to re-render?',
    ideal_answer: 'Fiber creates a work-in-progress tree and compares with current using O(n) diffing heuristics. Keys help identify moved list items. Fiber enables interruptible rendering.',
    tags: ['react', 'fiber', 'reconciliation'] },

  { role: 'Full Stack Developer', topic: 'Node.js', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What is Node.js and how does its non-blocking I/O model work?',
    ideal_answer: 'Node.js is a server-side JS runtime built on V8. Uses single-threaded event loop with non-blocking I/O via libuv. I/O is offloaded to the OS.',
    tags: ['nodejs', 'event-loop'] },

  { role: 'Full Stack Developer', topic: 'Node.js', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'How does Node.js handle CPU-intensive tasks? What are Worker Threads?',
    ideal_answer: 'CPU-bound tasks block the event loop. Worker Threads enable parallelism for CPU work. For I/O: async. For CPU: Worker Threads or child_process or offload to a microservice.',
    tags: ['nodejs', 'worker-threads'] },

  { role: 'Full Stack Developer', topic: 'REST API', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What is REST? Describe the key HTTP methods and their proper use cases.',
    ideal_answer: 'REST: stateless client-server. GET (retrieve), POST (create), PUT (replace), PATCH (partial update), DELETE (remove). Should be idempotent except POST.',
    tags: ['rest', 'http'] },

  { role: 'Full Stack Developer', topic: 'REST API', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'What are HTTP status codes? Explain 4xx vs 5xx errors with common examples.',
    ideal_answer: '4xx: client errors — 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 429 Rate Limit. 5xx: server errors — 500 Internal Error, 503 Unavailable.',
    tags: ['rest', 'status-codes'] },

  { role: 'Full Stack Developer', topic: 'Authentication', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: '1-2_years',
    text: 'Explain JWT-based authentication. What are its advantages and potential security issues?',
    ideal_answer: 'JWT: header.payload.signature. Advantages: stateless, scalable. Issues: token theft, no server-side invalidation. Use httpOnly cookies, short expiry + refresh tokens.',
    tags: ['authentication', 'jwt'] },

  { role: 'Full Stack Developer', topic: 'SQL', category: 'technical', question_type: 'coding', difficulty: 'easy', experience_level: 'fresher',
    text: 'Explain the difference between INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL OUTER JOIN.',
    ideal_answer: 'INNER JOIN: only matching rows. LEFT JOIN: all from left + matching from right (NULL for no match). RIGHT JOIN: opposite. FULL OUTER JOIN: all rows from both.',
    tags: ['sql', 'joins'] },

  { role: 'Full Stack Developer', topic: 'SQL', category: 'technical', question_type: 'coding', difficulty: 'medium', experience_level: 'all',
    text: 'Write a SQL query to find the second highest salary from an employee table. Handle ties.',
    ideal_answer: 'SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees). Or use DENSE_RANK() window function.',
    tags: ['sql', 'subquery'] },

  { role: 'Full Stack Developer', topic: 'System Design', category: 'technical', question_type: 'system_design', difficulty: 'hard', experience_level: '3+_years',
    text: 'Design the backend for a real-time chat application. What technologies would you choose?',
    ideal_answer: 'WebSockets for real-time, Redis pub/sub for broadcasting, MongoDB for persistence, message queue for reliability, horizontal scaling with JWT.',
    tags: ['system-design', 'websockets'] },

  { role: 'Full Stack Developer', topic: 'Behavioral', category: 'behavioral', question_type: 'behavioral', difficulty: 'medium', experience_level: 'all',
    text: 'Describe a full stack feature you built end-to-end. What integration challenges did you face?',
    ideal_answer: 'Should describe: UI design, API design, database schema, integration challenges, debugging, and deployment.',
    tags: ['behavioral', 'fullstack'] },

  // ══════════════════════════════════════════════════════════════════
  // FRONTEND DEVELOPER
  // ══════════════════════════════════════════════════════════════════

  { role: 'Frontend Developer', topic: 'HTML/CSS', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'Explain the CSS Box Model. What is the difference between margin, padding, and border?',
    ideal_answer: 'Box model: content → padding → border → margin. Padding inside border (part of element), margin outside (space between elements). box-sizing: border-box includes padding and border in width.',
    tags: ['css', 'box-model'] },

  { role: 'Frontend Developer', topic: 'HTML/CSS', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What is the difference between Flexbox and CSS Grid? When would you use each?',
    ideal_answer: 'Flexbox: 1D layout (row or column), best for components. Grid: 2D layout (rows AND columns), best for page-level. Both can be combined.',
    tags: ['css', 'flexbox', 'grid'] },

  { role: 'Frontend Developer', topic: 'HTML/CSS', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'What is CSS specificity? How does the cascade work?',
    ideal_answer: 'Specificity: inline (1000) > ID (100) > class (10) > element (1). Higher wins. !important overrides all. Same specificity: last rule wins.',
    tags: ['css', 'specificity'] },

  { role: 'Frontend Developer', topic: 'JavaScript', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What is event delegation in JavaScript and why is it beneficial?',
    ideal_answer: 'One event listener on parent instead of many on children. Utilizes event bubbling. Benefits: memory efficiency, works for dynamically added elements.',
    tags: ['javascript', 'events'] },

  { role: 'Frontend Developer', topic: 'JavaScript', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'Explain debouncing and throttling. When would you use each?',
    ideal_answer: 'Debounce: delay execution until pause in calls (search input). Throttle: limit to one call per interval (scroll/resize handlers). Both prevent excessive calls.',
    tags: ['javascript', 'debounce', 'throttle'] },

  { role: 'Frontend Developer', topic: 'Performance', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: '1-2_years',
    text: 'What are Web Vitals (LCP, CLS, INP) and how do you optimize them in React?',
    ideal_answer: 'LCP: optimize images, preload key resources. CLS: explicit dimensions. INP: reduce JS execution. Use code splitting, lazy loading, compression, React.lazy.',
    tags: ['performance', 'web-vitals'] },

  { role: 'Frontend Developer', topic: 'Performance', category: 'technical', question_type: 'conceptual', difficulty: 'hard', experience_level: '3+_years',
    text: 'Explain the browser rendering pipeline. What causes layout thrashing and how do you fix it?',
    ideal_answer: 'Rendering: Parse → Render tree → Layout → Paint → Composite. Layout thrashing: reading then writing layout properties in a loop. Fix: batch reads then writes, use requestAnimationFrame, use transform/opacity (composite only).',
    tags: ['performance', 'rendering'] },

  { role: 'Frontend Developer', topic: 'Accessibility', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'What is web accessibility and how do you implement it? What are ARIA roles?',
    ideal_answer: 'Accessibility: usable by people with disabilities. Semantic HTML, ARIA roles (role="button", aria-label), keyboard navigation, color contrast, skip links. Test with screen readers.',
    tags: ['accessibility', 'aria'] },

  { role: 'Frontend Developer', topic: 'Behavioral', category: 'behavioral', question_type: 'behavioral', difficulty: 'medium', experience_level: 'all',
    text: 'Tell me about a time you had to implement a complex UI component from scratch. What was your approach?',
    ideal_answer: 'Should describe requirements, component architecture, accessibility, testing approach, and iteration.',
    tags: ['behavioral', 'ui'] },

  // ══════════════════════════════════════════════════════════════════
  // BACKEND DEVELOPER
  // ══════════════════════════════════════════════════════════════════

  { role: 'Backend Developer', topic: 'System Design', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What is the difference between monolithic and microservices architecture?',
    ideal_answer: 'Monolith: single deployable unit, simpler but scaling issues. Microservices: independent services per domain, better scaling/deployment but complex communication.',
    tags: ['architecture', 'microservices'] },

  { role: 'Backend Developer', topic: 'System Design', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: '1-2_years',
    text: 'What is an API Gateway and what are its responsibilities in microservices?',
    ideal_answer: 'API Gateway: single entry point. Handles: routing, auth, rate limiting, SSL termination, request aggregation, logging. Prevents clients from knowing service topology.',
    tags: ['architecture', 'api-gateway'] },

  { role: 'Backend Developer', topic: 'DBMS', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: '1-2_years',
    text: 'What is database connection pooling and why is it important for backend performance?',
    ideal_answer: 'Pooling maintains reusable database connections. Avoids costly connection setup on each request. Pools have max connections, idle timeout, queue for waiting requests.',
    tags: ['databases', 'connection-pool'] },

  { role: 'Backend Developer', topic: 'Caching', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What is caching and why is it important in backend systems? What data should you cache?',
    ideal_answer: 'Caching stores frequently accessed data in fast memory to reduce DB load and latency. Cache: computation results, DB query results, session data. Do not cache sensitive or rapidly-changing data without proper invalidation.',
    tags: ['caching', 'performance'] },

  { role: 'Backend Developer', topic: 'Caching', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'Explain caching strategies: Cache-Aside, Write-Through, Write-Behind, and Read-Through.',
    ideal_answer: 'Cache-Aside: app checks cache, miss reads DB and populates cache. Write-Through: write to cache and DB synchronously. Write-Behind: write to cache first, DB asynchronously. Read-Through: cache fetches from DB on miss.',
    tags: ['caching', 'redis'] },

  { role: 'Backend Developer', topic: 'Caching', category: 'technical', question_type: 'conceptual', difficulty: 'hard', experience_level: '3+_years',
    text: 'What is cache invalidation and how do you handle cache stampede in a high-traffic system?',
    ideal_answer: 'Cache invalidation: time-based TTL, event-driven, or version tags. Cache stampede: many cache misses hit DB simultaneously. Solutions: staggered TTL, mutex/lock on first miss, background refresh before expiry.',
    tags: ['caching', 'stampede'] },

  { role: 'Backend Developer', topic: 'Behavioral', category: 'behavioral', question_type: 'behavioral', difficulty: 'medium', experience_level: 'all',
    text: 'Describe a time when you had to optimize a slow API endpoint. What was your approach?',
    ideal_answer: 'Should describe: profiling, identifying bottleneck (N+1, no index), solution (query optimization, caching, pagination), measurable improvement.',
    tags: ['behavioral', 'optimization'] },

  // ══════════════════════════════════════════════════════════════════
  // DATA ANALYST
  // ══════════════════════════════════════════════════════════════════

  { role: 'Data Analyst', topic: 'SQL', category: 'technical', question_type: 'coding', difficulty: 'easy', experience_level: 'fresher',
    text: 'Explain the difference between INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL OUTER JOIN.',
    ideal_answer: 'INNER JOIN: only matching rows. LEFT JOIN: all from left + matching from right. RIGHT JOIN: opposite. FULL OUTER JOIN: all rows from both.',
    tags: ['sql', 'joins'] },

  { role: 'Data Analyst', topic: 'SQL', category: 'technical', question_type: 'coding', difficulty: 'easy', experience_level: 'fresher',
    text: 'What is the difference between WHERE and HAVING in SQL?',
    ideal_answer: 'WHERE filters rows before aggregation. HAVING filters after GROUP BY. You cannot use aggregate functions in WHERE.',
    tags: ['sql', 'where', 'having'] },

  { role: 'Data Analyst', topic: 'SQL', category: 'technical', question_type: 'coding', difficulty: 'medium', experience_level: 'all',
    text: 'What are window functions in SQL? Give examples using ROW_NUMBER(), RANK(), and DENSE_RANK().',
    ideal_answer: 'Window functions calculate across related rows without collapsing them. ROW_NUMBER: unique sequential number. RANK: gaps for ties. DENSE_RANK: no gaps. All use OVER(PARTITION BY ... ORDER BY ...).',
    tags: ['sql', 'window-functions'] },

  { role: 'Data Analyst', topic: 'SQL', category: 'technical', question_type: 'coding', difficulty: 'hard', experience_level: '3+_years',
    text: 'Write a SQL query to identify users who made a purchase within their first 7 days of signup using CTEs.',
    ideal_answer: 'WITH first_purchase AS (SELECT user_id, MIN(date) as fp FROM orders GROUP BY user_id) SELECT u.id FROM users u JOIN first_purchase fp ON u.id=fp.user_id WHERE DATEDIFF(fp.fp, u.signup_date) <= 7;',
    tags: ['sql', 'cte'] },

  { role: 'Data Analyst', topic: 'Statistics', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'Explain mean, median, and mode. When is median a better measure than mean?',
    ideal_answer: 'Mean: average (sensitive to outliers). Median: middle value (robust). Mode: most frequent. Median better for skewed distributions like income or house prices.',
    tags: ['statistics', 'descriptive'] },

  { role: 'Data Analyst', topic: 'Statistics', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'How would you design an A/B test? Explain statistical significance and p-value.',
    ideal_answer: 'Define hypothesis, control/treatment groups, success metric. p-value: probability of results by chance. Significance level α=0.05. Sample size from power analysis (power=0.8). Run until minimum sample reached.',
    tags: ['statistics', 'ab-testing'] },

  { role: 'Data Analyst', topic: 'Statistics', category: 'technical', question_type: 'conceptual', difficulty: 'hard', experience_level: '3+_years',
    text: 'What is Simpson\'s Paradox? Give an example and explain how to handle it.',
    ideal_answer: 'Simpson\'s Paradox: a trend reverses when subgroups are combined (due to confounders). Example: a drug seems worse overall but better in every age group. Handle: stratify data, include confounders in analysis.',
    tags: ['statistics', 'confounding'] },

  { role: 'Data Analyst', topic: 'Behavioral', category: 'behavioral', question_type: 'behavioral', difficulty: 'medium', experience_level: 'all',
    text: 'Tell me about a data analysis project that directly influenced a business decision.',
    ideal_answer: 'Should describe data sources, analysis method, insight discovered, communication to stakeholders, measurable business outcome.',
    tags: ['behavioral', 'business-impact'] },

  // ══════════════════════════════════════════════════════════════════
  // DATA SCIENTIST
  // ══════════════════════════════════════════════════════════════════

  { role: 'Data Scientist', topic: 'Machine Learning', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'Explain the bias-variance tradeoff in machine learning.',
    ideal_answer: 'Bias: simplistic assumptions → underfitting. Variance: sensitivity to fluctuations → overfitting. Goal: balance both. High bias → high training error. High variance → low training high test error.',
    tags: ['ml', 'bias-variance'] },

  { role: 'Data Scientist', topic: 'Machine Learning', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What is the difference between supervised, unsupervised, and reinforcement learning?',
    ideal_answer: 'Supervised: labeled data (classification, regression). Unsupervised: no labels (clustering, dimensionality reduction). Reinforcement: agent learns by reward/punishment.',
    tags: ['ml', 'supervised'] },

  { role: 'Data Scientist', topic: 'Machine Learning', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'Compare Random Forest and XGBoost. How do bagging and boosting differ?',
    ideal_answer: 'Bagging (Random Forest): parallel trees on random subsets, reduces variance. Boosting (XGBoost): sequential trees correcting previous errors, reduces bias.',
    tags: ['ml', 'ensemble'] },

  { role: 'Data Scientist', topic: 'Machine Learning', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'What evaluation metrics would you use for a classification model? Explain precision, recall, F1, and AUC-ROC.',
    ideal_answer: 'Precision: correctness of positives. Recall: coverage of actual positives. F1: harmonic mean. AUC-ROC: discrimination across thresholds. Use F1 for imbalanced data.',
    tags: ['ml', 'evaluation'] },

  { role: 'Data Scientist', topic: 'Statistics', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: '1-2_years',
    text: 'How do you handle class imbalance in a classification dataset?',
    ideal_answer: 'SMOTE (oversampling minority), random undersampling, class weights in loss function, appropriate metrics (F1, ROC-AUC), ensemble methods like BalancedRandomForest.',
    tags: ['ml', 'class-imbalance'] },

  { role: 'Data Scientist', topic: 'Statistics', category: 'technical', question_type: 'conceptual', difficulty: 'hard', experience_level: '3+_years',
    text: 'Explain Bayesian vs frequentist statistics. What is a prior, likelihood, and posterior?',
    ideal_answer: 'Frequentist: probability as long-run frequency. Bayesian: probability as degree of belief. Bayes: posterior ∝ likelihood × prior. Bayesian updates beliefs with evidence.',
    tags: ['statistics', 'bayesian'] },

  { role: 'Data Scientist', topic: 'Behavioral', category: 'behavioral', question_type: 'behavioral', difficulty: 'medium', experience_level: 'all',
    text: 'Tell me about a machine learning model you built that underperformed in production. How did you debug and improve it?',
    ideal_answer: 'Should discuss data drift, feature importance, model monitoring, retraining strategy, iterative improvement.',
    tags: ['behavioral', 'ml-production'] },

  // ══════════════════════════════════════════════════════════════════
  // MACHINE LEARNING ENGINEER
  // ══════════════════════════════════════════════════════════════════

  { role: 'Machine Learning Engineer', topic: 'Deep Learning', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'Explain how gradient descent works in training neural networks. What are SGD, Adam, and RMSProp?',
    ideal_answer: 'Gradient descent minimizes loss by updating weights opposite to gradient. SGD: single sample. Mini-batch: subset. Adam: adaptive LR + momentum. RMSProp: adaptive LR.',
    tags: ['deep-learning', 'optimization'] },

  { role: 'Machine Learning Engineer', topic: 'Deep Learning', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What is backpropagation? How does it compute gradients through a neural network?',
    ideal_answer: 'Backpropagation uses the chain rule to compute gradients from output to input layer. Forward pass: compute output. Backward pass: compute gradients and update weights.',
    tags: ['deep-learning', 'backpropagation'] },

  { role: 'Machine Learning Engineer', topic: 'MLOps', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: '1-2_years',
    text: 'What is a feature store and why is it important in production ML systems?',
    ideal_answer: 'Feature store centralizes feature computation, storage, and serving. Prevents training-serving skew, enables reuse, provides point-in-time correctness.',
    tags: ['mlops', 'feature-store'] },

  { role: 'Machine Learning Engineer', topic: 'MLOps', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'What is model drift? How would you monitor and detect it in production?',
    ideal_answer: 'Data drift: input distribution changes. Concept drift: input-target relationship changes. Monitor: track feature distributions, model performance metrics, alerts for degradation. Retrain on fresh data.',
    tags: ['mlops', 'model-drift'] },

  { role: 'Machine Learning Engineer', topic: 'Transformers', category: 'technical', question_type: 'conceptual', difficulty: 'hard', experience_level: '3+_years',
    text: 'Explain the Transformer architecture and self-attention mechanism. How does it differ from RNNs?',
    ideal_answer: 'Transformers use self-attention to compute all position relationships simultaneously (O(n²)). RNNs: sequential O(n). Transformers: parallelizable, no vanishing gradient, better long-range. Key: Q, K, V matrices.',
    tags: ['transformers', 'attention'] },

  { role: 'Machine Learning Engineer', topic: 'Transformers', category: 'technical', question_type: 'conceptual', difficulty: 'hard', experience_level: '3+_years',
    text: 'Explain LoRA (Low-Rank Adaptation) for LLM fine-tuning. Why is it more efficient?',
    ideal_answer: 'LoRA adds trainable low-rank matrices (A×B, rank r << d) to frozen weights. Only A and B are trained (~0.1% of params). Memory-efficient, no catastrophic forgetting. Used for domain adaptation.',
    tags: ['transformers', 'lora', 'fine-tuning'] },

  { role: 'Machine Learning Engineer', topic: 'Behavioral', category: 'behavioral', question_type: 'behavioral', difficulty: 'medium', experience_level: 'all',
    text: 'How did you take a machine learning model from notebook stage to production API? What challenges did you face?',
    ideal_answer: 'Should describe containerization, API wrapper, model serialization, inference optimization, monitoring, CI/CD for model updates.',
    tags: ['behavioral', 'mlops'] },

  // ══════════════════════════════════════════════════════════════════
  // AI ENGINEER
  // ══════════════════════════════════════════════════════════════════

  { role: 'AI Engineer', topic: 'LLMs', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What is Retrieval-Augmented Generation (RAG)? How does it improve LLM responses?',
    ideal_answer: 'RAG retrieves relevant documents from a vector database and injects them into LLM context. Reduces hallucinations, enables access to up-to-date/private knowledge.',
    tags: ['ai', 'rag', 'llm'] },

  { role: 'AI Engineer', topic: 'LLMs', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What is prompt engineering? Explain few-shot prompting and chain-of-thought.',
    ideal_answer: 'Prompt engineering designs inputs to guide LLM outputs. Few-shot: provide examples in prompt. Chain-of-thought: ask model to reason step-by-step. Reduces hallucinations.',
    tags: ['prompt-engineering', 'llm'] },

  { role: 'AI Engineer', topic: 'Embeddings', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: '1-2_years',
    text: 'Explain vector embeddings and how similarity search works. What are HNSW and IVFFlat?',
    ideal_answer: 'Embeddings map semantic meaning to high-dimensional vectors. Similarity via cosine/dot product. HNSW: graph-based ANN. IVFFlat: inverted file index. ANN faster than exact but approximate.',
    tags: ['embeddings', 'vector-db'] },

  { role: 'AI Engineer', topic: 'Embeddings', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'What is the difference between semantic search and keyword search? When would you use vector search?',
    ideal_answer: 'Keyword search: exact term matching (BM25, TF-IDF). Semantic search: meaning-based via embeddings. Use semantic search for: natural language queries, paraphrase matching, cross-language search, recommendations.',
    tags: ['embeddings', 'semantic-search'] },

  { role: 'AI Engineer', topic: 'LLMs', category: 'technical', question_type: 'conceptual', difficulty: 'hard', experience_level: '3+_years',
    text: 'What are the key challenges of deploying LLMs in production? Explain token budgeting, latency, and cost strategies.',
    ideal_answer: 'Challenges: high latency (TTFT, TBT), cost (tokens), hallucination, context limits. Optimizations: streaming, KV-cache reuse, quantization, batching, caching frequent responses, model distillation.',
    tags: ['llm', 'production'] },

  { role: 'AI Engineer', topic: 'Behavioral', category: 'behavioral', question_type: 'behavioral', difficulty: 'medium', experience_level: 'all',
    text: 'Tell me about an AI application you built using an LLM API. What challenges with cost, latency, or reliability did you face?',
    ideal_answer: 'Should discuss prompt optimization, caching, model selection, timeouts/retries, rate limiting, cost monitoring, fallback strategies.',
    tags: ['behavioral', 'ai-engineering'] },

  // ══════════════════════════════════════════════════════════════════
  // CLOUD ENGINEER
  // ══════════════════════════════════════════════════════════════════

  { role: 'Cloud Engineer', topic: 'Cloud Fundamentals', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'Compare IaaS, PaaS, and SaaS with real-world examples from AWS or Azure.',
    ideal_answer: 'IaaS: EC2, VMs — raw infrastructure. PaaS: Elastic Beanstalk, App Service — deploy apps. SaaS: Gmail, Salesforce — software over internet. Higher abstraction = less management.',
    tags: ['cloud', 'iaas', 'paas'] },

  { role: 'Cloud Engineer', topic: 'Cloud Fundamentals', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What is serverless computing? Explain AWS Lambda and when to use or avoid it.',
    ideal_answer: 'Serverless: run code without managing servers, auto-scales, pay-per-execution. Lambda: event-driven functions. Use for irregular traffic, event processing. Avoid for: long-running processes, cold start-sensitive apps.',
    tags: ['cloud', 'serverless', 'lambda'] },

  { role: 'Cloud Engineer', topic: 'AWS', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'How do you secure a multi-tier application using VPCs, Security Groups, NACLs, and IAM in AWS?',
    ideal_answer: 'VPC: isolated network with public/private subnets. Security Groups: stateful, instance-level firewall. NACLs: stateless, subnet-level. IAM: least-privilege roles. Databases in private subnets.',
    tags: ['aws', 'security', 'vpc'] },

  { role: 'Cloud Engineer', topic: 'AWS', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'Explain the difference between AWS S3 storage classes. When would you use Standard, IA, or Glacier?',
    ideal_answer: 'Standard: frequent access. Standard-IA: infrequent, lower cost. Intelligent-Tiering: auto-tier by access patterns. Glacier: archival, retrieval in minutes-hours. Glacier Deep Archive: cheapest, 12h retrieval.',
    tags: ['aws', 's3', 'storage'] },

  { role: 'Cloud Engineer', topic: 'Infrastructure as Code', category: 'technical', question_type: 'conceptual', difficulty: 'hard', experience_level: '1-2_years',
    text: 'How does Terraform work? Explain state, providers, modules, and remote state.',
    ideal_answer: 'Terraform: declarative IaC. Providers: cloud API connectors. State: tracks real-world resources. Remote state: shared in S3/Terraform Cloud. Modules: reusable groups. Plan → Apply workflow.',
    tags: ['terraform', 'iac'] },

  { role: 'Cloud Engineer', topic: 'Infrastructure as Code', category: 'technical', question_type: 'conceptual', difficulty: 'hard', experience_level: '3+_years',
    text: 'What is GitOps? How does it differ from traditional CI/CD and what are its benefits?',
    ideal_answer: 'GitOps: Git as source of truth for infrastructure. Changes via PRs, automated reconciliation. Tools: ArgoCD, Flux. Benefits: audit trail, rollback via git revert, declarative state. CI/CD is imperative, GitOps is declarative.',
    tags: ['gitops', 'cicd', 'kubernetes'] },

  { role: 'Cloud Engineer', topic: 'Behavioral', category: 'behavioral', question_type: 'behavioral', difficulty: 'medium', experience_level: 'all',
    text: 'Describe how you optimized cloud infrastructure costs without sacrificing performance.',
    ideal_answer: 'Should mention Reserved Instances, Spot Instances, right-sizing, auto-scaling, shutting down unused resources, managed services.',
    tags: ['behavioral', 'finops'] },

  // ══════════════════════════════════════════════════════════════════
  // DEVOPS ENGINEER
  // ══════════════════════════════════════════════════════════════════

  { role: 'DevOps Engineer', topic: 'Docker', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What is Docker? How does a Docker container differ from a virtual machine?',
    ideal_answer: 'Containers share host OS kernel (lightweight, fast startup, MB). VMs: full OS per VM (heavyweight, GB). Containers: isolated process with namespaces and cgroups.',
    tags: ['docker', 'containers'] },

  { role: 'DevOps Engineer', topic: 'Docker', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'Explain multi-stage builds in Docker. Why are they important for production images?',
    ideal_answer: 'Multi-stage: multiple FROM statements. Build stage compiles with all tools. Final stage copies only artifacts into minimal base image. Result: smaller image, faster pull, reduced attack surface.',
    tags: ['docker', 'multi-stage'] },

  { role: 'DevOps Engineer', topic: 'Kubernetes', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What is Kubernetes and why is it used for container orchestration?',
    ideal_answer: 'Kubernetes (k8s) automates deployment, scaling, and management of containers. Features: self-healing, service discovery, auto-scaling, rolling updates, load balancing.',
    tags: ['kubernetes', 'k8s'] },

  { role: 'DevOps Engineer', topic: 'Kubernetes', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: '1-2_years',
    text: 'Explain Kubernetes architecture. What are pods, deployments, services, and ingress?',
    ideal_answer: 'Master: API server, etcd, scheduler. Worker: kubelet, kube-proxy. Pod: smallest unit. Deployment: manages replicas. Service: stable network endpoint. Ingress: HTTP routing.',
    tags: ['kubernetes', 'architecture'] },

  { role: 'DevOps Engineer', topic: 'Kubernetes', category: 'technical', question_type: 'conceptual', difficulty: 'hard', experience_level: '3+_years',
    text: 'What is a Kubernetes operator? How does the operator pattern extend Kubernetes?',
    ideal_answer: 'Operators are custom controllers managing complex stateful apps using CRDs. They encode operational knowledge: provisioning, scaling, backup, upgrade. Examples: etcd-operator, postgres-operator. Follows observe-analyze-act loop.',
    tags: ['kubernetes', 'operator', 'crds'] },

  { role: 'DevOps Engineer', topic: 'CI/CD', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'How would you design a CI/CD pipeline for a Node.js application? What stages would you include?',
    ideal_answer: 'Code Commit → Lint → Unit Tests → Build Docker → Integration Tests → Security Scan → Push to Registry → Deploy Staging → Smoke Tests → Deploy Production (Blue/Green or Canary).',
    tags: ['cicd', 'devops', 'pipeline'] },

  { role: 'DevOps Engineer', topic: 'CI/CD', category: 'technical', question_type: 'conceptual', difficulty: 'hard', experience_level: '3+_years',
    text: 'Explain blue-green vs canary deployments. What are the tradeoffs of each strategy?',
    ideal_answer: 'Blue-Green: maintain two identical environments, switch all traffic at once. Fast rollback but doubles infrastructure. Canary: gradually shift traffic to new version. Slower but lower risk — detect issues before full rollout. Canary requires feature flags or weighted routing.',
    tags: ['cicd', 'deployments', 'blue-green', 'canary'] },

  { role: 'DevOps Engineer', topic: 'Behavioral', category: 'behavioral', question_type: 'behavioral', difficulty: 'medium', experience_level: 'all',
    text: 'Tell me about a critical production outage you had to triage. How did you handle it under pressure?',
    ideal_answer: 'Should describe: incident detection, communication, isolation of issue, rollback vs fix, post-mortem, preventive measures.',
    tags: ['behavioral', 'incident-response'] },

  // ══════════════════════════════════════════════════════════════════
  // CYBERSECURITY ANALYST
  // ══════════════════════════════════════════════════════════════════

  { role: 'Cybersecurity Analyst', topic: 'Security Fundamentals', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'Explain the OWASP Top 10. What are SQL Injection and Cross-Site Scripting (XSS)?',
    ideal_answer: 'OWASP Top 10: most critical web vulnerabilities. SQLi: attacker injects SQL via input fields. XSS: malicious scripts injected into pages. Mitigate with parameterized queries and output encoding.',
    tags: ['security', 'owasp'] },

  { role: 'Cybersecurity Analyst', topic: 'Security Fundamentals', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What is the difference between authentication and authorization?',
    ideal_answer: 'Authentication: verifying who you are (password, MFA, biometrics). Authorization: what you are allowed to do (RBAC, ACL, permissions). Login is auth, accessing admin panel is authz.',
    tags: ['security', 'authentication'] },

  { role: 'Cybersecurity Analyst', topic: 'Security Fundamentals', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'What is the principle of least privilege and how is it applied in system security?',
    ideal_answer: 'Least privilege: grant only the minimum permissions needed to perform a task. Applied via: IAM roles, user access reviews, separating dev/prod access, service accounts with limited scopes. Reduces blast radius if account is compromised.',
    tags: ['security', 'least-privilege'] },

  { role: 'Cybersecurity Analyst', topic: 'Cryptography', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'Explain symmetric vs asymmetric encryption. How does TLS use both?',
    ideal_answer: 'Symmetric: same key (AES) — fast. Asymmetric: public/private key (RSA) — slow but enables key exchange. TLS: RSA/ECDHE for key exchange, then AES for bulk encryption.',
    tags: ['cryptography', 'tls'] },

  { role: 'Cybersecurity Analyst', topic: 'Cryptography', category: 'technical', question_type: 'conceptual', difficulty: 'hard', experience_level: '3+_years',
    text: 'What is a zero-knowledge proof? Explain its properties and a practical use case.',
    ideal_answer: 'ZKP: prove knowledge of a secret without revealing it. Properties: completeness, soundness, zero-knowledge. Use cases: blockchain privacy, anonymous credentials, password verification without transmitting password.',
    tags: ['cryptography', 'zero-knowledge'] },

  { role: 'Cybersecurity Analyst', topic: 'Behavioral', category: 'behavioral', question_type: 'behavioral', difficulty: 'medium', experience_level: 'all',
    text: 'Tell me about a time you identified a security vulnerability. How did you report and remediate it?',
    ideal_answer: 'Should cover: discovery method, severity assessment, responsible disclosure, working with developers on fix, verification, documentation.',
    tags: ['behavioral', 'vulnerability'] },

  // ══════════════════════════════════════════════════════════════════
  // QA / TEST ENGINEER
  // ══════════════════════════════════════════════════════════════════

  { role: 'QA / Test Engineer', topic: 'Testing Fundamentals', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'Explain the testing pyramid. What are unit, integration, and end-to-end tests?',
    ideal_answer: 'Testing pyramid: Unit (base, many, fast, isolated) → Integration (test component interaction) → E2E (top, few, slow, full user journey). More unit tests = cheaper.',
    tags: ['testing', 'unit-test'] },

  { role: 'QA / Test Engineer', topic: 'Testing Fundamentals', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What is the difference between black-box testing and white-box testing?',
    ideal_answer: 'Black-box: tests functionality without internal code knowledge — focuses on input/output. White-box: tests internal code paths and branch coverage.',
    tags: ['testing', 'black-box'] },

  { role: 'QA / Test Engineer', topic: 'Testing Fundamentals', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'What is regression testing and when should it be run?',
    ideal_answer: 'Regression testing ensures new changes do not break existing functionality. Run: on every PR/commit (automated), before releases, after bug fixes. Maintain a regression suite of critical user flows and previously found bugs.',
    tags: ['testing', 'regression'] },

  { role: 'QA / Test Engineer', topic: 'Test Automation', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: '1-2_years',
    text: 'What is the Page Object Model (POM) pattern in test automation?',
    ideal_answer: 'POM: each page has a separate class with locators and methods. Benefits: separation of concerns, reusability, maintainability — UI changes only require updating the page class.',
    tags: ['automation', 'pom'] },

  { role: 'QA / Test Engineer', topic: 'Test Automation', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'How would you design an API testing strategy? What tools and types of tests would you include?',
    ideal_answer: 'API testing: contract testing (Pact), functional (Postman/Newman), load (k6, JMeter), security (OWASP ZAP). Test: correct status codes, response schemas, edge cases, auth, error handling.',
    tags: ['testing', 'api-testing'] },

  { role: 'QA / Test Engineer', topic: 'Behavioral', category: 'behavioral', question_type: 'behavioral', difficulty: 'medium', experience_level: 'all',
    text: 'Tell me about a critical bug that reached production despite your testing. What happened and what changed?',
    ideal_answer: 'Show ownership, root cause analysis, missing test coverage, additions to regression suite, process improvements.',
    tags: ['behavioral', 'qa'] },

  // ══════════════════════════════════════════════════════════════════
  // HR
  // ══════════════════════════════════════════════════════════════════

  { role: 'HR', topic: 'Self Introduction', category: 'hr', question_type: 'hr', difficulty: 'easy', experience_level: 'fresher',
    text: 'Tell me about yourself. Walk me through your background and what brings you to this role.',
    ideal_answer: 'Education/background → key experience → skills relevant to role → why this company. Concise, structured, enthusiastic.',
    tags: ['hr', 'introduction'] },

  { role: 'HR', topic: 'Self Introduction', category: 'hr', question_type: 'hr', difficulty: 'easy', experience_level: 'all',
    text: 'Walk me through your resume. What are the most relevant experiences for this role?',
    ideal_answer: 'Curate relevant experience, explain decisions (why you moved roles), show growth arc, connect experiences to target role.',
    tags: ['hr', 'resume'] },

  { role: 'HR', topic: 'Strengths & Weaknesses', category: 'hr', question_type: 'hr', difficulty: 'easy', experience_level: 'all',
    text: 'What are your greatest strengths and weaknesses?',
    ideal_answer: 'Strengths: specific, relevant with example. Weakness: genuine but not disqualifying, show self-awareness and active improvement. Avoid clichés.',
    tags: ['hr', 'self-awareness'] },

  { role: 'HR', topic: 'Career Goals', category: 'hr', question_type: 'hr', difficulty: 'easy', experience_level: 'all',
    text: 'Where do you see yourself in 5 years? How does this role fit into your long-term career goals?',
    ideal_answer: 'Align with company growth opportunities. Show ambition balanced with realistic plans. Tie personal goals to value they provide to the company.',
    tags: ['hr', 'career-goals'] },

  { role: 'HR', topic: 'Conflict Resolution', category: 'hr', question_type: 'hr', difficulty: 'medium', experience_level: 'all',
    text: 'Tell me about a conflict you had with a colleague or manager. How did you resolve it?',
    ideal_answer: 'STAR: active listening, empathy, data-driven discussion, compromise or escalation, positive resolution. Avoid blaming.',
    tags: ['hr', 'conflict'] },

  { role: 'HR', topic: 'Teamwork', category: 'hr', question_type: 'hr', difficulty: 'medium', experience_level: 'all',
    text: 'Describe a situation where you worked closely with a difficult team member. How did you handle it?',
    ideal_answer: 'STAR: empathy, professional communication, understanding their perspective, constructive resolution.',
    tags: ['hr', 'teamwork'] },

  { role: 'HR', topic: 'Teamwork', category: 'hr', question_type: 'hr', difficulty: 'medium', experience_level: 'all',
    text: 'Tell me about a time you had to work with a remote or cross-timezone team. What challenges did you face?',
    ideal_answer: 'Communication strategies, async vs sync work balance, documentation practices, building rapport remotely, and successful collaboration.',
    tags: ['hr', 'remote-work'] },

  { role: 'HR', topic: 'Leadership', category: 'hr', question_type: 'hr', difficulty: 'hard', experience_level: '3+_years',
    text: 'Tell me about a time you had to influence a decision without formal authority.',
    ideal_answer: 'Shows leadership without title. Should describe: building credibility with data, understanding stakeholder concerns, finding common ground, achieving alignment.',
    tags: ['hr', 'leadership'] },

  // ══════════════════════════════════════════════════════════════════
  // PYTHON DEVELOPER
  // ══════════════════════════════════════════════════════════════════

  { role: 'Python Developer', topic: 'Python Fundamentals', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What is the Global Interpreter Lock (GIL) in Python? How does it affect multithreading vs multiprocessing?',
    ideal_answer: 'GIL allows only one thread to execute Python bytecode at a time. Threads: good for I/O-bound. Processes: true parallelism for CPU-bound. Use threading for I/O, multiprocessing for CPU.',
    tags: ['python', 'gil'] },

  { role: 'Python Developer', topic: 'Python Fundamentals', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What are Python list comprehensions? How are they different from a regular for loop?',
    ideal_answer: 'List comprehensions: concise [expr for item in iterable if condition]. More readable and generally faster. Also have set, dict, and generator comprehensions.',
    tags: ['python', 'list-comprehension'] },

  { role: 'Python Developer', topic: 'Python Fundamentals', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'Explain Python generators vs iterators. How does the yield keyword work?',
    ideal_answer: 'Iterator: __iter__ and __next__. Generator: function with yield, creates iterator lazily. yield suspends execution and returns value, resumes on next(). Memory efficient.',
    tags: ['python', 'generators'] },

  { role: 'Python Developer', topic: 'Python Fundamentals', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'What are Python decorators? Provide a practical example.',
    ideal_answer: 'Decorators wrap functions to add behavior. @decorator syntax. Common uses: logging, auth, caching (functools.lru_cache), timing. Use closure to maintain reference to original function.',
    tags: ['python', 'decorators'] },

  { role: 'Python Developer', topic: 'Python Fundamentals', category: 'technical', question_type: 'conceptual', difficulty: 'hard', experience_level: '3+_years',
    text: 'Explain Python metaclasses. What is the difference between a class and a metaclass?',
    ideal_answer: 'Metaclass: class whose instances are classes. type is the default metaclass. Uses: ORMs (Django models), API frameworks, enforcing class invariants. Custom: class MyMeta(type): def __new__(cls, name, bases, dict).',
    tags: ['python', 'metaclass'] },

  { role: 'Python Developer', topic: 'Behavioral', category: 'behavioral', question_type: 'behavioral', difficulty: 'medium', experience_level: 'all',
    text: 'Tell me about a Python project where you had to optimize performance. What tools did you use?',
    ideal_answer: 'Should mention profiling (cProfile, line_profiler), bottlenecks, generators, NumPy vectorization, Cython/Numba, or async/await for I/O.',
    tags: ['behavioral', 'python'] },

  // ══════════════════════════════════════════════════════════════════
  // JAVA DEVELOPER
  // ══════════════════════════════════════════════════════════════════

  { role: 'Java Developer', topic: 'Java Fundamentals', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'What is the difference between HashMap, LinkedHashMap, TreeMap, and ConcurrentHashMap?',
    ideal_answer: 'HashMap: no order, O(1). LinkedHashMap: insertion order. TreeMap: sorted by key, O(log n). ConcurrentHashMap: thread-safe, no null keys.',
    tags: ['java', 'collections'] },

  { role: 'Java Developer', topic: 'Java Fundamentals', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'Explain Java\'s memory model: stack vs heap. What is stored in each?',
    ideal_answer: 'Stack: method frames, local variables, references (per thread, fast). Heap: all objects (shared, GC managed). Primitives in stack, objects in heap.',
    tags: ['java', 'memory'] },

  { role: 'Java Developer', topic: 'JVM', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: '1-2_years',
    text: 'How does Java Garbage Collection work? Explain Young, Old, and Metaspace.',
    ideal_answer: 'Young Gen: Eden + Survivor (Minor GC). Old Gen: Major GC. Metaspace: class metadata. G1: regional. ZGC: low latency. Objects promoted when surviving multiple minor GCs.',
    tags: ['java', 'gc'] },

  { role: 'Java Developer', topic: 'Spring Boot', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: '1-2_years',
    text: 'Explain Spring Boot auto-configuration and how @Transactional works under the hood.',
    ideal_answer: 'Auto-configuration: scans classpath, configures beans conditionally. @Transactional: AOP proxy wraps method in transaction. Default propagation: REQUIRED.',
    tags: ['java', 'spring-boot'] },

  { role: 'Java Developer', topic: 'Spring Boot', category: 'technical', question_type: 'conceptual', difficulty: 'hard', experience_level: '3+_years',
    text: 'Explain reactive programming in Spring WebFlux. How does it differ from Spring MVC?',
    ideal_answer: 'WebFlux: non-blocking reactive programming using Reactor (Mono, Flux). Uses Netty. Better for high-concurrency I/O-bound. MVC: blocking thread-per-request, simpler. Use WebFlux for streaming, backpressure scenarios.',
    tags: ['java', 'webflux', 'reactive'] },

  { role: 'Java Developer', topic: 'Behavioral', category: 'behavioral', question_type: 'behavioral', difficulty: 'medium', experience_level: 'all',
    text: 'Tell me about a Java project where you had to deal with concurrency issues. How did you resolve them?',
    ideal_answer: 'Should describe race condition or deadlock, use of synchronized/ReentrantLock/volatile, thread-safe collections, profiling tools, resolution.',
    tags: ['behavioral', 'java'] },

  // ══════════════════════════════════════════════════════════════════
  // C++ DEVELOPER
  // ══════════════════════════════════════════════════════════════════

  { role: 'C++ Developer', topic: 'Memory Management', category: 'technical', question_type: 'conceptual', difficulty: 'easy', experience_level: 'fresher',
    text: 'Explain smart pointers in C++. What are unique_ptr, shared_ptr, and weak_ptr?',
    ideal_answer: 'unique_ptr: sole ownership, non-copyable. shared_ptr: reference counted. weak_ptr: non-owning, breaks circular references. All auto-release memory.',
    tags: ['cpp', 'smart-pointers'] },

  { role: 'C++ Developer', topic: 'Memory Management', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'What is RAII (Resource Acquisition Is Initialization) in C++? How does it prevent resource leaks?',
    ideal_answer: 'RAII: tie resource lifetime to object lifetime. Acquire in constructor, release in destructor. Destructors called automatically on scope exit, even on exceptions. Examples: smart pointers, lock_guard, fstream.',
    tags: ['cpp', 'raii'] },

  { role: 'C++ Developer', topic: 'C++ Fundamentals', category: 'technical', question_type: 'conceptual', difficulty: 'medium', experience_level: 'all',
    text: 'Explain move semantics in C++11. What is std::move and rvalue references (&&)?',
    ideal_answer: 'Rvalue references (&&) bind to temporaries. Move semantics transfer resources instead of copying. std::move casts to rvalue. Eliminates unnecessary deep copies.',
    tags: ['cpp', 'move-semantics'] },

  { role: 'C++ Developer', topic: 'C++ Fundamentals', category: 'technical', question_type: 'conceptual', difficulty: 'hard', experience_level: '3+_years',
    text: 'Explain template metaprogramming in C++. What are variadic templates and constexpr?',
    ideal_answer: 'TMP: compile-time computation via templates. Variadic templates: any number of template args. constexpr: evaluated at compile time. Used for: type traits, tuple, zero-overhead abstractions.',
    tags: ['cpp', 'templates'] },

  { role: 'C++ Developer', topic: 'Behavioral', category: 'behavioral', question_type: 'behavioral', difficulty: 'medium', experience_level: 'all',
    text: 'Tell me about a time you tracked down a memory leak or segmentation fault. What tools did you use?',
    ideal_answer: 'Should mention Valgrind, AddressSanitizer, GDB, systematic debugging approach, smart pointers as prevention.',
    tags: ['behavioral', 'cpp'] },

];

// ─────────────────────────────────────────────────────────────────────────────

const seedQuestions = async () => {
  try {
    await connectDB();
    console.log('🗑️  Clearing existing questions...');
    await Question.deleteMany({});

    console.log(`🌱 Seeding ${questions.length} questions across all roles and topics...`);
    const inserted = await Question.insertMany(questions, { ordered: false });
    console.log(`✅ Successfully seeded ${inserted.length} questions!\n`);

    // Summary
    const summary = await Question.aggregate([
      { $group: { _id: { role: '$role', topic: '$topic', difficulty: '$difficulty' }, count: { $sum: 1 } } },
      { $sort: { '_id.role': 1, '_id.topic': 1, '_id.difficulty': 1 } },
    ]);

    console.log('📊 Questions by role + topic + difficulty:');
    let lastRole = '';
    summary.forEach(({ _id, count }) => {
      if (_id.role !== lastRole) { console.log(`\n  ${_id.role}:`); lastRole = _id.role; }
      console.log(`    ${_id.topic} [${_id.difficulty}]: ${count} questions`);
    });

    const total = await Question.countDocuments();
    console.log(`\n✅ Total questions in DB: ${total}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedQuestions();
