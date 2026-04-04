# 사례 1 — Sema fix-it source location 복원

> **단계**: Sema / Diagnostics
> **난이도**: 입문 사례
> **anchor PR**: [#88222](https://github.com/swiftlang/swift/pull/88222)
> **merged fix commit**: `a8e7b1a887e`
> **parent commit**: `dd03302d7b71dc2c60f87daa1f00eb632ed9ada2`
> **핵심 파일**: `lib/Sema/TypeCheckAttr.cpp`
> **핵심 테스트**: `test/Availability/availability_suggest_any_apple_os.swift`

---

## 이 사례를 왜 먼저 하는가

이 사례는 교육적으로 아주 좋습니다.

- 구현 파일 1개 + 테스트 파일 1개
- 버그 증상이 명확함: fix-it replacement 범위가 잘못됨
- 재현이 좁고 빠름
- front-end 진단과 source range 계산을 함께 배울 수 있음

즉, “컴파일러 이슈를 하나 직접 고친다”는 감각을 가장 적은 비용으로 줍니다.

---

## 학습 목표

이 사례가 끝나면 아래를 설명할 수 있어야 합니다.

- 테스트의 expected-warning/fix-it range가 무엇을 의미하는가
- 왜 이 문제가 `lib/Sema/TypeCheckAttr.cpp`에 있을 가능성이 큰가
- grouped availability attribute를 순회할 때 source range 계산이 왜 꼬일 수 있는가
- 단일 테스트로 front-end fix-it을 어떻게 검증하는가

### 함께 볼 카드

- [03-sema-anyappleos-diagnostic-group.md](cards/03-sema-anyappleos-diagnostic-group.md)
- [08-sema-nonisolated-unsafe-fixit-range.md](cards/08-sema-nonisolated-unsafe-fixit-range.md)

---

## 문제 맥락 (PR / issue)

PR [#88222](https://github.com/swiftlang/swift/pull/88222)는 `UseAnyAppleOSAvailability` fix-it이
실제로는 마지막 availability spec만 바꾸고 전체 spec을 바꾸지 못한다고 설명합니다.

핵심 맥락은 아주 실용적입니다.

- 컴파일러는 warning을 잘 내고 있었지만
- editor에서 apply 가능한 fix-it은 잘못된 source range를 가리키고 있었고
- 작성자는 이 문제를 **에디터에서 직접 적용해보다가** 발견했습니다.

즉, 이 사례는 “진단 메시지”와 “수정 제안의 적용 범위”가 서로 다른 품질 축이라는 점을 보여줍니다.

### 이 PR에서 특히 배울 점

- 구현은 작아도 사용자 체감은 큽니다.
- fix-it 버그는 대개 텍스트 치환 정책과 source range 계산 문제로 귀결됩니다.
- 리뷰 대화 자체는 짧았지만, PR 본문과 테스트 diff만으로도 충분히 좋은 학습 사례가 됩니다.

---

## 사전 회상 질문

1. warning 메시지와 fix-it replacement는 보통 어느 단계에서 만들어질까요?
2. source range 버그는 “로직 버그”와 어떻게 다를까요?
3. 왜 이런 종류의 버그는 editor에서 더 잘 드러날까요?

---

## 실습 준비

```bash
export ROOT=$PWD
export SWIFT_MAIN_REPO=$ROOT/swift
export CASE_ROOT=$ROOT/worktrees/sema-anyappleos-parent

mkdir -p "$ROOT/worktrees"
git -C "$SWIFT_MAIN_REPO" worktree add "$CASE_ROOT" dd03302d7b71dc2c60f87daa1f00eb632ed9ada2
cd "$CASE_ROOT"

utils/build-script \
  --skip-build-benchmarks \
  --swift-darwin-supported-archs "$(uname -m)" \
  --release-debuginfo \
  --swift-disable-dead-stripping

export BUILD=../build/Ninja-RelWithDebInfoAssert/swift-macosx-$(uname -m)
```

> 이 사례부터는 worktree마다 별도 build 디렉토리를 가지는 것을 전제로 합니다.

---

## 1단계 — 부모 커밋에서 실패 재현

```bash
utils/run-test --build-dir $BUILD test/Availability/availability_suggest_any_apple_os.swift
```

### 무엇을 볼 것인가
- expected-warning 자체보다 **fix-it replacement 범위**에 주목하세요.
- 테스트는 “마지막 availability spec만 교체되는 문제”를 드러냅니다.

### 관찰 기록 예시
- 증상: warning은 나오지만 replacement 범위가 앞에서부터 전체 spec을 덮지 못한다.
- 추정 단계: Sema/diagnostics

---

## 2단계 — 테스트에서 구현으로 역추적

먼저 테스트를 읽습니다.

```bash
sed -n '1,220p' test/Availability/availability_suggest_any_apple_os.swift
```

그 다음 구현 쪽을 찾습니다.

```bash
rg "availability_use_any_apple_os" lib/Sema include/swift
rg "suggestAnyAppleOSAvailability" lib/Sema
```

첫 진입 함수는 `suggestAnyAppleOSAvailability`입니다.

### self-explanation
- 왜 이 버그는 `TypeCheckAttr.cpp` 쪽에 있을 확률이 높을까요?
- 왜 parser가 아니라 semantic phase 버그라고 생각했나요?

---

## 3단계 — 핵심 원인 파악

merged fix를 보기 전에 먼저 직접 설명해 보세요.

이 사례의 핵심은:
- grouped availability attributes가 역순으로 열거되고
- replacement의 시작 위치를 `groupHead->getDomainLoc()`에 의존하면
- 실제로는 전체 spec이 아니라 마지막 spec 근처만 교체될 수 있다는 점입니다.

수정 방향 힌트:
- 그룹의 **실제 시작 위치**를 다시 계산해야 합니다.
- 단순 `SourceRange` 교체보다 문자 범위를 직접 교체하는 방식이 더 안전할 수 있습니다.

---

## 4단계 — 최소 수정 시도

먼저 아래 함수만 집중해서 보세요.

```bash
sed -n '5380,5515p' lib/Sema/TypeCheckAttr.cpp
```

학습자 과제:
- `groupStartLoc`가 왜 필요한지 직접 설명하기
- 왜 `groupEndLoc`만 계속 갱신해서는 부족한지 설명하기
- 왜 “역순 순회”가 여기서 중요한지 설명하기

---

## 5단계 — 좁은 검증

```bash
ninja -C $BUILD bin/swift-frontend
utils/run-test --build-dir $BUILD test/Availability/availability_suggest_any_apple_os.swift
```

### 추가 확인
가능하면 테스트 파일 안의 여러 케이스가 전부 통과하는지 봅니다.

- 일반 순서
- 역순
- weird order
- weird whitespace

이 사례는 “한 버그를 고쳤더니 주변 케이스도 맞아떨어지는가”를 보기 좋은 구조입니다.

---

## 6단계 — merged fix와 비교

이제서야 정답 패치를 봅니다.

```bash
git diff dd03302d7b71dc2c60f87daa1f00eb632ed9ada2..a8e7b1a887e -- \
  lib/Sema/TypeCheckAttr.cpp \
  test/Availability/availability_suggest_any_apple_os.swift
```

비교 질문:
- 나는 `groupStartLoc` 같은 개념을 떠올렸는가?
- 나는 `fixItReplaceChars` 같은 API 선택까지 생각했는가?
- 나는 테스트 범위를 얼마나 넓게 봤는가?

---

## 독립 전이 과제

다음 중 하나를 하세요.

1. 같은 테스트 파일에서 또 다른 fix-it 관련 기대치를 골라 어떤 함수가 만들지 추정하기
2. `test/Sema/`의 다른 진단 테스트 하나를 골라 구현 진입점을 찾기
3. 이 사례를 10줄짜리 “버그 분석 카드”로 요약하기

---

## 회고 질문

1. 나는 왜 이 문제가 range 계산 문제라고 판단했는가?
2. 처음에 너무 넓은 파일/디렉토리부터 열지는 않았는가?
3. 다음 진단 버그를 보면 어떤 검색어부터 칠 것인가?

---

## 학습 설계 근거

- 첫 사례를 Sema fix-it으로 둔 이유는 짧은 피드백 루프와 높은 가시성 때문입니다.
- 기존 테스트를 바로 재현하게 해, “실패를 손에 쥔다”는 감각을 먼저 줍니다.
- merged diff를 마지막에만 보게 해 productive struggle을 유지합니다.
- 같은 테스트 파일의 변형 케이스를 함께 보게 해 transfer를 유도합니다.
- 관련 연구 링크는 [../00-curriculum-and-method.md](../00-curriculum-and-method.md)를 참고하세요.
