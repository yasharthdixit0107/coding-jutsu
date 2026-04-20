import os
import time
from datetime import datetime
from dotenv import load_dotenv

from fastapi import FastAPI, Request, UploadFile, File, Query, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from detectors.regex_detector import scan_text, mask_text
from detectors.nlp_detector import scan_with_nlp
from detectors.file_detector import get_text_from_file
from policy.engine import decide, Action, POLICY_RULES, update_policy
from models.schemas import (
    ScanTextRequest, 
    ScanTextResponse, 
    ScanFileResponse, 
    ScanEmailRequest, 
    PolicyUpdateRequest
)
from database import init_db, save_incident, get_incidents, get_incident_by_id, get_stats

app = FastAPI(title="DLP System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await init_db()
    print("DLP System started")

@app.middleware("http")
async def dlp_middleware(request: Request, call_next):
    skip_paths = ["/docs", "/openapi.json", "/redoc", "/health", "/api/incidents", "/api/stats", "/api/policies"]
    path = request.url.path
    
    if request.method == "OPTIONS":
        return await call_next(request)
        
    if path in skip_paths or path.startswith("/api/incidents"):
        return await call_next(request)

    try:
        body_bytes = await request.body()
    except Exception:
        body_bytes = b""
        
    if not body_bytes:
        return await call_next(request)
        
    body_text = body_bytes.decode("utf-8", errors="ignore")

    findings = []
    if body_text.strip():
        findings = scan_text(body_text) + scan_with_nlp(body_text)
        
    decision = decide(findings)
    action = decision["action"]
    risk_score = decision["risk_score"]
    
    client_ip = request.client.host if request.client else "unknown"

    if action == Action.BLOCK.value:
        await save_incident({
            "channel": "api",
            "action_taken": "blocked",
            "findings": findings,
            "risk_score": risk_score,
            "source_ip": client_ip,
            "original_preview": body_text[:100]
        })
        return JSONResponse(
            status_code=403,
            content={
                "error": "Request blocked — sensitive data detected",
                "action": "blocked",
                "findings": findings,
                "risk_score": risk_score
            }
        )
    elif action == Action.MASK.value:
        masked_body = mask_text(body_text)
        await save_incident({
            "channel": "api",
            "action_taken": "masked",
            "findings": findings,
            "risk_score": risk_score,
            "source_ip": client_ip,
            "original_preview": body_text[:100],
            "masked_content": masked_body[:100]
        })
        async def receive():
            return {"type": "http.request", "body": masked_body.encode("utf-8")}
        request._receive = receive
        
        return await call_next(request)
    elif action == Action.ALERT.value:
        await save_incident({
            "channel": "api",
            "action_taken": "alerted",
            "findings": findings,
            "risk_score": risk_score,
            "source_ip": client_ip,
            "original_preview": body_text[:100]
        })
        async def receive():
            return {"type": "http.request", "body": body_bytes}
        request._receive = receive
        return await call_next(request)
    else:
        async def receive():
            return {"type": "http.request", "body": body_bytes}
        request._receive = receive
        return await call_next(request)

@app.get("/health")
async def health_check():
    return {
        "status": "ok", 
        "database": "mongodb", 
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    }

@app.post("/api/scan/text", response_model=ScanTextResponse)
async def api_scan_text(req: ScanTextRequest, request: Request):
    start_time = time.time()
    findings = scan_text(req.text) + scan_with_nlp(req.text)
    decision = decide(findings)
    action = decision["action"]
    risk_score = decision["risk_score"]
    
    masked_data = mask_text(req.text)
    
    await save_incident({
        "channel": "text",
        "action_taken": action.lower(),
        "findings": findings,
        "risk_score": risk_score,
        "source_ip": request.client.host if request.client else "unknown",
        "original_preview": req.text[:100],
        "masked_content": masked_data[:100] if action == Action.MASK.value else None
    })
    
    process_time = (time.time() - start_time) * 1000.0
    
    return ScanTextResponse(
        action=action,
        findings=findings,
        risk_score=risk_score,
        masked_text=masked_data,
        processing_time_ms=process_time
    )

@app.post("/api/scan/file", response_model=ScanFileResponse)
async def api_scan_file(file: UploadFile, request: Request):
    file_bytes = await file.read()
    file_size_kb = len(file_bytes) / 1024.0
    
    extracted_text = get_text_from_file(file.filename, file_bytes)
    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Empty text extracted")
        
    findings = scan_text(extracted_text) + scan_with_nlp(extracted_text)
    decision = decide(findings)
    action = decision["action"]
    risk_score = decision["risk_score"]
    
    masked_data = mask_text(extracted_text)
    
    await save_incident({
        "channel": "file",
        "action_taken": action.lower(),
        "findings": findings,
        "risk_score": risk_score,
        "source_ip": request.client.host if request.client else "unknown",
        "original_preview": extracted_text[:100],
        "masked_content": masked_data[:100] if action == Action.MASK.value else None
    })
    
    return ScanFileResponse(
        filename=file.filename,
        file_size_kb=file_size_kb,
        action=action,
        findings=findings,
        risk_score=risk_score,
        text_preview=extracted_text[:300],
        masked_content=masked_data if action == Action.MASK.value else None
    )

@app.post("/api/scan/email")
async def api_scan_email(req: ScanEmailRequest, request: Request):
    combined_text = req.subject + " " + req.body
    findings = scan_text(combined_text) + scan_with_nlp(combined_text)
    decision = decide(findings)
    action = decision["action"]
    risk_score = decision["risk_score"]
    
    await save_incident({
        "channel": "email",
        "action_taken": action.lower(),
        "findings": findings,
        "risk_score": risk_score,
        "source_ip": request.client.host if request.client else "unknown",
        "original_preview": combined_text[:100]
    })
    
    safe_to_send = (action in [Action.ALLOW.value, Action.ALERT.value])
    
    return {
        "action": action,
        "findings": findings,
        "risk_score": risk_score,
        "safe_to_send": safe_to_send
    }

@app.get("/api/incidents")
async def get_incidents_api(page: int = 1, limit: int = 20, action: str = Query(None)):
    skip = (page - 1) * limit
    results = await get_incidents(limit, skip, action)
    stats = await get_stats()
    total = stats["total"]
    return {
        "incidents": results,
        "total": total,
        "page": page,
        "limit": limit
    }

@app.get("/api/incidents/{id}")
async def get_incident_api(id: str):
    inc = await get_incident_by_id(id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc

@app.get("/api/stats")
async def api_get_stats():
    return await get_stats()

@app.get("/api/policies")
async def get_policies():
    return {k: v.value for k, v in POLICY_RULES.items()}

@app.put("/api/policies")
async def api_update_policy(req: PolicyUpdateRequest):
    success = update_policy(req.data_type, req.action)
    if not success:
        return JSONResponse(status_code=404, content={"error": "data_type not found"})
    return {"success": True, "data_type": req.data_type, "new_action": req.action}
