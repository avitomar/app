from fastapi import FastAPI, APIRouter, HTTPException, Cookie, Response, Header
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================
# ENUMS
# ============================================
class UserRole(str, Enum):
    OWNER = "owner"
    PRODUCTION_MANAGER = "production_manager"
    INVENTORY_MANAGER = "inventory_manager"
    SALES_MANAGER = "sales_manager"
    OPERATOR = "operator"

class MaterialType(str, Enum):
    SHEET = "sheet"
    REEL = "reel"

class JobStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PRODUCTION = "in_production"
    READY = "ready"
    DISPATCHED = "dispatched"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

# ============================================
# PYDANTIC MODELS
# ============================================

# Auth Models
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: UserRole = UserRole.OPERATOR
    created_at: datetime

class SessionData(BaseModel):
    session_token: str
    user_id: str
    expires_at: datetime
    created_at: datetime

# Raw Material Models
class RawMaterial(BaseModel):
    material_id: str
    name: str
    material_type: MaterialType
    gsm: float  # Grams per square meter
    length_inch: Optional[float] = None  # For sheets
    width_inch: Optional[float] = None   # For sheets
    diameter_inch: Optional[float] = None  # For reels
    width_reel_inch: Optional[float] = None  # For reels
    quantity: float  # Number of sheets or reels
    weight_kg: float  # Calculated weight
    rate_per_kg: float
    reorder_level: float
    supplier: Optional[str] = None
    created_by: str
    created_at: datetime
    updated_at: datetime

class RawMaterialCreate(BaseModel):
    name: str
    material_type: MaterialType
    gsm: float
    length_inch: Optional[float] = None
    width_inch: Optional[float] = None
    diameter_inch: Optional[float] = None
    width_reel_inch: Optional[float] = None
    quantity: float
    rate_per_kg: float
    reorder_level: float = 100
    supplier: Optional[str] = None

# Machine Models
class Machine(BaseModel):
    machine_id: str
    name: str
    machine_type: str  # e.g., "Cutting", "Binding", "Printing"
    status: str = "active"  # active, maintenance, inactive
    created_at: datetime

class MachineCreate(BaseModel):
    name: str
    machine_type: str

# Job Card Models
class JobCard(BaseModel):
    job_id: str
    job_number: str
    customer_name: str
    product_name: str
    quantity: int
    material_id: str
    machine_id: str
    status: JobStatus
    target_completion: datetime
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    raw_material_consumed_kg: float = 0
    wastage_kg: float = 0
    created_by: str
    created_at: datetime
    updated_at: datetime

class JobCardCreate(BaseModel):
    customer_name: str
    product_name: str
    quantity: int
    material_id: str
    machine_id: str
    target_completion: datetime

class JobCardUpdate(BaseModel):
    status: Optional[JobStatus] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    raw_material_consumed_kg: Optional[float] = None
    wastage_kg: Optional[float] = None

# Production Log Models
class ProductionLog(BaseModel):
    log_id: str
    job_id: str
    machine_id: str
    shift: str  # morning, afternoon, night
    operator_id: str
    produced_quantity: int
    wastage_quantity: int
    downtime_minutes: int = 0
    notes: Optional[str] = None
    created_at: datetime

class ProductionLogCreate(BaseModel):
    job_id: str
    machine_id: str
    shift: str
    produced_quantity: int
    wastage_quantity: int = 0
    downtime_minutes: int = 0
    notes: Optional[str] = None

# Inventory Models
class InventoryItem(BaseModel):
    inventory_id: str
    product_name: str
    sku: str
    batch_number: str
    quantity: int
    unit_weight_kg: float
    unit_cost: float
    is_finished: bool = True  # True for finished goods, False for semi-finished
    job_id: Optional[str] = None
    created_by: str
    created_at: datetime
    updated_at: datetime

class InventoryItemCreate(BaseModel):
    product_name: str
    sku: str
    batch_number: str
    quantity: int
    unit_weight_kg: float
    unit_cost: float
    is_finished: bool = True
    job_id: Optional[str] = None

