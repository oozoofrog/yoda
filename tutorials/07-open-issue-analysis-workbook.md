# Open Issue 분석 워크북

> **대상**: merged 사례는 따라가 봤지만, open issue는 아직 막막한 학습자
> **목표**: open issue를 읽고 재현·단계 추정·진입 파일 후보·수정 유형 가설까지 스스로 정리할 수 있는 루프 만들기
> **전제**: [06-good-first-issues-swift-6.0-6.3.md](06-good-first-issues-swift-6.0-6.3.md)에서 관심 있는 이슈 하나를 고른 상태

> **핵심 코스 연결**: 이 문서는 [첫 기여 핵심 코스](courses/00-swift-compiler-first-contribution-track.md)의 **Step 10**에서 여는 보조 문서입니다. 처음에는 open issue를 해결하려 하지 말고, **탐색 계획을 쓰는 것**만 목표로 사용하세요.

---

## 빠른 시작

1. [good-first-issues/README.md](good-first-issues/README.md)에서 카드 하나를 고릅니다.
2. 아래 템플릿을 복사합니다.
3. 실제 코드를 실행하기 전에 먼저 **가설**부터 적습니다.

```md
- 이슈 번호:
- 재현 코드:
- 추정 단계:
- 첫 진입 파일 후보:
- 첫 재현 명령:
- 예상 수정 유형:
```

---

## 이 문서의 역할

이 워크북은 정답을 알려주는 문서가 아닙니다.

대신 아래를 훈련합니다.

- 문제를 짧게 재현하는 법
- 어느 단계에서 시작해야 하는지 추정하는 법
- 첫 진입 파일을 좁히는 법
- 막혔을 때도 학습 로그를 남기는 법

즉, 해결 여부와 관계없이 **학습이 남도록** 만드는 것이 목적입니다.

---

## 분석 루프

### 1단계 — 이슈를 읽고 재현 코드만 추출
먼저 prose를 다 읽기보다, 재현 코드와 기대 동작을 먼저 뽑습니다.

### 2단계 — 단계 추정
문제는 보통 아래 중 하나입니다.

- Parse
- Sema / diagnostics
- Sema / type checker
- SIL / diagnostics
- IRGen
- tooling / test infra

### 3단계 — 첫 진입 파일 후보 1~3개 선정
처음부터 너무 많이 고르지 마세요.
3개를 넘기면 이미 범위를 넓힌 것입니다.

### 4단계 — 첫 재현 명령 선택
항상 가장 좁은 명령부터 시작합니다.

- `swiftc file.swift`
- `swiftc -typecheck file.swift`
- `utils/run-test --build-dir $BUILD test/...`

### 5단계 — 수정 유형 가설 세우기
아래 중 무엇인지 먼저 고릅니다.

- wording 변경
- note 추가
- fix-it 추가
- fix-it 범위 수정
- 중복 진단 억제
- invalid code 거부
- rule enforcement

### 6단계 — 막힌 지점 기록
open issue는 막히는 것이 정상입니다.
막힌 이유를 적는 것이 학습입니다.

---

## 이슈 분류표

| 유형 | 대표 징후 | 자주 보는 파일 |
|---|---|---|
| diagnostics wording | 에러 메시지는 맞지만 설명이 부족 | `DiagnosticsSema.def`, `CSDiagnostics.cpp` |
| fix-it insertion | 에러는 나오지만 고치는 제안이 없음 | `Diagnostics*.def`, 관련 TypeCheck*.cpp |
| fix-it range | 고치는 텍스트/범위가 잘못됨 | source range 계산 코드 |
| duplicate diagnostics | 같은 문제에 에러가 두 개 이상 | parse + sema 경계 |
| accepts invalid | 잘못된 코드를 받아들임 | parser / type resolution / attr validation |
| note addition | 에러는 맞지만 이유가 불충분 | `Diagnostics*.def`, diagnostic builder |

---

## 첫 파일을 찾는 규칙

