"""Source-level behavioral model, NOT a GenVM Direct Mode or hosted-validators test."""
import base64
import hashlib
import importlib.util
import json
import pathlib
import sys
import types
import unittest
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parents[1]
ADDR1 = "0x" + "1" * 40
ADDR2 = "0x" + "2" * 40
ADDR3 = "0x" + "3" * 40
COMMIT = "a" * 40
REPO = "senvara-fixture/public-source"
PATH_A = "docs/features.md"
PATH_B = "docs/limits.md"
SRC_A = "The documented interface supports retrying failed requests safely when an idempotency key is present."
SRC_B = "The documented interface requires a client-generated idempotency key before retries are safe."
ASSERTION = "The public release documentation explicitly describes safe request retries."

class UserError(Exception):
    pass

class TreeMap(dict):
    def __class_getitem__(cls, _):
        return cls

class Vm:
    class Return:
        def __init__(self, calldata):
            self.calldata = calldata
    UserError = UserError
    def run_nondet_unsafe(self, leader, validator):
        result = leader()
        if not validator(self.Return(result)):
            raise UserError("validator disagreement")
        return result

class FakeResponse:
    def __init__(self, value, status=200):
        self.status_code = status
        self.body = json.dumps(value).encode() if not isinstance(value, bytes) else value

class TestHarness:
    def __init__(self, contract_path=None, module_name="senvara_contract_test"):
        self.now = 1_780_000_000
        self.actor = ADDR1
        self.chain_id = 61999
        self.signed = True
        self.bad_identity = False
        self.bad_blob = False
        self.malformed_verification = False
        self.missing = False
        self.provider_outage = False
        self.bad_quote = False
        self.output_primary = "SUPPORTS"
        self.output_counter = "SUPPORTS"
        self.disagree = False
        self.alternate_quotes = False
        self.flip_source = False
        self.prompt_count = 0
        self.api_reads = []
        vm = Vm()
        msg = types.SimpleNamespace(sender_address=self.actor, origin_address=self.actor, chain_id=self.chain_id)
        gl = types.SimpleNamespace(
            Contract=object,
            public=types.SimpleNamespace(write=lambda f: f, view=lambda f: f),
            vm=vm,
            message=msg,
            message_raw={"datetime": datetime.fromtimestamp(self.now, timezone.utc).isoformat()},
            nondet=types.SimpleNamespace(web=types.SimpleNamespace(get=self.github), exec_prompt=self.prompt),
        )
        module = types.ModuleType("genlayer")
        module.gl = gl
        module.TreeMap = TreeMap
        module.u256 = int
        module.__all__ = ["gl", "TreeMap", "u256"]
        sys.modules["genlayer"] = module
        spec = importlib.util.spec_from_file_location(module_name, contract_path or ROOT / "contracts" / "senvara.py")
        self.source = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.source)
        self.gl = gl
        self.contract = self.source.Senvara()
        self.contract.dossiers = TreeMap()
        self.contract.observations = TreeMap()
        self.contract.fingerprints = TreeMap()
        self.contract.evaluation_nonces = TreeMap()

    def as_wallet(self, who, minutes=0, origin=None):
        self.now += minutes * 60
        self.gl.message.sender_address = who
        self.gl.message.origin_address = who if origin is None else origin
        self.gl.message.chain_id = self.chain_id
        self.gl.message_raw["datetime"] = datetime.fromtimestamp(self.now, timezone.utc).isoformat()

    def github(self, url, **_):
        self.api_reads.append(url)
        if self.provider_outage:
            return FakeResponse({"message": "rate limited"}, 403)
        if url == "https://api.github.com/repos/" + REPO:
            return FakeResponse({"full_name": "other/repository" if self.bad_identity else REPO, "private": False})
        if url.endswith("/commits/" + COMMIT):
            verification = {"verified": self.signed, "reason": "valid" if self.signed else "unsigned",
                            "signature": "fixture-signature" if self.signed else None,
                            "payload": "fixture-signed-payload" if self.signed else None}
            if self.malformed_verification:
                verification["signature"] = {"unexpected": True}
                verification["payload"] = {"unexpected": True}
            return FakeResponse({"sha": COMMIT, "html_url": f"https://github.com/{REPO}/commit/{COMMIT}",
                                 "commit": {"verification": verification}})
        if "/contents/" in url:
            if self.missing:
                return FakeResponse({"message": "not found"}, 404)
            path = url.split("/contents/", 1)[1].split("?ref=", 1)[0]
            if path not in (PATH_A, PATH_B):
                return FakeResponse({"message": "not found"}, 404)
            content_value = SRC_A if path == PATH_A else SRC_B
            if self.flip_source and len(self.api_reads) >= 5 and path == PATH_A:
                content_value = "This unrelated paragraph discusses deployment branding only."
            content = content_value.encode("utf8")
            blob = hashlib.sha1(b"blob " + str(len(content)).encode() + b"\0" + content).hexdigest()
            return FakeResponse({"path": path, "type": "file", "encoding": "base64", "size": len(content),
                                 "content": base64.b64encode(content).decode(),
                                 "sha": "f" * 40 if self.bad_blob else blob})
        return FakeResponse({}, 404)

    def prompt(self, prompt, response_format="json"):
        assert response_format == "json"
        assert "DATA" in prompt
        self.prompt_count += 1
        counter = self.output_counter
        if self.disagree and self.prompt_count % 2 == 0:
            counter = "CONTRADICTS" if counter != "CONTRADICTS" else "SUPPORTS"
        def quote(category, content):
            if category not in ("SUPPORTS", "CONTRADICTS"):
                return ""
            if self.bad_quote:
                return "Fabricated content that is absent in both source files."
            if content == SRC_A:
                return "supports retrying failed requests safely when an idempotency key is present"
            return "requires a client-generated idempotency key before retries are safe"
        primary_quote = quote(self.output_primary, SRC_A)
        opposing_quote = quote(counter, SRC_B)
        if self.alternate_quotes and not self.bad_quote:
            primary_quote = "supports retrying failed requests safely when an idempotency key is present"
            opposing_quote = "requires a client-generated idempotency key before retries are safe"
        return {"primary": self.output_primary, "opposing": counter,
                "primary_quote": primary_quote, "opposing_quote": opposing_quote}

    def create(self):
        return self.contract.propose(ASSERTION, REPO, COMMIT, PATH_A, ADDR2, 86400)

    def ready(self):
        self.create()
        self.as_wallet(ADDR2, minutes=1)
        self.contract.respond(1, PATH_B, "An important condition is attached to the assertion.")
        self.as_wallet(ADDR1, minutes=11)

    def state(self):
        return json.loads(self.contract.get_dossier(1))


