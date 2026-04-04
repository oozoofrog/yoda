# 사례 카탈로그

이 디렉토리는 Swift 컴파일러의 **실제 merged fix**를 바탕으로 학습하는 사례 저장소입니다.

핵심 원칙은 단순합니다.

- 사례는 가능한 한 많이 축적한다.
- 하지만 한 세션에서는 1개 사례만 다룬다.
- 사례는 가능하면 **issue / PR / review / final diff**까지 연결한다.
- 최종 diff는 정답지가 아니라 **마지막 비교 자료**로 사용한다.

---

## 지금 바로 시작할 사례

| 상태 | 사례 | 단계 | 난이도 | anchor |
|---|---|---|---|---|
| 완료 | [01-sema-fixit-source-locs.md](01-sema-fixit-source-locs.md) | Sema / Diagnostics | 하 | PR [#88222](https://github.com/swiftlang/swift/pull/88222) |
| 완료 | [02-sil-location-explicitness.md](02-sil-location-explicitness.md) | SIL / DebugInfo | 중 | PR [#88166](https://github.com/swiftlang/swift/pull/88166) |
| 완료 | [03-irgen-fast-existential-casts.md](03-irgen-fast-existential-casts.md) | IRGen / Serialization | 중상 | PR [#88270](https://github.com/swiftlang/swift/pull/88270) 중 일부 |

---

## 왜 사례를 많이 쌓는가

컴파일러 학습은 한두 개 예시만으로는 전이가 잘 일어나지 않습니다.  
서브시스템이 다르고, 실패 방식이 다르고, 테스트 전략도 다르기 때문입니다.

그래서 이 카탈로그는 “엄선된 몇 개만 보여주기”보다

- 많은 사례를 수집하고
- 난이도와 단계별로 분류하고
- 한 번에 적은 양만 학습하도록 설계하는

방향을 택합니다.

---

## 추천 소비 방식

### 입문자
- Sema 1개
- DebugInfo/SIL 1개
- IRGen 1개

이 세 개를 한 번씩 경험한 뒤 다음 단계로 넘어갑니다.

### 중급
- 같은 단계에서 비슷한 사례를 2~3개 묶어서 비교합니다.
- 예: fix-it range / diagnostics / source loc 관련 사례 묶음

### 고급
- 하나의 큰 PR을 여러 하위 학습 단위로 쪼개 읽습니다.
- 예: PR #88270 같은 다중 커밋/다중 서브시스템 변경

---

## 사례 선정 기준

좋은 사례는 다음 특징을 가집니다.

1. parent commit에서 재현 가능
2. merged PR 또는 issue 맥락이 명확
3. 테스트가 작고 읽을 수 있음
4. 수정 포인트가 학습 가능한 크기
5. “왜 이렇게 고쳤는가”를 리뷰나 설명에서 복원 가능

---

## 다음 후보 사례 백로그

아래는 다음 단계에서 PR/issue 맥락을 붙여 튜토리얼화하기 좋은 후보들입니다.

| 우선순위 | 영역 | anchor | 학습 포인트 | 상태 |
|---|---|---|---|---|
| 높음 | Optimizer / SILCombine | PR [#88258](https://github.com/swiftlang/swift/pull/88258) | `cond_fail true` 단순화, 패스 분리, 관련 테스트 업데이트 | backlog |
| 높음 | Optimizer | PR [#88052](https://github.com/swiftlang/swift/pull/88052) | enum tag comparison 최적화, SIL 테스트 읽기 | backlog |
| 높음 | Sema / Availability | PR [#87935](https://github.com/swiftlang/swift/pull/87935) | anyAppleOS migration fix-it, diagnostics 설계 | backlog |
| 높음 | Sema / CSOptimizer | PR [#88188](https://github.com/swiftlang/swift/pull/88188) | operator erasure scoring, type checker heuristics | backlog |
| 중간 | Concurrency / tests | PR [#88231](https://github.com/swiftlang/swift/pull/88231) | regression test from bug report, 최소 재현의 가치 | backlog |
| 중간 | IRGen | PR [#86387](https://github.com/swiftlang/swift/pull/86387) | issue-driven IRGen 수정 사례 | backlog |
| 중간 | Sema / Diagnostics | PR [#87843](https://github.com/swiftlang/swift/pull/87843) | implicit decl availability diagnostics 개선 | backlog |
| 중간 | Diagnostics | PR [#87342](https://github.com/swiftlang/swift/pull/87342) | fix-it replacement 범위와 attribute 텍스트 치환 | backlog |
| 중간 | SILGen | commit `cb85ded480c` | top-level decl visitor에 pretty stack trace 추가 | candidate |
| 중간 | DebugInfo | commit `5f5b9112621` | debug info salvage 비활성화와 회귀 분석 | candidate |
| 중간 | Optimizer / SIL | commit `77f64398e58` | `SimplifyStructExtract` 적용 범위 확대 | candidate |
| 중간 | SIL / Utils | commit `7c8f61c3610` | `MemAccessUtils` assert 제거, 분석 유틸 디버깅 | candidate |
| 낮음 | IRGen | commit `6f3a4b04c3d` | `-save-irgen`, `-save-ir` 옵션 추가와 디버깅 UX | candidate |
| 낮음 | Tests / infra | PR [#87911](https://github.com/swiftlang/swift/pull/87911) | `update-checkout` 안정화, infra 사례 | candidate |
| 낮음 | C++ interop | PR [#88211](https://github.com/swiftlang/swift/pull/88211) | failing test triage, platform gating | candidate |

> `backlog`는 다음 튜토리얼화 대상, `candidate`는 더 조사 후 채택 여부를 결정할 대상을 뜻합니다.

---

## 사례 문서 템플릿

새 사례를 추가할 때는 [_case-template.md](_case-template.md)를 복사해 사용합니다.

반드시 포함해야 하는 요소:
- merged fix anchor
- parent commit
- 핵심 테스트
- 재현 명령
- 단계 분류 이유
- self-explanation 질문
- merged diff 비교 질문

---

## 다음 확장 방향

장기적으로는 사례를 아래 축으로도 분류합니다.

- 단계: Parse / Sema / SILGen / SIL / IRGen / DebugInfo / Demangling
- 난이도: 하 / 중 / 상
- 세션 길이: 30분 / 90분 / 반나절
- 학습 유형: regression-first / perf / diagnostics / source location / serialization / pass architecture

이 분류가 충분히 쌓이면 “주간 학습 코스”를 자동으로 조합할 수 있습니다.
