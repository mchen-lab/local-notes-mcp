// Native fetch is available in Node 24

const API_URL = 'http://localhost:31111'; 

const USERNAME = 'admin';
const PASSWORD = 'adminpassword';

// Complex Markdown Notes with various features
const COMPLEX_NOTES = [
    {
        title: "System Architecture Overview",
        content: `# System Architecture Overview

This document outlines our microservices architecture and key design decisions.

## Architecture Diagram

\`\`\`mermaid
flowchart TB
    subgraph Client Layer
        Web[Web App]
        Mobile[Mobile App]
        CLI[CLI Tool]
    end
    
    subgraph API Gateway
        Gateway[Kong Gateway]
        Auth[Auth Service]
    end
    
    subgraph Services
        UserSvc[User Service]
        OrderSvc[Order Service]
        PaymentSvc[Payment Service]
        NotifySvc[Notification Service]
    end
    
    subgraph Data Layer
        PG[(PostgreSQL)]
        Redis[(Redis Cache)]
        S3[(S3 Storage)]
    end
    
    Web --> Gateway
    Mobile --> Gateway
    CLI --> Gateway
    Gateway --> Auth
    Auth --> UserSvc
    Gateway --> OrderSvc
    Gateway --> PaymentSvc
    OrderSvc --> NotifySvc
    
    UserSvc --> PG
    OrderSvc --> PG
    PaymentSvc --> PG
    UserSvc --> Redis
    OrderSvc --> S3
\`\`\`

## Key Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| API Gateway | Kong | Rate limiting, routing, SSL termination |
| Auth Service | Node.js + JWT | Authentication & Authorization |
| User Service | Go | User management, profiles |
| Order Service | Python/FastAPI | Order processing |
| Payment Service | Java/Spring | Payment processing |
| Notification | Node.js | Email, SMS, Push notifications |

## Deployment Strategy

1. **Blue-Green Deployment** for zero-downtime releases
2. **Canary Releases** for high-risk changes
3. **Feature Flags** for gradual rollouts

> **Note**: All services must implement health checks and graceful shutdown.
`,
        favorite: true
    },
    {
        title: "JavaScript Best Practices Guide",
        content: `# JavaScript Best Practices Guide

A comprehensive guide on writing clean, maintainable JavaScript code.

## Modern ES6+ Features

### Destructuring

\`\`\`javascript
// Object destructuring
const { name, age, city = 'Unknown' } = user;

// Array destructuring with rest
const [first, second, ...rest] = numbers;

// Nested destructuring
const { 
    address: { 
        street, 
        zipCode 
    } 
} = person;
\`\`\`

### Async/Await Patterns

\`\`\`javascript
// Sequential execution
async function fetchUserData(userId) {
    try {
        const user = await getUser(userId);
        const posts = await getPosts(user.id);
        const comments = await getComments(posts[0].id);
        return { user, posts, comments };
    } catch (error) {
        console.error('Failed to fetch data:', error);
        throw error;
    }
}

// Parallel execution with Promise.all
async function fetchAllData(userIds) {
    const users = await Promise.all(
        userIds.map(id => getUser(id))
    );
    return users;
}

// Error handling with Promise.allSettled
async function fetchWithFallback(urls) {
    const results = await Promise.allSettled(
        urls.map(url => fetch(url))
    );
    
    return results.map((result, index) => ({
        url: urls[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' 
            ? result.value 
            : null
    }));
}
\`\`\`

## Code Quality Checklist

- [ ] Use \`const\` by default, \`let\` when reassignment needed
- [ ] Prefer arrow functions for callbacks
- [ ] Use template literals for string interpolation
- [ ] Implement proper error handling
- [ ] Add JSDoc comments for public APIs
- [x] Configure ESLint with recommended rules
- [x] Set up Prettier for code formatting

## Performance Tips

1. **Memoization** for expensive calculations
2. **Debouncing** for frequent event handlers
3. **Lazy loading** for large modules
4. **Web Workers** for CPU-intensive tasks
`,
        favorite: true
    },
    {
        title: "Database Schema Design",
        content: `# Database Schema Design

## Entity Relationship Diagram

\`\`\`mermaid
erDiagram
    USERS ||--o{ ORDERS : places
    USERS ||--o{ REVIEWS : writes
    USERS {
        int id PK
        string email UK
        string name
        timestamp created_at
    }
    ORDERS ||--|{ ORDER_ITEMS : contains
    ORDERS {
        int id PK
        int user_id FK
        decimal total
        string status
        timestamp created_at
    }
    ORDER_ITEMS }|--|| PRODUCTS : includes
    ORDER_ITEMS {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal price
    }
    PRODUCTS ||--o{ REVIEWS : has
    PRODUCTS {
        int id PK
        string name
        text description
        decimal price
        int stock
    }
    REVIEWS {
        int id PK
        int user_id FK
        int product_id FK
        int rating
        text content
    }
\`\`\`

## SQL Schema Definition

\`\`\`sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table with full-text search
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0,
    search_vector TSVECTOR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create GIN index for full-text search
CREATE INDEX idx_products_search ON products 
    USING GIN(search_vector);

-- Trigger to update search vector
CREATE TRIGGER products_search_update
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION
    tsvector_update_trigger(
        search_vector, 'pg_catalog.english', name, description
    );
\`\`\`

## Index Strategy

| Table | Column(s) | Index Type | Reason |
|-------|-----------|------------|--------|
| users | email | B-Tree (Unique) | Login lookups |
| orders | user_id, created_at | Composite | User order history |
| products | search_vector | GIN | Full-text search |
| order_items | order_id | B-Tree | Order detail fetching |
| reviews | product_id, rating | Composite | Product ratings |

## Query Optimization Notes

1. Always use **parameterized queries** to prevent SQL injection
2. Implement **pagination** with keyset (cursor) for large datasets
3. Use **EXPLAIN ANALYZE** to identify slow queries
4. Consider **read replicas** for heavy read workloads
`,
        favorite: false
    },
    {
        title: "Python Data Pipeline",
        content: `# Python Data Pipeline

End-to-end data processing pipeline using Python.

## Pipeline Flow

\`\`\`mermaid
graph LR
    A[Data Sources] --> B[Extraction]
    B --> C[Validation]
    C --> D[Transformation]
    D --> E[Loading]
    E --> F[Data Warehouse]
    
    C -->|Invalid| G[Error Queue]
    G --> H[Manual Review]
    H --> C
\`\`\`

## Core Pipeline Code

\`\`\`python
from dataclasses import dataclass
from typing import List, Optional, Generator
from datetime import datetime
import pandas as pd
import asyncio
import aiohttp

@dataclass
class PipelineConfig:
    """Configuration for the data pipeline."""
    source_url: str
    batch_size: int = 1000
    max_retries: int = 3
    timeout_seconds: int = 30

class DataPipeline:
    """
    Main data pipeline orchestrator.
    
    Handles extraction, transformation, and loading
    of data from various sources to the warehouse.
    """
    
    def __init__(self, config: PipelineConfig):
        self.config = config
        self.metrics = {
            'processed': 0,
            'failed': 0,
            'started_at': None
        }
    
    async def extract(self) -> Generator[dict, None, None]:
        """Extract data from source in batches."""
        async with aiohttp.ClientSession() as session:
            offset = 0
            while True:
                async with session.get(
                    self.config.source_url,
                    params={
                        'offset': offset,
                        'limit': self.config.batch_size
                    }
                ) as response:
                    data = await response.json()
                    if not data:
                        break
                    yield data
                    offset += self.config.batch_size
    
    def transform(self, records: List[dict]) -> pd.DataFrame:
        """Apply transformations to raw data."""
        df = pd.DataFrame(records)
        
        # Data cleaning
        df = df.dropna(subset=['id', 'timestamp'])
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Feature engineering
        df['day_of_week'] = df['timestamp'].dt.dayofweek
        df['hour'] = df['timestamp'].dt.hour
        df['is_weekend'] = df['day_of_week'].isin([5, 6])
        
        return df
    
    async def run(self) -> dict:
        """Execute the full pipeline."""
        self.metrics['started_at'] = datetime.now()
        
        async for batch in self.extract():
            try:
                df = self.transform(batch)
                await self.load(df)
                self.metrics['processed'] += len(df)
            except Exception as e:
                self.metrics['failed'] += len(batch)
                await self.handle_error(e, batch)
        
        return self.metrics


# Usage example
if __name__ == '__main__':
    config = PipelineConfig(
        source_url='https://api.example.com/data',
        batch_size=500
    )
    pipeline = DataPipeline(config)
    results = asyncio.run(pipeline.run())
    print(f"Processed: {results['processed']}, Failed: {results['failed']}")
\`\`\`

## Monitoring Checklist

- [x] Set up logging with structured JSON format
- [x] Configure Prometheus metrics endpoint
- [ ] Create Grafana dashboard
- [ ] Set up PagerDuty alerts
- [ ] Implement dead letter queue monitoring
`,
        favorite: true
    },
    {
        title: "API Documentation Standards",
        content: `# API Documentation Standards

Guidelines for creating consistent, comprehensive API documentation.

## Endpoint Structure

\`\`\`
[METHOD] /api/v1/{resource}[/{id}][/{sub-resource}]
\`\`\`

## HTTP Methods Reference

| Method | Purpose | Idempotent | Request Body |
|--------|---------|------------|--------------|
| GET | Retrieve resources | ✅ Yes | ❌ No |
| POST | Create new resource | ❌ No | ✅ Yes |
| PUT | Replace resource | ✅ Yes | ✅ Yes |
| PATCH | Partial update | ✅ Yes | ✅ Yes |
| DELETE | Remove resource | ✅ Yes | ❌ No |

## Response Format

All API responses follow this structure:

\`\`\`json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "Example Resource",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 150,
    "totalPages": 8
  }
}
\`\`\`

## Error Response Format

\`\`\`json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address"
      },
      {
        "field": "age",
        "message": "Must be a positive integer"
      }
    ]
  },
  "requestId": "req_abc123xyz"
}
\`\`\`

## Status Codes

### Success Codes
- \`200 OK\` - Request succeeded
- \`201 Created\` - Resource created successfully
- \`204 No Content\` - Request succeeded, no response body

### Client Error Codes
- \`400 Bad Request\` - Invalid request syntax
- \`401 Unauthorized\` - Authentication required
- \`403 Forbidden\` - Permission denied
- \`404 Not Found\` - Resource doesn't exist
- \`422 Unprocessable Entity\` - Validation failed
- \`429 Too Many Requests\` - Rate limit exceeded

### Server Error Codes
- \`500 Internal Server Error\` - Unexpected server error
- \`502 Bad Gateway\` - Upstream service error
- \`503 Service Unavailable\` - Maintenance mode

## Authentication Header

\`\`\`bash
# Bearer token authentication
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \\
     https://api.example.com/v1/users

# API key authentication
curl -H "X-API-Key: sk_live_abc123..." \\
     https://api.example.com/v1/users
\`\`\`

## Rate Limiting Headers

| Header | Description |
|--------|-------------|
| \`X-RateLimit-Limit\` | Max requests per window |
| \`X-RateLimit-Remaining\` | Requests remaining |
| \`X-RateLimit-Reset\` | Unix timestamp of reset |
`,
        favorite: false
    },
    {
        title: "Git Workflow & Branch Strategy",
        content: `# Git Workflow & Branch Strategy

Our branching strategy based on GitFlow with modifications.

## Branch Flow

\`\`\`mermaid
gitGraph
    commit id: "initial"
    branch develop
    checkout develop
    commit id: "dev-start"
    branch feature/user-auth
    checkout feature/user-auth
    commit id: "auth-1"
    commit id: "auth-2"
    checkout develop
    merge feature/user-auth
    branch release/1.0
    checkout release/1.0
    commit id: "bump-version"
    checkout main
    merge release/1.0 tag: "v1.0.0"
    checkout develop
    merge release/1.0
    branch hotfix/security
    checkout hotfix/security
    commit id: "fix-vuln"
    checkout main
    merge hotfix/security tag: "v1.0.1"
    checkout develop
    merge hotfix/security
\`\`\`

## Branch Naming Convention

| Branch Type | Pattern | Example |
|-------------|---------|---------|
| Feature | \`feature/{ticket}-{description}\` | \`feature/PROJ-123-user-login\` |
| Bugfix | \`bugfix/{ticket}-{description}\` | \`bugfix/PROJ-456-cart-total\` |
| Hotfix | \`hotfix/{description}\` | \`hotfix/security-patch\` |
| Release | \`release/{version}\` | \`release/2.1.0\` |

## Commit Message Format

\`\`\`
<type>(<scope>): <subject>

<body>

<footer>
\`\`\`

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only
- **style**: Formatting, missing semicolons, etc.
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvement
- **test**: Adding missing tests
- **chore**: Maintenance tasks

### Example

\`\`\`bash
feat(auth): implement OAuth2 login with Google

- Add Google OAuth2 provider configuration
- Create callback handler for token exchange
- Store refresh tokens securely in database
- Add logout endpoint to revoke tokens

Closes #123
\`\`\`

## Pull Request Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No merge conflicts
- [ ] CI pipeline passes
- [x] Branch is up to date with target

## Useful Git Commands

\`\`\`bash
# Interactive rebase last 3 commits
git rebase -i HEAD~3

# Squash all commits into one
git rebase -i --root

# Cherry-pick specific commit
git cherry-pick abc123

# Undo last commit, keep changes
git reset --soft HEAD~1

# Show commit history as graph
git log --oneline --graph --all

# Clean up local branches
git fetch -p && git branch -vv | grep ': gone]' | awk '{print $1}' | xargs git branch -D
\`\`\`
`,
        favorite: true
    },
    {
        title: "Docker & Kubernetes Cheatsheet",
        content: `# Docker & Kubernetes Cheatsheet

Quick reference for containerization and orchestration.

## Kubernetes Architecture

\`\`\`mermaid
graph TB
    subgraph Control Plane
        API[API Server]
        ETCD[(etcd)]
        SCHED[Scheduler]
        CM[Controller Manager]
    end
    
    subgraph Worker Node 1
        KUBELET1[Kubelet]
        PROXY1[Kube Proxy]
        POD1A[Pod A]
        POD1B[Pod B]
    end
    
    subgraph Worker Node 2
        KUBELET2[Kubelet]
        PROXY2[Kube Proxy]
        POD2A[Pod C]
        POD2B[Pod D]
    end
    
    API --> ETCD
    SCHED --> API
    CM --> API
    KUBELET1 --> API
    KUBELET2 --> API
\`\`\`

## Docker Commands

\`\`\`bash
# Build image with tag
docker build -t myapp:1.0 .

# Run container with port mapping and volume
docker run -d \\
  --name myapp \\
  -p 8080:80 \\
  -v $(pwd)/data:/app/data \\
  -e NODE_ENV=production \\
  myapp:1.0

# Multi-stage build example
docker build --target production -t myapp:prod .

# View logs with tail
docker logs -f --tail 100 myapp

# Execute command in running container
docker exec -it myapp /bin/sh

# Clean up unused resources
docker system prune -af --volumes
\`\`\`

## Dockerfile Best Practices

\`\`\`dockerfile
# Use specific version tags
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Non-root user
USER node

EXPOSE 3000
CMD ["node", "dist/server.js"]
\`\`\`

## Kubernetes Resources

\`\`\`yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: myapp:1.0
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "128Mi"
            cpu: "250m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
\`\`\`

## kubectl Commands

| Command | Description |
|---------|-------------|
| \`kubectl get pods -A\` | List all pods in all namespaces |
| \`kubectl describe pod <name>\` | Show pod details |
| \`kubectl logs -f <pod>\` | Stream pod logs |
| \`kubectl port-forward pod/x 8080:80\` | Port forward to pod |
| \`kubectl apply -f config.yaml\` | Apply configuration |
| \`kubectl rollout status deployment/x\` | Check rollout status |
| \`kubectl scale deployment/x --replicas=5\` | Scale deployment |
`,
        favorite: false
    },
    {
        title: "State Machine Design",
        content: `# State Machine Design

Designing robust state machines for order processing.

## Order State Machine

\`\`\`mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Pending: submit()
    Draft --> Cancelled: cancel()
    
    Pending --> Confirmed: confirm()
    Pending --> Cancelled: cancel()
    Pending --> Draft: edit()
    
    Confirmed --> Processing: startProcessing()
    Confirmed --> Cancelled: cancel()
    
    Processing --> Shipped: ship()
    Processing --> Failed: fail()
    
    Shipped --> Delivered: deliver()
    Shipped --> Returned: returnRequest()
    
    Delivered --> [*]
    Delivered --> Returned: returnRequest()
    
    Returned --> Refunded: processRefund()
    Refunded --> [*]
    
    Failed --> Pending: retry()
    Failed --> Cancelled: cancel()
    
    Cancelled --> [*]
\`\`\`

## State Implementation

\`\`\`typescript
// State types
type OrderState = 
  | 'draft' 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'returned' 
  | 'refunded'
  | 'failed'
  | 'cancelled';

// Transition definition
interface Transition {
  from: OrderState | OrderState[];
  to: OrderState;
  action: string;
  guard?: (order: Order) => boolean;
  effect?: (order: Order) => Promise<void>;
}

// State machine configuration
const orderTransitions: Transition[] = [
  {
    from: 'draft',
    to: 'pending',
    action: 'submit',
    guard: (order) => order.items.length > 0,
    effect: async (order) => {
      await sendConfirmationEmail(order);
      await reserveInventory(order);
    }
  },
  {
    from: ['draft', 'pending', 'confirmed'],
    to: 'cancelled',
    action: 'cancel',
    effect: async (order) => {
      await releaseInventory(order);
      await sendCancellationEmail(order);
    }
  },
  {
    from: 'processing',
    to: 'shipped',
    action: 'ship',
    guard: (order) => !!order.trackingNumber,
    effect: async (order) => {
      await sendShippingNotification(order);
    }
  },
  // ... more transitions
];

// State machine class
class OrderStateMachine {
  private transitions: Map<string, Transition[]>;
  
  constructor(config: Transition[]) {
    this.transitions = this.buildTransitionMap(config);
  }
  
  async transition(order: Order, action: string): Promise<Order> {
    const key = \`\${order.state}:\${action}\`;
    const transition = this.transitions.get(key);
    
    if (!transition) {
      throw new Error(
        \`Invalid transition: \${action} from \${order.state}\`
      );
    }
    
    if (transition.guard && !transition.guard(order)) {
      throw new Error('Transition guard failed');
    }
    
    if (transition.effect) {
      await transition.effect(order);
    }
    
    return { ...order, state: transition.to };
  }
}
\`\`\`

## State Transition Matrix

| From State | submit | cancel | confirm | ship | deliver |
|------------|--------|--------|---------|------|---------|
| draft | ✅ pending | ✅ cancelled | ❌ | ❌ | ❌ |
| pending | ❌ | ✅ cancelled | ✅ confirmed | ❌ | ❌ |
| confirmed | ❌ | ✅ cancelled | ❌ | ❌ | ❌ |
| processing | ❌ | ❌ | ❌ | ✅ shipped | ❌ |
| shipped | ❌ | ❌ | ❌ | ❌ | ✅ delivered |
`,
        favorite: false
    },
    {
        title: "Testing Strategy Guide",
        content: `# Testing Strategy Guide

Comprehensive testing approach for modern applications.

## Testing Pyramid

\`\`\`mermaid
graph TB
    subgraph "Testing Pyramid"
        E2E[E2E Tests<br/>10%]
        INT[Integration Tests<br/>30%]
        UNIT[Unit Tests<br/>60%]
    end
    
    E2E --> INT
    INT --> UNIT
    
    style E2E fill:#ff6b6b
    style INT fill:#ffd93d
    style UNIT fill:#6bcb77
\`\`\`

## Unit Testing with Jest

\`\`\`javascript
// calculator.test.js
import { Calculator } from './calculator';

describe('Calculator', () => {
  let calc;
  
  beforeEach(() => {
    calc = new Calculator();
  });
  
  describe('add()', () => {
    it('should add two positive numbers', () => {
      expect(calc.add(2, 3)).toBe(5);
    });
    
    it('should handle negative numbers', () => {
      expect(calc.add(-1, 5)).toBe(4);
    });
    
    it('should handle decimal numbers', () => {
      expect(calc.add(0.1, 0.2)).toBeCloseTo(0.3);
    });
  });
  
  describe('divide()', () => {
    it('should divide two numbers', () => {
      expect(calc.divide(10, 2)).toBe(5);
    });
    
    it('should throw on division by zero', () => {
      expect(() => calc.divide(5, 0))
        .toThrow('Division by zero');
    });
  });
});

// Mocking example
describe('UserService', () => {
  let userService;
  let mockApi;
  
  beforeEach(() => {
    mockApi = {
      fetchUser: jest.fn(),
      saveUser: jest.fn()
    };
    userService = new UserService(mockApi);
  });
  
  it('should fetch and transform user data', async () => {
    mockApi.fetchUser.mockResolvedValue({
      id: 1,
      first_name: 'John',
      last_name: 'Doe'
    });
    
    const user = await userService.getUser(1);
    
    expect(mockApi.fetchUser).toHaveBeenCalledWith(1);
    expect(user).toEqual({
      id: 1,
      fullName: 'John Doe'
    });
  });
});
\`\`\`

## Integration Testing

\`\`\`javascript
// api.integration.test.js
import request from 'supertest';
import { app } from './app';
import { db } from './database';

describe('POST /api/users', () => {
  beforeEach(async () => {
    await db.clear('users');
  });
  
  afterAll(async () => {
    await db.disconnect();
  });
  
  it('should create a new user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'test@example.com',
        name: 'Test User',
        password: 'securePass123'
      })
      .expect(201);
    
    expect(response.body).toMatchObject({
      success: true,
      data: {
        email: 'test@example.com',
        name: 'Test User'
      }
    });
    expect(response.body.data.password).toBeUndefined();
    
    // Verify in database
    const user = await db.findOne('users', {
      email: 'test@example.com'
    });
    expect(user).toBeTruthy();
  });
  
  it('should reject duplicate email', async () => {
    await db.insert('users', {
      email: 'existing@example.com',
      name: 'Existing',
      password: 'hashed'
    });
    
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'existing@example.com',
        name: 'New User',
        password: 'newPass123'
      })
      .expect(409);
    
    expect(response.body.error.code).toBe('EMAIL_EXISTS');
  });
});
\`\`\`

## Test Coverage Targets

| Type | Minimum | Target | Critical Paths |
|------|---------|--------|----------------|
| Unit | 70% | 85% | 95% |
| Integration | 50% | 70% | 90% |
| E2E | N/A | Key flows | All happy paths |

## Testing Checklist

- [x] Unit tests for all business logic
- [x] Integration tests for API endpoints  
- [x] Database migration tests
- [ ] Load testing with k6
- [ ] Security scanning with OWASP ZAP
- [ ] Accessibility testing with axe-core
- [ ] Visual regression with Percy
`,
        favorite: true
    },
    {
        title: "Meeting Notes: Q1 Planning",
        content: `# Q1 2025 Planning Meeting

**Date:** January 15, 2025  
**Attendees:** Engineering Team, Product, Design

---

## Agenda

1. Review Q4 achievements
2. Discuss Q1 objectives
3. Resource allocation
4. Timeline and milestones

## Q4 Achievements

| Initiative | Status | Impact |
|------------|--------|--------|
| Performance optimization | ✅ Complete | 40% faster page loads |
| Mobile app v2 | ✅ Complete | 4.5★ app store rating |
| Auth system migration | 🟡 90% done | Security improvements |
| Analytics dashboard | ❌ Postponed | Moved to Q1 |

## Q1 Objectives

### Objective 1: Complete Auth Migration
- **Key Results:**
  1. Migrate remaining 10% of users
  2. Deprecate legacy auth endpoints
  3. Security audit completion

### Objective 2: Launch Analytics Dashboard
- **Key Results:**
  1. Real-time data visualization
  2. Custom report builder
  3. Export to PDF/CSV functionality

### Objective 3: API v2 Release
- **Key Results:**
  1. GraphQL schema design complete
  2. Migration guide published
  3. 50% of partners on v2

## Resource Allocation

\`\`\`mermaid
pie title Engineering Time Allocation
    "Auth Migration" : 15
    "Analytics Dashboard" : 30
    "API v2" : 25
    "Tech Debt" : 15
    "Bug Fixes" : 10
    "Other" : 5
\`\`\`

## Timeline

\`\`\`mermaid
gantt
    title Q1 2025 Roadmap
    dateFormat  YYYY-MM-DD
    section Auth
    Complete migration     :a1, 2025-01-15, 2w
    Security audit         :a2, after a1, 1w
    Deprecate legacy       :a3, after a2, 1w
    section Analytics
    Backend development    :b1, 2025-01-15, 4w
    Frontend development   :b2, after b1, 3w
    User testing           :b3, after b2, 2w
    section API v2
    Schema design          :c1, 2025-02-01, 2w
    Implementation         :c2, after c1, 4w
    Documentation          :c3, after c2, 2w
\`\`\`

## Action Items

- [ ] @alice - Draft security audit requirements by Jan 20
- [ ] @bob - Create analytics wireframes by Jan 22
- [ ] @charlie - API v2 RFC document by Jan 25
- [x] @dave - Set up project boards ✓
- [x] @eve - Schedule stakeholder updates ✓

## Key Decisions

1. ✅ **Approved**: Migrate to GraphQL for API v2
2. ✅ **Approved**: Use Metabase for analytics MVP
3. 🔄 **Deferred**: Native mobile SDK (revisit Q2)

## Next Meeting

**Date:** January 22, 2025  
**Focus:** Sprint planning and task breakdown

---

> **Note:** Meeting recording available in Google Drive. Slack channel #q1-planning created for ongoing discussions.
`,
        favorite: false
    }
];

