# Swift 컴파일러 학습 튜토리얼

이 디렉토리는 `yoda/`의 **튜토리얼 전용 트랙**입니다.  
기존 `yoda/*.md` 문서가 레퍼런스 성격이라면, 여기의 문서는 다음에 집중합니다.

- 실제 손을 움직이는 학습 순서
- 환경 구성 → 관찰 → 디버깅 → 수정 → 검증 루프
- 이미 main에서 고쳐진 사례를 부모 커밋에서 다시 재현하고 고쳐보는 연습
- 학습과학/인지심리학 근거를 반영한 반복 가능한 학습 절차
- 많은 사례를 짧게 훑는 case card와, 대표 사례를 깊게 따라가는 full tutorial의 2층 구조

처음이라면 먼저 [00-curriculum-and-method.md](00-curriculum-and-method.md)부터 읽고,  
그 다음 [01-build-environment-lab.md](01-build-environment-lab.md) → [02-debugging-environment-lab.md](02-debugging-environment-lab.md) 순서로 진행하세요.


## 인터랙티브 웹앱으로 보는 방법

튜토리얼과 사례 문서는 `../docs/`의 정적 웹앱에서도 탐색할 수 있습니다.
웹앱은 다음 흐름을 지원합니다.

- track/library 전환
- 문서별 progress / mastery / notes
- 1/3/7일 review queue
- good first issue 카드와 merged 사례를 같은 UI에서 탐색

로컬 미리보기:

```bash
cd yoda
python3 scripts/build_web_content.py
python3 -m http.server 8123 -d docs
```

---

## 이 디렉토리를 어떻게 사용할까

### 가장 추천하는 순서
1. [00-curriculum-and-method.md](00-curriculum-and-method.md)
2. [01-build-environment-lab.md](01-build-environment-lab.md)
3. [02-debugging-environment-lab.md](02-debugging-environment-lab.md)
4. [03-pipeline-entrypoints-and-knowledge-map.md](03-pipeline-entrypoints-and-knowledge-map.md)
5. [04-stage-modification-workflow.md](04-stage-modification-workflow.md)
6. [06-good-first-issues-swift-6.0-6.3.md](06-good-first-issues-swift-6.0-6.3.md)와 [good-first-issues/README.md](good-first-issues/README.md)에서 open issue 카드를 고릅니다
7. [07-open-issue-analysis-workbook.md](07-open-issue-analysis-workbook.md)로 분석 로그를 시작합니다
8. full tutorial 5개를 순서대로 진행
   - [01-sema-fixit-source-locs.md](case-studies/01-sema-fixit-source-locs.md)
   - [02-sil-location-explicitness.md](case-studies/02-sil-location-explicitness.md)
   - [03-irgen-fast-existential-casts.md](case-studies/03-irgen-fast-existential-casts.md)
   - [04-optimizer-cond-fail-pass-architecture.md](case-studies/04-optimizer-cond-fail-pass-architecture.md)
   - [05-optimizer-enum-tag-comparison-correctness.md](case-studies/05-optimizer-enum-tag-comparison-correctness.md)
9. 이후 [case-studies/README.md](case-studies/README.md)와 `case-studies/cards/`에서 다음 사례를 고릅니다

### 목표별 추천 경로
- **환경부터 익히기**: 01 → 02
- **컴파일러 단계 지도를 익히기**: 03
- **실제 수정 절차를 익히기**: 04
- **버전별 open issue로 실전 감각 익히기**: 06
- **open issue 분석 루프를 훈련하기**: 07
- **진짜 이슈를 고쳐보며 배우기**: case-studies/
- **많은 사례를 짧게 넓게 보기**: `case-studies/cards/`
- **open good first issue를 짧게 넓게 보기**: `good-first-issues/cards/`

---

## 문서 지도

