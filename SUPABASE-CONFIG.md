# Supabase Configuration

## Database Schema

### Table: domains
| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| title | text | Domain name |
| description | text | Domain description |
| created_at | timestamptz | Creation timestamp |

### Table: projects
| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| domain_id | integer | Foreign key to domains |
| title | text | Project name |
| description | text | Project description |
| status | text | Project status |
| created_at | timestamptz | Creation timestamp |

### Table: tasks
| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| project_id | integer | Foreign key to projects |
| title | text | Task name |
| description | text | Task description |
| status | text | Task status |
| priority | text | Task priority |
| created_at | timestamptz | Creation timestamp |

### Table: records
| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| created_at | timestamptz | Creation timestamp |
| date | text | Record date (YYYY-MM-DD) |
| project_id | integer | Foreign key to projects |
| time_spent | numeric | Time spent in hours |
| title | text | Record title |
| description | text | Record description |
| category | text | Record category |
| tags | text[] | Array of tags |
| link | text | External link |

## RLS Policies

Enable Row Level Security on all tables and configure policies for authenticated users.

## Quick Setup SQL

```sql
-- Enable RLS
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust for your auth setup)
CREATE POLICY "Allow all for authenticated users" ON domains FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON projects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON tasks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON records FOR ALL USING (auth.role() = 'authenticated');
```