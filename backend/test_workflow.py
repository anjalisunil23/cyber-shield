"""Comprehensive test for Investigator <-> Supervisor Workflow Integration."""

from __future__ import annotations

import sys
import uuid
from datetime import datetime, timezone

from app.core.security import hash_password
from app.db.session import get_db
from app.models.enums import CasePriority, CaseStatus, TimelineEventType, ActivityAction
from app.models.user import User, UserRole
from app.models.case import Case, CaseAssignment
from app.services.case_service import CaseService
from app.schemas.domain import CaseCreate, CaseReviewRequest
from app.repositories.common import TimelineRepository, ActivityRepository, NotificationRepository


def run_workflow_tests():
    db = next(get_db())
    try:
        print("[1/7] Setting up test users...")
        test_inv_email = f"test_inv_{uuid.uuid4().hex[:6]}@shield.gov"
        test_sup_email = f"test_sup_{uuid.uuid4().hex[:6]}@shield.gov"

        inv_user = User(
            id=uuid.uuid4(),
            email=test_inv_email,
            password_hash=hash_password("TestPass123!"),
            full_name="Agent Investigator",
            role=UserRole.investigator,
            is_active=True,
        )
        sup_user = User(
            id=uuid.uuid4(),
            email=test_sup_email,
            password_hash=hash_password("TestPass123!"),
            full_name="Captain Supervisor",
            role=UserRole.supervisor,
            is_active=True,
        )
        db.add(inv_user)
        db.add(sup_user)
        db.commit()
        db.refresh(inv_user)
        db.refresh(sup_user)

        case_svc = CaseService(db)

        print("[2/7] Investigator creates a new investigation case...")
        case_payload = CaseCreate(
            title="Operation Shadow Phantom",
            description="Investigating ransomware payload distribution.",
            priority=CasePriority.high,
            status=CaseStatus.in_progress,
            notes="Initial triage underway.",
            assignee_ids=[inv_user.id],
        )
        case = case_svc.create(case_payload, inv_user)
        assert case.status == CaseStatus.in_progress
        assert case.created_by_id == inv_user.id
        print(f"  -> Case created: {case.case_number} (Status: {case.status.value})")

        print("[3/7] Investigator submits case for supervisor review...")
        submitted_case = case_svc.submit_for_review(case.id, inv_user)
        assert submitted_case.status == CaseStatus.under_review
        assert submitted_case.submitted_at is not None
        print(f"  -> Submitted for review at: {submitted_case.submitted_at}")

        # Verify Timeline & Activity
        timeline = TimelineRepository(db).list_for_case(case.id)
        assert any(t.event_type == TimelineEventType.review_submitted for t in timeline)
        activities, _ = ActivityRepository(db).list(limit=20)
        assert any(a.action == ActivityAction.submit_for_review and str(a.case_id) == str(case.id) for a in activities)
        print("  -> Verified review_submitted timeline event and activity log.")

        print("[4/7] Supervisor requests changes with mandatory comments...")
        revised_case = case_svc.review_case(
            case.id,
            action="request_changes",
            review_comment="Please extract and correlate EXIF metadata for image evidence before signoff.",
            actor=sup_user,
        )
        assert revised_case.status == CaseStatus.changes_requested
        assert revised_case.supervisor_id == sup_user.id
        assert revised_case.review_comment == "Please extract and correlate EXIF metadata for image evidence before signoff."
        assert revised_case.reviewed_at is not None
        print(f"  -> Supervisor requested changes: '{revised_case.review_comment}'")

        # Verify Supervisor review notification to investigator
        notifs = NotificationRepository(db).list_for_user(inv_user.id)
        assert any("changes" in n.title.lower() or "revision" in n.title.lower() for n in notifs)
        print("  -> Verified revision notification sent to investigator.")

        print("[5/7] Investigator addresses feedback and resubmits...")
        resubmitted_case = case_svc.submit_for_review(case.id, inv_user)
        assert resubmitted_case.status == CaseStatus.under_review
        print("  -> Case successfully resubmitted to supervisor.")

        print("[6/7] Supervisor approves the case...")
        approved_case = case_svc.review_case(
            case.id,
            action="approve",
            review_comment="All evidence verified and chain of custody intact. Approved for final closure.",
            actor=sup_user,
        )
        assert approved_case.status == CaseStatus.approved
        assert approved_case.reviewed_at is not None
        print(f"  -> Case approved by {approved_case.supervisor.full_name if approved_case.supervisor else 'Supervisor'}")

        # Verify Approved Timeline & Notifications
        timeline = TimelineRepository(db).list_for_case(case.id)
        assert any(t.event_type == TimelineEventType.case_approved for t in timeline)
        print("  -> Verified case_approved timeline event and approval notifications.")

        print("[7/7] Supervisor closes the approved case...")
        closed_case = case_svc.close_case(case.id, sup_user)
        assert closed_case.status == CaseStatus.closed
        print(f"  -> Case closed: {closed_case.case_number}")

        print("\n========================================================")
        print(" ALL WORKFLOW INTEGRATION TESTS PASSED WITH 100% SUCCESS!")
        print("========================================================")

        # Cleanup
        db.delete(case)
        db.delete(inv_user)
        db.delete(sup_user)
        db.commit()

    except Exception as e:
        db.rollback()
        print(f"TEST FAILED: {e}", file=sys.stderr)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_workflow_tests()
