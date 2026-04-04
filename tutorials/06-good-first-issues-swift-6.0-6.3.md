# Swift 6.0 ~ 6.3 Good First Issue 학습 코스

> **대상**: 실제 Swift 컴파일러 이슈를 직접 잡아보며 배움의 폭을 넓히고 싶은 학습자
> **목표**: Swift 6.0 ~ 6.3 구간의 `good first issue`를 난이도와 주제별로 정리하고, 단계적 학습 코스로 소비할 수 있게 만들기
> **전제**: [01-build-environment-lab.md](01-build-environment-lab.md), [04-stage-modification-workflow.md](04-stage-modification-workflow.md)를 마친 상태 권장

---

## 빠른 시작

이 문서는 “당장 어떤 이슈를 읽고 직접 시도해볼지”를 정하는 코스 가이드입니다.

추천 사용법:

1. 아래 버전별 목록에서 **한 버전당 1개만** 고릅니다.
2. diagnostics/fix-it 계열부터 시작합니다.
3. 실제 작업 전에는 항상 아래를 먼저 적습니다.

```md
- 왜 이 이슈가 good first issue라고 생각하는가?
- 나는 어느 단계(Sema / SIL / IRGen / tooling) 문제라고 추정하는가?
- 첫 번째로 열 파일은 어디라고 생각하는가?
- 좁은 재현 명령은 무엇인가?
```

---

## 왜 버전별 good first issue를 코스에 넣는가

이미 merge된 사례는 “좋은 정답지”를 줍니다. 반면 `good first issue`는 다음을 줍니다.

- 아직 풀리지 않은 실제 문제
- 구현자가 스스로 탐색해야 하는 여지
- 최신 컴파일러의 언어/진단 경향
- 실제 기여로 이어질 수 있는 과제

즉, merged 사례가 **모델 해설서**라면, good first issue는 **실전 연습장**입니다.

---

## 코스 사용 원칙

### 1. 한 번에 1개만
사례가 많아도 세션당 한 이슈만 다룹니다.

### 2. diagnostics/fix-it부터 시작
처음에는
- 재현이 짧고
- 수정 범위가 비교적 작고
- 결과가 눈에 잘 보이는
이슈부터 시작합니다.

### 3. 해결보다 분석 로그를 남긴다
당장 고치지 못해도 괜찮습니다.
이 문서의 목적은 “문제를 푸는 법을 배우는 것”입니다.

---

## Swift 6.0 트랙

