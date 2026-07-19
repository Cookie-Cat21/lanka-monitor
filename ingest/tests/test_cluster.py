"""Unit tests for ingest.cluster — no network required."""

from __future__ import annotations

import sys
import os

# Allow running directly: python ingest/tests/test_cluster.py
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from ingest.cluster import _jaccard, _tokenize, cluster_articles


# ---------------------------------------------------------------------------
# _tokenize
# ---------------------------------------------------------------------------


def test_tokenize_keeps_significant_words() -> None:
    tokens = _tokenize("Sri Lanka election results 2024")
    assert "lanka" in tokens
    assert "election" in tokens
    assert "results" in tokens
    assert "2024" in tokens


def test_tokenize_drops_stopwords() -> None:
    tokens = _tokenize("The floods are in the north")
    assert "the" not in tokens
    assert "are" not in tokens
    assert "in" not in tokens
    assert "floods" in tokens
    assert "north" in tokens


def test_tokenize_drops_short_tokens() -> None:
    tokens = _tokenize("go up at")
    assert "go" not in tokens  # length 2
    assert "up" not in tokens  # length 2


def test_tokenize_lowercases() -> None:
    tokens = _tokenize("CBSL Raises Rates")
    assert "cbsl" in tokens
    assert "raises" in tokens
    assert "rates" in tokens


def test_tokenize_empty_string() -> None:
    assert _tokenize("") == frozenset()


# ---------------------------------------------------------------------------
# _jaccard
# ---------------------------------------------------------------------------


def test_jaccard_identical_sets() -> None:
    a = frozenset(["a", "b", "c"])
    assert _jaccard(a, a) == 1.0


def test_jaccard_disjoint_sets() -> None:
    a = frozenset(["a", "b"])
    b = frozenset(["c", "d"])
    assert _jaccard(a, b) == 0.0


def test_jaccard_partial_overlap() -> None:
    a = frozenset(["a", "b", "c"])
    b = frozenset(["b", "c", "d"])
    # intersection={b,c}=2, union={a,b,c,d}=4
    assert abs(_jaccard(a, b) - 0.5) < 1e-9


def test_jaccard_both_empty() -> None:
    assert _jaccard(frozenset(), frozenset()) == 1.0


def test_jaccard_one_empty() -> None:
    assert _jaccard(frozenset(["a"]), frozenset()) == 0.0


# ---------------------------------------------------------------------------
# cluster_articles
# ---------------------------------------------------------------------------


def test_cluster_empty_list() -> None:
    assert cluster_articles([]) == []


def test_cluster_single_title() -> None:
    clusters = cluster_articles(["CBSL raises interest rates"])
    assert len(clusters) == 1
    assert clusters[0] == [0]


def test_cluster_identical_titles_merge() -> None:
    titles = [
        "Sri Lanka floods hit northern provinces",
        "Sri Lanka floods hit northern provinces",  # exact duplicate
        "CSE market closes higher today",
    ]
    clusters = cluster_articles(titles, threshold=0.35)
    assert len(clusters) == 2
    sizes = sorted(len(c) for c in clusters)
    assert sizes == [1, 2]


def test_cluster_dissimilar_titles_stay_separate() -> None:
    titles = [
        "CBSL raises interest rates by fifty basis points",
        "Cricket match highlights Colombo today",
        "Weather forecast heavy rain northern province",
    ]
    clusters = cluster_articles(titles, threshold=0.35)
    assert len(clusters) == 3
    assert all(len(c) == 1 for c in clusters)


def test_cluster_sorted_largest_first() -> None:
    titles = [
        "Floods hit colombo district heavy rain",
        "Floods hit colombo city area rain",   # similar to [0]
        "CSE market opens higher day",
    ]
    clusters = cluster_articles(titles, threshold=0.35)
    # Largest cluster should be first
    assert len(clusters[0]) >= len(clusters[-1])


def test_cluster_transitive_union_find() -> None:
    # A~B and B~C but A and C alone are below threshold.
    # Union-find should still put all three in one cluster.
    titles = [
        "Floods hit colombo district today heavy",      # [0]
        "Floods hit colombo city homes rain today",     # [1] — similar to [0]
        "Colombo city homes damaged flooding rain",     # [2] — similar to [1]
    ]
    clusters = cluster_articles(titles, threshold=0.35)
    # All three should end up in one cluster due to transitivity.
    assert len(clusters) == 1
    assert sorted(clusters[0]) == [0, 1, 2]


def test_cluster_all_unique_indices() -> None:
    titles = ["title one alpha", "title two beta gamma", "title three delta epsilon"]
    clusters = cluster_articles(titles, threshold=0.35)
    all_indices = sorted(idx for cluster in clusters for idx in cluster)
    assert all_indices == list(range(len(titles)))


def test_cluster_threshold_boundary() -> None:
    # Two titles with exactly 2 shared tokens out of 4 unique = Jaccard 0.5 > 0.35
    # so they should merge.
    titles = [
        "rain floods colombo",  # {rain, floods, colombo}
        "rain floods kandy",    # {rain, floods, kandy}
        # intersection={rain,floods}=2, union={rain,floods,colombo,kandy}=4 → 0.5
    ]
    clusters = cluster_articles(titles, threshold=0.35)
    assert len(clusters) == 1


if __name__ == "__main__":
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    passed = 0
    failed = 0
    for fn in tests:
        try:
            fn()
            print(f"  PASS  {fn.__name__}")
            passed += 1
        except AssertionError as e:
            print(f"  FAIL  {fn.__name__}: {e}")
            failed += 1
        except Exception as e:
            print(f"  ERROR {fn.__name__}: {type(e).__name__}: {e}")
            failed += 1
    print(f"\n{passed} passed, {failed} failed")
    sys.exit(0 if failed == 0 else 1)