class ContractBehavior(unittest.TestCase):
    def setUp(self):
        self.t = TestHarness()

    def test_create_keeps_immutable_anchors_and_wallets(self):
        self.assertEqual(self.t.create(), 1)
        r = self.t.state()
        self.assertEqual((r["repository"], r["commit"], r["primary_path"]), (REPO, COMMIT, PATH_A))
        self.assertEqual(r["status"], "AWAITING_REVIEWER")
        self.assertEqual(r["proposer"], ADDR1)

    def test_prevents_same_wallet_self_review(self):
        with self.assertRaises(UserError):
            self.t.contract.propose(ASSERTION, REPO, COMMIT, PATH_A, ADDR1, 86400)
        self.assertEqual(self.t.contract.get_total(), 0)

    def test_rejects_bad_repository_or_commit(self):
        for repo, sha in [("localhost:8000/owner", COMMIT), ("a/..", COMMIT), (REPO, "main")]:
            with self.assertRaises(UserError):
                self.t.contract.propose(ASSERTION, repo, sha, PATH_A, ADDR2, 86400)

    def test_bad_paths_rejected_without_transition(self):
        self.t.create()
        self.t.as_wallet(ADDR2)
        for path in ("../secrets", "docs/../secrets", "https://internal/path", "docs/%2e%2e/s"):
            with self.subTest(path=path), self.assertRaises(UserError):
                self.t.contract.respond(1, path, "")
        self.assertEqual(self.t.state()["status"], "AWAITING_REVIEWER")

    def test_exact_duplicate_question_cannot_be_registered_twice(self):
        self.t.create()
        with self.assertRaises(UserError): self.t.create()
        self.assertEqual(self.t.contract.get_total(), 1)

    def test_stranger_cannot_exhaust_evaluation_attempts(self):
        self.t.ready()
        self.t.as_wallet(ADDR3)
        with self.assertRaises(UserError): self.t.contract.evaluate(1, "a" * 64)
        self.assertEqual(self.t.state()["attempts"], 0)

    def test_only_nominated_reviewer_can_supply_counterevidence(self):
        self.t.create()
        with self.assertRaises(UserError): self.t.contract.respond(1, PATH_B, "")
        self.t.as_wallet(ADDR3)
        with self.assertRaises(UserError): self.t.contract.respond(1, PATH_B, "")
        self.t.as_wallet(ADDR2)
        self.t.contract.respond(1, PATH_B, "")
        with self.assertRaises(UserError): self.t.contract.respond(1, PATH_B, "")
        self.assertEqual(self.t.state()["status"], "READY_FOR_REVIEW")

    def test_proposer_cannot_rewrite_after_response(self):
        self.t.ready()
        self.t.as_wallet(ADDR1)
        with self.assertRaises(UserError): self.t.contract.withdraw(1)

    def test_proposer_can_withdraw_unanswered_only(self):
        self.t.create()
        self.t.contract.withdraw(1)
        self.assertEqual(self.t.state()["status"], "WITHDRAWN")
        self.t.as_wallet(ADDR2)
        with self.assertRaises(UserError): self.t.contract.respond(1, PATH_B, "")

    def test_reviewer_can_decline_without_fabricated_verdict(self):
        self.t.create()
        self.t.as_wallet(ADDR2)
        self.t.contract.decline(1)
        self.assertEqual(self.t.state()["status"], "DECLINED")
        self.assertEqual(self.t.state()["decision"], "")

    def test_unanswered_expiry_is_not_a_contradiction(self):
        self.t.create()
        self.t.as_wallet(ADDR3, minutes=1440)
        self.t.contract.close_expired(1)
        self.assertEqual(self.t.state()["status"], "EXPIRED_UNANSWERED")
        self.assertEqual(self.t.state()["decision"], "")

    def test_assessment_requires_two_sources_and_valid_window(self):
        self.t.create()
        with self.assertRaises(UserError): self.t.contract.evaluate(1, "a" * 64)
        with self.assertRaises(UserError): self.t.contract.close_expired(1)
        self.t.as_wallet(ADDR2, minutes=1440)
        with self.assertRaises(UserError): self.t.contract.respond(1, PATH_B, "")

    def test_positive_review_and_consensus_bound_fingerprints(self):
        self.t.ready()
        self.t.contract.evaluate(1, "a" * 64)
        self.assertEqual(self.t.state()["status"], "DECIDED")
        self.assertEqual(self.t.state()["decision"], "SUPPORTED")
        observed = json.loads(self.t.contract.get_observation(1, 1))
        self.assertEqual(len(observed["primary_sha256"]), 64)
        self.assertEqual(len(observed["signed_payload_sha256"]), 64)
        self.assertEqual(self.t.prompt_count, 2)  # leader + validator independently observed
        with self.assertRaises(UserError): self.t.contract.evaluate(1, "a" * 64)

    def test_evaluation_nonce_blocks_exact_replay(self):
        self.t.ready()
        self.t.provider_outage = True
        self.t.contract.evaluate(1, "a" * 64)
        self.t.as_wallet(ADDR1, minutes=10)
        with self.assertRaises(UserError): self.t.contract.evaluate(1, "a" * 64)
        self.assertEqual(self.t.state()["attempts"], 1)

    def test_conflicting_sources_do_not_become_false_certainty(self):
        self.t.ready()
        self.t.output_counter = "CONTRADICTS"
        self.t.contract.evaluate(1, "a" * 64)
        self.assertEqual(self.t.state()["decision"], "MIXED")

    def test_negative_claim_requires_decisive_evidence(self):
        self.t.ready()
        self.t.output_primary = "IRRELEVANT"
        self.t.output_counter = "CONTRADICTS"
        self.t.contract.evaluate(1, "a" * 64)
        self.assertEqual(self.t.state()["decision"], "CONTRADICTED")

    def test_ambiguous_sources_remain_insufficient(self):
        self.t.ready()
        self.t.output_primary = "AMBIGUOUS"
        self.t.output_counter = "IRRELEVANT"
        self.t.contract.evaluate(1, "a" * 64)
        self.assertEqual(self.t.state()["decision"], "INSUFFICIENT")

    def test_unavailable_repository_never_claims_negative(self):
        self.t.ready()
        self.t.provider_outage = True
        self.t.contract.evaluate(1, "a" * 64)
        self.assertEqual(self.t.state()["status"], "READY_FOR_REVIEW")
        self.assertEqual(self.t.state()["decision"], "")
        self.assertEqual(self.t.prompt_count, 0)

    def test_signed_commit_failure_never_authorizes_verdict(self):
        self.t.ready()
        self.t.signed = False
        self.t.contract.evaluate(1, "a" * 64)
        self.assertEqual(self.t.state()["last_reason"], "PROVIDER_OR_PROVENANCE_UNAVAILABLE")

    def test_malformed_signed_commit_fields_are_nonconclusive(self):
        self.t.ready()
        self.t.malformed_verification = True
        self.t.contract.evaluate(1, "a" * 64)
        self.assertEqual(self.t.state()["last_reason"], "PROVIDER_OR_PROVENANCE_UNAVAILABLE")

    def test_nonfinite_provider_json_is_rejected(self):
        with self.assertRaises(ValueError):
            self.t.source._decode_json('{"value":NaN}')

    def test_identity_mismatch_is_nonconclusive(self):
        self.t.ready()
        self.t.bad_identity = True
        self.t.contract.evaluate(1, "a" * 64)
        self.assertEqual(self.t.state()["status"], "READY_FOR_REVIEW")

    def test_git_blob_mismatch_is_nonconclusive(self):
        self.t.ready()
        self.t.bad_blob = True
        self.t.contract.evaluate(1, "a" * 64)
        self.assertEqual(self.t.state()["decision"], "")

    def test_missing_source_is_not_negative_evidence(self):
        self.t.ready()
        self.t.missing = True
        self.t.contract.evaluate(1, "a" * 64)
        self.assertEqual(self.t.state()["last_reason"], "PROVIDER_OR_PROVENANCE_UNAVAILABLE")

    def test_quote_fabrication_is_nonconclusive(self):
        self.t.ready()
        self.t.bad_quote = True
        self.t.contract.evaluate(1, "a" * 64)
        self.assertEqual(self.t.state()["last_reason"], "JUDGMENT_UNAVAILABLE")

    def test_validator_disagreement_writes_no_state(self):
        self.t.ready()
        self.t.disagree = True
        with self.assertRaises(UserError): self.t.contract.evaluate(1, "a" * 64)
        self.assertEqual(self.t.state()["attempts"], 0)
        self.assertEqual(self.t.state()["status"], "READY_FOR_REVIEW")

    def test_cooldown_and_exhaustion(self):
        self.t.ready()
        self.t.provider_outage = True
        self.t.contract.evaluate(1, "a" * 64)
        with self.assertRaises(UserError): self.t.contract.evaluate(1, "b" * 64)
        self.t.as_wallet(ADDR1, minutes=10)
        self.t.contract.evaluate(1, "b" * 64)
        self.t.as_wallet(ADDR1, minutes=10)
        self.t.contract.evaluate(1, "c" * 64)
        self.assertEqual(self.t.state()["status"], "REVIEW_EXHAUSTED")
        with self.assertRaises(UserError): self.t.contract.evaluate(1, "d" * 64)

    def test_expire_after_assessment_window_without_inventing_verdict(self):
        self.t.ready()
        self.t.as_wallet(ADDR3, minutes=4320)
        self.t.contract.close_expired(1)
        self.assertEqual(self.t.state()["status"], "EXPIRED_UNRESOLVED")
        with self.assertRaises(UserError): self.t.contract.evaluate(1, "a" * 64)

    def test_chain_and_origin_are_enforced(self):
        self.t.chain_id = 1
        self.t.as_wallet(ADDR1)
        with self.assertRaises(UserError): self.t.create()
        self.t.chain_id = 61999
        self.t.as_wallet(ADDR1, origin=ADDR3)
        with self.assertRaises(UserError): self.t.create()
        self.assertEqual(self.t.contract.get_total(), 0)

    def test_bounded_pagination(self):
        for i in range(3): self.t.contract.propose(ASSERTION + " review " + str(i), REPO, COMMIT, PATH_A, ADDR2, 86400)
        self.assertEqual(json.loads(self.t.contract.list_dossiers(0, 2))["ids"], [3, 2])
        self.assertEqual(json.loads(self.t.contract.list_dossiers(2, 2))["ids"], [1])
        with self.assertRaises(UserError): self.t.contract.list_dossiers(0, 21)

if __name__ == "__main__": unittest.main()
