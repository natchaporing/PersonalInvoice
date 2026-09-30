#!/usr/bin/env python3
"""Validate e-Tax XML against the vendored ETDA schema (XSD) and Schematron rules.

Usage: python3 scripts/validate-etax.py file.xml [more.xml ...]
Needs lxml (pip install lxml). Exit code 0 = every file passes both checks.

The ETDA Schematron files declare queryBinding="xslt2" but only use XPath 1.0, so they are run
here with the "xslt" binding, which lxml supports.
"""
import re
import sys
from pathlib import Path

from lxml import etree, isoschematron

STD = Path(__file__).resolve().parent.parent / "vendor" / "etda-etax" / "ETDA" / "data" / "standard"


def load(root_tag: str):
    xsd = etree.XMLSchema(etree.parse(str(STD / f"{root_tag}_2p0.xsd")))
    sch_name = root_tag.replace("_CrossIndustryInvoice", "_Schematron")
    sch_src = (STD / f"{sch_name}_2p0.sch").read_bytes().replace(b'queryBinding="xslt2"', b'queryBinding="xslt"')
    sch = isoschematron.Schematron(etree.fromstring(sch_src), store_report=True)
    return xsd, sch


def main(paths):
    ok = True
    cache = {}
    for p in paths:
        # Real ETDA samples pad date-times with whitespace; the XSD rejects that, so trim it like a producer would.
        raw = re.sub(rb"(T\d\d:\d\d:\d\d\.\d)\s+<", rb"\1<", Path(p).read_bytes())
        doc = etree.fromstring(raw)
        root_tag = etree.QName(doc).localname
        if root_tag not in cache:
            cache[root_tag] = load(root_tag)
        xsd, sch = cache[root_tag]
        problems = []
        if not xsd.validate(doc):
            problems += [f"XSD: {e.message}" for e in xsd.error_log]
        if not sch.validate(doc):
            problems += ["Schematron: " + " ".join(str(e.message).split())[:300] for e in sch.error_log]
        print(f"{'PASS' if not problems else 'FAIL'}  {p}")
        for line in problems:
            print("   ", line)
        ok = ok and not problems
    return 0 if ok else 1


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    sys.exit(main(sys.argv[1:]))
