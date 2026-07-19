"""Article title clustering via Jaccard similarity (bag-of-words).

No external dependencies — pure stdlib. Two titles are in the same cluster
when their Jaccard similarity on tokenised tokens is >= threshold (default 0.35).
Union-find ensures transitivity: if A~B and B~C then A, B, C are one cluster.
"""

from __future__ import annotations

import re


_STOPWORDS = frozenset({
    "a", "an", "the", "in", "of", "to", "and", "is", "are", "was", "were",
    "for", "on", "at", "by", "as", "it", "its", "this", "that", "with",
    "from", "be", "been", "has", "have", "had", "will", "would", "could",
    "should", "may", "might", "can", "not", "no", "nor", "but", "or",
    "if", "then", "than", "so", "yet", "both", "either", "up", "out",
    "over", "after", "before", "during", "new", "old", "more", "most",
    "he", "she", "his", "her", "him", "they", "their", "them", "we",
    "our", "you", "your", "who", "which", "what", "when", "where", "how",
    "into", "about", "also", "just", "says", "said", "say", "per",
})


def _tokenize(title: str) -> frozenset[str]:
    text = title.lower()
    tokens = re.split(r"[\s\W]+", text)
    return frozenset(t for t in tokens if len(t) >= 3 and t not in _STOPWORDS)


def _jaccard(a: frozenset[str], b: frozenset[str]) -> float:
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


class _UnionFind:
    def __init__(self, n: int) -> None:
        self.parent = list(range(n))

    def find(self, x: int) -> int:
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]  # path compression
            x = self.parent[x]
        return x

    def union(self, x: int, y: int) -> None:
        rx, ry = self.find(x), self.find(y)
        if rx != ry:
            self.parent[rx] = ry


def cluster_articles(titles: list[str], threshold: float = 0.35) -> list[list[int]]:
    """Group article indices by Jaccard similarity of tokenised titles.

    Args:
        titles: Article titles to cluster.
        threshold: Minimum Jaccard similarity to merge two articles (0–1).

    Returns:
        List of clusters, each cluster is a list of indices into *titles*.
        Sorted largest-first; within each cluster indices are in insertion order.
    """
    n = len(titles)
    if n == 0:
        return []

    token_sets = [_tokenize(t) for t in titles]
    uf = _UnionFind(n)

    for i in range(n):
        for j in range(i + 1, n):
            if _jaccard(token_sets[i], token_sets[j]) >= threshold:
                uf.union(i, j)

    groups: dict[int, list[int]] = {}
    for idx in range(n):
        root = uf.find(idx)
        groups.setdefault(root, []).append(idx)

    return sorted(groups.values(), key=len, reverse=True)
