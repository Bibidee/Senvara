"""Candidate v0.2.0 source model; Direct Mode coverage is separate."""
import pathlib
import unittest

from test_contract_model import ADDR1, ADDR2, ASSERTION, COMMIT, PATH_A, PATH_B, REPO, SRC_A, TestHarness

ROOT = pathlib.Path(__file__).resolve().parents[1]


class CandidateHarness(TestHarness):
    def __init__(self):
        super().__init__(ROOT / "contracts" / "senvara_v02.py", "senvara_candidate_model_test")


class CandidateBehavior(unittest.TestCase):
    def setUp(self):
        self.t = CandidateHarness()

    def test_conclusive_result_and_per_validator_request_budget(self):
        self.t.ready()
        self.t.contract.evaluate(1, "a" * 64)
        self.assertEqual(self.t.state()["status"], "DECIDED")
        self.assertEqual(self.t.state()["decision"], "SUPPORTED")
        self.assertEqual(len(self.t.api_reads), 8)  # 4 leader + 4 validator, no equivalence refetch
        self.assertEqual(self.t.prompt_count, 2)

    def test_failure_categories_are_bounded_and_distinct(self):
        self.t.ready()
        self.t.signed = False
        self.t.contract.evaluate(1, "a" * 64)
        self.assertEqual(self.t.state()["last_reason"], "PROVENANCE_UNAVAILABLE")

        self.t = CandidateHarness()
        self.t.ready()
        self.t.missing = True
        self.t.contract.evaluate(1, "a" * 64)
        self.assertEqual(self.t.state()["last_reason"], "SOURCE_RETRIEVAL_UNAVAILABLE")

        self.t = CandidateHarness()
        self.t.ready()
        self.t.provider_outage = True
        self.t.contract.evaluate(1, "a" * 64)
        self.assertEqual(self.t.state()["last_reason"], "PROVENANCE_UNAVAILABLE")

    def test_malformed_and_irrelevant_citations_are_not_decisions(self):
        self.t.ready()
        self.t.bad_quote = True
        self.t.contract.evaluate(1, "a" * 64)
        self.assertEqual(self.t.state()["last_reason"], "JUDGMENT_CITATION_INVALID")

        self.t = CandidateHarness()
        self.t.ready()
        self.t.output_primary = "SUPPORTS"
        self.t.output_counter = "SUPPORTS"
        self.t.prompt = lambda *_args, **_kwargs: {
            "primary": "SUPPORTS", "opposing": "SUPPORTS",
            "primary_quote": "deployment branding only", "opposing_quote": "deployment branding only",
        }
        self.t.gl.nondet.exec_prompt = self.t.prompt
        self.t.contract.evaluate(1, "b" * 64)
        self.assertEqual(self.t.state()["last_reason"], "JUDGMENT_CITATION_INVALID")

    def test_validator_accepts_different_valid_quote_spans(self):
        self.t.ready()
        self.t.alternate_quotes = True
        self.t.contract.evaluate(1, "a" * 64)
        self.assertEqual(self.t.state()["status"], "DECIDED")

    def test_heterogeneous_classification_or_source_fingerprint_rolls_back(self):
        self.t.ready()
        self.t.disagree = True
        with self.assertRaises(Exception):
            self.t.contract.evaluate(1, "a" * 64)
        self.assertEqual(self.t.state()["attempts"], 0)

        self.t = CandidateHarness()
        self.t.ready()
        self.t.flip_source = True
        with self.assertRaises(Exception):
            self.t.contract.evaluate(1, "b" * 64)
        self.assertEqual(self.t.state()["attempts"], 0)


if __name__ == "__main__":
    unittest.main()
