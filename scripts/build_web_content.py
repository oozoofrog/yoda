#!/usr/bin/env python3
from __future__ import annotations

import html
import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'docs' / 'content.json'
EXCLUDED_PARTS = {'.git', 'docs', '__pycache__'}
QUESTION_HEADING_KEYWORDS = ('질문', '회상', '과제', '체크', '프롬프트')
DEFAULT_REVIEW_AFTER_DAYS = [1, 3, 7]

CATEGORY_ORDER = {
    'hub': 0,
    'reference': 1,
    'tutorial_hub': 2,
    'tutorial': 3,
    'course': 4,
    'course_sample': 5,
    'case_tutorial': 6,
    'case_card': 7,
    'gfi_hub': 8,
    'gfi_card': 9,
    'research': 10,
    'template': 11,
}

CATEGORY_LABEL = {
    'hub': '허브',
    'reference': '레퍼런스',
    'tutorial_hub': '튜토리얼 허브',
    'tutorial': '튜토리얼',
    'course': '30일 코스',
    'course_sample': '코스 로그 샘플',
    'case_tutorial': 'Merged 사례 튜토리얼',
    'case_card': 'Merged 사례 카드',
    'gfi_hub': 'Open GFI 허브',
    'gfi_card': 'Open GFI 카드',
    'research': '조사 원자료',
    'template': '템플릿',
}

TRACK_ORDER = {
    'hub': 0,
    'foundation': 1,
    'open_issue_workflow': 2,
    'diagnostics_course': 3,
    'optimizer_course': 4,
    'compiler_core_course': 5,
    'open_gfi_library': 6,
    'merged_case_library': 7,
    'reference_library': 8,
    'research': 9,
    'template': 10,
}

TRACK_LABEL = {
    'hub': '문서 허브',
    'foundation': '기초 학습 루프',
    'open_issue_workflow': 'Open Issue 분석 루프',
    'diagnostics_course': 'Diagnostics 30일 트랙',
    'optimizer_course': 'Optimizer 30일 트랙',
    'compiler_core_course': 'Compiler Core 30일 트랙',
    'open_gfi_library': 'Open GFI 라이브러리',
    'merged_case_library': 'Merged 사례 라이브러리',
    'reference_library': '레퍼런스 라이브러리',
    'research': '조사 원자료',
    'template': '템플릿/도구',
}


def iter_markdown_files() -> list[Path]:
    files: list[Path] = []
    for path in ROOT.rglob('*.md'):
        if any(part in EXCLUDED_PARTS for part in path.parts):
            continue
        files.append(path)
    return sorted(files)


def classify(path: Path) -> tuple[str, bool]:
    rel = path.relative_to(ROOT).as_posix()
    name = path.name
    if rel == 'README.md':
        return 'hub', True
    if rel.startswith('tutorials/courses/samples/'):
        return 'course_sample', True
    if rel.startswith('tutorials/courses/'):
        return 'course', True
    if rel.startswith('tutorials/case-studies/cards/'):
        return 'case_card', True
    if rel.startswith('tutorials/case-studies/research/'):
        return 'research', True
    if rel.startswith('tutorials/case-studies/'):
        if name == 'README.md':
            return 'tutorial_hub', True
        if name.startswith('_'):
            return 'template', True
        return 'case_tutorial', True
    if rel.startswith('tutorials/good-first-issues/cards/'):
        return 'gfi_card', True
    if rel.startswith('tutorials/good-first-issues/'):
        if name == 'README.md':
            return 'gfi_hub', True
        return 'template', False
    if rel.startswith('tutorials/open-issue-templates/'):
        return 'template', True
    if rel.startswith('tutorials/'):
        if name == 'README.md':
            return 'tutorial_hub', True
        return 'tutorial', True
    return 'reference', True


