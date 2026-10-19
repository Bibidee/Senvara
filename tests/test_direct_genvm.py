"""Executable GenLayer Direct Mode coverage for the Senvara contract."""

import base64
import hashlib
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "contracts" / "senvara.py"
CANDIDATE_CONTRACT = ROOT / "contracts" / "senvara_v02.py"
COMMIT = "a" * 40
REPOSITORY = "example/registry"
PRIMARY_PATH = "docs/primary.md"
OPPOSING_PATH = "docs/opposing.md"
ALICE_ASSERTION = "The public documentation explicitly describes safe retries."


def address(wallet):
    return "0x" + bytes(wallet).hex()


def blob_sha(value):
    return hashlib.sha1(b"blob " + str(len(value)).encode() + b"\x00" + value).hexdigest()


def contents_body(path, text):
    raw = text.encode("utf-8")
    return json.dumps({
        "type": "file", "path": path, "encoding": "base64",
        "size": len(raw), "content": base64.b64encode(raw).decode(),
        "sha": blob_sha(raw),
    })


def configure_sources(vm, primary_text=None, opposing_text=None):
    primary_text = primary_text or "The interface supports safe retries with an idempotency key."
    opposing_text = opposing_text or "Retries require an idempotency key before they are safe."
    vm.mock_web(r"api\.github\.com/repos/example/registry$", {
        "status": 200, "body": json.dumps({"full_name": REPOSITORY, "private": False})
    })
    vm.mock_web(r"api\.github\.com/repos/example/registry/commits/" + COMMIT, {
        "status": 200, "body": json.dumps({
            "sha": COMMIT,
            "html_url": f"https://github.com/{REPOSITORY}/commit/{COMMIT}",
            "commit": {"verification": {
                "verified": True, "reason": "valid", "signature": "fixture-signature",
                "payload": "fixture-signed-payload",
            }},
        })
    })
    vm.mock_web(r"api\.github\.com/repos/example/registry/contents/docs/primary\.md\?ref=" + COMMIT, {
        "status": 200, "body": contents_body(PRIMARY_PATH, primary_text)
    })
    vm.mock_web(r"api\.github\.com/repos/example/registry/contents/docs/opposing\.md\?ref=" + COMMIT, {
        "status": 200, "body": contents_body(OPPOSING_PATH, opposing_text)
    })


def configure_judgement(vm, primary="SUPPORTS", opposing="SUPPORTS"):
    vm.mock_llm(r".*", json.dumps({
        "primary": primary,
        "opposing": opposing,
        "primary_quote": "supports safe retries" if primary in ("SUPPORTS", "CONTRADICTS") else "",
        "opposing_quote": "Retries require an idempotency key" if opposing in ("SUPPORTS", "CONTRADICTS") else "",
    }))


def configure_text_judgement(vm, primary="SUPPORTS", opposing="SUPPORTS", primary_quote="supports safe retries", opposing_quote="Retries require an idempotency key"):
    vm.mock_llm(r".*", "```json\n" + json.dumps({
        "primary": primary,
        "opposing": opposing,
        "primary_quote": primary_quote if primary in ("SUPPORTS", "CONTRADICTS") else "",
        "opposing_quote": opposing_quote if opposing in ("SUPPORTS", "CONTRADICTS") else "",
    }) + "\n```")


def submit_ready(contract, vm, alice, bob):
    vm._chain_id = 61999
    vm._refresh_gl_message()
    vm.sender = alice
    number = contract.propose(ALICE_ASSERTION, REPOSITORY, COMMIT, PRIMARY_PATH, address(bob), 86400)
    vm.sender = bob
    contract.respond(number, OPPOSING_PATH, "The counter-source adds the retry condition.")
    return number


def warp_seconds(vm, seconds):
    current = datetime.now(timezone.utc) + timedelta(seconds=seconds)
    vm.warp(current.isoformat().replace("+00:00", "Z"))


