import os
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "dlp_db")

client = AsyncIOMotorClient(MONGO_URI)
db = client[MONGO_DB_NAME]
incidents_collection = db["incidents"]

async def save_incident(data: dict) -> str:
    if "timestamp" not in data:
        data["timestamp"] = datetime.now(timezone.utc)
    try:
        result = await incidents_collection.insert_one(data)
        return str(result.inserted_id)
    except Exception as e:
        print(f"DB Error: {e}")
        return "failed_id"

async def get_incidents(limit: int = 20, skip: int = 0, action_filter: str = None) -> list:
    try:
        query = {}
        if action_filter:
            query["action_taken"] = action_filter
            
        cursor = incidents_collection.find(query).sort("timestamp", -1).skip(skip).limit(limit)
        incidents = []
        async for document in cursor:
            document["_id"] = str(document["_id"])
            incidents.append(document)
        return incidents
    except Exception as e:
        print(f"DB Error get_incidents: {e}")
        return []

async def get_incident_by_id(id: str) -> dict:
    try:
        document = await incidents_collection.find_one({"_id": ObjectId(id)})
        if document:
            document["_id"] = str(document["_id"])
        return document
    except Exception:
        return None

async def get_stats() -> dict:
    try:
        total = await incidents_collection.count_documents({})
        
        actions_pipeline = [
            {"$group": {"_id": "$action_taken", "count": {"$sum": 1}}}
        ]
        actions_cursor = incidents_collection.aggregate(actions_pipeline)
        
        blocked = masked = alerted = 0
        async for doc in actions_cursor:
            if doc["_id"] == "BLOCK" or doc["_id"] == "blocked": blocked = doc["count"]
            elif doc["_id"] == "MASK" or doc["_id"] == "masked": masked = doc["count"]
            elif doc["_id"] == "ALERT" or doc["_id"] == "alerted": alerted = doc["count"]
            
        findings_pipeline = [
            {"$unwind": "$findings"},
            {"$group": {"_id": "$findings.type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]
        findings_cursor = incidents_collection.aggregate(findings_pipeline)
        top_data_types = {doc["_id"]: doc["count"] async for doc in findings_cursor}
        
        days_pipeline = [
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": -1}},
            {"$limit": 7}
        ]
        days_cursor = incidents_collection.aggregate(days_pipeline)
        incidents_by_day = {doc["_id"]: doc["count"] async for doc in days_cursor}
        
        score_pipeline = [
            {"$group": {"_id": None, "avg_score": {"$avg": "$risk_score"}}}
        ]
        score_cursor = incidents_collection.aggregate(score_pipeline)
        avg_score_doc = await score_cursor.to_list(1)
        avg_risk_score = avg_score_doc[0]["avg_score"] if avg_score_doc else 0.0
        
        return {
            "total": total,
            "blocked": blocked,
            "masked": masked,
            "alerted": alerted,
            "top_data_types": top_data_types,
            "incidents_by_day": incidents_by_day,
            "avg_risk_score": avg_risk_score
        }
    except Exception as e:
        print(f"DB Error get_stats: {e}")
        return {
            "total": 0,
            "blocked": 0,
            "masked": 0,
            "alerted": 0,
            "top_data_types": {},
            "incidents_by_day": {"Today": 0},
            "avg_risk_score": 0.0
        }

async def init_db():
    try:
        await incidents_collection.create_index([("timestamp", -1)])
        await incidents_collection.create_index([("action_taken", 1)])
        await incidents_collection.create_index([("risk_score", -1)])
        print("MongoDB connected successfully")
    except Exception as e:
        print(f"MongoDB connection skipped: {e}")
