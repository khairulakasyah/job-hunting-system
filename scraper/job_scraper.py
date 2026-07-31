"""
Universal Job Portal Scraper
=============================
Scrapes job listings from any job portal URL and extracts:
  - Job Title
  - Platform (auto-detected from URL)
  - Location
  - Salary Range
  - Job Scope (responsibilities)
  - Skill Requirements

Supported portals (auto-detected):
  Indeed, LinkedIn, Jobstreet, Glassdoor, Monster,
  CareerBuilder, SimplyHired, ZipRecruiter, Seek, MyCareersFuture
  + Generic fallback for any other job site

Usage:
    # Scrape a single job posting URL
    python job_scraper.py "https://www.indeed.com/viewjob?jk=abc123"

    # Scrape multiple URLs from a text file (one URL per line)
    python job_scraper.py --file urls.txt

    # Save to a custom output file
    python job_scraper.py "https://..." --output my_jobs.json

    # Enable debug output
    python job_scraper.py "https://..." --debug
"""

import argparse
import json
import re
import sys
import time
from datetime import datetime
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode
import random
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from playwright.sync_api import sync_playwright
import re

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("❌ Missing dependencies. Install them with:")
    print("   pip install requests beautifulsoup4")
    sys.exit(1)


# ── Constants ─────────────────────────────────────────────────────────────────

DEFAULT_OUTPUT = "jobs_output.json"

HEADERS = {
    "User-Agent": random.choice([
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/138.0 Safari/537.36",
    ]),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Referer": "https://www.google.com/",
}
# Salary patterns (covers RM, USD, SGD, AUD, GBP, EUR, etc.)
SALARY_PATTERNS = [
    r"(?:RM|MYR|USD|\$|SGD|AUD|GBP|£|€|EUR)\s*[\d,]+(?:\s*[-–—to]+\s*(?:RM|MYR|USD|\$|SGD|AUD|GBP|£|€|EUR)?\s*[\d,]+)?(?:\s*/\s*(?:month|yr|year|annum|hour|hr))?",
    r"[\d,]+\s*[-–—to]+\s*[\d,]+\s*(?:per\s+)?(?:month|year|annum|hour|hr|annually)",
    r"(?:salary|pay|compensation|package)[:\s]+[\w\s,$/£€RM-]+(?:per\s+)?(?:month|year|annum|hour)?",
]


# ── Section Keywords (exact match against heading text) ───────────────────────
#
# Each list contains the exact strings that appear as section headings on job
# portals. Matching is case-insensitive and trailing punctuation is stripped.

SCOPE_KEYWORDS = [
    "objectives of this role",
    "objective of this role",
    "what you'll be doing",
    "what you will be doing",
    "what you'll do",
    "what you will do",
    "responsibility",
    "responsibilities",
    "key responsibility",
    "key responsibilities",
    "job scope",
    "job responsibilities",
    "job description",
    "role & responsibilities",
    "roles & responsibilities",
    "roles and responsibilities",
    "your responsibilities",
    "duties",
    "key duties",
    "job duties",
    "what the role involves",
    "the role",
    "your role",
    "you will be able to apply your skills to",
    "your day-to-day",
]

SKILLS_KEYWORDS = [
    "qualifications",
    "qualification",
    "requirements",
    "requirement",
    "key requirements",
    "key requirement",
    "job requirements",
    "job requirement",
    "skills & requirements",
    "skills and requirements",
    "required qualifications",
    "minimum qualifications",
    "preferred qualifications",
    "what we're looking for",
    "what we are looking for",
    "who we're looking for",
    "who you are",
    "you must have",
    "you should have",
    "experience required",
    "technical skills",
    "competencies",
    "prerequisites",
    "we want you to succeed with us and it will be much easier if you have",
    "your know-how"
]

BENEFITS_KEYWORDS = [
    "benefits",
    "benefit",
    "what we'll offer you",
    "what you'll get",
    "perks",
    "perks & benefits",
    "perks and benefits",
    "our benefits",
    "employee benefits",
    "compensation & benefits",
    "compensation and benefits",
    "why join us",
    "why work with us",
    "what's in it for you",
    "as part of our family, we ensure you",
]

