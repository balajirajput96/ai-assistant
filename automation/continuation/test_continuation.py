import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from continuation import CheckResult, MAX_CYCLES, build_record


class ContinuationRecordTests(unittest.TestCase):
    def test_build_record_marks_successful_validation_as_passed(self) -> None:
        record = build_record(
            1,
            [CheckResult("unit_tests", ["pnpm", "test"], 0, "ok")],
            "abc123",
        )
        self.assertEqual(record["status"], "passed")
        self.assertEqual(record["cycle_limit"], MAX_CYCLES)
        self.assertEqual(record["mutation_policy"], "read_only_validation")

    def test_build_record_marks_failure_for_review(self) -> None:
        record = build_record(
            2400,
            [CheckResult("typecheck", ["pnpm", "check"], 1, "failure")],
            "abc123",
        )
        self.assertEqual(record["status"], "needs_review")
        self.assertEqual(record["next_action"], "review_failed_checks_before_any_repair")