def infer_track(rel: str, category: str) -> str:
    if rel == 'README.md' or rel == 'tutorials/README.md':
        return 'hub'
    if rel.startswith('tutorials/courses/30-day-diagnostics-track'):
        return 'diagnostics_course'
    if rel.startswith('tutorials/courses/30-day-optimizer-track'):
        return 'optimizer_course'
    if rel.startswith('tutorials/courses/30-day-compiler-core-track'):
        return 'compiler_core_course'
    if rel.startswith('tutorials/courses/samples/'):
        return 'diagnostics_course'
    if rel.startswith('tutorials/good-first-issues/'):
        return 'open_gfi_library'
    if rel.startswith('tutorials/case-studies/'):
        return 'merged_case_library'
    if rel.startswith('tutorials/open-issue-templates/') or rel.startswith('tutorials/07-open-issue-analysis-workbook') or rel.startswith('tutorials/06-good-first-issues'):
        return 'open_issue_workflow'
    if rel.startswith('tutorials/00-') or rel.startswith('tutorials/01-') or rel.startswith('tutorials/02-') or rel.startswith('tutorials/03-') or rel.startswith('tutorials/04-'):
        return 'foundation'
    if rel.startswith('tutorials/'):
        return 'foundation'
    if category == 'research':
        return 'research'
    if category == 'template':
        return 'template'
    return 'reference_library'


def slugify(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r'[^\w\s\-가-힣]+', '', text)
    text = re.sub(r'\s+', '-', text)
    return text or 'section'


def extract_title(lines: list[str], fallback: str) -> str:
    for line in lines:
        if line.startswith('# '):
            return line[2:].strip()
    return fallback


def extract_meta(lines: list[str]) -> dict[str, str]:
    meta: dict[str, str] = {}
    for line in lines[:24]:
        if line.startswith('> **') and '**:' in line:
            body = line[4:]
            key, value = body.split('**:', 1)
            meta[key.strip()] = value.strip()
    return meta


def extract_excerpt(lines: list[str]) -> str:
    skip_prefixes = ('#', '>', '-', '*', '|', '```')
    for line in lines:
        s = line.strip()
        if not s:
            continue
        if s.startswith(skip_prefixes):
            continue
        if re.match(r'^\d+\.\s+', s):
            continue
        return s
    return ''


def extract_headings(lines: list[str]) -> list[dict[str, object]]:
    out = []
    for line in lines:
        m = re.match(r'^(#{1,6})\s+(.*)$', line)
        if not m:
            continue
        level = len(m.group(1))
        text = m.group(2).strip()
        out.append({'level': level, 'text': text, 'id': slugify(text)})
    return out


def extract_section_items(lines: list[str], heading_keywords: tuple[str, ...]) -> list[dict[str, object]]:
    items: list[dict[str, object]] = []
    current_heading = None
    collecting = False
    bucket: list[str] = []
    for line in lines:
        m = re.match(r'^(#{2,6})\s+(.*)$', line)
        if m:
            if collecting and bucket:
                items.append({'section': current_heading, 'items': bucket[:]})
            current_heading = m.group(2).strip()
            collecting = any(keyword in current_heading for keyword in heading_keywords)
            bucket = []
            continue
        if not collecting:
            continue
        stripped = line.strip()
        if stripped.startswith('- '):
            bucket.append(stripped[2:].strip())
        elif re.match(r'^\d+\.\s+', stripped):
            bucket.append(re.sub(r'^\d+\.\s+', '', stripped).strip())
    if collecting and bucket:
        items.append({'section': current_heading, 'items': bucket[:]})
    return items


def extract_days(lines: list[str]) -> list[str]:
    days: list[str] = []
    for line in lines:
        m = re.match(r'^###\s+(Day\s+\d+.*?)$', line)
        if m:
            days.append(m.group(1).strip())
    return days


def extract_code_blocks(lines: list[str]) -> list[dict[str, str]]:
    blocks = []
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if line.startswith('```'):
            lang = line[3:].strip()
            i += 1
            code_lines = []
            while i < len(lines) and not lines[i].strip().startswith('```'):
                code_lines.append(lines[i])
                i += 1
            blocks.append({'language': lang or 'text', 'content': '\n'.join(code_lines)})
        i += 1
    return blocks