COMPANY_KEYWORDS = [
    "about us",
    "about the company",
    "about the employer",
    "about our company",
    "who we are",
    "company overview",
    "our company",
    "company description",
    "about the organisation",
    "about the organization",
]

SALARY_KEYWORDS = [
    "pay",
    "salary",
    "salary range",
    "compensation",
    "remuneration"
]

WORK_KEYWORDS = [
    "work location",
    "work arrangement",
    "working arrangement",
    "work type",
    "workplace"
]

EDUCATION_KEYWORDS = [
    "education"
]

EXPERIENCE_KEYWORDS = [
    "experience"
]

USELESS_KEYWORDS = [
    "apply today",
    "let's show your interest by applying",
    "working hours",
    "working hour",
    "job types",
    'job type'
]

def _normalize_heading(text: str) -> str:
    """Strip trailing punctuation, lowercase, collapse whitespace."""
    text = text.strip()
    text = re.sub(r"[:\-–—]+$", "", text)   # remove trailing colon/dash
    text = re.sub(r"\s+", " ", text)
    return text.lower().strip()


def _classify(heading_text: str) -> str:
    """Return SCOPE | SKILLS | BENEFITS | COMPANY | OTHER."""
    n = _normalize_heading(heading_text)
    for kw in SCOPE_KEYWORDS:
        if n == kw.lower() or n.startswith(kw.lower()):
            return "SCOPE"
    for kw in SKILLS_KEYWORDS:
        if n == kw.lower() or n.startswith(kw.lower()):
            return "SKILLS"
    for kw in BENEFITS_KEYWORDS:
        if n == kw.lower() or n.startswith(kw.lower()):
            return "BENEFITS"
    for kw in COMPANY_KEYWORDS:
        if n == kw.lower() or n.startswith(kw.lower()):
            return "COMPANY"
    for kw in SALARY_KEYWORDS:
        if n.startswith(kw):
            return "SALARY"
    for kw in WORK_KEYWORDS:
        if n.startswith(kw):
            return "WORK"
    for kw in EDUCATION_KEYWORDS:
        if n.startswith(kw):
            return "EDUCATION"
    for kw in EXPERIENCE_KEYWORDS:
        if n.startswith(kw):
            return "EXPERIENCE"
    for kw in USELESS_KEYWORDS:
        if n.startswith(kw):
            return "USELESS"
    return "OTHER"


def extract_sections_from_html(container) -> dict:
    """
    Walk heading/bold elements inside the description container.
    Collect bullet-point / paragraph content under each classified heading.
    Returns dict with keys: job_scope, skill_requirements, benefits.
    """
    buckets = {"SCOPE": [], "SKILLS": [], "BENEFITS": []}

    heading_tags = container.find_all(
        lambda tag: tag.name in ["h1", "h2", "h3", "h4", "h5", "strong", "b", "p"]
        and len(tag.get_text(strip=True)) < 150
    )

    def collect_after(el) -> str:
        """Gather sibling text until the next heading-like element."""
        parts = []
        for sib in el.find_next_siblings():
            if sib.name in ["h1", "h2", "h3", "h4", "h5"]:
                break
            # stop if sibling is itself a heading (bold/strong with short text)
            if sib.name in ["strong", "b", "p"]:
                sib_text = sib.get_text(strip=True)
                if sib_text and len(sib_text) < 150 and _classify(sib_text) != "OTHER":
                    break
            text = sib.get_text(separator="\n", strip=True)
            if text:
                parts.append(text)
        return "\n".join(parts).strip()

    seen = set()
    for el in heading_tags:
        text = el.get_text(strip=True)
        if not text or text in seen:
            continue
        seen.add(text)
        label = _classify(text)
        if label in buckets:
            content = collect_after(el)
            if content:
                buckets[label].append(content)

    return {
        "job_scope":          "\n\n".join(buckets["SCOPE"]).strip(),
        "skill_requirements": "\n\n".join(buckets["SKILLS"]).strip(),
        "benefits":           "\n\n".join(buckets["BENEFITS"]).strip(),
    }


