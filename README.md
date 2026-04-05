# yoda 문서 허브

`yoda/`는 Swift 컴파일러 기여와 학습을 위한 문서 모음입니다.  
이제 문서는 크게 두 층으로 나뉩니다:

- **레퍼런스 문서**: 환경, SIL, Demangling, 전체 기여 흐름을 설명하는 참고 문서
- **튜토리얼 문서**: 실제 학습 순서, 실습, 사례 복원, 연구 기반 학습 루프를 제공하는 문서

레퍼런스 축은 다시 아래 4가지 주제로 나뉩니다:

- 개발 환경과 빌드/테스트 루프
- 처음 기여를 시작하는 학습 순서
- SIL 중심의 내부 구조와 최적화
- Demangling/Mangling 중심의 심볼/ABI 이해

처음이라면 **항상 개발 환경 문서부터** 시작하세요.  
다른 문서들은 모두 로컬 빌드/테스트 루프가 잡혀 있다는 전제를 공유합니다.


## 인터랙티브 웹 문서

`yoda/docs/`에는 이 Markdown 문서들을 바탕으로 만든 **정적 인터랙티브 학습 웹앱**이 있습니다.

- 기본 UX: **개인용 2단 문서 뷰어**
- 좌측: 전체 문서 목차 / 우측: 선택한 문서 내용 + 개인 메모
- 배포 방식: **GitHub Pages용 정적 문서**

로컬에서 미리보려면:

```bash
cd yoda
./scripts/run_web.sh
```

그 다음 브라우저에서 `http://127.0.0.1:8123`를 엽니다.

---

## 빠른 진입

### 연구 기반 튜토리얼로 시작하고 싶다면
1. [tutorials/README.md](tutorials/README.md)
2. [tutorials/00-curriculum-and-method.md](tutorials/00-curriculum-and-method.md)
3. [tutorials/01-build-environment-lab.md](tutorials/01-build-environment-lab.md)

### 완전 처음이라면
1. [Swift 컴파일러 개발 환경 완전 정복](2026-04-04-swift-compiler-dev-environment.md)
2. [Swift 컴파일러 기여자를 위한 체계적 학습 가이드](2026-04-04-swift-compiler-contributor-learning-guide.md)

### 빌드/테스트 루프부터 잡고 싶다면
- [Swift 컴파일러 개발 환경 완전 정복](2026-04-04-swift-compiler-dev-environment.md)

### SIL부터 파고들고 싶다면
1. [Swift 컴파일러 개발 환경 완전 정복](2026-04-04-swift-compiler-dev-environment.md)
2. [SIL (Swift Intermediate Language) 심화 가이드](2026-04-04-sil-deep-dive.md)

### 심볼/ABI/Demangling부터 보고 싶다면
1. [Swift 컴파일러 개발 환경 완전 정복](2026-04-04-swift-compiler-dev-environment.md)
2. [Demangling 심화 가이드](2026-04-04-demangling-deep-dive.md)

---

## 문서 지도

### 레퍼런스 문서

| 문서 | 대상 독자 | 핵심 질문 | 난이도 | 선행 문서 |
|---|---|---|---|---|
| [Swift 컴파일러 개발 환경 완전 정복](2026-04-04-swift-compiler-dev-environment.md) | 처음 빌드/테스트 루프를 잡는 기여자 | 로컬 빌드, 증분 빌드, 테스트, 디버깅 루프를 어떻게 잡을까? | 하 | 없음 |
| [Swift 컴파일러 기여자를 위한 체계적 학습 가이드](2026-04-04-swift-compiler-contributor-learning-guide.md) | 컴파일러 구조가 처음인 Swift 개발자 | 무엇을 어떤 순서로 배우고 어디서 첫 기여를 시작할까? | 하 | 개발 환경 문서 |
| [SIL (Swift Intermediate Language) 심화 가이드](2026-04-04-sil-deep-dive.md) | SILOptimizer/SILGen 쪽에 관심 있는 기여자 | SIL은 왜 필요하고, 어떻게 읽고, 어디를 고치고, 어떻게 테스트할까? | 중 | 개발 환경 문서 |
| [Demangling 심화 가이드](2026-04-04-demangling-deep-dive.md) | 심볼, ABI, 런타임 표현에 관심 있는 기여자 | 맹글링/디맹글링은 어떻게 동작하고 어디서 검증할까? | 중 | 개발 환경 문서 |

### 튜토리얼 문서

