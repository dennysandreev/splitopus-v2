from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import json
import logging
from typing import Dict, Optional, Any
from datetime import datetime
import os
import requests
from src import logic
# Import handlers for webhook processing
# Note: handlers must be available in python path. Since it is in src/, we import from src
from src import handlers

# --- Config ---
DB_PATH = "data/splitopus.db"

# --- Setup ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    split: Dict[str, float]

# --- DB Helper ---
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# --- Notification Logic ---
def send_telegram_msg(chat_id, text):
    token = os.getenv('BOT_TOKEN')
    if not token: return
    try:
        url = f'https://api.telegram.org/bot{token}/sendMessage'
        requests.post(url, json={'chat_id': chat_id, 'text': text, 'parse_mode': 'Markdown'})
    except Exception as e:
        logger.error(f'Failed to send TG message: {e}')

def notify_new_expense(trip_id, payer_id, amount, desc):
    conn = get_db()
    cursor = conn.cursor()
    try:
        # Get Trip & Currency
        cursor.execute("SELECT name, currency FROM trips WHERE id = ?", (trip_id,))
        trip_row = cursor.fetchone()
        if not trip_row: return
        trip_name = trip_row['name']
        curr = trip_row['currency']
        
        # Get Payer Name
        cursor.execute("SELECT name FROM users WHERE id = ?", (payer_id,))
        payer_row = cursor.fetchone()
        payer_name = payer_row['name'] if payer_row else 'Кто-то'
        
        # Get Members
        cursor.execute("SELECT user_id FROM trip_members WHERE trip_id = ?", (trip_id,))
        members = [r['user_id'] for r in cursor.fetchall()]
        
        msg = f"💸 *{trip_name}*: Новый расход (через App)\n👤 *{payer_name}* заплатил *{amount:,.0f} {curr}*\n📝 {desc}"
        
        for m_id in members:
            if str(m_id) != str(payer_id):
                send_telegram_msg(m_id, msg)
                
    except Exception as e:
        logger.error(f'Notification error: {e}')
    finally:
        conn.close()

# --- API Endpoints ---

@app.get("/")
def health_check():
    return {"status": "ok", "service": "splitopus-api"}

@app.post("/api/webhook")
async def telegram_webhook(update: Dict[str, Any] = Body(...)):
    """Handle Telegram Webhook updates."""
    try:
        handlers.process_update(update)
    except Exception as e:
        logger.error(f"Webhook processing error: {e}")
    return {"ok": True}

@app.get("/api/trips/{user_id}")
def get_user_trips(user_id: str):
    conn = get_db()
    cursor = conn.cursor()
    try:
        query = """
        SELECT t.id, t.code, t.name, t.currency, t.rate
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
        
        logger.info(f"New expense created: ID={new_id}")
        
        notify_new_expense(expense.trip_id, expense.payer_id, expense.amount, expense.description)
        
        return {"status": "success", "id": new_id}
    except Exception as e:
        logger.error(f"Error creating expense: {e}")
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/members/{trip_id}")
def get_trip_members(trip_id: str):
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

@app.get("/api/debts/{trip_id}")
def get_trip_debts(trip_id: str):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        SELECT u.id, u.name 
        FROM users u 
        JOIN trip_members tm ON u.id = tm.user_id 
        WHERE tm.trip_id = ?
        """, (trip_id,))
        members_rows = cursor.fetchall()
        
        members = [row["id"] for row in members_rows]
        user_names = {row["id"]: row["name"] for row in members_rows}
        
        cursor.execute("""
        SELECT payer_id, amount, category, created_at, split_json 
        FROM expenses 
        WHERE trip_id = ?
        """, (trip_id,))
        expenses_rows = cursor.fetchall()
        
        expenses = []
        for row in expenses_rows:
            exp = dict(row)
            try:
                exp["split"] = json.loads(row["split_json"]) if row["split_json"] else {}
            except:
                exp["split"] = {}
            exp["ts"] = row["created_at"]
            expenses.append(exp)
            
        trip = {
            'members': members,
            'expenses': expenses
        }
        
        balances, total_spent, paid_by = logic.calculate_balance(trip, link_map={})
        transactions = logic.simplify_debts(balances, user_names)
        
        return {
            "debts": transactions,
            "balances": balances
        }
        
    except Exception as e:
        logger.error(f"Error calculating debts: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