def normalize_internal_doc_link(href: str, current_rel: str) -> tuple[str | None, str | None]:
    href = href.strip()
    if not href or '://' in href or href.startswith('mailto:'):
        return None, None
    if href.startswith('#'):
        return current_rel, href[1:] or None

    link_path, _, fragment = href.partition('#')
    candidate = (ROOT / current_rel).parent / link_path
    if candidate.is_dir() and (candidate / 'README.md').exists():
        candidate = candidate / 'README.md'
    elif candidate.suffix == '' and (candidate.with_suffix('.md')).exists():
        candidate = candidate.with_suffix('.md')
    try:
        rel = candidate.resolve().relative_to(ROOT).as_posix()
    except Exception:
        return None, fragment or None
    return rel, fragment or None


def extract_internal_doc_links(text: str, current_rel: str) -> list[str]:
    refs: list[str] = []
    for _, href in re.findall(r'\[([^\]]+)\]\(([^)]+)\)', text):
        rel, _ = normalize_internal_doc_link(href, current_rel)
        if rel and rel.endswith('.md') and rel != current_rel:
            refs.append(rel)
    deduped = []
    seen = set()
    for ref in refs:
        if ref in seen:
            continue
        seen.add(ref)
        deduped.append(ref)
    return deduped


def format_inline(raw: str, current_rel: str) -> str:
    placeholders: list[str] = []

    def stash(content: str) -> str:
        token = f'@@PLACEHOLDER{len(placeholders)}@@'
        placeholders.append(content)
        return token

    def repl_code(m: re.Match[str]) -> str:
        return stash(f'<code>{html.escape(m.group(1))}</code>')

    def repl_link(m: re.Match[str]) -> str:
        text = html.escape(m.group(1))
        href = m.group(2).strip()
        if '://' in href or href.startswith('mailto:'):
            return stash(f'<a href="{html.escape(href)}" target="_blank" rel="noopener noreferrer">{text}</a>')
        rel, anchor = normalize_internal_doc_link(href, current_rel)
        if rel == current_rel and anchor:
            return stash(f'<a href="#" data-scroll-target="{html.escape(anchor)}">{text}</a>')
        if rel:
            anchor_attr = f' data-doc-anchor="{html.escape(anchor)}"' if anchor else ''
            return stash(f'<a href="#" data-doc-href="{html.escape(rel)}"{anchor_attr}>{text}</a>')
        return stash(text)

    work = raw
    work = re.sub(r'`([^`]+)`', repl_code, work)
    work = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', repl_link, work)
    work = html.escape(work)
    work = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', work)
    work = re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)', r'<em>\1</em>', work)
    for i, content in enumerate(placeholders):
        work = work.replace(f'@@PLACEHOLDER{i}@@', content)
    return work


