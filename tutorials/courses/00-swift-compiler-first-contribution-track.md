# Swift 개발자를 위한 Swift 컴파일러 첫 기여 코스

> **대상**: Swift 문법과 앱/패키지 개발은 익숙하지만, Swift 컴파일러 내부는 처음인 개발자
> **목표**: 이 코스를 끝내면 **작은 diagnostics / fix-it / validation 계열 변경을 직접 재현·수정·검증하고 PR 준비까지 할 수 있는 수준**에 도달한다.
> **전제**: macOS + Apple Silicon, 로컬에 `swiftlang/swift` 저장소 체크아웃 가능

## 먼저 이 코스의 원칙

이 코스는 **무엇이 있는지 설명하는 코스가 아니라, 무엇을 어떤 순서로 할지 고정하는 코스**입니다.

따라서 처음에는 아래를 **하지 않습니다**.

- SIL 심화부터 들어가기
- optimizer부터 들어가기
- demangling부터 들어가기
- open issue를 무작정 여러 개 읽기
- Xcode/LLDB 설정 없이 컴파일러 소스를 먼저 뒤지기

처음 기여를 목표로 할 때 가장 좋은 순서는 아래입니다.

1. **빌드 / 테스트 루프 확보**
2. **출력 관찰 루프 확보**
3. **문제 단계 추정 능력 확보**
4. **작은 merged 사례 복원**
5. **open issue 분석**
6. **작은 로컬 수정과 검증**
7. **PR 준비**

핵심은 “많이 아는 것”이 아니라 **작게 바꾸고, 테스트로 증명하는 것**입니다.

---

## 이 코스를 끝냈을 때의 완료 기준

아래 6개를 만족하면 됩니다.

1. `utils/build-script` 또는 대응 빌드 루프로 로컬 빌드 가능
2. `utils/run-test` 또는 `lit.py`로 좁은 테스트 실행 가능
3. 문제를 보고 **Parse / Sema / SIL / IRGen 중 어디부터 볼지** 추정 가능
4. merged 사례 1개를 parent commit에서 다시 고쳐볼 수 있음
5. open good first issue 1개에 대해
   - 최소 재현 코드
   - 첫 진입 파일 후보
   - 첫 테스트 후보
   를 적을 수 있음
6. 작은 diagnostics/fix-it 변경을 로컬에서 검증하고 PR 직전 체크리스트까지 수행 가능

---

## 이 코스만 따라갈 때의 순서

### Step 1 — 로컬 빌드와 첫 테스트를 성공시킨다
**왜 지금 이걸 먼저 하는가**
- 컴파일러 학습에서 가장 먼저 필요한 것은 이론이 아니라 **반복 가능한 빌드/테스트 루프**입니다.
- 이게 없으면 이후 모든 단계가 구경으로 끝납니다.

**읽기**
- [../01-build-environment-lab.md](../01-build-environment-lab.md)
- 레퍼런스: [../../2026-04-04-swift-compiler-dev-environment.md](../../2026-04-04-swift-compiler-dev-environment.md)
- 공식: <https://github.com/swiftlang/swift/blob/main/README.md>
- 공식: <https://github.com/swiftlang/swift/blob/main/docs/DevelopmentTips.md>

**해야 할 일**
- build 디렉토리를 하나 잡습니다.
- 첫 빌드를 성공시킵니다.
- `utils/run-test`로 테스트 1개를 성공시킵니다.

**끝나면 남길 것**
- 내 `BUILD` 경로
- 첫 성공 테스트 명령 1개
- 빌드/테스트에 걸린 시간 메모

**완료 조건**
- “나는 지금 내 머신에서 compiler를 다시 빌드하고 test 1개를 돌릴 수 있다”라고 말할 수 있으면 끝입니다.

---

### Step 2 — 좁은 테스트 실행 루프를 만든다
**왜 이 단계가 필요한가**
- 실제 기여는 거의 항상 “전체 빌드”가 아니라 **좁은 테스트 → 작은 수정 → 다시 좁은 테스트** 루프로 진행됩니다.

