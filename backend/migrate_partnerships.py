import sqlite3
import os

DB_PATH = os.path.join("data", "splitopus.db")

def migrate():
    print(f"Connecting to {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 1. Add linked_to column to trip_members if it doesn't exist
    print("Checking trip_members schema...")
    cursor.execute("PRAGMA table_info(trip_members)")
    columns = [row['name'] for row in cursor.fetchall()]
    
    if 'linked_to' not in columns:
        print("Adding 'linked_to' column to trip_members...")
        try:
            cursor.execute("ALTER TABLE trip_members ADD COLUMN linked_to TEXT")
        except sqlite3.OperationalError as e:
            print(f"Error altering table: {e}")
            # In SQLite, sometimes ALTER TABLE fails if there are pending transactions or other issues
            # But usually it works.
    else:
        print("'linked_to' column already exists in trip_members.")

    # 2. Migrate existing partnerships
    print("Migrating partnerships from users table...")
    
    # Get all users who have a linked_to set
    cursor.execute("SELECT id, linked_to FROM users WHERE linked_to IS NOT NULL AND linked_to != ''")
    users_with_links = cursor.fetchall()
    
    count = 0
    for user in users_with_links:
        user_id = user['id']
        linked_to = user['linked_to']
        
        # For each such user, update ALL their trip memberships to have this link
        # This preserves the old behavior (global link) into the new structure (link per trip)
        cursor.execute(
            "UPDATE trip_members SET linked_to = ? WHERE user_id = ?",
            (linked_to, user_id)
        )
        count += cursor.rowcount
        
    print(f"Updated {count} trip membership records with existing partnership links.")
    
    # 3. Verify
    cursor.execute("SELECT * FROM trip_members WHERE linked_to IS NOT NULL LIMIT 5")
    samples = cursor.fetchall()
    print("Sample updated records:")
    for row in samples:
        print(dict(row))

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    if not os.path.exists(DB_PATH):
        print(f"Database file not found at {DB_PATH}. Skipping migration.")
    else:
        migrate()