def extract_sections_from_text(raw_text: str) -> dict:
    """
    Plain-text fallback: scan line-by-line for known headings and slice out
    each section's content. Used when HTML extraction finds nothing.
    """
    if not raw_text:
        return {"job_scope": "", "skill_requirements": "", "benefits": ""}

    lines = raw_text.splitlines()
    # Build an ordered list of (label, line_index)
    order = []
    seen_labels = set()

    for i, line in enumerate(lines):
        n = _normalize_heading(line)
        if not n:
            continue
        label = _classify(line)
        if label not in ("OTHER", "COMPANY") and label not in seen_labels:
            order.append((label, i))
            seen_labels.add(label)

    def get_content(start_idx: int) -> str:
        next_starts = [s for _, s in order if s > start_idx]
        end = min(next_starts) if next_starts else len(lines)
        return "\n".join(lines[start_idx + 1 : end]).strip()

    result = {"job_scope": "", "skill_requirements": "", "benefits": ""}
    label_map = {"SCOPE": "job_scope", "SKILLS": "skill_requirements", "BENEFITS": "benefits"}
    for label, idx in order:
        key = label_map.get(label)
        if key and not result[key]:
            result[key] = get_content(idx)

    return result


# ── URL Cleaner ───────────────────────────────────────────────────────────────

# Query params that are purely tracking/session — safe to strip
_TRACKING_PARAMS = {
    # Jobstreet
    "tracking", "sol", "ref", "rsec", "rtra", "rpos", "rtype",
    "from", "pos", "source", "sourcesystem", "referer",
    # General
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "fbclid", "gclid", "msclkid", "ttclid", "_ga",
}

def extract_url_from_text(raw: str) -> str:
    """
    If the user pastes a share message instead of a bare URL,
    extract the actual URL from it.
    e.g. 'Check out this job on Jobstreet: Java Developer - https://my.jobstreet.com/job/123?tracking=...'
    """
    match = re.search(r'https?://\S+', raw.strip())
    return match.group(0).rstrip(".,)\"'") if match else raw.strip()


# ── Platform Detection ────────────────────────────────────────────────────────

PLATFORM_MAP = {
    "indeed": "Indeed",
    "linkedin": "LinkedIn",
    "jobstreet": "Jobstreet",
    "glassdoor": "Glassdoor",
    "monster": "Monster",
    "careerbuilder": "CareerBuilder",
    "simplyhired": "SimplyHired",
    "ziprecruiter": "ZipRecruiter",
    "seek": "Seek",
    "mycareersfuture": "MyCareersFuture",
    "jobsdb": "JobsDB",
    "reed": "Reed",
    "totaljobs": "TotalJobs",
    "workopolis": "Workopolis",
    "dice": "Dice",
    "wellfound": "Wellfound",
    "greenhouse": "Greenhouse",
    "lever": "Lever",
    "workday": "Workday",
}

def detect_platform(url: str) -> str:
    domain = urlparse(url).netloc.lower()
    for key, name in PLATFORM_MAP.items():
        if key in domain:
            return name
    parts = domain.replace("www.", "").split(".")
    return parts[0].capitalize() if parts else "Unknown"