**읽기**
- [../01-build-environment-lab.md](../01-build-environment-lab.md)
- 공식: <https://github.com/swiftlang/swift/blob/main/docs/Testing.md>

**해야 할 일**
- `test/Sema`, `test/Parse`, `test/SILOptimizer`에서 예시 테스트를 각각 1개씩 실행합니다.
- `utils/run-test`와 `lit.py` 둘 다 한 번씩 써봅니다.

**끝나면 남길 것**
- 내가 쓸 기본 테스트 명령 3개
- “frontend 문제는 어디 테스트부터 보겠다” 기준 3줄

**완료 조건**
- 테스트를 category별로 좁혀서 돌리는 감각이 생기면 끝입니다.

---

### Step 3 — 같은 입력을 AST / SIL / IR로 본다
**왜 이 단계가 먼저인가**
- 컴파일러를 기여 가능한 수준으로 배우려면, 소스 코드 1개가 단계마다 어떻게 바뀌는지 눈으로 봐야 합니다.
- 소스 코드를 읽기 전에 **출력 변화**를 먼저 보는 편이 훨씬 빠릅니다.

**읽기**
- [../02-debugging-environment-lab.md](../02-debugging-environment-lab.md)
- [../03-pipeline-entrypoints-and-knowledge-map.md](../03-pipeline-entrypoints-and-knowledge-map.md)

**해야 할 일**
- 아주 작은 Swift 파일 1개를 만들고
  - `-dump-ast`
  - `-emit-sil`
  - `-emit-ir`
  로 각각 출력합니다.

**끝나면 남길 것**
- AST / SIL / IR 차이를 설명하는 5줄 메모

**완료 조건**
- “이 문제는 parser에서 끝날지, type checking을 거칠지, SIL 이후까지 갈지” 감이 생기면 끝입니다.

---

### Step 4 — 문제를 보고 어느 단계부터 볼지 추정한다
**왜 이 단계가 핵심인가**
- 초보자는 보통 문제를 보면 바로 소스를 뒤집니다.
- 하지만 실제로는 **어느 단계 문제인지 먼저 맞히는 능력**이 가장 중요합니다.

**읽기**
- [../03-pipeline-entrypoints-and-knowledge-map.md](../03-pipeline-entrypoints-and-knowledge-map.md)
- [../04-stage-modification-workflow.md](../04-stage-modification-workflow.md)

**해야 할 일**
- 아래 셋을 각각 보고 첫 진입 단계를 추정합니다.
  - parse error 1개
  - diagnostics/fix-it 문제 1개
  - SIL/optimizer 문제 1개

**끝나면 남길 것**
- 각 문제별 “나는 왜 이 단계를 의심했는가?” 2~3줄

**완료 조건**
- 문제를 보기만 해도 `Parse / Sema / SIL / IRGen` 중 어디부터 볼지 말할 수 있으면 끝입니다.

---

### Step 5 — LLDB와 디버깅 문서를 한 번 실제로 쓴다
**왜 필요한가**
- 기여 수준에 도달하려면 “문서를 읽는 사람”이 아니라 **관찰하고 멈춰보는 사람**이 되어야 합니다.

**읽기**
- [../02-debugging-environment-lab.md](../02-debugging-environment-lab.md)
- 공식: <https://github.com/swiftlang/swift/blob/main/docs/DebuggingTheCompiler.md>

**해야 할 일**
- `swift-frontend` 한 번을 LLDB로 실행합니다.
- breakpoint 1개를 걸고, 현재 입력과 관련된 노드/진단 흐름을 관찰합니다.

**끝나면 남길 것**
- 내가 가장 자주 쓸 LLDB 명령 3개
- breakpoint를 어디에 걸었는지

**완료 조건**
- 컴파일러를 “실행 파일”이 아니라 “디버깅 가능한 프로그램”으로 인식하면 끝입니다.

