from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import json
import logging
from typing import Dict, Optional, Any, List
from datetime import datetime
import os
import requests
import random
import string
from src import logic
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

class NoteCreate(BaseModel):
    trip_id: str
    user_id: str
    text: str

class TripCreate(BaseModel):
    name: str
    currency: str
    creator_id: str

@app.get("/api/trips/by-code/{code}")
def get_trip_by_code(code: str):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, name, code, currency FROM trips WHERE UPPER(code) = ?", (code.upper(),))
        trip_row = cursor.fetchone()
        if not trip_row:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        trip = dict(trip_row)
        
        cursor.execute("SELECT u.id, u.name FROM users u JOIN trip_members tm ON u.id = tm.user_id WHERE tm.trip_id = ?", (trip['id'],))
        members = [dict(row) for row in cursor.fetchall()]
        
        trip['members'] = members
        
        return {"trip": trip}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching trip by code: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

class PartnerLinkRequest(BaseModel):
    code: str
    user_id: str
    partner_id: str

@app.post("/api/trips/link-request")
def request_partner_link(req: PartnerLinkRequest):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, name FROM trips WHERE UPPER(code) = ?", (req.code.upper(),))
        trip_row = cursor.fetchone()
        if not trip_row:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        trip_id = trip_row['id']
        trip_name = trip_row['name']
        
        cursor.execute("SELECT name FROM users WHERE id = ?", (req.user_id,))
        requester_row = cursor.fetchone()
        requester_name = requester_row['name'] if requester_row else "Пользователь Telegram"
        
        msg = (
            f"🔔 *Запрос на привязку*\n"
            f"Пользователь *{requester_name}* хочет присоединиться к вашему счету в поездке *{trip_name}*.\n"
            "Если вы примете, вы будете платить за двоих."
        )
        keyboard = {"inline_keyboard": [
            [{"text": "✅ Принять", "callback_data": f"APPROVE_LINK|{req.user_id}|{trip_id}"}],
            [{"text": "❌ Отклонить", "callback_data": f"REJECT_LINK|{req.user_id}"}]
        ]}
        
        send_telegram_msg(req.partner_id, msg, reply_markup=keyboard)
        
        return {"status": "success", "message": "Link request sent"}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error requesting partner link: {e}")
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

class JoinTripRequest(BaseModel):
    code: str
    user_id: str

