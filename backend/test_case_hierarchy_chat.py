"""Comprehensive tests for Case Investigation Hierarchy and Investigator Communication System."""

from __future__ import annotations

import sys
import uuid
from datetime import datetime, timezone
from fastapi import HTTPException

from app.core.security import hash_password
from app.db.session import get_db
from app.models.case import Case, InvestigatorAssignment
from app.models.chat import ChatConversation, ChatMessage, ChatParticipant
from app.models.enums import CasePriority, CaseStatus
from app.models.user import User, UserRole
from app.schemas.domain import CaseCreate, ReassignLeadRequest
from app.services.case_service import CaseService
from app.services.chat_service import ChatService


def run_hierarchy_and_chat_tests():
    db = next(get_db())
    try:
        print("\n--- [TEST 1/6] Creating Users (Superior Officer + Investigators) ---")
        suffix = uuid.uuid4().hex[:6]
        superior = User(
            id=uuid.uuid4(),
            email=f"superior_{suffix}@shield.gov",
            password_hash=hash_password("Pass123!"),
            full_name="Captain Reynolds",
            role=UserRole.supervisor,
            is_active=True,
        )
        john_lead = User(
            id=uuid.uuid4(),
            email=f"john_lead_{suffix}@shield.gov",
            password_hash=hash_password("Pass123!"),
            full_name="John Smith",
            role=UserRole.investigator,
            is_active=True,
        )
        alice_inv = User(
            id=uuid.uuid4(),
            email=f"alice_{suffix}@shield.gov",
            password_hash=hash_password("Pass123!"),
            full_name="Alice Johnson",
            role=UserRole.investigator,
            is_active=True,
        )
        robert_inv = User(
            id=uuid.uuid4(),
            email=f"robert_{suffix}@shield.gov",
            password_hash=hash_password("Pass123!"),
            full_name="Robert Davis",
            role=UserRole.investigator,
            is_active=True,
        )
        sarah_inv = User(
            id=uuid.uuid4(),
            email=f"sarah_{suffix}@shield.gov",
            password_hash=hash_password("Pass123!"),
            full_name="Sarah Wilson",
            role=UserRole.investigator,
            is_active=True,
        )
        db.add_all([superior, john_lead, alice_inv, robert_inv, sarah_inv])
        db.commit()
        for u in [superior, john_lead, alice_inv, robert_inv, sarah_inv]:
            db.refresh(u)
        print("  [OK] Created Superior Captain Reynolds, John Smith (Lead), Alice, Robert, Sarah")

        case_svc = CaseService(db)
        chat_svc = ChatService(db)

        print("\n--- [TEST 2/6] Superior Officer Creates Case and Assigns John as Initial Investigator ---")
        case = case_svc.create(
            CaseCreate(
                title="Operation Cyber Fortress",
                description="Investigating critical state infrastructure breach.",
                priority=CasePriority.critical,
                status=CaseStatus.open,
                investigator_lead_id=john_lead.id,
            ),
            actor=superior,
        )
        db.refresh(case)
        assert case.investigator_lead_id == john_lead.id, "Case investigator_lead_id must be John Smith"
        
        team = case_svc.get_team(case.id, superior)
        assert team.investigator_lead is not None, "Investigator Lead must exist in team"
        assert team.investigator_lead.user_id == john_lead.id, "Lead must be John Smith"
        assert team.investigator_lead.role == "INVESTIGATOR_LEAD", "Role must be INVESTIGATOR_LEAD"
        print(f"  [OK] Case {case.case_number} created with Investigator Lead: {team.investigator_lead.user.full_name}")

        # Check official Case Group Chat was created automatically
        convs = chat_svc.list_user_conversations(john_lead)
        case_group = next((c for c in convs if c.case_id == case.id and c.type == "case_group"), None)
        assert case_group is not None, "Case Group Chat must be created automatically"
        print(f"  [OK] Case Group Chat auto-created: '{case_group.title}' with participants: {[p.user.full_name for p in case_group.participants]}")

        print("\n--- [TEST 3/6] Investigator Lead (John Smith) Adds Alice and Robert to the Case Team ---")
        updated_team = case_svc.add_team_investigators(
            case.id,
            investigator_ids=[alice_inv.id, robert_inv.id],
            actor=john_lead,
        )
        assert len(updated_team.team_investigators) == 2, "Team should have 2 investigators"
        team_uids = {t.user_id for t in updated_team.team_investigators}
        assert alice_inv.id in team_uids and robert_inv.id in team_uids
        print(f"  [OK] John Smith added Alice and Robert. Total team size: {updated_team.total_members}")

        # Verify Alice and Robert are now in the Case Group Chat
        alice_convs = chat_svc.list_user_conversations(alice_inv)
        alice_case_group = next((c for c in alice_convs if c.case_id == case.id), None)
        assert alice_case_group is not None, "Alice must be automatically in the case group chat"
        assert len(alice_case_group.participants) >= 3, "Group chat must have active participants (Superior, John, Alice, Robert)"
        print(f"  [OK] Alice automatically enrolled in Case Chat: {[p.user.full_name for p in alice_case_group.participants]}")

        print("\n--- [TEST 4/6] Backend RBAC Verification: Regular Investigator Forbidden to Add Members / Change Lead ---")
        # Alice (regular investigator) attempts to add Sarah -> Must raise 403
        try:
            case_svc.add_team_investigators(case.id, investigator_ids=[sarah_inv.id], actor=alice_inv)
            raise AssertionError("Regular investigator should NOT be allowed to add team members!")
        except HTTPException as e:
            assert e.status_code == 403
            print("  [OK] Alice (regular investigator) adding members was blocked with 403 Forbidden")

        # Alice attempts to reassign the lead -> Must raise 403
        try:
            case_svc.reassign_lead(case.id, new_lead_id=alice_inv.id, keep_previous_lead=True, actor=alice_inv)
            raise AssertionError("Regular investigator should NOT be allowed to reassign case lead!")
        except HTTPException as e:
            assert e.status_code == 403
            print("  [OK] Alice reassigning lead was blocked with 403 Forbidden")

        print("\n--- [TEST 5/6] Communication System: Group Chat & 1-on-1 Direct Messaging ---")
        # 1. John sends group chat message
        msg1 = chat_svc.send_message(
            case_group.id,
            "Team, please begin forensic memory dump analysis.",
            actor=john_lead,
        )
        assert msg1.content == "Team, please begin forensic memory dump analysis."
        print(f"  [OK] John sent group message: '{msg1.content}'")

        # Alice checks messages
        alice_msgs = chat_svc.list_messages(case_group.id, actor=alice_inv)
        assert any(m.content == "Team, please begin forensic memory dump analysis." for m in alice_msgs)
        print(f"  [OK] Alice received group message stream ({len(alice_msgs)} messages including system events)")

        # 2. John opens direct 1-on-1 message with Alice
        direct_conv = chat_svc.get_or_create_direct_chat(
            target_user_id=alice_inv.id,
            actor=john_lead,
            case_id=case.id,
        )
        assert direct_conv.type == "direct"
        print(f"  [OK] Direct chat established between John and Alice: id={direct_conv.id}")

        direct_msg = chat_svc.send_message(
            direct_conv.id,
            "Alice, please review the firewall packet captures first.",
            actor=john_lead,
        )
        assert direct_msg.content == "Alice, please review the firewall packet captures first."
        print(f"  [OK] Direct private message sent: '{direct_msg.content}'")

        print("\n--- [TEST 6/6] Team Removal and Lead Reassignment with Historical Preservation ---")
        # John removes Alice from team
        team_after_remove = case_svc.remove_team_investigator(case.id, user_id=alice_inv.id, actor=john_lead)
        assert len(team_after_remove.team_investigators) == 1, "Only Robert should remain as regular investigator"
        print(f"  [OK] Alice removed from team. Remaining team size: {team_after_remove.total_members}")

        # Check Alice's access to group chat is now inactive
        alice_convs_after = chat_svc.list_user_conversations(alice_inv)
        assert not any(c.id == case_group.id for c in alice_convs_after), "Alice should no longer see case group in active conversations"

        # Superior Officer reassigns Investigator Lead to Robert Davis
        reassigned_team = case_svc.reassign_lead(
            case.id,
            new_lead_id=robert_inv.id,
            keep_previous_lead=True,
            actor=superior,
        )
        assert reassigned_team.investigator_lead.user_id == robert_inv.id, "Robert Davis must now be Investigator Lead"
        assert any(t.user_id == john_lead.id and t.role == "INVESTIGATOR" for t in reassigned_team.team_investigators), "John Smith should now be regular investigator"
        print(f"  [OK] Superior Captain Reynolds reassigned lead to Robert Davis. John is now regular investigator.")

        print("\n=======================================================")
        print("ALL HIERARCHY & COMMUNICATION TESTS PASSED SUCCESSFULLY!")
        print("=======================================================\n")
    finally:
        db.close()


if __name__ == "__main__":
    run_hierarchy_and_chat_tests()