def clean_url(url: str) -> str:
    """
    Strip tracking/session query parameters from a URL and return a clean version.
    Also remaps Jobstreet mobile/share subdomains to the scrapeable web domain:
      my.jobstreet.com  → www.jobstreet.com.my
      sg.jobstreet.com  → www.jobstreet.com.sg
      th.jobstreet.com  → www.jobstreet.co.th
      id.jobstreet.com  → www.jobstreet.co.id
      ph.jobstreet.com  → www.jobstreet.com.ph
    """
    parsed = urlparse(url)
    platform = detect_platform(url)

    if platform == "Jobstreet":
        # Remap mobile share subdomain → scrapeable web domain
        domain = parsed.netloc.lower()
        JOBSTREET_DOMAIN_MAP = {
            "my.jobstreet.com": "www.jobstreet.com.my",
            "sg.jobstreet.com": "www.jobstreet.com.sg",
            "th.jobstreet.com": "www.jobstreet.co.th",
            "id.jobstreet.com": "www.jobstreet.co.id",
            "ph.jobstreet.com": "www.jobstreet.com.ph",
        }
        netloc = JOBSTREET_DOMAIN_MAP.get(domain, parsed.netloc)
        clean = urlunparse((parsed.scheme, netloc, parsed.path, "", "", ""))
        if clean != url:
            print(f"  ℹ️  Jobstreet URL normalised → {clean}")
        return clean

    # All other platforms: drop known tracking params, keep the rest
    params = parse_qs(parsed.query, keep_blank_values=True)
    filtered = {k: v for k, v in params.items() if k.lower() not in _TRACKING_PARAMS}
    clean_query = urlencode(filtered, doseq=True)
    clean = urlunparse((parsed.scheme, parsed.netloc, parsed.path,
                        parsed.params, clean_query, ""))
    if clean != url:
        print(f"  ℹ️  Tracking params stripped → {clean}")
    return clean


# ── HTTP Fetch ────────────────────────────────────────────────────────────────

def fetch_page(url, timeout=20, debug=False):
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True
            )

            page = browser.new_page(
                user_agent=HEADERS["User-Agent"],
                viewport={"width": 1920, "height": 1080}
            )

            page.goto(
                url,
                wait_until="networkidle",
                timeout=timeout * 1000
            )

            html = page.content()

            if debug:
                with open("debug.html", "w", encoding="utf-8") as f:
                    f.write(html)

                print(f"[DEBUG] URL : {page.url}")
                print(f"[DEBUG] HTML Length : {len(html)}")

            browser.close()

            return BeautifulSoup(html, "html.parser")

    except Exception as e:
        print(f"⚠️ {e}")
        return None


# ── Portal-Specific Extractors ────────────────────────────────────────────────

def extract_indeed(soup: BeautifulSoup) -> dict:
    data = {}
    # Title
    for sel in ["h1.jobsearch-JobInfoHeader-title", "h1[data-testid='jobsearch-JobInfoHeader-title']", "h1"]:
        el = soup.select_one(sel)
        if el:
            data["job_title"] = el.get_text(strip=True)
            break
    # Company Name
    for sel in [
        "[data-testid='inlineHeader-companyName'] a",
        "[data-testid='inlineHeader-companyName']",
        "[data-company-name]",
        "a[data-testid='jobsearch-JobInfoHeader-companyNameLink']",
        ".jobsearch-JobInfoHeader-companyNameSimple",
        "[class*='companyName']",
        "[class*='company-name']",
    ]:
        el = soup.select_one(sel)
        if el:
            text = el.get_text(strip=True)
            if text:
                data["company_name"] = text
                break
    # Location
    for sel in ["div[data-testid='job-location']", "div.icl-u-xs-mt--xs.icl-u-textColor--secondary", ".jobsearch-JobInfoHeader-subtitle div"]:
        el = soup.select_one(sel)
        if el:
            data["location"] = el.get_text(strip=True)
            break
    # Salary
    for sel in ["div[data-testid='attribute_snippet_testid']", "#salaryInfoAndJobType span", ".icl-u-xs-mr--xs"]:
        els = soup.select(sel)
        for el in els:
            text = el.get_text(strip=True)
            if any(c in text for c in ["$", "£", "€", "RM", "SGD", "AUD", "/yr", "/mo", "year", "month", "hour"]):
                data["salary_range"] = text
                break
    # Job scope + skill requirements — parse from HTML structure
    for sel in ["div#jobDescriptionText", "div[data-testid='jobsearch-JobComponent-description']"]:
        el = soup.select_one(sel)
        if el:
            sections = extract_sections_from_html(el)
            data.update(sections)
            data["_raw_description"] = el.get_text(separator="\n", strip=True)
            break
    return data