# Customer Models
class Customer(BaseModel):
    customer_id: str
    name: str
    contact_person: Optional[str] = None
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    gstin: Optional[str] = None
    credit_limit: float = 0
    outstanding: float = 0
    created_at: datetime

class CustomerCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    gstin: Optional[str] = None
    credit_limit: float = 0

# Sales Order Models
class SalesOrder(BaseModel):
    order_id: str
    order_number: str
    customer_id: str
    customer_name: str
    items: List[dict]  # [{product_name, quantity, rate, amount}]
    total_amount: float
    gst_amount: float
    grand_total: float
    status: OrderStatus
    order_date: datetime
    delivery_date: Optional[datetime] = None
    dispatched_date: Optional[datetime] = None
    created_by: str
    created_at: datetime
    updated_at: datetime

class SalesOrderCreate(BaseModel):
    customer_id: str
    items: List[dict]
    delivery_date: Optional[datetime] = None

# Dashboard Stats Model
class DashboardStats(BaseModel):
    total_production_today: int
    pending_orders: int
    machine_utilization_percent: float
    paper_stock_tons: float
    daily_revenue: float
    active_jobs: int
    low_stock_materials: int

# ============================================
# HELPER FUNCTIONS
# ============================================

def calculate_paper_weight(material_type: MaterialType, gsm: float, length_inch: float = None, 
                          width_inch: float = None, diameter_inch: float = None, 
                          width_reel_inch: float = None, quantity: float = 1) -> float:
    """
    Calculate paper weight based on industry standard formulas
    """
    if material_type == MaterialType.SHEET:
        # Sheet Weight (kg) = (Length(inch) × Width(inch) × GSM) / 1550000
        weight_per_sheet = (length_inch * width_inch * gsm) / 1550000
        return weight_per_sheet * quantity
    elif material_type == MaterialType.REEL:
        # For reels: approximate based on diameter and width
        # This is a simplified calculation
        # Actual formula would need core diameter and paper thickness
        if diameter_inch and width_reel_inch:
            # Approximate: larger reels weigh more
            weight_per_reel = (diameter_inch * width_reel_inch * gsm) / 1000
            return weight_per_reel * quantity
    return 0

def calculate_wastage_percent(input_qty: float, output_qty: float) -> float:
    """Calculate wastage percentage"""
    if input_qty == 0:
        return 0
    return ((input_qty - output_qty) / input_qty) * 100

async def get_current_user(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
) -> User:
    """Get current user from session token (cookie or header)"""
    token = session_token
    
    # Fallback to Authorization header
    if not token and authorization:
        if authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**user_doc)

# ============================================
# AUTH ENDPOINTS
# ============================================

@api_router.post("/auth/session")
async def create_session(session_id: str, response: Response):
    """Exchange session_id for user data and create session"""
    try:
        # Call Emergent Auth API
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session_id")
            
            auth_data = resp.json()
        
        # Create or update user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        existing_user = await db.users.find_one({"email": auth_data["email"]}, {"_id": 0})
        
        if existing_user:
            user_id = existing_user["user_id"]
            # Update user info
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {
                    "name": auth_data["name"],
                    "picture": auth_data.get("picture")
                }}
            )
        else:
            # Create new user with default role
            user_doc = {
                "user_id": user_id,
                "email": auth_data["email"],
                "name": auth_data["name"],
                "picture": auth_data.get("picture"),
                "role": UserRole.OPERATOR,  # Default role
                "created_at": datetime.now(timezone.utc)
            }
            await db.users.insert_one(user_doc)
        
        # Create session
        session_token = auth_data["session_token"]
        session_doc = {
            "session_token": session_token,
            "user_id": user_id,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
            "created_at": datetime.now(timezone.utc)
        }
        await db.user_sessions.insert_one(session_doc)
        
        # Set cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7*24*60*60,
            path="/"
        )
        
        # Get full user data
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        
        return User(**user)
    
    except Exception as e:
        logger.error(f"Session creation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/auth/me")
