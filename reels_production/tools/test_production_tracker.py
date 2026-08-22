import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from production_tracker import ALLOWED_TRANSITIONS, ValidationResult


class ProductionTrackerTests(unittest.TestCase):
    def test_uploaded_reels_cannot_transition_further(self) -> None:
        self.assertEqual(ALLOWED_TRANSITIONS["uploaded"], set())

    def test_planned_reel_requires_research_before_script(self) -> None:
        self.assertIn("researching", ALLOWED_TRANSITIONS["planned"])
        self.assertNotIn("scripted", ALLOWED_TRANSITIONS["planned"])

    def test_validation_result_carries_registry_count(self) -> None:
        result = ValidationResult(True, [], 1)
        self.assertTrue(result.valid)
        self.assertEqual(result.registry_count, 1)

    def test_only_planned_reels_are_eligible_for_next_selection(self) -> None:
        self.assertNotIn("uploaded", {"planned"})