---

## 여기까지 끝났으면 이제 첫 안전한 코드 변경으로 들어간다

이제부터는 **작고 안전한 diagnostics 사례**부터 들어갑니다.  
처음 기여 목표라면 가장 좋은 첫 사례는 optimizer나 IRGen이 아니라 **Sema diagnostics / fix-it**입니다.

이유:
- 재현이 쉽고
- 테스트가 선명하고
- 수정 범위가 작고
- 기여 가치가 높습니다.

---

### Step 6 — 가장 쉬운 merged 사례를 parent commit에서 다시 고친다
**추천 사례**
- [../case-studies/01-sema-fixit-source-locs.md](../case-studies/01-sema-fixit-source-locs.md)

**왜 이걸 먼저 하는가**
- 이 사례는 “작은 diagnostics bug + fix-it range + 회귀 테스트”를 한 번에 배울 수 있는 가장 안전한 사례입니다.

**해야 할 일**
- parent commit으로 worktree를 만들고
- 실패를 재현하고
- 문서 지시에 따라 직접 고쳐봅니다.

**끝나면 남길 것**
- 재현 명령
- 수정 파일
- 통과한 테스트

**완료 조건**
- 이미 정답이 있는 작은 사례 1개를 스스로 복원하면 끝입니다.

---

### Step 7 — 테스트를 먼저 읽는 습관을 만든다
**왜 별도 단계로 두는가**
- 초보자는 보통 코드부터 읽습니다.
- 하지만 Swift 컴파일러 기여에서는 **테스트가 명세**인 경우가 많습니다.

**읽기**
- Step 6 사례 문서 재복습
- 공식: <https://github.com/swiftlang/swift/blob/main/docs/Testing.md>

**해야 할 일**
- Step 6에서 사용한 테스트를 line-by-line로 읽고,
- 그 테스트가 정확히 무엇을 보장하는지 적습니다.

**끝나면 남길 것**
- “이 테스트는 무엇을 깨지 않게 막는가?” 3줄

**완료 조건**
- 테스트를 보고 수정 의도를 역으로 설명할 수 있으면 끝입니다.

---

### Step 8 — diagnostics/fix-it 문제의 전형을 익힌다
**읽기**
- [../good-first-issues/cards/01-static-member-instance-diagnostic.md](../good-first-issues/cards/01-static-member-instance-diagnostic.md)
- [../good-first-issues/cards/03-opaque-property-fixit.md](../good-first-issues/cards/03-opaque-property-fixit.md)
- [../good-first-issues/cards/06-dynamicmemberlookup-fixits.md](../good-first-issues/cards/06-dynamicmemberlookup-fixits.md)

**왜 이 셋인가**
- wording 개선
- fix-it 추가
- attribute validation
이라는 초보자 첫 기여의 대표 유형 3개이기 때문입니다.

**해야 할 일**
- 세 카드 각각에 대해
  - 최소 재현
  - 첫 진입 파일 후보
  - 첫 테스트 후보
  를 적습니다.

**완료 조건**
- diagnostics/fix-it 문제를 봤을 때 “어떤 종류의 문제인지” 이름 붙일 수 있으면 끝입니다.

---

## 이제 실제 open issue로 들어간다

### Step 9 — open issue를 하나만 고른다
**규칙**
- 절대로 여러 개를 동시에 고르지 않습니다.
- 첫 기여 목표라면 아래 중 하나만 고릅니다.
  - wording 개선
  - note 추가
  - fix-it 추가
  - duplicate diagnostics suppression

**추천 시작점**
- [../06-good-first-issues-swift-6.0-6.3.md](../06-good-first-issues-swift-6.0-6.3.md)
- [../good-first-issues/README.md](../good-first-issues/README.md)

**완료 조건**
- 내가 이번에 파고들 issue 1개를 확정하면 끝입니다.

---

