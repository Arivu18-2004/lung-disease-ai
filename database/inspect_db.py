import sqlite3
import pandas as pd
import os

DB_PATH = '/Users/britto/Documents/Lung Disease Project/lung-disease-ai/lung_disease.db'

def inspect_db():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database file not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get list of tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()

    print(f"=== Database Inspection: {os.path.basename(DB_PATH)} ===\n")
    
    if not tables:
        print("No tables found in the database.")
        return

    for table_name in [t[0] for t in tables]:
        if table_name == 'sqlite_sequence': continue
        
        print(f"Table: {table_name}")
        print("-" * (len(table_name) + 7))
        
        # Get column info
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        print("Columns:", ", ".join([f"{col[1]} ({col[2]})" for col in columns]))
        
        # Get row count
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        print(f"Total rows: {count}")
        
        # Show first 5 rows if any
        if count > 0:
            df = pd.read_sql_query(f"SELECT * FROM {table_name} LIMIT 5", conn)
            print("\nPreview (First 5 rows):")
            print(df.to_string(index=False))
        else:
            print("Table is empty.")
        
        print("\n" + "="*50 + "\n")

    conn.close()

if __name__ == "__main__":
    inspect_db()