| 문서 | 역할 | 산출물 |
|---|---|---|
| [tutorials/README.md](tutorials/README.md) | 튜토리얼 허브와 추천 순서 | 개인 학습 진입점 |
| [tutorials/00-curriculum-and-method.md](tutorials/00-curriculum-and-method.md) | 학습법, 복습 루프, 연구 기반 설계 원칙 | 학습 로그와 주간 계획 |
| [tutorials/01-build-environment-lab.md](tutorials/01-build-environment-lab.md) | 빌드 환경 실습 | 첫 빌드/첫 증분 빌드/첫 테스트 |
| [tutorials/02-debugging-environment-lab.md](tutorials/02-debugging-environment-lab.md) | AST/SIL/IR/LLDB 관찰 루프 실습 | 디버깅 명령 세트 |
| [tutorials/03-pipeline-entrypoints-and-knowledge-map.md](tutorials/03-pipeline-entrypoints-and-knowledge-map.md) | 단계별 진입점과 지식 지도 | 단계-파일-문서 매핑 |
| [tutorials/04-stage-modification-workflow.md](tutorials/04-stage-modification-workflow.md) | 재현 → 수정 → 검증 공통 절차 | 수정 체크리스트 |
| [tutorials/06-good-first-issues-swift-6.0-6.3.md](tutorials/06-good-first-issues-swift-6.0-6.3.md) | Swift 6.0~6.3 `good first issue` 학습 코스 | open issue 기반 실전 진입 |
| [tutorials/07-open-issue-analysis-workbook.md](tutorials/07-open-issue-analysis-workbook.md) | open issue 분석 워크북 | 분석 로그와 가설 훈련 |
| [tutorials/good-first-issues/README.md](tutorials/good-first-issues/README.md) | open `good first issue` 카드 허브 | 버전별 짧은 실전 과제 |
| [tutorials/courses/README.md](tutorials/courses/README.md) | 장기 학습 코스 허브 | diagnostics / optimizer / compiler core 30일 코스 |
| [tutorials/case-studies/README.md](tutorials/case-studies/README.md) | 사례 카탈로그와 백로그 | 다음 사례 선택과 난이도 조절 |
| [tutorials/case-studies/cards/](tutorials/case-studies/cards/) | 많은 사례를 빠르게 탐색하는 case card 모음 | 넓은 사례 학습 |
| [tutorials/case-studies/](tutorials/case-studies/) | 부모 커밋에서 merged fix를 다시 구현하는 사례 실습 | 사례별 worktree 실습 기록 |

---

## 추천 학습 트랙

### 1) 입문자 트랙
처음 기여를 준비한다면 이 순서가 가장 안전합니다.

1. [개발 환경 문서](2026-04-04-swift-compiler-dev-environment.md)의 빠른 시작으로 빌드/테스트 루프 확보
2. [기여자 학습 가이드](2026-04-04-swift-compiler-contributor-learning-guide.md)로 전체 파이프라인과 학습 순서 파악
3. 이후 관심 분야에 따라 SIL 또는 Demangling 문서로 진입

### 1-보강) 연구 기반 튜토리얼 트랙
읽기만 하지 않고, 실제로 학습 루프를 설계하며 따라가고 싶다면 이 순서가 가장 좋습니다.

1. [tutorials/README.md](tutorials/README.md)
2. [tutorials/00-curriculum-and-method.md](tutorials/00-curriculum-and-method.md)
3. [tutorials/01-build-environment-lab.md](tutorials/01-build-environment-lab.md)
4. [tutorials/02-debugging-environment-lab.md](tutorials/02-debugging-environment-lab.md)
5. [tutorials/03-pipeline-entrypoints-and-knowledge-map.md](tutorials/03-pipeline-entrypoints-and-knowledge-map.md)
6. [tutorials/04-stage-modification-workflow.md](tutorials/04-stage-modification-workflow.md)
7. [tutorials/06-good-first-issues-swift-6.0-6.3.md](tutorials/06-good-first-issues-swift-6.0-6.3.md)로 open issue 코스를 섞어 본다
8. [tutorials/07-open-issue-analysis-workbook.md](tutorials/07-open-issue-analysis-workbook.md)로 실제 issue 분석 로그를 남긴다
9. full tutorial 5개를 순서대로 진행하거나, `tutorials/case-studies/cards/`와 `tutorials/good-first-issues/cards/`에서 짧은 사례를 병행

### 2) SIL 트랙
SILOptimizer, SILGen, Ownership SSA, 검증기 흐름을 이해하려면 이 순서가 좋습니다.

1. [개발 환경 문서](2026-04-04-swift-compiler-dev-environment.md)
2. [SIL 심화 가이드](2026-04-04-sil-deep-dive.md)
3. [tutorials/02-debugging-environment-lab.md](tutorials/02-debugging-environment-lab.md)
4. [tutorials/case-studies/02-sil-location-explicitness.md](tutorials/case-studies/02-sil-location-explicitness.md)

### 3) 심볼/ABI 트랙
심볼 이름, Node Tree, ABI 표기, `swift-demangle` 도구에 관심이 있다면 이 순서로 읽습니다.

1. [개발 환경 문서](2026-04-04-swift-compiler-dev-environment.md)
2. [Demangling 심화 가이드](2026-04-04-demangling-deep-dive.md)
3. 필요 시 [SIL 심화 가이드](2026-04-04-sil-deep-dive.md)의 SIL 심볼 예시와 교차 참고