def extract_linkedin(soup: BeautifulSoup) -> dict:
    data = {}
    for sel in ["h1.top-card-layout__title", "h1.t-24", "h1"]:
        el = soup.select_one(sel)
        if el:
            data["job_title"] = el.get_text(strip=True)
            break
    # Company Name
    for sel in [
        "a.topcard__org-name-link",
        ".topcard__org-name-link",
        "[class*='company-name']",
        ".job-details-jobs-unified-top-card__company-name a",
        ".job-details-jobs-unified-top-card__company-name",
        "[data-tracking-control-name='public_jobs_topcard-org-name']",
    ]:
        el = soup.select_one(sel)
        if el:
            text = el.get_text(strip=True)
            if text:
                data["company_name"] = text
                break
    for sel in [".topcard__flavor--bullet", ".job-details-jobs-unified-top-card__primary-description-container span"]:
        el = soup.select_one(sel)
        if el:
            data["location"] = el.get_text(strip=True)
            break
    for sel in [".compensation__salary", ".salary", "[data-test-id='salary']"]:
        el = soup.select_one(sel)
        if el:
            data["salary_range"] = el.get_text(strip=True)
            break
    for sel in ["div.description__text", "div.show-more-less-html__markup", "section.description"]:
        el = soup.select_one(sel)
        if el:
            sections = extract_sections_from_html(el)
            data.update(sections)
            data["_raw_description"] = el.get_text(separator="\n", strip=True)
            break
    return data


def extract_jobstreet(soup: BeautifulSoup) -> dict:
    data = {}
    for sel in ["h1[data-automation='job-detail-title']", "h1.sx2jih0", "h1"]:
        el = soup.select_one(sel)
        if el:
            data["job_title"] = el.get_text(strip=True)
            break
    # Company Name
    for sel in [
        "span[data-automation='advertiser-name']",
        "a[data-automation='advertiser-name']",
        "[data-testid='job-detail-company']",
        "[class*='advertiser']",
        "[class*='company']",
    ]:
        el = soup.select_one(sel)
        if el:
            text = el.get_text(strip=True)
            if text:
                data["company_name"] = text
                break
    for sel in ["span[data-automation='job-detail-location']", "span[data-testid='job-location']"]:
        el = soup.select_one(sel)
        if el:
            data["location"] = el.get_text(strip=True)
            break
    for sel in ["span[data-automation='job-detail-salary']", "span[data-testid='job-salary']"]:
        el = soup.select_one(sel)
        if el:
            data["salary_range"] = el.get_text(strip=True)
            break
    for sel in ["div[data-automation='jobAdDetails']", "div[data-testid='job-description']"]:
        el = soup.select_one(sel)
        if el:
            sections = extract_sections_from_html(el)
            data.update(sections)
            data["_raw_description"] = el.get_text(separator="\n", strip=True)
            break
    return data


def extract_glassdoor(soup: BeautifulSoup) -> dict:
    data = {}
    for sel in ["h1[data-test='job-title']", "h1.job-title", "h1"]:
        el = soup.select_one(sel)
        if el:
            data["job_title"] = el.get_text(strip=True)
            break
    # Company Name
    for sel in [
        "[data-test='employer-name']",
        ".employer-name",
        "[class*='employerName']",
        "[class*='employer-name']",
    ]:
        el = soup.select_one(sel)
        if el:
            text = el.get_text(strip=True)
            if text:
                data["company_name"] = text
                break
    for sel in ["div[data-test='location']", "span.location"]:
        el = soup.select_one(sel)
        if el:
            data["location"] = el.get_text(strip=True)
            break
    for sel in ["span[data-test='detailSalary']", "div.salary-estimate"]:
        el = soup.select_one(sel)
        if el:
            data["salary_range"] = el.get_text(strip=True)
            break
    for sel in ["div.jobDescriptionContent", "div[class*='desc']"]:
        el = soup.select_one(sel)
        if el:
            sections = extract_sections_from_html(el)
            data.update(sections)
            data["_raw_description"] = el.get_text(separator="\n", strip=True)
            break
    return data


# ── Generic / Fallback Extractor ──────────────────────────────────────────────

