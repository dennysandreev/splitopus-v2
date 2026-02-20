from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import json
import logging
from typing import Dict, Optional
from datetime import datetime

# --- Config ---
DB_PATH = "data/splitopus.db"

# --- Setup ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# CORS (Allow Frontend to call Backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---
class ExpenseCreate(BaseModel):
    trip_id: str
    payer_id: str
    amount: float
    description: str
    category: str
    split: Dict[str, float]  # user_id -> amount

# --- DB Helper ---
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# --- API Endpoints ---

@app.get("/")
def health_check():
    return {"status": "ok", "service": "splitopus-api"}

@app.get("/api/trips/{user_id}")
def get_user_trips(user_id: str):
    """Get all trips a user belongs to."""
    conn = get_db()
    cursor = conn.cursor()
    try:
        # Get trips where user is a member
        query = """
        SELECT t.id, t.code, t.name, t.currency
        FROM trips t
        JOIN trip_members tm ON t.id = tm.trip_id
        WHERE tm.user_id = ?
        ORDER BY t.created_at DESC
        """
        cursor.execute(query, (user_id,))
        trips = [dict(row) for row in cursor.fetchall()]
        return {"trips": trips}
    except Exception as e:
        logger.error(f"Error fetching trips: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/expenses/{trip_id}")
def get_trip_expenses(trip_id: str):
    """Get all expenses for a specific trip."""
    conn = get_db()
    cursor = conn.cursor()
    try:
        query = """
        SELECT id, payer_id, amount, description, category, created_at, split_json
        FROM expenses
        WHERE trip_id = ?
        ORDER BY created_at DESC
        """
        cursor.execute(query, (trip_id,))
        rows = cursor.fetchall()
        
        expenses = []
        for row in rows:
            exp = dict(row)
            try:
                exp["split"] = json.loads(row["split_json"]) if row["split_json"] else {}
            except:
                exp["split"] = {}
            del exp["split_json"]
            expenses.append(exp)
            
        return {"expenses": expenses}
    except Exception as e:
        logger.error(f"Error fetching expenses: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/expenses")
def create_expense(expense: ExpenseCreate):
    """Add a new expense."""
    conn = get_db()
    cursor = conn.cursor()
    try:
        split_json = json.dumps(expense.split)
        created_at = int(datetime.now().timestamp())
        
        query = """
        INSERT INTO expenses (trip_id, payer_id, amount, description, category, created_at, split_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        cursor.execute(query, (
            expense.trip_id,
            expense.payer_id,
            expense.amount,
            expense.description,
            expense.category,
            created_at,
            split_json
        ))
        conn.commit()
        new_id = cursor.lastrowid
        
        logger.info(f"New expense created: ID={new_id}, Trip={expense.trip_id}, Amount={expense.amount}")
        
        return {"status": "success", "id": new_id}
    except Exception as e:
        logger.error(f"Error creating expense: {e}")
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/members/{trip_id}")
def get_trip_members(trip_id: str):
    """Get all members of a trip."""
    conn = get_db()
    cursor = conn.cursor()
    try:
        query = """
        SELECT u.id, u.name
        FROM users u
        JOIN trip_members tm ON u.id = tm.user_id
        WHERE tm.trip_id = ?
        """
        cursor.execute(query, (trip_id,))
        members = [dict(row) for row in cursor.fetchall()]
        return {"members": members}
    except Exception as e:
        logger.error(f"Error fetching members: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