def render_markdown(text: str, current_rel: str) -> str:
    lines = text.splitlines()
    out: list[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        if not stripped:
            i += 1
            continue
        if stripped.startswith('```'):
            lang = stripped[3:].strip() or 'text'
            i += 1
            code_lines = []
            while i < len(lines) and not lines[i].strip().startswith('```'):
                code_lines.append(lines[i])
                i += 1
            code = html.escape('\n'.join(code_lines))
            out.append(f'<pre class="code-block"><button class="copy-button" type="button">복사</button><code data-lang="{html.escape(lang)}">{code}</code></pre>')
            if i < len(lines):
                i += 1
            continue
        if re.match(r'^#{1,6}\s+', line):
            level = len(line) - len(line.lstrip('#'))
            title = line[level:].strip()
            out.append(f'<h{level} id="{slugify(title)}">{format_inline(title, current_rel)}</h{level}>')
            i += 1
            continue
        if stripped == '---':
            out.append('<hr />')
            i += 1
            continue
        if stripped.startswith('|') and i + 1 < len(lines) and set(lines[i + 1].replace('|', '').replace('-', '').replace(':', '').strip()) == set():
            header_cells = [format_inline(c.strip(), current_rel) for c in line.strip('|').split('|')]
            rows = []
            i += 2
            while i < len(lines) and lines[i].strip().startswith('|'):
                row_cells = [format_inline(c.strip(), current_rel) for c in lines[i].strip().strip('|').split('|')]
                rows.append(row_cells)
                i += 1
            table = ['<table><thead><tr>']
            table += [f'<th>{c}</th>' for c in header_cells]
            table.append('</tr></thead><tbody>')
            for row in rows:
                table.append('<tr>')
                table += [f'<td>{c}</td>' for c in row]
                table.append('</tr>')
            table.append('</tbody></table>')
            out.append(''.join(table))
            continue
        if stripped.startswith('>'):
            quote_lines = []
            while i < len(lines) and lines[i].strip().startswith('>'):
                quote_lines.append(lines[i].strip()[1:].strip())
                i += 1
            out.append(f'<blockquote><p>{format_inline(" ".join(quote_lines), current_rel)}</p></blockquote>')
            continue
        if stripped.startswith('- ') or re.match(r'^\d+\.\s+', stripped):
            ordered = bool(re.match(r'^\d+\.\s+', stripped))
            tag = 'ol' if ordered else 'ul'
            out.append(f'<{tag}>')
            while i < len(lines):
                s = lines[i].strip()
                if ordered and re.match(r'^\d+\.\s+', s):
                    item = re.sub(r'^\d+\.\s+', '', s)
                    out.append(f'<li>{format_inline(item, current_rel)}</li>')
                    i += 1
                    continue
                if (not ordered) and s.startswith('- '):
                    out.append(f'<li>{format_inline(s[2:].strip(), current_rel)}</li>')
                    i += 1
                    continue
                break
            out.append(f'</{tag}>')
            continue
        para = [stripped]
        i += 1
        while i < len(lines):
            nxt = lines[i].strip()
            if not nxt:
                break
            if nxt.startswith(('```', '#', '>', '-', '|')) or re.match(r'^\d+\.\s+', nxt) or nxt == '---':
                break
            para.append(nxt)
            i += 1
        out.append(f'<p>{format_inline(" ".join(para), current_rel)}</p>')
    return '\n'.join(out)


class SimpleYamlCursor:
    def __init__(self, lines: list[str]) -> None:
        self.lines = lines
        self.index = 0

    def has(self) -> bool:
        return self.index < len(self.lines)

    def peek(self) -> str | None:
        if not self.has():
            return None
        return self.lines[self.index]

    def pop(self) -> str:
        line = self.lines[self.index]
        self.index += 1
        return line

    def skip_blanks(self) -> None:
        while self.has() and not self.peek().strip():
            self.index += 1


def _indent_of(line: str) -> int:
    return len(line) - len(line.lstrip(' '))


def _parse_scalar(raw: str, cursor: SimpleYamlCursor) -> Any:
    raw = raw.strip()
    if raw == '':
        return ''
    if raw in {'true', 'false'}:
        return raw == 'true'
    if raw == 'null':
        return None
    if re.fullmatch(r'-?\d+', raw):
        return int(raw)
    if raw[0] in {'"', "'"}:
        quote = raw[0]
        if len(raw) >= 2 and raw.endswith(quote):
            return raw[1:-1]
        parts = [raw[1:]]
        while cursor.has():
            line = cursor.pop()
            if line.endswith(quote):
                parts.append(line[:-1])
                break
            parts.append(line)
        return '\n'.join(parts)
    return raw


def _parse_mapping_entries(cursor: SimpleYamlCursor, indent: int, initial: dict[str, Any] | None = None) -> dict[str, Any]:
    result: dict[str, Any] = initial or {}
    while True:
        cursor.skip_blanks()
        line = cursor.peek()
        if line is None:
            break
        if _indent_of(line) != indent or line.strip().startswith('- '):
            break
        raw_line = cursor.pop().rstrip('\n')
        stripped = raw_line[indent:]
        key, sep, remainder = stripped.partition(':')
        if not sep:
            continue
        if remainder.strip() == '':
            cursor.skip_blanks()
            next_line = cursor.peek()
            if next_line is None or _indent_of(next_line) < indent + 2:
                result[key.strip()] = None
            else:
                result[key.strip()] = _parse_block(cursor, indent + 2)
        else:
            result[key.strip()] = _parse_scalar(remainder.strip(), cursor)
    return result


def _parse_list(cursor: SimpleYamlCursor, indent: int) -> list[Any]:
    items: list[Any] = []
    while True:
        cursor.skip_blanks()
        line = cursor.peek()
        if line is None or _indent_of(line) != indent or not line.strip().startswith('- '):
            break
        raw_line = cursor.pop().rstrip('\n')
        rest = raw_line[indent + 2:]
        if rest.strip() == '':
            cursor.skip_blanks()
            next_line = cursor.peek()
            if next_line is None or _indent_of(next_line) < indent + 2:
                items.append(None)
            else:
                items.append(_parse_block(cursor, indent + 2))
            continue
        if rest.lstrip().startswith(('"', "'")):
            items.append(_parse_scalar(rest.strip(), cursor))
            continue
        key, sep, remainder = rest.partition(':')
        if sep:
            item: dict[str, Any] = {}
            if remainder.strip() == '':
                cursor.skip_blanks()
                next_line = cursor.peek()
                if next_line is None or _indent_of(next_line) < indent + 2:
                    item[key.strip()] = None
                else:
                    item[key.strip()] = _parse_block(cursor, indent + 2)
            else:
                item[key.strip()] = _parse_scalar(remainder.strip(), cursor)
            item = _parse_mapping_entries(cursor, indent + 2, item)
            items.append(item)
        else:
            items.append(_parse_scalar(rest.strip(), cursor))
    return items


def _parse_block(cursor: SimpleYamlCursor, indent: int) -> Any:
    cursor.skip_blanks()
    line = cursor.peek()
    if line is None:
        return None
    if _indent_of(line) < indent:
        return None
    if line.strip().startswith('- '):
        return _parse_list(cursor, indent)
    return _parse_mapping_entries(cursor, indent)


def load_simple_yaml(path: Path) -> dict[str, Any]:
    cursor = SimpleYamlCursor(path.read_text().splitlines())
    return _parse_block(cursor, 0)


def normalize_doc_refs(values: list[str] | None, current_rel: str) -> list[str]:
    refs: list[str] = []
    for value in values or []:
        rel, _ = normalize_internal_doc_link(value, current_rel)
        if rel:
            refs.append(rel)
    deduped: list[str] = []
    seen = set()
    for ref in refs:
        if ref in seen:
            continue
        seen.add(ref)
        deduped.append(ref)
    return deduped


def build_source_links(meta: dict[str, Any]) -> list[dict[str, str]]:
    links: list[dict[str, str]] = []
    if meta.get('merged_pr'):
        pr = meta['merged_pr']
        links.append({'label': f'Merged PR #{pr}', 'url': f'https://github.com/swiftlang/swift/pull/{pr}'})
    if meta.get('issue_number'):
        issue = meta['issue_number']
        links.append({'label': f'Issue #{issue}', 'url': f'https://github.com/swiftlang/swift/issues/{issue}'})
    for url in meta.get('issue_urls') or []:
        links.append({'label': '관련 이슈', 'url': url})
    if meta.get('fix_commit'):
        sha = meta['fix_commit']
        links.append({'label': 'Fix commit', 'url': f'https://github.com/swiftlang/swift/commit/{sha}'})
    if meta.get('parent_commit'):
        sha = meta['parent_commit']
        links.append({'label': 'Parent commit', 'url': f'https://github.com/swiftlang/swift/commit/{sha}'})
    deduped: list[dict[str, str]] = []
    seen = set()
    for link in links:
        key = (link['label'], link['url'])
        if key in seen:
            continue
        seen.add(key)
        deduped.append(link)
    return deduped


def review_days_for(category: str, track: str) -> list[int]:
    if category in {'template', 'research'}:
        return []
    if category in {'hub', 'tutorial_hub'}:
        return [3, 7]
    if track in {'diagnostics_course', 'optimizer_course', 'compiler_core_course', 'open_issue_workflow', 'foundation', 'open_gfi_library', 'merged_case_library'}:
        return DEFAULT_REVIEW_AFTER_DAYS
    return [3, 7]


def build_index_metadata() -> dict[str, dict[str, Any]]:
    by_path: dict[str, dict[str, Any]] = {}
    for path, key in [
        (ROOT / 'tutorials' / 'good-first-issues' / 'index.yaml', 'issues'),
        (ROOT / 'tutorials' / 'case-studies' / 'index.yaml', 'cases'),
    ]:
        data = load_simple_yaml(path)
        for item in data.get(key, []):
            doc_path = item.get('doc_path')
            if doc_path:
                by_path[doc_path] = item
    return by_path


def build_practice_cards(doc: dict[str, Any]) -> list[dict[str, Any]]:
    cards: list[dict[str, Any]] = []
    for section in doc['questionSections']:
        for item in section['items']:
            cards.append({'type': 'question', 'section': section['section'], 'prompt': item})
    for cmd in doc.get('reproCommandGuesses', []):
        cards.append({'type': 'command', 'label': '재현 명령', 'content': cmd})
    for path in doc.get('entryFileGuesses', []):
        cards.append({'type': 'entry', 'label': '첫 진입 파일', 'content': path})
    for test in doc.get('repoTestCandidates', []):
        cards.append({'type': 'repo_test', 'label': test.get('path', ''), 'why': test.get('why', '')})
    for test in doc.get('primaryTests', [])[:4]:
        cards.append({'type': 'primary_test', 'label': '핵심 테스트', 'content': test})
    return cards


def collect_docs() -> tuple[list[dict[str, object]], list[dict[str, object]], list[dict[str, object]]]:
    metadata_by_path = build_index_metadata()
    docs: list[dict[str, object]] = []
    tracks_seen: set[str] = set()

    for idx, path in enumerate(iter_markdown_files()):
        rel = path.relative_to(ROOT).as_posix()
        category, include = classify(path)
        if not include:
            continue
        text = path.read_text()
        lines = text.splitlines()
        title = extract_title(lines, path.stem)
        meta = extract_meta(lines)
        excerpt = extract_excerpt(lines)
        headings = extract_headings(lines)
        question_sections = extract_section_items(lines, QUESTION_HEADING_KEYWORDS)
        days = extract_days(lines)
        code_blocks = extract_code_blocks(lines)
        index_meta = metadata_by_path.get(rel, {})
        track = infer_track(rel, category)
        tracks_seen.add(track)
        internal_links = extract_internal_doc_links(text, rel)
        related_docs = normalize_doc_refs(index_meta.get('related_reference_docs'), rel)
        related_docs += normalize_doc_refs(index_meta.get('related_case_cards'), rel)
        related_docs += normalize_doc_refs(index_meta.get('related_full_tutorials'), rel)
        related_docs += internal_links
        dedup_related: list[str] = []
        seen_related = set()
        for ref in related_docs:
            if ref == rel or ref in seen_related:
                continue
            seen_related.add(ref)
            dedup_related.append(ref)

        repo_test_candidates = index_meta.get('repo_test_candidates') or []
        entry_file_guesses = index_meta.get('entry_file_guesses') or []
        repro_command_guesses = index_meta.get('repro_command_guesses') or []
        primary_tests = index_meta.get('primary_tests') or []
        primary_files = index_meta.get('primary_files') or []
        labels = index_meta.get('labels') or []
        concepts = index_meta.get('concepts') or []
        source_links = build_source_links(index_meta)
        doc = {
            'id': rel.replace('/', '__').replace('.md', ''),
            'path': rel,
            'title': title,
            'category': category,
            'categoryLabel': CATEGORY_LABEL[category],
            'track': track,
            'trackLabel': TRACK_LABEL[track],
            'order': CATEGORY_ORDER[category] * 1000 + idx,
            'meta': meta,
            'excerpt': excerpt,
            'headings': headings,
            'questionSections': question_sections,
            'days': days,
            'codeBlocks': code_blocks,
            'html': render_markdown(text, rel),
            'wordCount': len(re.findall(r'\S+', text)),
            'readingMinutes': max(1, len(re.findall(r'\S+', text)) // 220),
            'difficulty': index_meta.get('difficulty') or meta.get('난이도'),
            'durationMinutes': index_meta.get('duration_minutes'),
            'stageGuess': index_meta.get('stage_guess') or index_meta.get('stage'),
            'kindLabel': index_meta.get('kind') or category,
            'labels': labels,
            'concepts': concepts,
            'whyItMatters': index_meta.get('why_it_matters'),
            'prContextSummary': index_meta.get('pr_context_summary'),
            'relatedDocs': dedup_related,
            'repoTestCandidates': repo_test_candidates,
            'entryFileGuesses': entry_file_guesses,
            'reproCommandGuesses': repro_command_guesses,
            'primaryTests': primary_tests,
            'primaryFiles': primary_files,
            'sourceLinks': source_links,
            'reviewAfterDays': review_days_for(category, track),
            'issueNumber': index_meta.get('issue_number'),
            'mergedPr': index_meta.get('merged_pr'),
            'fixCommit': index_meta.get('fix_commit'),
            'parentCommit': index_meta.get('parent_commit'),
            'searchText': ' '.join(
                filter(
                    None,
                    [
                        title,
                        excerpt,
                        CATEGORY_LABEL[category],
                        TRACK_LABEL[track],
                        meta.get('목표', ''),
                        meta.get('대상', ''),
                        index_meta.get('stage_guess', ''),
                        index_meta.get('stage', ''),
                        ' '.join(labels),
                        ' '.join(concepts),
                        rel,
                    ],
                )
            ),
        }
        doc['practiceCards'] = build_practice_cards(doc)
        doc['questionCount'] = sum(len(section['items']) for section in question_sections)
        doc['practiceCount'] = len(doc['practiceCards'])
        docs.append(doc)

    docs = sorted(docs, key=lambda d: (d['order'], d['title']))
    categories = [
        {'id': key, 'label': CATEGORY_LABEL[key], 'order': CATEGORY_ORDER[key]}
        for key in sorted(CATEGORY_ORDER, key=lambda k: CATEGORY_ORDER[k])
        if any(doc['category'] == key for doc in docs)
    ]
    tracks = [
        {'id': key, 'label': TRACK_LABEL[key], 'order': TRACK_ORDER[key]}
        for key in sorted(tracks_seen, key=lambda k: TRACK_ORDER.get(k, 999))
    ]
    return docs, categories, tracks


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    docs, categories, tracks = collect_docs()
    payload = {
        'title': 'yoda interactive learning docs',
        'generatedFrom': 'markdown+yaml',
        'docCount': len(docs),
        'docs': docs,
        'categories': categories,
        'tracks': tracks,
        'uiRecommendation': {
            'primary': 'coursera-hybrid',
            'summary': 'Coursera식 3열 코스 구조를 기본으로 하되, Codecademy식 practice card, Khan식 mastery/consistency, Duolingo식 review resurfacing을 결합합니다.',
        },
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2))
    print(f'generated {OUTPUT} with {len(docs)} docs')


if __name__ == '__main__':
    main()