def extract_generic(soup: BeautifulSoup, debug: bool = False) -> dict:
    """
    Heuristic-based extraction for any job portal not explicitly supported.
    Tries common patterns and structured data (JSON-LD schema.org/JobPosting).
    """
    data = {}

    # 1. Try JSON-LD schema.org/JobPosting
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            ld = json.loads(script.string or "")
            # Handle arrays
            if isinstance(ld, list):
                ld = next((i for i in ld if i.get("@type") == "JobPosting"), {})
            if ld.get("@type") == "JobPosting":
                data["job_title"] = ld.get("title", "")
                # Company Name from JSON-LD
                hiring_org = ld.get("hiringOrganization", {})
                if isinstance(hiring_org, dict):
                    data["company_name"] = hiring_org.get("name", "")
                elif isinstance(hiring_org, str):
                    data["company_name"] = hiring_org
                # Location
                loc = ld.get("jobLocation", {})
                if isinstance(loc, list):
                    loc = loc[0]
                addr = loc.get("address", {})
                if isinstance(addr, str):
                    data["location"] = addr
                elif isinstance(addr, dict):
                    parts = [addr.get("addressLocality",""), addr.get("addressRegion",""), addr.get("addressCountry","")]
                    data["location"] = ", ".join(p for p in parts if p)
                # Salary
                sal = ld.get("baseSalary", {})
                if isinstance(sal, dict):
                    val = sal.get("value", {})
                    if isinstance(val, dict):
                        mn = val.get("minValue","")
                        mx = val.get("maxValue","")
                        unit = sal.get("currency","")
                        period = val.get("unitText","")
                        if mn and mx:
                            data["salary_range"] = f"{unit} {mn} – {mx} {period}".strip()
                        elif mn:
                            data["salary_range"] = f"{unit} {mn} {period}".strip()
                    elif isinstance(val, (int, float)):
                        data["salary_range"] = f"{sal.get('currency','')} {val}".strip()
                # Raw description — will be split into scope + skills in master extractor
                data["_raw_description"] = BeautifulSoup(
                    ld.get("description", ""), "html.parser"
                ).get_text(separator="\n", strip=True)
                if debug:
                    print("  [DEBUG] Used JSON-LD schema.org/JobPosting")
                if data.get("job_title"):
                    return data
        except (json.JSONDecodeError, AttributeError):
            continue

    # 2. Title — try common selectors, then <h1>
    title_selectors = [
        "h1[class*='title']", "h1[class*='job']", "h1[data-testid*='title']",
        "h1[data-automation*='title']", "[class*='job-title'] h1",
        "[class*='jobtitle']", "[class*='position-title']", "h1",
    ]
    for sel in title_selectors:
        el = soup.select_one(sel)
        if el:
            text = el.get_text(strip=True)
            if text:
                data["job_title"] = text
                break

    # 2b. Company Name — keyword-based class/attr search
    if not data.get("company_name"):
        for sel in [
            "[class*='companyName']", "[class*='company-name']", "[class*='employer']",
            "[data-testid*='company']", "[data-automation*='company']",
            "[itemprop='hiringOrganization']", "[itemprop='name']",
            "[class*='org-name']", "[class*='advertiser']",
        ]:
            el = soup.select_one(sel)
            if el:
                text = el.get_text(strip=True)
                if text and len(text) < 100:
                    data["company_name"] = text
                    break

    # 3. Location — keyword-based class/attr search
    location_selectors = [
        "[class*='location']", "[data-testid*='location']", "[data-automation*='location']",
        "[itemprop='jobLocation']", "[class*='city']", "[class*='place']",
    ]
    for sel in location_selectors:
        el = soup.select_one(sel)
        if el:
            text = el.get_text(strip=True)
            if text and len(text) < 120:
                data["location"] = text
                break

    # 4. Salary — keyword-based class/attr search + regex over full text
    salary_selectors = [
        "[class*='salary']", "[class*='pay']", "[class*='compensation']",
        "[data-testid*='salary']", "[data-automation*='salary']",
        "[itemprop='baseSalary']",
    ]
    for sel in salary_selectors:
        el = soup.select_one(sel)
        if el:
            text = el.get_text(strip=True)
            if text:
                data["salary_range"] = text
                break

    # Regex fallback for salary over the entire page text
    if not data.get("salary_range"):
        full_text = soup.get_text(" ", strip=True)
        for pattern in SALARY_PATTERNS:
            match = re.search(pattern, full_text, re.IGNORECASE)
            if match:
                data["salary_range"] = match.group(0).strip()
                break

    # 5. Job scope + skill requirements — scan description container via HTML structure
    desc_selectors = [
        "[class*='description']", "[class*='job-detail']", "[class*='jobdetail']",
        "[class*='job-body']", "[class*='job-content']", "[data-testid*='description']",
        "[data-automation*='description']", "[itemprop='description']",
        "article", "main",
    ]
    for sel in desc_selectors:
        el = soup.select_one(sel)
        if el:
            raw_text = el.get_text(separator="\n", strip=True)
            if len(raw_text) > 100:
                # Try HTML-aware section extraction first
                sections = extract_sections_from_html(el)
                data.update(sections)
                data["_raw_description"] = raw_text
                break

    return data


