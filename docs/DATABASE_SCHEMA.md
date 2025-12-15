# Propodocs Database Schema

> **Note:** All migrations have been applied. This document serves as schema reference.

## Tables Overview

| Table | Purpose |
|-------|---------|
| `users` | User accounts and settings |
| `proposals` | Sales proposals |
| `proposal_links` | Shareable proposal links |
| `proposal_comments` | Comments on proposals |
| `contracts` | Client contracts |
| `contract_comments` | Comments on contracts |
| `contract_templates` | Reusable contract templates |
| `invoices` | Billing invoices |
| `clients` | CRM client records |
| `notifications` | User notification log |
| `notification_preferences` | Per-user notification settings |

---

## Key Columns Added via Migrations

### users
```sql
appearance JSONB DEFAULT '{"theme": "light", "accentColor": "#8C0000"}'
bank_details JSONB DEFAULT '{}'
payment_preferences JSONB DEFAULT '{}'
phone VARCHAR(20)
```

### clients
```sql
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    company VARCHAR(200),
    phone VARCHAR(50),
    address TEXT,
    notes TEXT,
    tags TEXT[],
    status VARCHAR(50) DEFAULT 'active',
    total_revenue NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### proposals, invoices, contracts
```sql
-- All have client_id foreign key
client_id INT REFERENCES clients(id) ON DELETE SET NULL
```

### invoices
```sql
contract_id INT REFERENCES contracts(id) ON DELETE SET NULL
```

### contract_templates
```sql
offer_type VARCHAR(100)
category VARCHAR(100) DEFAULT 'service_agreement'
```

### contract_comments
```sql
CREATE TABLE contract_comments (
    id SERIAL PRIMARY KEY,
    contract_id INT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    author_name VARCHAR(200) DEFAULT 'Anonymous',
    content TEXT NOT NULL,
    parent_comment_id INT REFERENCES contract_comments(id),
    is_internal BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### notification_preferences
```sql
CREATE TABLE notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL, -- 'email', 'sms', 'push'
    event_type VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    UNIQUE(user_id, channel, event_type)
);
```

### notifications
```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```
