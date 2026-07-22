import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
COURSES = ROOT / "library/courses"
INVENTORY = ROOT / "course-authoring/guided_curriculum_inventory.json"
LANGUAGES = (
    "English", "Korean", "Russian", "Italian", "French",
    "German", "Japanese", "Chinese", "Portuguese", "Arabic",
)
RETIRED_PROTOTYPES = {
    "a1-2-daily-life",
    "a2-1-plans-and-time",
    "a2-2-description-and-comparison",
    "b1-1-narration-and-reasons",
    "b1-2-independent-reading",
}


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def test_full_curriculum_blueprint_has_real_depth():
    inventory = load(INVENTORY)
    assert inventory["status"] == "AUTHORING_APPROVED_FOR_STAGED_EXTERNAL_GENERATION"
    assert inventory["totals"] == {
        "languages": 10,
        "stagesPerLanguage": 6,
        "unitsPerLanguage": 36,
        "lessonsPerLanguage": 252,
        "audioPromptsPerLanguage": 576,
        "minimumNewAudioPromptsPerLanguage": 288,
        "totalUnits": 360,
        "totalLessons": 2520,
        "totalAudioPrompts": 5760,
        "minimumTotalNewAudioPrompts": 2880,
        "candidateFilesIfTwoPerPrompt": 11520,
    }
    for language in LANGUAGES:
        stages = inventory["languages"][language]["stages"]
        assert len(stages) == 6
        for stage in stages:
            assert len(stage["units"]) == 6
            for unit in stage["units"]:
                assert unit["lessons"] == 7
                assert unit["grammarFocus"]
                assert unit["newContent"] == {
                    "words": 8,
                    "expressions": 4,
                    "sentences": 4,
                    "audioPrompts": 16,
                    "minimumNewAudioPrompts": 8,
                }


def test_complete_a11_replaces_the_pilot_without_reintroducing_advanced_prototypes():
    for language in LANGUAGES:
        course = load(COURSES / language / "course.json")
        assert [level["id"] for level in course["levels"]][:2] == ["foundations", "a1-1"]
        assert course["levels"][1]["unitIds"] == [
            "a1-1-identity", "a1-1-people", "a1-1-home",
            "a1-1-routine", "a1-1-food", "a1-1-places",
        ]
        assert "PILOTO" not in course["routeLabel"]
        assert not (RETIRED_PROTOTYPES & {unit["id"] for unit in course["units"]})


def test_service_worker_does_not_precache_retired_prototypes():
    worker = (ROOT / "service-worker.js").read_text(encoding="utf-8")
    assert "const SHELL='hanstory-shell-v" in worker
    for unit_id in RETIRED_PROTOTYPES:
        assert unit_id not in worker


def test_language_specific_focus_protects_key_learning_rules():
    inventory = load(INVENTORY)["languages"]
    japanese = " ".join(
        stage_focus
        for stage in inventory["Japanese"]["stages"]
        for stage_focus in stage["grammarFocus"]
    )
    chinese = " ".join(
        stage_focus
        for stage in inventory["Chinese"]["stages"]
        for stage_focus in stage["grammarFocus"]
    )
    german = " ".join(
        stage_focus
        for stage in inventory["German"]["stages"]
        for stage_focus in stage["grammarFocus"]
    )
    assert "sin rōmaji" in japanese
    assert "pinyin oculto por defecto" in chinese
    assert "acusativo" in german and "dativo" in german