### 6.0-A — 정적 멤버 접근 에러 메시지 개선
- 이슈: [#48759](https://github.com/swiftlang/swift/issues/48759)
- 제목: *Misleading error for unqualified use of static variable in method*
- 라벨: `good first issue`, `diagnostics quality`, `type checker`, `swift 6.0`
- 재현 코드:
  ```swift
  struct HasStatic {
      func foo() {
          print(cvar)
      }
      static let cvar = 123
  }
  ```
- 기대 학습:
  - unqualified lookup과 static member diagnosis 연결
  - fix-it는 맞아도 메시지가 부족할 수 있다는 감각
- 추천 이유:
  - 증상이 짧고 명확함
  - 진단 문구 개선형 문제라 첫 이슈로 적합

### 6.0-B — `any P!` 진단 정리
- 이슈: [#72662](https://github.com/swiftlang/swift/issues/72662)
- 제목: *Bad diagnostic for `any P!`*
- 라벨: `good first issue`, `diagnostics quality`, `fix-its`, `existentials`, `swift 6.0`
- 핵심 문제:
  - 한 줄 코드에 중복/혼란스러운 진단이 나온다.
  - 기대 동작은 하나의 더 정확한 진단과 올바른 spelling 제안이다.
- 추천 이유:
  - existential / optional parsing과 TypeResolver 경계를 학습하기 좋다.
  - fix-it과 진단 중복 제거를 함께 생각하게 만든다.

### 6.0-C — opaque property inferred type fix-it
- 이슈: [#69241](https://github.com/swiftlang/swift/issues/69241)
- 제목: *Missing fix-it when opaque property type is inferred*
- 라벨: `good first issue`, `diagnostics quality`, `fix-its`, `opaque types`, `swift 6.0`
- 재현 코드:
  ```swift
  protocol Proto {}
  struct Concrete: Proto {}
  func getProto() -> some Proto { Concrete() }

  let value = getProto() // error
  ```
- 기대 학습:
  - opaque result type 관련 진단이 왜 explicit annotation을 요구하는지
  - fix-it 삽입형 진단 추가 흐름
- 추천 이유:
  - modern language feature(`some`)와 fix-it을 같이 배울 수 있다.

---

## Swift 6.1 트랙

### 6.1-A — `static nonmutating` 진단 개선
- 이슈: [#77835](https://github.com/swiftlang/swift/issues/77835)
- 제목: *Diagnostic for `static nonmutating` should be improved*
- 라벨: `good first issue`, `diagnostics quality`, `type checker`, `swift 6.1`
- 재현 코드:
  ```swift
  struct S {
    nonmutating static func foo() {}
  }
  ```
- 핵심 질문:
  - 현재 에러 메시지는 왜 혼란스러운가?
  - modifier 두 개를 함께 언급해야 하는가, 특정 modifier만 지적해야 하는가?
- 추천 이유:
  - 6.1 라벨의 대표적인 diagnostics QoI 사례
  - declaration grammar를 진단 텍스트에 어떻게 반영할지 고민하게 함

> 현재 조사 기준으로 `swift 6.1` + `good first issue` 라벨이 붙은 open issue는 이 사례가 가장 대표적입니다.

---

## Swift 6.2 트랙

### 6.2-A — memberwise init 공개성 진단 개선
- 이슈: [#78362](https://github.com/swiftlang/swift/issues/78362)
- 제목: *Bad diagnostic about memberwise `init` not being public*
- 라벨: `good first issue`, `diagnostics quality`, `fix-its`, `memberwise init`, `swift 6.2`
- 재현 코드:
  ```swift
  public struct Number: RawRepresentable {
    public let rawValue: Int
  }
  ```
- 핵심 문제:
  - implicit memberwise initializer를 public으로 만들 수 없는데, 진단은 그걸 요구하는 것처럼 보임
- 추천 이유:
  - conformance + access control + fix-it을 한 번에 묶어서 배울 수 있음

### 6.2-B — `@dynamicMemberLookup` 누락 구현 fix-it
- 이슈: [#83344](https://github.com/swiftlang/swift/issues/83344)
- 제목: *Missing fixits for missing @dynamicMemberLookup impl*
- 라벨: `good first issue`, `diagnostics quality`, `fix-its`, `attributes`, `swift 6.2`
- 재현 코드:
  ```swift
  @dynamicMemberLookup
  struct Test {}
  ```
- 기대 학습:
  - attribute validation과 fix-it 설계
  - required witness-like member를 생성/제안하는 진단 UX
- 추천 이유:
  - 재현이 짧고 attribute-driven diagnostics를 배우기 좋다.

### 6.2-C — existential method 사용 제한 이유 note 추가
- 이슈: [#76320](https://github.com/swiftlang/swift/issues/76320)
- 제목: *Offer additional note for why method with Self reference cannot be used on `any SomeType`*
- 라벨: `good first issue`, `diagnostics quality`, `type checker`, `existentials`, `swift 6.2`
- 핵심 문제:
  - 현재 에러는 막아야 하는 이유는 맞지만, 왜 안 되는지 사용자가 이해하기 어렵다.
- 추천 이유:
  - existential, `Self` requirements, 추가 note 설계까지 배우게 한다.

---

## Swift 6.3 트랙

### 6.3-A — escaping closure가 `inout`를 캡처할 때 fix-it 추가
- 이슈: [#87830](https://github.com/swiftlang/swift/issues/87830)
- 제목: *No fix-it for escaping closure captures 'inout' parameter*
- 라벨: `good first issue`, `diagnostics quality`, `fix-its`, `SIL`, `closures`, `swift 6.3`
- 재현 코드:
  ```swift
  func bar(_: @escaping () -> Void) {}
  func foo(_ i: inout Int) {
    bar {
      _ = i
    }
  }
  ```
- 기대 학습:
  - capture semantics와 진단/추가 note/fix-it 설계
- 추천 이유:
  - 사용자가 바로 체감 가능한 fix-it 이슈
  - closure capture semantics를 얕지만 실전적으로 배울 수 있음

### 6.3-B — computed property 중복 진단 제거
- 이슈: [#87322](https://github.com/swiftlang/swift/issues/87322)
- 제목: *Redundant error for missing type annotation in computed property*
- 라벨: `good first issue`, `diagnostics quality`, `type checker`, `swift 6.3`
- 핵심 문제:
  - 하나의 실수에 대해 중복 에러가 두 개 나온다.
- 추천 이유:
  - diagnostics deduplication / suppression 패턴을 배우기 좋다.

### 6.3-C — computed property type annotation fix-it 추가
- 이슈: [#87324](https://github.com/swiftlang/swift/issues/87324)
- 제목: *No fix-it for missing type annotation in computed property*
- 라벨: `good first issue`, `diagnostics quality`, `fix-its`, `swift 6.3`
- 핵심 문제:
  - 올바른 에러는 나오지만, 고치는 fix-it이 없다.
- 추천 이유:
  - 직전 6.3-B와 묶어서 “중복 제거 vs 자동 수정 제안”을 대비 학습할 수 있다.

### 6.3-D — redundant effect marker fix-it 추가
- 이슈: [#85882](https://github.com/swiftlang/swift/issues/85882)
- 제목: *Redundant effect warnings should have fixits*
- 라벨: `good first issue`, `diagnostics quality`, `fix-its`, `error handling`, `swift 6.3`
- 핵심 문제:
  - `try` / `unsafe`가 의미 없을 때 warning은 나오지만 제거 fix-it이 없다.
- 추천 이유:
  - warning + fix-it 조합을 연속적으로 학습하기 좋다.

### 6.3-E — inheritance clause의 global actor annotation 금지
- 이슈: [#86693](https://github.com/swiftlang/swift/issues/86693)
- 제목: *global actor annotations can be applied to inheritance clauses*
- 라벨: `good first issue`, `type checker`, `accepts invalid`, `concurrency`, `swift 6.3`
- 재현 코드:
  ```swift
  class Base {}
  class Derived: @MainActor Base {}
  ```
- 기대 학습:
  - “accepts invalid” 계열 버그를 어떻게 parser/type checker 경계에서 볼 것인가
- 추천 이유:
  - diagnostics 개선이 아니라 language rule enforcement를 경험할 수 있다.

---

## 권장 학습 순서

### 코스 A — diagnostics / fix-it 입문
1. 6.0-A `#48759`
2. 6.1-A `#77835`
3. 6.2-A `#78362`
4. 6.3-C `#87324`
5. 6.3-D `#85882`

### 코스 B — modern feature 진단
1. 6.0-C `#69241` (`some`)
2. 6.2-C `#76320` (`any` + Self)
3. 6.3-A `#87830` (`inout` capture)
4. 6.3-E `#86693` (global actor / inheritance clause)

### 코스 C — 한 문제를 두 축으로 보기
1. 6.3-B `#87322` — redundant diagnostic 제거
2. 6.3-C `#87324` — same surface area에 fix-it 추가

이 코스는 같은 증상 영역을 서로 다른 학습 축으로 나눠 보는 좋은 예입니다.

---

## 어떻게 이슈를 실제 학습으로 바꿀까

각 이슈에 대해 아래 5줄을 먼저 써보세요.

```md
- 재현 코드:
- 추정 단계:
- 첫 진입 파일 후보:
- 좁은 테스트 후보:
- 내가 기대하는 수정 유형(문구 / note / fix-it / suppression / rule enforcement):
```

이 기록이 쌓이면 open issue도 충분히 좋은 학습 자산이 됩니다.

---

## 이 문서를 yoda의 다른 자료와 연결하는 법

- diagnostics/fix-it형 이슈는 먼저 [01-sema-fixit-source-locs.md](case-studies/01-sema-fixit-source-locs.md)를 읽고 들어가면 좋습니다.
- 경계 문제는 [03-pipeline-entrypoints-and-knowledge-map.md](03-pipeline-entrypoints-and-knowledge-map.md)와 같이 보세요.
- 실제 수정 절차는 항상 [04-stage-modification-workflow.md](04-stage-modification-workflow.md)를 체크리스트로 사용하세요.

---

## 학습 설계 근거

- open issue는 “정답 없는 실전 문제”라서 transfer 학습에 좋습니다.
- 다만 인지 부하가 크므로, 이 문서는 version label과 증상 유형으로 먼저 좁혀 줍니다.
- diagnostics/fix-it부터 시작하게 한 이유는 재현이 빠르고 결과가 눈에 잘 보이기 때문입니다.
- 같은 surface area를 가진 이슈를 나란히 두어 interleaving과 contrastive learning을 유도했습니다.
- 관련 근거는 [00-curriculum-and-method.md](00-curriculum-and-method.md)를 참고하세요.