async def get_me(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get current user info"""
    user = await get_current_user(session_token, authorization)
    return user

@api_router.post("/auth/logout")
async def logout(response: Response, session_token: Optional[str] = Cookie(None)):
    """Logout user"""
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
        response.delete_cookie("session_token", path="/")
    return {"message": "Logged out successfully"}

# ============================================
# RAW MATERIAL ENDPOINTS
# ============================================

@api_router.post("/materials", response_model=RawMaterial)
async def create_material(
    material: RawMaterialCreate,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Create new raw material entry"""
    user = await get_current_user(session_token, authorization)
    
    # Calculate weight
    weight = calculate_paper_weight(
        material.material_type,
        material.gsm,
        material.length_inch,
        material.width_inch,
        material.diameter_inch,
        material.width_reel_inch,
        material.quantity
    )
    
    material_doc = {
        "material_id": f"mat_{uuid.uuid4().hex[:8]}",
        **material.dict(),
        "weight_kg": weight,
        "created_by": user.user_id,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.raw_materials.insert_one(material_doc)
    return RawMaterial(**material_doc)

@api_router.get("/materials", response_model=List[RawMaterial])
async def get_materials(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get all raw materials"""
    await get_current_user(session_token, authorization)
    materials = await db.raw_materials.find({}, {"_id": 0}).to_list(1000)
    return [RawMaterial(**mat) for mat in materials]

@api_router.get("/materials/low-stock", response_model=List[RawMaterial])
async def get_low_stock_materials(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get materials below reorder level"""
    await get_current_user(session_token, authorization)
    materials = await db.raw_materials.find(
        {"$expr": {"$lt": ["$quantity", "$reorder_level"]}},
        {"_id": 0}
    ).to_list(1000)
    return [RawMaterial(**mat) for mat in materials]

class StockUpdateRequest(BaseModel):
    quantity_change: float

@api_router.put("/materials/{material_id}/stock")
async def update_material_stock(
    material_id: str,
    request: StockUpdateRequest,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Update material stock (add or subtract)"""
    await get_current_user(session_token, authorization)
    
    material = await db.raw_materials.find_one({"material_id": material_id}, {"_id": 0})
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    
    new_quantity = material["quantity"] + quantity_change
    if new_quantity < 0:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    # Recalculate weight
    new_weight = calculate_paper_weight(
        material["material_type"],
        material["gsm"],
        material.get("length_inch"),
        material.get("width_inch"),
        material.get("diameter_inch"),
        material.get("width_reel_inch"),
        new_quantity
    )
    
    await db.raw_materials.update_one(
        {"material_id": material_id},
        {"$set": {
            "quantity": new_quantity,
            "weight_kg": new_weight,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    return {"message": "Stock updated", "new_quantity": new_quantity, "new_weight_kg": new_weight}

# ============================================
# MACHINE ENDPOINTS
# ============================================

@api_router.post("/machines", response_model=Machine)
async def create_machine(
    machine: MachineCreate,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Create new machine"""
    user = await get_current_user(session_token, authorization)
    
    if user.role not in [UserRole.OWNER, UserRole.PRODUCTION_MANAGER]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    machine_doc = {
        "machine_id": f"mach_{uuid.uuid4().hex[:8]}",
        **machine.dict(),
        "status": "active",
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.machines.insert_one(machine_doc)
    return Machine(**machine_doc)

@api_router.get("/machines", response_model=List[Machine])
async def get_machines(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get all machines"""
    await get_current_user(session_token, authorization)
    machines = await db.machines.find({}, {"_id": 0}).to_list(1000)
    return [Machine(**mach) for mach in machines]

# ============================================
# JOB CARD ENDPOINTS
# ============================================

@api_router.post("/jobs", response_model=JobCard)
async def create_job(
    job: JobCardCreate,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Create new job card"""
    user = await get_current_user(session_token, authorization)
    
    # Generate job number
    job_count = await db.job_cards.count_documents({}) + 1
    job_number = f"JOB{job_count:05d}"
    
    job_doc = {
        "job_id": f"job_{uuid.uuid4().hex[:8]}",
        "job_number": job_number,
        **job.dict(),
        "status": JobStatus.PENDING,
        "actual_start": None,
        "actual_end": None,
        "raw_material_consumed_kg": 0,
        "wastage_kg": 0,
        "created_by": user.user_id,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.job_cards.insert_one(job_doc)
    return JobCard(**job_doc)

@api_router.get("/jobs", response_model=List[JobCard])
async def get_jobs(
    status: Optional[JobStatus] = None,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get all job cards"""
    await get_current_user(session_token, authorization)
    
    query = {}
    if status:
        query["status"] = status
    
    jobs = await db.job_cards.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [JobCard(**job) for job in jobs]

@api_router.put("/jobs/{job_id}")
async def update_job(
    job_id: str,
    update: JobCardUpdate,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Update job card"""
    await get_current_user(session_token, authorization)
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.job_cards.update_one(
        {"job_id": job_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = await db.job_cards.find_one({"job_id": job_id}, {"_id": 0})
    return JobCard(**job)

# ============================================
# PRODUCTION LOG ENDPOINTS
# ============================================

@api_router.post("/production-logs", response_model=ProductionLog)
async def create_production_log(
    log: ProductionLogCreate,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Create production log entry"""
    user = await get_current_user(session_token, authorization)
    
    log_doc = {
        "log_id": f"log_{uuid.uuid4().hex[:8]}",
        **log.dict(),
        "operator_id": user.user_id,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.production_logs.insert_one(log_doc)
    
    # Update job card statistics
    total_produced = await db.production_logs.aggregate([
        {"$match": {"job_id": log.job_id}},
        {"$group": {"_id": None, "total": {"$sum": "$produced_quantity"}}}
    ]).to_list(1)
    
    if total_produced:
        await db.job_cards.update_one(
            {"job_id": log.job_id},
            {"$set": {"updated_at": datetime.now(timezone.utc)}}
        )
    
    return ProductionLog(**log_doc)

@api_router.get("/production-logs", response_model=List[ProductionLog])
async def get_production_logs(
    job_id: Optional[str] = None,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get production logs"""
    await get_current_user(session_token, authorization)
    
    query = {}
    if job_id:
        query["job_id"] = job_id
    
    logs = await db.production_logs.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [ProductionLog(**log) for log in logs]

# ============================================
# INVENTORY ENDPOINTS
# ============================================

@api_router.post("/inventory", response_model=InventoryItem)
async def create_inventory_item(
    item: InventoryItemCreate,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Create inventory item"""
    user = await get_current_user(session_token, authorization)
    
    item_doc = {
        "inventory_id": f"inv_{uuid.uuid4().hex[:8]}",
        **item.dict(),
        "created_by": user.user_id,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.inventory.insert_one(item_doc)
    return InventoryItem(**item_doc)

@api_router.get("/inventory", response_model=List[InventoryItem])
async def get_inventory(
    is_finished: Optional[bool] = None,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get inventory items"""
    await get_current_user(session_token, authorization)
    
    query = {}
    if is_finished is not None:
        query["is_finished"] = is_finished
    
    items = await db.inventory.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [InventoryItem(**item) for item in items]

# ============================================
# CUSTOMER ENDPOINTS
# ============================================

@api_router.post("/customers", response_model=Customer)
async def create_customer(
    customer: CustomerCreate,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Create customer"""
    user = await get_current_user(session_token, authorization)
    
    if user.role not in [UserRole.OWNER, UserRole.SALES_MANAGER]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    customer_doc = {
        "customer_id": f"cust_{uuid.uuid4().hex[:8]}",
        **customer.dict(),
        "outstanding": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.customers.insert_one(customer_doc)
    return Customer(**customer_doc)

@api_router.get("/customers", response_model=List[Customer])
async def get_customers(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get all customers"""
    await get_current_user(session_token, authorization)
    customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
    return [Customer(**cust) for cust in customers]

# ============================================
# SALES ORDER ENDPOINTS
# ============================================

@api_router.post("/orders", response_model=SalesOrder)
async def create_order(
    order: SalesOrderCreate,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Create sales order"""
    user = await get_current_user(session_token, authorization)
    
    # Get customer
    customer = await db.customers.find_one({"customer_id": order.customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Calculate totals
    total_amount = sum(item.get("amount", 0) for item in order.items)
    gst_amount = total_amount * 0.18  # 18% GST
    grand_total = total_amount + gst_amount
    
    # Generate order number
    order_count = await db.sales_orders.count_documents({}) + 1
    order_number = f"ORD{order_count:05d}"
    
    order_doc = {
        "order_id": f"ord_{uuid.uuid4().hex[:8]}",
        "order_number": order_number,
        "customer_id": order.customer_id,
        "customer_name": customer["name"],
        "items": order.items,
        "total_amount": total_amount,
        "gst_amount": gst_amount,
        "grand_total": grand_total,
        "status": OrderStatus.PENDING,
        "order_date": datetime.now(timezone.utc),
        "delivery_date": order.delivery_date,
        "dispatched_date": None,
        "created_by": user.user_id,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.sales_orders.insert_one(order_doc)
    return SalesOrder(**order_doc)

@api_router.get("/orders", response_model=List[SalesOrder])
async def get_orders(
    status: Optional[OrderStatus] = None,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get sales orders"""
    await get_current_user(session_token, authorization)
    
    query = {}
    if status:
        query["status"] = status
    
    orders = await db.sales_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [SalesOrder(**order) for order in orders]

@api_router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    status: OrderStatus,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Update order status"""
    await get_current_user(session_token, authorization)
    
    update_data = {"status": status, "updated_at": datetime.now(timezone.utc)}
    
    if status == OrderStatus.DISPATCHED:
        update_data["dispatched_date"] = datetime.now(timezone.utc)
    
    result = await db.sales_orders.update_one(
        {"order_id": order_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated"}

# ============================================
# DASHBOARD ENDPOINTS
# ============================================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get dashboard statistics"""
    user = await get_current_user(session_token, authorization)
    
    # Total production today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_logs = await db.production_logs.find(
        {"created_at": {"$gte": today_start}}
    ).to_list(1000)
    total_production_today = sum(log.get("produced_quantity", 0) for log in today_logs)
    
    # Pending orders
    pending_orders = await db.sales_orders.count_documents(
        {"status": {"$in": [OrderStatus.PENDING, OrderStatus.CONFIRMED]}}
    )
    
    # Active jobs
    active_jobs = await db.job_cards.count_documents(
        {"status": {"$in": [JobStatus.PENDING, JobStatus.IN_PROGRESS]}}
    )
    
    # Paper stock in tons
    materials = await db.raw_materials.find({}, {"_id": 0}).to_list(1000)
    total_stock_kg = sum(mat.get("weight_kg", 0) for mat in materials)
    paper_stock_tons = total_stock_kg / 1000
    
    # Low stock materials
    low_stock_materials = await db.raw_materials.count_documents(
        {"$expr": {"$lt": ["$quantity", "$reorder_level"]}}
    )
    
    # Daily revenue (orders delivered today)
    daily_orders = await db.sales_orders.find(
        {
            "status": OrderStatus.DELIVERED,
            "updated_at": {"$gte": today_start}
        }
    ).to_list(1000)
    daily_revenue = sum(order.get("grand_total", 0) for order in daily_orders)
    
    # Machine utilization (simplified calculation)
    total_machines = await db.machines.count_documents({"status": "active"})
    active_machine_jobs = await db.job_cards.count_documents({"status": JobStatus.IN_PROGRESS})
    machine_utilization = (active_machine_jobs / total_machines * 100) if total_machines > 0 else 0
    
    return DashboardStats(
        total_production_today=total_production_today,
        pending_orders=pending_orders,
        machine_utilization_percent=round(machine_utilization, 2),
        paper_stock_tons=round(paper_stock_tons, 2),
        daily_revenue=round(daily_revenue, 2),
        active_jobs=active_jobs,
        low_stock_materials=low_stock_materials
    )

# ============================================
# INCLUDE ROUTER AND MIDDLEWARE
# ============================================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