# --- DB Helper ---
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def generate_code(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

# --- Notification Logic ---
def send_telegram_msg(chat_id, text, reply_markup=None):
    token = os.getenv('BOT_TOKEN')
    if not token: return
    try:
        url = f'https://api.telegram.org/bot{token}/sendMessage'
        payload = {'chat_id': chat_id, 'text': text, 'parse_mode': 'Markdown'}
        if reply_markup: payload['reply_markup'] = json.dumps(reply_markup)
        requests.post(url, json=payload)
    except Exception as e:
        logger.error(f'Failed to send TG message: {e}')

def notify_new_expense(trip_id, payer_id, amount, desc, category="OTHER", split=None):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT name, currency FROM trips WHERE id = ?", (trip_id,))
        trip_row = cursor.fetchone()
        if not trip_row: return
        trip_name = trip_row['name']
        curr = trip_row['currency']
        
        cursor.execute("SELECT name FROM users WHERE id = ?", (payer_id,))
        payer_row = cursor.fetchone()
        payer_name = payer_row['name'] if payer_row else 'User'
        
        cursor.execute("SELECT u.id, u.linked_to FROM users u JOIN trip_members tm ON u.id = tm.user_id WHERE tm.trip_id = ?", (trip_id,))
        members_rows = cursor.fetchall()
        members = [r['id'] for r in members_rows]
        link_map = {r['id']: r['linked_to'] for r in members_rows if r['linked_to']}
        
        masters = set(logic.get_master(m, link_map) for m in members)
        payer_master = logic.get_master(payer_id, link_map)
        
        if split is None: split = {}
        
        if desc.startswith("Рулетка") or "🎁" in desc:
             msg = f"🎰 *Рулетка!* \n*{payer_name}* угостил всех на сумму *{amount:,.0f} {curr}*! 🥳"
             for mid in masters:
                 if mid != payer_master:
                     send_telegram_msg(mid, msg)
             return

        # Custom notification for REPAYMENT category
        if category == "REPAYMENT":
            # Assuming split will contain one entry: recipient_id -> amount
            recipient_id = list(split.keys())[0] if split else None
            if recipient_id:
                cursor.execute("SELECT name FROM users WHERE id = ?", (recipient_id,))
                recipient_row = cursor.fetchone()
                recipient_name = recipient_row['name'] if recipient_row else 'User'

                # Message to payer (who returned the debt)
                msg_payer = f"✅ Вы вернули *{amount:,.0f} {curr}* пользователю *{recipient_name}*."
                send_telegram_msg(payer_id, msg_payer)

                # Message to recipient (who received the debt)
                msg_recipient = f"💸 *{payer_name}* вернул вам долг: *{amount:,.0f} {curr}*."
                send_telegram_msg(recipient_id, msg_recipient)
            return

        for mid in masters:
            if mid != payer_master:
                my_share = 0.0
                if split:
                    my_share = float(split.get(mid, 0.0))
                elif len(masters) > 0:
                    my_share = amount / len(masters)
                
                if my_share > 0:
                    share_text = f"*{my_share:,.0f} {curr}*"
                    msg = (
                        f"🧾 Новый Расход (через App)\n"
                        f"👤 *{payer_name}* -> *{amount:,.0f} {curr}*\n"
                        f"📝 {desc}\n"
                        f"📉 Ваша доля: {share_text}"
                    )
                    send_telegram_msg(mid, msg)
                
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
        
        # Populate members for each trip
        for trip in trips:
            m_query = """
            SELECT u.name 
            FROM users u
            JOIN trip_members tm ON u.id = tm.user_id
            WHERE tm.trip_id = ?
            """
            cursor.execute(m_query, (trip['id'],))
            trip['members'] = [r['name'] for r in cursor.fetchall() if r['name']]
            
        return {"trips": trips}
    except Exception as e:
        logger.error(f"Error fetching trips: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/trips")
def create_trip(trip: TripCreate):
    conn = get_db()
    cursor = conn.cursor()
    try:
        new_id = f"trip_{int(datetime.now().timestamp())}"
        code = generate_code()
        created_at = int(datetime.now().timestamp())
        
        cursor.execute("""
        INSERT INTO trips (id, code, creator_id, name, currency, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (new_id, code, trip.creator_id, trip.name, trip.currency, created_at))
        
        cursor.execute("""
        INSERT INTO trip_members (trip_id, user_id, joined_at)
        VALUES (?, ?, ?)
        """, (new_id, trip.creator_id, created_at))
        
        conn.commit()
        return {"status": "success", "id": new_id, "code": code}
    except Exception as e:
        logger.error(f"Error creating trip: {e}")
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/trips/join")
def join_trip(req: JoinTripRequest):
    conn = get_db()
    cursor = conn.cursor()
    try:
        # 1. Find trip by code
        cursor.execute("SELECT id FROM trips WHERE UPPER(code) = ?", (req.code.upper(),))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        trip_id = row['id']
        
        # 2. Add member (IGNORE if already exists)
        joined_at = int(datetime.now().timestamp())
        cursor.execute("""
            INSERT OR IGNORE INTO trip_members (trip_id, user_id, joined_at)
            VALUES (?, ?, ?)
        """, (trip_id, req.user_id, joined_at))
        
        conn.commit()
        return {"status": "success", "trip_id": trip_id}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error joining trip: {e}")
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/trips/{trip_id}/leave")
def leave_trip(trip_id: str, request: Dict[str, str] = Body(...)):
    user_id = request.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing user_id")
        
    conn = get_db()
    cursor = conn.cursor()
    try:
        # Check if user is in trip
        cursor.execute("SELECT user_id FROM trip_members WHERE trip_id = ? AND user_id = ?", (trip_id, user_id))
        member = cursor.fetchone()
        if not member:
            raise HTTPException(status_code=404, detail="User not in trip")
            
        # Check balance (must be 0)
        # We need to calculate balance. Reusing logic from get_trip_debts is best but expensive.
        # Let's verify via existing endpoints logic or duplicate minimal check.
        # Actually, let's allow leaving if balance is SMALL (e.g. < 1 unit) to avoid float issues, 
        # OR strictly 0. Let's try strictly 0 first.
        
        # We need member list and expenses to calc balance
        cursor.execute("SELECT u.id, u.linked_to FROM users u JOIN trip_members tm ON u.id = tm.user_id WHERE tm.trip_id = ?", (trip_id,))
        members_rows = cursor.fetchall()
        link_map = {row['id']: row['linked_to'] for row in members_rows if row['linked_to']}
        
        cursor.execute("SELECT payer_id, amount, category, split_json FROM expenses WHERE trip_id = ?", (trip_id,))
        expenses_rows = cursor.fetchall()
        expenses = []
        for row in expenses_rows:
            exp = dict(row)
            try:
                exp["split"] = json.loads(row["split_json"]) if row["split_json"] else {}
            except:
                exp["split"] = {}
            expenses.append(exp)
            
        trip_data = {'members': [m['id'] for m in members_rows], 'expenses': expenses}
        balances, _, _ = logic.calculate_balance(trip_data, link_map=link_map)
        
        user_balance = balances.get(user_id, 0)
        # Check if master or linked account
        master_id = logic.get_master(user_id, link_map)
        master_balance = balances.get(master_id, 0)
        
        # If user is linked, their personal balance might be irrelevant if master holds the debt?
        # logic.calculate_balance aggregates to masters. 
        # If I am a child, my balance is effectively my master's balance? 
        # No, if I leave, I disappear from the group.
        # If I am a child, I should probably unlink first? Or leaving just removes me.
        # If I leave, expenses paid by me (if any) or splits on me might hang?
        # Actually, expenses are stored by payer_id. If payer leaves, history remains.
        # But if I have a non-zero balance, it means I owe someone or someone owes me.
        
        if abs(master_balance) > 1.0: # Tolerance 1.0
             raise HTTPException(status_code=400, detail=f"Cannot leave: Balance is not zero ({master_balance:.0f}). Settle debts first.")

        # Delete member
        cursor.execute("DELETE FROM trip_members WHERE trip_id = ? AND user_id = ?", (trip_id, user_id))
        conn.commit()
        return {"status": "success", "message": "Left trip"}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error leaving trip: {e}")
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.delete("/api/trips/{trip_id}")
def delete_trip(trip_id: str, user_id: str): # user_id as query param
    conn = get_db()
    cursor = conn.cursor()
    try:
        # Check creator
        cursor.execute("SELECT creator_id FROM trips WHERE id = ?", (trip_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Trip not found")
            
        if row['creator_id'] != user_id:
             raise HTTPException(status_code=403, detail="Only creator can delete trip")
             
        # Cascading delete
        cursor.execute("DELETE FROM expenses WHERE trip_id = ?", (trip_id,))
        cursor.execute("DELETE FROM notes WHERE trip_id = ?", (trip_id,))
        cursor.execute("DELETE FROM trip_members WHERE trip_id = ?", (trip_id,))
        cursor.execute("DELETE FROM trips WHERE id = ?", (trip_id,))
        
        conn.commit()
        return {"status": "success", "message": "Trip deleted"}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error deleting trip: {e}")
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/users/{user_id}/status")
def get_user_status(user_id: str):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT active_trip_id, linked_to FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
            
        return {
            "active_trip_id": row['active_trip_id'], 
            "linked_to": row['linked_to']
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching user status: {e}")
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
        # Force category uppercase just in case
        expense.category = expense.category.upper()
        
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
        
        notify_new_expense(expense.trip_id, expense.payer_id, expense.amount, expense.description, expense.category, expense.split)
        
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
        SELECT u.id, u.name, u.linked_to
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
        SELECT u.id, u.name, u.linked_to
        FROM users u 
        JOIN trip_members tm ON u.id = tm.user_id 
        WHERE tm.trip_id = ?
        """, (trip_id,))
        members_rows = cursor.fetchall()
        
        members = [row["id"] for row in members_rows]
        user_names = {row["id"]: row["name"] for row in members_rows}
        link_map = {row['id']: row['linked_to'] for row in members_rows if row['linked_to']}
        
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
            
        trip = {'members': members, 'expenses': expenses}
        balances, _, _ = logic.calculate_balance(trip, link_map=link_map)
        transactions = logic.simplify_debts(balances, user_names)
        
        return {"debts": transactions, "balances": balances, "link_map": link_map}
    except Exception as e:
        logger.error(f"Error calculating debts: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/notes/{trip_id}")
def get_trip_notes(trip_id: str):
    conn = get_db()
    cursor = conn.cursor()
    try:
        query = "SELECT id, author_name, text, created_at FROM notes WHERE trip_id = ? ORDER BY created_at DESC"
        cursor.execute(query, (trip_id,))
        notes = [dict(row) for row in cursor.fetchall()]
        return {"notes": notes}
    except Exception as e:
        logger.error(f"Error fetching notes: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/notes")
def create_note(note: NoteCreate):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT name FROM users WHERE id = ?", (note.user_id,))
        user_row = cursor.fetchone()
        author_name = user_row['name'] if user_row else 'Unknown'
        created_at = int(datetime.now().timestamp())
        query = "INSERT INTO notes (trip_id, author_name, text, created_at) VALUES (?, ?, ?, ?)"
        cursor.execute(query, (note.trip_id, author_name, note.text, created_at))
        conn.commit()
        return {"status": "success", "id": cursor.lastrowid}
    except Exception as e:
        logger.error(f"Error creating note: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/stats/{trip_id}")
def get_trip_stats(trip_id: str, user_id: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT u.id, u.linked_to FROM users u JOIN trip_members tm ON u.id = tm.user_id WHERE tm.trip_id = ?", (trip_id,))
        members_rows = cursor.fetchall()
        link_map = {row['id']: row['linked_to'] for row in members_rows if row['linked_to']}

        cursor.execute("""
            SELECT category, SUM(amount) as total 
            FROM expenses 
            WHERE trip_id = ? AND category != 'REPAYMENT'
            GROUP BY category
        """, (trip_id,))
        by_category = {row['category']: row['total'] for row in cursor.fetchall()}
        
        cursor.execute("""
            SELECT payer_id, SUM(amount) as total 
            FROM expenses 
            WHERE trip_id = ? AND category != 'REPAYMENT'
            GROUP BY payer_id
        """, (trip_id,))
        by_member_raw = {row['payer_id']: row['total'] for row in cursor.fetchall()}
        
        if by_member_raw:
            placeholders = ','.join(['?']*len(by_member_raw))
            cursor.execute(f"SELECT id, name FROM users WHERE id IN ({placeholders})", tuple(by_member_raw.keys()))
            names = {str(row['id']): row['name'] for row in cursor.fetchall()}
            by_member = {names.get(str(uid), str(uid)): amount for uid, amount in by_member_raw.items()}
        else:
            by_member = {}

        my_category = {}
        if user_id:
            target_uid = str(user_id)
            target_master = link_map.get(target_uid, target_uid)
            cursor.execute("SELECT COUNT(*) FROM trip_members WHERE trip_id = ?", (trip_id,))
            row_count = cursor.fetchone()
            member_count = row_count[0] if row_count else 0
            
            cursor.execute("""
                SELECT category, split_json, amount 
                FROM expenses 
                WHERE trip_id = ? AND category != 'REPAYMENT'
            """, (trip_id,))
            rows = cursor.fetchall()
            for row in rows:
                amount = row['amount']
                try:
                    split = json.loads(row['split_json']) if row['split_json'] else {}
                except:
                    split = {}
                
                my_share = 0.0
                if split:
                    my_share += float(split.get(target_master, 0.0))
                    for k, v in split.items():
                        if k != target_master and link_map.get(k) == target_master:
                             my_share += float(v)
                elif member_count > 0:
                    my_share = amount / member_count
                
                if my_share > 0:
                    cat = row['category']
                    my_category[cat] = my_category.get(cat, 0.0) + my_share
        
        total = sum(by_category.values())
        return {"total": total, "by_category": by_category, "by_member": by_member, "my_category": my_category}
    except Exception as e:
        logger.error(f"Error calculating stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/debts/{trip_id}/notify")
def notify_debts(trip_id: str):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT u.id, u.name, u.linked_to FROM users u JOIN trip_members tm ON u.id = tm.user_id WHERE tm.trip_id = ?", (trip_id,))
        members_rows = cursor.fetchall()
        user_names = {row["id"]: row["name"] for row in members_rows}
        members = [row["id"] for row in members_rows]
        link_map = {row['id']: row['linked_to'] for row in members_rows if row['linked_to']}
        
        cursor.execute("SELECT payer_id, amount, category, created_at, split_json FROM expenses WHERE trip_id = ?", (trip_id,))
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
            
        trip = {'members': members, 'expenses': expenses}
        balances, _, _ = logic.calculate_balance(trip, link_map=link_map)
        transactions = logic.simplify_debts(balances, user_names)
        
        cursor.execute("SELECT name, currency FROM trips WHERE id = ?", (trip_id,))
        trip_info = cursor.fetchone()
        trip_name = trip_info['name'] if trip_info else "Поездка"
        curr = trip_info['currency'] if trip_info else "THB"
        
        sent_count = 0
        for tx in transactions:
            from_name = tx['from']
            to_name = tx['to']
            amount = tx['amount']
            from_id = next((uid for uid, name in user_names.items() if name == from_name), None)
            to_id = next((uid for uid, name in user_names.items() if name == to_name), None)
            
            if from_id:
                msg = f"💸 *Расчет ({trip_name})*\nВам нужно перевести *{amount:,.0f} {curr}* пользователю *{to_name}*."
                send_telegram_msg(from_id, msg)
                sent_count += 1
            if to_id:
                msg = f"💰 *Расчет ({trip_name})*\nПользователь *{from_name}* должен вам *{amount:,.0f} {curr}*."
                send_telegram_msg(to_id, msg)
                sent_count += 1
                
        return {"status": "success", "notifications_sent": sent_count}
    except Exception as e:
        logger.error(f"Error notifying debts: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