### Step 10 — 워크북으로 issue를 해부한다
**읽기**
- [../07-open-issue-analysis-workbook.md](../07-open-issue-analysis-workbook.md)
- [../open-issue-templates/analysis-template.md](../open-issue-templates/analysis-template.md)

**해야 할 일**
- 선택한 issue 1개에 대해 아래를 적습니다.
  - 최소 재현 코드
  - 예상 단계
  - 첫 진입 파일 후보 3개
  - 첫 테스트 후보 3개
  - 예상 수정 유형 1개

**완료 조건**
- issue를 읽고 막막해하지 않고, 첫 탐색 계획을 적을 수 있으면 끝입니다.

---

### Step 11 — 테스트를 먼저 만들거나 기존 테스트에 붙인다
**왜 중요한가**
- Swift 컴파일러 기여는 “코드를 고쳤다”보다 **테스트로 증명했다**가 더 중요합니다.

**해야 할 일**
- 기존 테스트 파일에 붙일지,
- 새 테스트 파일을 만들지,
- 어떤 체크를 넣을지 결정합니다.

**완료 조건**
- “이 변경을 검증하는 가장 좁은 테스트”를 1개 말할 수 있으면 끝입니다.

---

### Step 12 — 작은 로컬 수정, 좁은 검증, 인접 회귀 확인
**해야 할 일**
1. 작은 수정 1개
2. 가장 좁은 테스트 1개 통과
3. 인접 테스트 몇 개 더 통과
4. 불필요한 범위 확장 금지

**읽기**
- [../04-stage-modification-workflow.md](../04-stage-modification-workflow.md)
- 공식: <https://github.com/swiftlang/swift/blob/main/CONTRIBUTING.md>

**끝나면 남길 것**
- 수정 파일
- 테스트 명령
- 왜 이 범위만 바꿨는지

**완료 조건**
- “작은 수정 1개를 테스트와 함께 설명”할 수 있으면, 이미 첫 기여 직전입니다.

---

### Step 13 — PR 전 체크리스트
**반드시 확인할 것**
- 재현 코드가 작다
- 테스트가 있다
- 변경 범위가 작다
- 설명이 diagnostics/fix-it 목적에 맞다
- 인접 테스트도 최소한 확인했다

**공식 읽기**
- <https://github.com/swiftlang/swift/blob/main/CONTRIBUTING.md>

**완료 조건**
- 내가 왜 이 변경을 했고, 어떻게 검증했는지 10줄 이내로 설명 가능

---

## 이 순서가 최적인 이유

이 순서는 아래 원칙에 따라 짰습니다.

1. **빌드/테스트 루프가 먼저**
   - 루프가 없으면 모든 학습이 구경이 됩니다.
2. **출력 관찰이 코드 읽기보다 먼저**
   - AST / SIL / IR를 먼저 보면 소스 읽기가 훨씬 빨라집니다.
3. **단계 추정이 상세 internals보다 먼저**
   - 첫 기여에서 가장 중요한 것은 정확한 진입점 추정입니다.
4. **merged 사례가 open issue보다 먼저**
   - 정답이 있는 작은 사례로 사고 루프를 먼저 익혀야 합니다.
5. **diagnostics/fix-it이 optimizer보다 먼저**
   - 첫 기여 성공 확률과 검증 선명도가 가장 높기 때문입니다.
6. **테스트가 코드보다 먼저**
   - 컴파일러 기여에서는 테스트가 명세인 경우가 많습니다.

즉, 이 코스는 “넓게 아는 순서”가 아니라 **처음 기여 성공 확률이 가장 높은 순서**입니다.

---

## 딱 하나만 기억할 것

Swift를 이미 아는 초보자가 Swift 컴파일러에 처음 기여하려면,
처음부터 SIL/optimizer를 파는 것이 아니라

**빌드 → 테스트 → 관찰 → 단계 추정 → 작은 diagnostics 사례 복원 → open issue 1개 분석 → 작은 수정 + 테스트**

이 순서로 가야 합니다.

이 코스는 바로 그 순서를 고정한 문서입니다.
