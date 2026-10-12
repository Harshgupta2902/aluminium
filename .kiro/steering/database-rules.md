---
name: Database SQL Workflow Rules
description: Rules for managing database changes using supabase_setup.sql and updates.sql
inclusion: auto
---

# Database SQL Workflow Rules

## Core Principle
Never modify `supabase_setup.sql` directly during development. Always use the two-file workflow.

---

## File Roles

### `supabase_setup.sql`
- **Purpose**: Complete, runnable database schema
- **When to modify**: Only when merging from `updates.sql`
- **Usage**: First-time setup for new projects
- **Status**: Always contains the full, current schema

### `updates.sql`
- **Purpose**: Incremental changes only
- **When to modify**: Every time you make database changes
- **Usage**: Copy and paste into Supabase SQL Editor
- **Status**: Contains only pending changes

---

## Workflow Steps

### When Creating/Modifying Database:

**Step 1: Add SQL to `updates.sql`**
```sql
-- Always add new changes here first
ALTER TABLE quotations ADD COLUMN discount_percentage NUMERIC DEFAULT 0;
```

**Step 2: Test in Supabase**
- Copy the SQL from `updates.sql`
- Paste in Supabase SQL Editor
- Run and verify it works

**Step 3: Merge to `supabase_setup.sql`**
- Update the relevant CREATE TABLE statement
- Or add the INSERT statements
- Keep `supabase_setup.sql` complete and runnable

**Step 4: Clear `updates.sql`**
- Remove the applied changes
- Keep file ready for next update
- Leave only the header comments

---

## Rules for AI Assistant

When user requests database changes:

1. ✅ **ALWAYS** add new SQL to `updates.sql` first
2. ✅ **ALWAYS** show the user what to copy/paste
3. ✅ **ALWAYS** update `supabase_setup.sql` after confirmation
4. ✅ **ALWAYS** clear `updates.sql` after merging
5. ❌ **NEVER** modify `supabase_setup.sql` directly without going through `updates.sql`

---

## Examples

### Example 1: Adding a Column

**User Request**: "Add a discount field to quotations"

**Your Response**:
1. Update `updates.sql`:
```sql
-- Add discount column to quotations
ALTER TABLE quotations ADD COLUMN discount_percentage NUMERIC DEFAULT 0;
ALTER TABLE quotations ADD COLUMN discount_amount NUMERIC DEFAULT 0;
```

2. Tell user:
> "I've added the SQL to `updates.sql`. Please:
> 1. Copy the SQL from `updates.sql`
> 2. Paste in Supabase SQL Editor
> 3. Run it
> 4. Let me know if it works, then I'll update `supabase_setup.sql`"

3. After user confirms, update `supabase_setup.sql`:
- Find quotations table CREATE statement
- Add the columns

4. Clear `updates.sql`

---

### Example 2: New Table

**User Request**: "Create a table for customer reviews"

**Your Response**:
1. Update `updates.sql`:
```sql
-- Create customer reviews table
CREATE TABLE customer_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quotation_id UUID REFERENCES quotations(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;

-- Add policy
CREATE POLICY "Users can view all reviews" ON customer_reviews
  FOR SELECT USING (auth.role() = 'authenticated');
```

2. Tell user to run it in Supabase

3. After confirmation, add to `supabase_setup.sql`

4. Clear `updates.sql`

---

### Example 3: Insert Data

**User Request**: "Add 5 more window templates"

**Your Response**:
1. Update `updates.sql`:
```sql
-- Add new window templates
INSERT INTO window_templates (name, category, window_type, default_width, default_height, description) VALUES
  ('Modern Bay Window', 'Bay', 'combination', 2800, 1400, 'Contemporary bay window design'),
  ('Corner Window', 'Special', 'combination', 1500, 1500, 'L-shaped corner window'),
  ('Picture Window', 'Fixed', 'fixed', 2000, 1800, 'Large fixed picture window'),
  ('Garden Window', 'Special', 'combination', 1200, 1000, 'Projecting garden window'),
  ('Transom Window', 'Fixed', 'fixed', 1200, 400, 'Horizontal transom window');
```

2. User runs in Supabase

3. Merge to `supabase_setup.sql` INSERT section

4. Clear `updates.sql`

---

## Response Template

When user asks for database changes, always respond:

```
I've added the SQL changes to `updates.sql`. Here's what to do:

**Step 1**: Copy this SQL from `updates.sql`:
[show the SQL]

**Step 2**: Paste and run in Supabase SQL Editor

**Step 3**: Verify it works

**Step 4**: Let me know, and I'll:
- Update `supabase_setup.sql` 
- Clear `updates.sql` for next time

File locations:
- 📝 `updates.sql` - Your pending changes (copy from here)
- 📚 `supabase_setup.sql` - Complete schema (I'll update after you confirm)
```

---

## File Status Indicators

### `updates.sql` states:

**Empty (Ready for new changes)**:
```sql
-- Database Updates
-- No pending updates at this time
```

**Has pending changes**:
```sql
-- Database Updates
-- PENDING: Copy these to Supabase SQL Editor

-- Add discount columns
ALTER TABLE quotations ADD COLUMN discount_percentage NUMERIC DEFAULT 0;
```

**After applying**:
- User confirms it worked
- Merge to `supabase_setup.sql`
- Reset `updates.sql` to empty state

---

## Quick Reference

| Action | File | When |
|--------|------|------|
| Add new SQL | `updates.sql` | First (always) |
| Test changes | Supabase Editor | Second |
| Update schema | `supabase_setup.sql` | After confirmation |
| Clear updates | `updates.sql` | After merging |

---

## Benefits

✅ Always know what needs to be run (check `updates.sql`)  
✅ Easy to copy/paste into Supabase  
✅ Complete schema always available (`supabase_setup.sql`)  
✅ Track history of changes  
✅ No confusion about what's applied  

---

## Remember

**The Golden Rule**: 
> New SQL → `updates.sql` → Test → Merge to `supabase_setup.sql` → Clear `updates.sql`

**Never skip the workflow!**