| 문서 | 역할 | 산출물 |
|---|---|---|
| [00-curriculum-and-method.md](00-curriculum-and-method.md) | 전체 학습법, 복습 루프, 연구 기반 설계 원칙 | 주간 학습 계획, 학습 로그 템플릿 |
| [01-build-environment-lab.md](01-build-environment-lab.md) | 빌드/테스트 루프를 직접 구축하는 실습 | `BUILD` 변수, 증분 빌드 루프 |
| [02-debugging-environment-lab.md](02-debugging-environment-lab.md) | AST/SIL/IR/LLDB 관찰 루프 실습 | 디버깅 커맨드 셋, 관찰 로그 |
| [03-pipeline-entrypoints-and-knowledge-map.md](03-pipeline-entrypoints-and-knowledge-map.md) | 단계별 진입점과 읽기 순서 지도 | 단계-파일-문서 매핑표 |
| [04-stage-modification-workflow.md](04-stage-modification-workflow.md) | 특정 단계 수정의 공통 절차 | 재현/수정/검증 체크리스트 |
| [06-good-first-issues-swift-6.0-6.3.md](06-good-first-issues-swift-6.0-6.3.md) | Swift 6.0~6.3 `good first issue` 학습 코스 | open issue 기반 실전 과제 |
| [07-open-issue-analysis-workbook.md](07-open-issue-analysis-workbook.md) | open issue를 분석하는 실전 워크북 | 분석 로그와 가설 기록 |
| [08-interactive-web-learning-ui-rationale.md](08-interactive-web-learning-ui-rationale.md) | 인터랙티브 웹 UI 설계 배경 | Coursera 하이브리드 선택 근거 |
| [good-first-issues/README.md](good-first-issues/README.md) | open `good first issue` 카드 허브 | 짧은 실전 탐색 카드 |
| [open-issue-templates/](open-issue-templates/) | open issue 분석 템플릿 | 분석 템플릿 / 세션 로그 |
| [courses/README.md](courses/README.md) | 장기 학습 코스 허브 | diagnostics / optimizer / core 30일 코스 |
| [case-studies/README.md](case-studies/README.md) | 사례 카탈로그와 백로그 | 다음 사례 선택 기준 |
| [case-studies/cards/](case-studies/cards/) | 많은 사례를 빠르게 탐색하는 case card 모음 | 짧은 사례 기반 학습 |
| [case-studies/](case-studies/) | 실제 merged fix를 부모 커밋에서 다시 구현하는 실습 | worktree 기반 수정 경험 |
| [case-studies/research/](case-studies/research/) | 사례화 전 원자료 정리 노트 | PR/issue 맥락 조사 원본 |

---

## 레퍼런스 문서와의 관계

튜토리얼 문서는 공통 설명을 길게 반복하지 않습니다. 필요할 때는 아래 문서를 함께 참고합니다.

- 환경/빌드/테스트의 기준 문서: [../2026-04-04-swift-compiler-dev-environment.md](../2026-04-04-swift-compiler-dev-environment.md)
- 전체 기여 흐름: [../2026-04-04-swift-compiler-contributor-learning-guide.md](../2026-04-04-swift-compiler-contributor-learning-guide.md)
- SIL 심화 레퍼런스: [../2026-04-04-sil-deep-dive.md](../2026-04-04-sil-deep-dive.md)
- Demangling 심화 레퍼런스: [../2026-04-04-demangling-deep-dive.md](../2026-04-04-demangling-deep-dive.md)

---

## 이 튜토리얼 세트의 학습 원칙

이 튜토리얼 세트는 두 층으로 운영합니다.

- **full tutorial**: 하나의 사례를 깊게 추적
- **case card**: 많은 사례를 짧게 탐색

full tutorial 문서는 공통적으로 다음 구조를 따릅니다.

1. **사전 회상 질문**: 이미 아는 것과 모르는 것을 분리
2. **worked example**: 먼저 완성된 예를 관찰
3. **guided practice**: 힌트를 보며 따라 하기
4. **independent transfer**: 비슷하지만 동일하지 않은 문제에 적용
5. **reflection**: 내가 왜 그렇게 판단했는지 기록

case card는 이 구조를 축약해서 유지하며, 자세한 근거와 원문 링크는 [00-curriculum-and-method.md](00-curriculum-and-method.md)에 정리합니다.

---

## 시작 전 준비

- Swift 컴파일러 저장소가 이미 체크아웃되어 있어야 합니다.
- macOS + Apple Silicon 기준입니다.
- `tutorials/case-studies/`까지 진행하려면 **별도 worktree와 별도 build 디렉토리**를 운영할 준비가 필요합니다.

처음 한 번은 [01-build-environment-lab.md](01-build-environment-lab.md)에서 환경을 먼저 잡고 오세요.
