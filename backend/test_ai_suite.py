import os
import sys
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.db.session import get_db
from app.models.user import User

def run_suite():
    print("[TEST] Initializing AI Test Suite...", flush=True)
    client = TestClient(app)
    db = next(get_db())
    try:
        user = db.query(User).first()
        if not user:
            print("[ERROR] No user found in DB", flush=True)
            sys.exit(1)
        role_val = user.role.value if hasattr(user.role, "value") else str(user.role)
        token = create_access_token(subject=str(user.id), role=role_val)
    finally:
        db.close()

    headers = {"Authorization": f"Bearer {token}"}

    # 1. Seed synthetic demonstration case CS-2026-0003
    print("\n[1/7] Testing Synthetic Case Seeding...")
    res = client.post("/api/demo/seed-synthetic-case", headers=headers)
    assert res.status_code == 200, f"Seed failed: {res.text}"
    case_data = res.json()
    case_id = case_data["case_id"]
    case_number = case_data["case_number"]
    print(f"  [OK] Seeded synthetic case: {case_number} ({case_id})")

    # 2. Test Evidence Analysis Inspection
    print("\n[2/7] Testing Evidence Analysis Endpoint...")
    res_ev = client.get(f"/api/cases/{case_id}/evidence", headers=headers)
    assert res_ev.status_code == 200, f"Evidence fetch failed: {res_ev.text}"
    ev_items = res_ev.json().get("items", [])
    assert len(ev_items) >= 5, f"Expected at least 5 evidence items, found {len(ev_items)}"
    first_ev_id = ev_items[0]["id"]
    res_analysis = client.get(f"/api/evidence/{first_ev_id}/analysis", headers=headers)
    assert res_analysis.status_code == 200, f"Analysis fetch failed: {res_analysis.text}"
    analysis_data = res_analysis.json()
    print(f"  [OK] Evidence Analysis retrieved: {analysis_data.get('original_name')} - {len(analysis_data.get('entities', []))} entities")

    # 3. Test Correlations & Entities
    print("\n[3/7] Testing Cross-Evidence Correlations & Extracted Entities...")
    res_corr = client.get(f"/api/cases/{case_id}/correlations", headers=headers)
    assert res_corr.status_code == 200, f"Correlations failed: {res_corr.text}"
    correlations = res_corr.json()
    print(f"  [OK] Found {len(correlations)} cross-source correlations")
    assert len(correlations) > 0, "Expected at least 1 correlation"

    res_ent = client.get(f"/api/cases/{case_id}/entities", headers=headers)
    assert res_ent.status_code == 200, f"Entities failed: {res_ent.text}"
    entities = res_ent.json()
    print(f"  [OK] Found {len(entities)} extracted normalized entities")
    assert len(entities) > 0, "Expected at least 1 entity"

    # 4. Test Risk Assessment
    print("\n[4/7] Testing Transparent Risk Score & Factor Breakdown...")
    res_risk = client.get(f"/api/cases/{case_id}/risk", headers=headers)
    assert res_risk.status_code == 200, f"Risk assessment failed: {res_risk.text}"
    risk_data = res_risk.json()
    print(f"  [OK] Risk Score: {risk_data.get('risk_score')}/100 ({risk_data.get('risk_level')})")
    print(f"  [OK] Risk Factors: {len(risk_data.get('factors', []))} factor point breakdowns")
    assert 0 <= risk_data.get("risk_score", -1) <= 100

    # 5. Test Graph Data
    print("\n[5/7] Testing Interactive Knowledge Graph...")
    res_graph = client.get(f"/api/cases/{case_id}/graph", headers=headers)
    assert res_graph.status_code == 200, f"Graph failed: {res_graph.text}"
    graph_data = res_graph.json()
    print(f"  [OK] Graph: {len(graph_data.get('nodes', []))} nodes, {len(graph_data.get('edges', []))} edges")
    assert len(graph_data.get("nodes", [])) > 0

    # 6. Test RAG Search & AI Investigation Summary
    print("\n[6/7] Testing Grounded RAG Search & AI Summary...")
    res_rag = client.post(f"/api/cases/{case_id}/search", json={"query": "ransom demand Bitcoin address"}, headers=headers)
    assert res_rag.status_code == 200, f"RAG failed: {res_rag.text}"
    rag_data = res_rag.json()
    print(f"  [OK] RAG Search Answer: '{rag_data.get('answer')[:70]}...'")
    print(f"  [OK] Grounded Evidence Sources: {len(rag_data.get('sources', []))}")
    assert len(rag_data.get("sources", [])) > 0

    res_sum = client.post(f"/api/cases/{case_id}/summarize", headers=headers)
    assert res_sum.status_code == 200, f"Summarize failed: {res_sum.text}"
    sum_data = res_sum.json()
    print(f"  [OK] AI Investigation Summary generated ({len(sum_data.get('summary', ''))} chars, {len(sum_data.get('key_findings', []))} key findings)")

    # 7. Test Human Oversight Review Actions (Verify, Reject, Modify Lead)
    print("\n[7/7] Testing Human Oversight Review Loop (Verify / Reject / Modify)...")
    res_leads = client.get(f"/api/cases/{case_id}/leads", headers=headers)
    leads = res_leads.json()
    assert len(leads) > 0, "No leads available to review"
    lead_id = leads[0]["id"]

    # Verify Lead
    res_v = client.post(f"/api/leads/{lead_id}/verify", json={"reason": "Investigator confirmed phone match with victim's mother."}, headers=headers)
    assert res_v.status_code == 200, f"Verify failed: {res_v.text}"
    assert res_v.json()["review_state"] == "VERIFIED"
    print("  [OK] Lead verified successfully with audit log.")

    # Modify Lead
    res_m = client.post(f"/api/leads/{lead_id}/modify", json={"title": "Updated Lead Title: Priority Surveillance", "reason": "Adjusted surveillance perimeter."}, headers=headers)
    assert res_m.status_code == 200, f"Modify failed: {res_m.text}"
    assert res_m.json()["review_state"] == "MODIFIED"
    print("  [OK] Lead modified successfully with audit justification.")

    # Reject Lead (use second lead if available)
    second_lead_id = leads[1]["id"] if len(leads) > 1 else lead_id
    res_r = client.post(f"/api/leads/{second_lead_id}/reject", json={"reason": "False positive contact."}, headers=headers)
    assert res_r.status_code == 200, f"Reject failed: {res_r.text}"
    assert res_r.json()["review_state"] == "REJECTED"
    print("  [OK] Lead rejected successfully with officer explanation.")

    print("\n" + "=" * 60)
    print(" ALL 7 AI INTELLIGENCE TEST GROUPS PASSED WITH 100% SUCCESS!")
    print("=" * 60)

def test_ai_intelligence_suite():
    run_suite()


if __name__ == "__main__":
    run_suite()