### 규칙 A — 진단 ID로 찾기
가능하면 issue 본문에 보이는 진단 ID를 검색합니다.

예:
```bash
rg "computed_property_missing_type|cannot_infer_type_for_pattern" \
  swift/include/swift/AST swift/lib
```

### 규칙 B — 에러 문구로 찾기
문구가 독특하면 문구 조각으로도 찾습니다.

### 규칙 C — feature 키워드로 찾기
- `@dynamicMemberLookup` → `TypeCheckAttr.cpp`
- `incorrect_optional_any` → `TypeCheckType.cpp`
- `effect_marker_on_single_value_stmt` → `TypeCheckEffects.cpp`

---

## 첫 재현 명령을 고르는 규칙

### diagnostics / fix-it형
가장 먼저 `swiftc sample.swift`

### parser / syntax형
가능하면 단일 파일 재현 후, 필요 시 parse 관련 테스트 찾기

### repo 테스트형
`utils/run-test --build-dir $BUILD test/...`

---

## 예시 1 — #48759 워크북 사용 예

- 이슈: static member를 인스턴스에서 쓸 때 진단이 오해를 부름
- 추정 단계: `Sema / diagnostics`
- 첫 진입 파일 후보:
  - `include/swift/AST/DiagnosticsSema.def`
  - `lib/Sema/CSDiagnostics.cpp`
- 첫 명령:
  ```bash
  cat > /tmp/gfi-48759.swift <<'SWIFT'
  struct HasStatic {
      func foo() { print(cvar) }
      static let cvar = 123
  }
  SWIFT
  swiftc /tmp/gfi-48759.swift
  ```
- 예상 수정 유형: wording + note refinement

이 예시는 “작은 진단 문구 개선”을 어떻게 접근하는지 보여줍니다.

---

## 예시 2 — #87830 워크북 사용 예

- 이슈: escaping closure가 `inout` parameter를 캡처할 때 추가 fix-it 필요
- 추정 단계: `Sema / closures + capture semantics`
- 첫 진입 파일 후보:
  - `include/swift/AST/DiagnosticsSIL.def`
  - `lib/SILOptimizer/Mandatory/DiagnoseInvalidEscapingCaptures.cpp`
- 첫 명령:
  ```bash
  cat > /tmp/gfi-87830.swift <<'SWIFT'
  func bar(_: @escaping () -> Void) {}
  func foo(_ i: inout Int) {
    bar { _ = i }
  }
  SWIFT
  swiftc /tmp/gfi-87830.swift
  ```
- 예상 수정 유형: note addition + fix-it insertion

이 예시는 “문제는 front-end처럼 보이지만 실제 진단은 SIL diagnostics 경로에 있을 수도 있다”는 점을 보여줍니다.

---

## 중단 기준

아래 중 하나면 멈추고 기록만 남겨도 됩니다.

- 30분 동안 단계 추정이 안 됨
- 첫 진입 파일 후보가 5개를 넘음
- 재현 코드 축소가 안 됨
- 에러는 재현되지만 어떤 테스트로 옮겨야 할지 감이 안 옴

이 경우는 실패가 아니라, **다음 학습 재료 확보**로 봅니다.

---

## 추천 템플릿

- 분석 템플릿: [open-issue-templates/analysis-template.md](open-issue-templates/analysis-template.md)
- 세션 로그 템플릿: [open-issue-templates/session-log-template.md](open-issue-templates/session-log-template.md)

---

## 학습 설계 근거

- open issue는 정답이 없기 때문에, 결과보다 **분석 과정 외현화**가 더 중요합니다.
- 이 워크북은 retrieval practice보다도 metacognitive debugging과 self-explanation을 강하게 유도합니다.
- 예시 2개를 넣은 이유는 “문서 읽기”가 아니라 “적용 방식”을 보여주기 위해서입니다.
- merged 사례를 먼저 해본 뒤 open issue로 넘어가는 순서는 worked example → independent transfer 구조를 따릅니다.
