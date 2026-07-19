from .brief_gen import BriefGen
from .cbsl_fx import CbslFx
from .ceb_power import CebPower
from .cse_asi import CseAsi
from .dengue_hub import DengueHub
from .fuel_octane import FuelOctane
from .news_rss import NewsRss
from .open_meteo import OpenMeteo
from .openaq_colombo import OpenaqColombo
from .usgs_quakes import UsgsQuakes

# Every registered source, active or not. run.py intersects this with the
# `sources.active` flags in the database, so flipping a source on is a DB
# update plus a subclass here — no other wiring.
ALL_SOURCES = [
    BriefGen,
    CbslFx,
    CebPower,
    CseAsi,
    DengueHub,
    FuelOctane,
    NewsRss,
    OpenMeteo,
    OpenaqColombo,
    UsgsQuakes,
]