def test_direct_mode_loads_roles_and_persists_lifecycle(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(str(CONTRACT))
    direct_vm._chain_id = 61999
    direct_vm._refresh_gl_message()
    direct_vm.sender = direct_alice
    number = contract.propose(ALICE_ASSERTION, REPOSITORY, COMMIT, PRIMARY_PATH, address(direct_bob), 86400)
    assert number == 1
    assert json.loads(contract.get_dossier(number))["status"] == "AWAITING_REVIEWER"
    direct_vm.sender = direct_bob
    contract.respond(number, OPPOSING_PATH, "The counter-source adds the retry condition.")
    assert json.loads(contract.get_dossier(number))["status"] == "READY_FOR_REVIEW"


def test_direct_mode_rejects_wrong_chain_and_unauthorized_response(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(str(CONTRACT))
    direct_vm._chain_id = 1
    direct_vm._refresh_gl_message()
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Studionet 61999 required"):
        contract.propose(ALICE_ASSERTION, REPOSITORY, COMMIT, PRIMARY_PATH, address(direct_bob), 86400)
    direct_vm._chain_id = 61999
    direct_vm._refresh_gl_message()
    number = submit_ready(contract, direct_vm, direct_alice, direct_bob)
    with direct_vm.expect_revert("reviewer response not authorized"):
        direct_vm.sender = direct_alice
        contract.respond(number, "docs/other.md", "not allowed")


def test_direct_mode_conclusive_assessment_persists_observation(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(str(CONTRACT))
    number = submit_ready(contract, direct_vm, direct_alice, direct_bob)
    configure_sources(direct_vm)
    configure_judgement(direct_vm)
    direct_vm.sender = direct_alice
    contract.evaluate(number, "a" * 64)
    dossier = json.loads(contract.get_dossier(number))
    observation = json.loads(contract.get_observation(number, 1))
    assert dossier["status"] == "DECIDED"
    assert dossier["last_attempt_by"] == address(direct_alice)
    assert observation["decision"] == "SUPPORTED"


def test_direct_mode_provider_failure_is_retryable_and_nonce_replay_is_rejected(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(str(CONTRACT))
    number = submit_ready(contract, direct_vm, direct_alice, direct_bob)
    direct_vm.mock_web(r"api\.github\.com/repos/example/registry$", {"status": 503, "body": "unavailable"})
    direct_vm.sender = direct_alice
    contract.evaluate(number, "b" * 64)
    assert json.loads(contract.get_dossier(number))["status"] == "READY_FOR_REVIEW"
    warp_seconds(direct_vm, 1200)
    with direct_vm.expect_revert("evaluation request already used"):
        contract.evaluate(number, "b" * 64)


def test_direct_mode_hostile_quote_becomes_retryable_not_verdict(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(str(CONTRACT))
    number = submit_ready(contract, direct_vm, direct_alice, direct_bob)
    configure_sources(direct_vm)
    direct_vm.mock_llm(r".*", json.dumps({
        "primary": "SUPPORTS", "opposing": "SUPPORTS",
        "primary_quote": "This text is fabricated and absent.",
        "opposing_quote": "This text is fabricated and absent.",
    }))
    direct_vm.sender = direct_alice
    contract.evaluate(number, "c" * 64)
    dossier = json.loads(contract.get_dossier(number))
    assert dossier["status"] == "READY_FOR_REVIEW"
    assert dossier["last_reason"] == "JUDGMENT_UNAVAILABLE"


def test_direct_mode_v02_parses_realistic_text_json_and_persists_conclusive_result(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(str(CANDIDATE_CONTRACT))
    number = submit_ready(contract, direct_vm, direct_alice, direct_bob)
    configure_sources(direct_vm)
    configure_text_judgement(direct_vm)
    direct_vm.sender = direct_alice
    contract.evaluate(number, "d" * 64)
    dossier = json.loads(contract.get_dossier(number))
    observation = json.loads(contract.get_observation(number, 1))
    assert contract.get_version() == "0.2.0"
    assert dossier["status"] == "DECIDED"
    assert observation["decision"] == "SUPPORTED"


def test_direct_mode_v02_equivalence_authenticates_quotes_but_not_quote_wording(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(str(CANDIDATE_CONTRACT))
    number = submit_ready(contract, direct_vm, direct_alice, direct_bob)
    configure_sources(direct_vm)
    configure_judgement(direct_vm)
    direct_vm.sender = direct_alice
    contract.evaluate(number, "e" * 64)
    leader_observation = json.loads(contract.get_observation(number, 1))
    dossier = json.loads(contract.get_dossier(number))
    import sys
    candidate_module = sys.modules["_contract_senvara_v02"]

    alternate = dict(leader_observation)
    alternate["primary_quote"] = "safe retries with an idempotency key"
    alternate["opposing_quote"] = "Retries require an idempotency key before they are safe"
    assert candidate_module._observation_equivalent(leader_observation, alternate, dossier) is True

    fabricated = dict(alternate)
    fabricated["primary_quote"] = "fabricated citation"
    assert candidate_module._observation_equivalent(leader_observation, fabricated, dossier) is False

    conflicting = dict(alternate)
    conflicting["opposing"] = "CONTRADICTS"
    assert candidate_module._observation_equivalent(leader_observation, conflicting, dossier) is False


def test_direct_mode_v02_separates_malformed_output_and_citation_failures(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(str(CANDIDATE_CONTRACT))
    number = submit_ready(contract, direct_vm, direct_alice, direct_bob)
    configure_sources(direct_vm)
    direct_vm.mock_llm(r".*", "not JSON")
    direct_vm.sender = direct_alice
    contract.evaluate(number, "f" * 64)
    assert json.loads(contract.get_observation(number, 1))["reason"] == "JUDGMENT_MALFORMED_OUTPUT"

    warp_seconds(direct_vm, 1200)
    direct_vm._llm_mocks = []
    configure_text_judgement(direct_vm, primary_quote="fabricated citation", opposing_quote="Retries require an idempotency key")
    contract.evaluate(number, "0" * 63 + "1")
    assert json.loads(contract.get_observation(number, 2))["reason"] == "JUDGMENT_CITATION_INVALID"