# ── Master Extractor ──────────────────────────────────────────────────────────

PORTAL_EXTRACTORS = {
    "Indeed": extract_indeed,
    "LinkedIn": extract_linkedin,
    "Jobstreet": extract_jobstreet,
    "Glassdoor": extract_glassdoor,
}

def extract_working_type(text: str) -> str:
    if not text:
        return "Not specified"

    # Targeted patterns with capturing groups for cleaner extracted values
    patterns = [
        r"\b(?:work\s+location|working\s+arrangement|work\s+arrangement)\s*:\s*(.+)",
        r"\b(fully\s+remote)\b",
        r"\b(work\s+from\s+home)\b",
        r"\b(home[- ]based)\b",
        r"\b(office[- ]based)\b",
        r"\b(in\s+person)\b",
        r"\b(on[- ]site|onsite)\b",
        r"\b(hybrid(?:\s+working)?)\b",
        r"\b(remote)\b",
    ]

    found_types = []

    for line in text.splitlines():
        clean = line.strip()
        if not clean:
            continue

        for pattern in patterns:
            match = re.search(pattern, clean, re.IGNORECASE)
            if match:
                # Capture the group value or whole match
                val = match.group(1) if match.lastindex else match.group(0)
                val = val.strip().title()

                # Normalize common variations
                if val.lower() in ["onsite", "on-site"]:
                    val = "On-site"
                elif val.lower() == "home-based":
                    val = "Home-based"
                elif val.lower() == "office-based":
                    val = "Office-based"

                # Avoid duplicate entries (case-insensitive check)
                if not any(val.lower() == existing.lower() for existing in found_types):
                    found_types.append(val)

    if not found_types:
        return "Not specified"

    return " / ".join(found_types)

def extract_job_data(url: str, soup: BeautifulSoup, debug: bool = False) -> dict:
    platform = detect_platform(url)
    extractor = PORTAL_EXTRACTORS.get(platform, None)

    # Run portal-specific extractor first (if available)
    data = extractor(soup) if extractor else {}

    # Fill in any missing fields with generic extractor
    if not all(data.get(f) for f in ["job_title", "location", "_raw_description"]):
        generic = extract_generic(soup, debug=debug)
        for key, val in generic.items():
            if not data.get(key) and val:
                data[key] = val

    # Use HTML-extracted sections if available; otherwise fall back to text-based split
    job_scope         = data.get("job_scope", "")
    skill_requirements = data.get("skill_requirements", "")
    benefits          = data.get("benefits", "")

    raw = data.get("_raw_description", "")

    working_type = extract_working_type(raw)

    if working_type == "Not specified":
        working_type = extract_working_type(
            soup.get_text(" ", strip=True)
        )

    if not job_scope and not skill_requirements and not benefits:
        raw = data.get("_raw_description", "")
        fallback = extract_sections_from_text(raw)
        job_scope          = fallback.get("job_scope", "")
        skill_requirements = fallback.get("skill_requirements", "")
        benefits           = fallback.get("benefits", "")
        if debug:
            print("  [DEBUG] Used text-based fallback for section splitting")

    # Defaults for missing fields
    result = {
        "job_title":          data.get("job_title", "N/A"),
        "company_name":       data.get("company_name", "N/A"),
        "platform":           platform,
        "location":           data.get("location", "N/A"),
        "salary_range":       data.get("salary_range", "Not specified"),
        "working_type":       working_type       or "Not specified",
        "job_scope":          job_scope          or "Not found",
        "skill_requirements": skill_requirements or "Not specified",
        "benefits":           benefits           or "Not specified",
        "source_url":         url,
        "scraped_at":         datetime.now().isoformat(),
    }
    return result


