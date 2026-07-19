from .cbsl_fx import CbslFx

# Every registered source, active or not. run.py intersects this with the
# `sources.active` flags in the database, so flipping a source on is a DB
# update plus a subclass here — no other wiring.
ALL_SOURCES = [CbslFx]
