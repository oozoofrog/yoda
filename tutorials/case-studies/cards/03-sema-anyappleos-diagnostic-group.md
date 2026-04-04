# 카드 03 — `UseAnyAppleOSAvailability` 진단 그룹 도입

> **단계**: Sema / Availability
> **난이도**: 하
> **예상 시간**: 30분
> **출처**: pr
> **anchor**: [PR #87935](https://github.com/swiftlang/swift/pull/87935)
> **fix commit**: `1f26971a8818`
> **parent commit**: `ce2de43ecbb5`
> **관련 full tutorial**: [01-sema-fixit-source-locs.md](../01-sema-fixit-source-locs.md)

---

## 한눈에 보기

이 사례는 “기능 추가”가 아니라 “진단을 어떤 조건에서 켤 것인가”를 다룹니다. 단순 경고 추가보다 정책적 선택이 더 중요할 수 있음을 배웁니다.

---

## 문제 맥락

PR은 `anyAppleOS`를 사용할 수 있는 선언을 opt-in 그룹으로 진단하게 만듭니다. 즉, 기술적으로 가능한 진단을 바로 상시 경고로 만들지 않고, 사용자 migration 부담과 정책을 함께 고려한 사례입니다.

---

## 핵심 파일과 테스트

### 파일
- `include/swift/AST/DiagnosticGroups.def`
- `include/swift/AST/DiagnosticsSema.def`
- `lib/Sema/TypeCheckAttr.cpp`

### 테스트
- `test/Availability/availability_suggest_any_apple_os.swift`

---

## 재현 시작점

```bash
utils/run-test --build-dir $BUILD test/Availability/availability_suggest_any_apple_os.swift
```

### 무엇을 관찰할까

새 진단 그룹이 어디 등록되는지, 실제 진단 로직은 기존 availability 경로에 어떻게 연결되는지 확인합니다.

---

## 어디서부터 읽을까

`DiagnosticGroups.def` → `DiagnosticsSema.def` → `TypeCheckAttr.cpp` 순서가 가장 학습 효율이 좋습니다.

---

## 이 카드로 배우는 것

- opt-in diagnostic group
- availability migration
- diagnostic policy

---

## 메타데이터 메모

- `review_signal`: medium
- `reproduction_quality`: high
- 이 카드는 짧은 탐색용 자료입니다. 깊게 실습하려면 관련 full tutorial 또는 parent commit worktree 실습으로 넘어가세요.