### 4) “이미 고쳐진 이슈를 내가 다시 고쳐보기” 트랙
실제 수정 사례를 복원하며 배우고 싶다면 아래 순서가 좋습니다.

1. [tutorials/04-stage-modification-workflow.md](tutorials/04-stage-modification-workflow.md)
2. [tutorials/case-studies/01-sema-fixit-source-locs.md](tutorials/case-studies/01-sema-fixit-source-locs.md)
3. [tutorials/case-studies/02-sil-location-explicitness.md](tutorials/case-studies/02-sil-location-explicitness.md)
4. [tutorials/case-studies/03-irgen-fast-existential-casts.md](tutorials/case-studies/03-irgen-fast-existential-casts.md)
5. [tutorials/case-studies/04-optimizer-cond-fail-pass-architecture.md](tutorials/case-studies/04-optimizer-cond-fail-pass-architecture.md)
6. [tutorials/case-studies/05-optimizer-enum-tag-comparison-correctness.md](tutorials/case-studies/05-optimizer-enum-tag-comparison-correctness.md)

### 5) “이제 실제 open issue에 들어가기” 트랙
실제 기여 후보를 단계적으로 경험하고 싶다면 이 순서가 좋습니다.

1. [tutorials/06-good-first-issues-swift-6.0-6.3.md](tutorials/06-good-first-issues-swift-6.0-6.3.md)
2. diagnostics/fix-it 계열 open issue 1개 선택
3. [tutorials/04-stage-modification-workflow.md](tutorials/04-stage-modification-workflow.md) 체크리스트로 분석
4. 관련 case card / full tutorial과 교차 학습

### 6) “30일 루프로 꾸준히 밀어붙이기” 트랙
문서를 읽는 데서 그치지 않고 실제 학습 프로그램으로 운영하고 싶다면 아래 순서가 좋습니다.

1. [tutorials/courses/30-day-diagnostics-track.md](tutorials/courses/30-day-diagnostics-track.md)
2. 매일 해당 day의 문서 / 카드 / issue를 수행
3. [tutorials/open-issue-templates/session-log-template.md](tutorials/open-issue-templates/session-log-template.md)으로 로그 축적

---

## 시간 기준 추천 순서

### 30분
- 튜토리얼 허브와 `00-curriculum-and-method`
- 개발 환경 문서의 **빠른 시작**
- 기여자 학습 가이드의 **빠른 시작 + Layer 1**
- SIL 또는 Demangling 문서의 **빠른 시작** 중 하나

### 반나절
- 튜토리얼의 **01 / 02**
- 개발 환경 문서의 **빌드 / 증분 빌드 / 테스트 / 디버깅** 장
- 기여자 학습 가이드의 **Phase 1~5**
- 관심 deep dive 문서 하나의 **빠른 시작 / 코드 지도 / 테스트** 섹션

### 1주
- 튜토리얼 **00~04 + 사례 1개 이상**
- 개발 환경 문서 전체
- 기여자 학습 가이드 전체
- SIL 또는 Demangling 문서 하나를 끝까지 정독
- 나머지 deep dive 문서는 필요한 섹션만 선택해서 읽기

---

## 문서 운영 규칙

새 문서를 추가하거나 기존 문서를 크게 확장할 때는 아래 원칙을 유지합니다.

1. **파일명 규칙**: `YYYY-MM-DD-topic.md`
2. **문서 구조 규칙**: 가능하면 `대상 / 목표 / 전제 → 빠른 시작 → Layer 1/2/3` 흐름 유지
3. **공통 설명 집중화**: 빌드/테스트/디버깅의 공통 설명은 가능한 한 개발 환경 문서에 모으고, deep dive 문서에서는 링크로 참조
4. **README 동기화**: 새 문서를 추가하면 이 README의 `문서 지도`와 `추천 학습 트랙`도 함께 갱신
5. **중복 최소화**: 같은 명령/배경 설명을 여러 문서에 길게 반복하지 않고, 각 문서는 자기 주제의 핵심 의사결정에 집중
6. **튜토리얼 분리 원칙**: 설명형 레퍼런스와 실습형 튜토리얼을 한 문서에 과도하게 섞지 않음
7. **연구 기반 명시**: 튜토리얼 문서는 가능하면 학습 설계 근거를 짧게 남기고, 자세한 근거는 `tutorials/00-curriculum-and-method.md`에 집중

---

## 현재 추천 시작점

- **무조건 한 문서만 먼저 읽어야 한다면**: [Swift 컴파일러 개발 환경 완전 정복](2026-04-04-swift-compiler-dev-environment.md)
- **실습형으로 시작하고 싶다면**: [tutorials/README.md](tutorials/README.md)
- **처음 기여까지 가장 빨리 가고 싶다면**: 개발 환경 → 기여자 학습 가이드
- **기술적으로 가장 먼저 깊게 파고들 주제를 고른다면**: SIL 또는 Demangling 중 하나만 먼저 선택