# ── Output ────────────────────────────────────────────────────────────────────

def save_json(records: list[dict], path: str):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)
    print(f"\n✅ Saved {len(records)} job(s) → {path}")


def print_job(job: dict):
    print(f"\n{'─'*60}")
    print(f"  📌 Title      : {job['job_title']}")
    print(f"  🏢 Company    : {job['company_name']}")
    print(f"  🌐 Platform   : {job['platform']}")
    print(f"  📍 Location   : {job['location']}")
    print(f"  💰 Salary     : {job['salary_range']}")
    print(f"  🏠 Work Type  : {job['working_type']}")
    scope = job["job_scope"]
    print(f"  🗂  Job Scope  : {scope[:250].replace(chr(10), ' ')}{'…' if len(scope) > 250 else ''}")
    skills = job["skill_requirements"]
    print(f"  🛠  Skills     : {skills[:250].replace(chr(10), ' ')}{'…' if len(skills) > 250 else ''}")
    benefits = job["benefits"]
    print(f"  🎁 Benefits   : {benefits[:250].replace(chr(10), ' ')}{'…' if len(benefits) > 250 else ''}")
    print(f"{'─'*60}")


# ── Main ──────────────────────────────────────────────────────────────────────

def scrape_url(url: str, debug: bool = False) -> dict | None:
    url = extract_url_from_text(url)
    url = clean_url(url)
    print(f"\n🔍 Scraping: {url}")
    soup = fetch_page(url, debug=debug)
    if soup is None:
        return None
    job = extract_job_data(url, soup, debug=debug)
    print_job(job)
    return job


def main():
    parser = argparse.ArgumentParser(
        description="Universal Job Portal Scraper — extracts title, platform, location, salary, job scope, and skill requirements.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("url", nargs="?", help="Single job listing URL to scrape")
    parser.add_argument("--file", "-f", help="Text file with one URL per line (batch mode)")
    parser.add_argument("--output", "-o", default=DEFAULT_OUTPUT, help=f"Output JSON file (default: {DEFAULT_OUTPUT})")
    parser.add_argument("--delay", type=float, default=1.5, help="Delay in seconds between requests in batch mode (default: 1.5)")
    parser.add_argument("--debug", action="store_true", help="Enable debug output")

    args = parser.parse_args()

    if not args.url and not args.file:
        parser.print_help()
        sys.exit(1)

    urls = []
    if args.url:
        urls.append(args.url)
    if args.file:
        try:
            with open(args.file, "r", encoding="utf-8") as f:
                file_urls = [line.strip() for line in f if line.strip() and not line.startswith("#")]
                urls.extend(file_urls)
            print(f"📂 Loaded {len(file_urls)} URL(s) from {args.file}")
        except FileNotFoundError:
            print(f"❌ File not found: {args.file}")
            sys.exit(1)

    # Scrape all URLs
    results = []
    for i, url in enumerate(urls):
        job = scrape_url(url, debug=args.debug)
        if job:
            results.append(job)
        if i < len(urls) - 1:
            time.sleep(args.delay)

    if results:
        save_json(results, args.output)
        print(f"\n📊 Summary: {len(results)}/{len(urls)} job(s) scraped successfully.")
    else:
        print("\n⚠️  No jobs were successfully scraped.")


if __name__ == "__main__":
    main()