async function seed() {
    console.log(`Registering/Logging in as ${USERNAME}...`);
    
    // Try Register first
    let user;
    let cookie;

    const regRes = await fetch(`${API_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: USERNAME, password: PASSWORD })
    });
    
    if (regRes.ok) {
        user = await regRes.json();
        console.log('Registered:', user);
        cookie = regRes.headers.get('set-cookie');
    } else {
        // If register fails, try login
        const loginRes = await fetch(`${API_URL}/api/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: USERNAME, password: PASSWORD })
        });
        
        if (!loginRes.ok) {
            console.error('Login failed:', await loginRes.text());
            return;
        }
        user = await loginRes.json();
        console.log('Logged in:', user);
        cookie = loginRes.headers.get('set-cookie');
    }

    // Generate timestamps spread across recent months
    const now = new Date();
    const notes = COMPLEX_NOTES.map((note, idx) => {
        const daysAgo = idx * 3; // Each note 3 days apart
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);
        
        return {
            title: note.title,
            content: note.content,
            createdAt: date.toISOString(),
            updatedAt: date.toISOString(),
            favorite: note.favorite
        };
    });
    
    console.log(`Generated ${notes.length} complex markdown notes.`);
    
    // Import
    const importPayload = {
        version: "1.0",
        userApiKey: user.api_key,
        username: user.username,
        exportedAt: new Date().toISOString(),
        notes: notes
    };
    
    console.log('Importing...');
    const importRes = await fetch(`${API_URL}/api/notes/import`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Cookie': cookie 
        },
        body: JSON.stringify(importPayload)
    });
    
    if (!importRes.ok) {
        console.error('Import failed:', await importRes.text());
    } else {
        const result = await importRes.json();
        console.log('Import success:', result);
    }
}

seed().catch(console.error);
