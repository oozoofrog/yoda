# Swift 6.0 ~ 6.3 Good First Issue 학습 허브

> **대상**: 실제 open issue를 분석하고, 점진적으로 첫 기여까지 연결하고 싶은 학습자
> **목표**: Swift 6.0 ~ 6.3의 `good first issue`를 버전/증상/난이도 기준으로 탐색하고, 분석 워크북과 카드 라이브러리로 연결하기
> **전제**: [01-build-environment-lab.md](01-build-environment-lab.md), [04-stage-modification-workflow.md](04-stage-modification-workflow.md)를 끝낸 상태 권장

---

## 빠른 시작

1. [good-first-issues/README.md](good-first-issues/README.md)에서 카드 목록을 훑습니다.
2. 아래 버전별 추천 카드 중 하나를 고릅니다.
3. [07-open-issue-analysis-workbook.md](07-open-issue-analysis-workbook.md)을 열고 분석 로그를 시작합니다.

---

## 이 문서의 역할

이 문서는 긴 해설서가 아니라 **버전별 탐색 허브**입니다.

- 상세 이슈 설명 → `good-first-issues/cards/`
- 실제 분석 절차 → `07-open-issue-analysis-workbook.md`
- 장기 루프에 넣기 → `courses/30-day-diagnostics-track.md`

즉, 이 문서 하나만 읽고 끝내기보다 **다음 자료로 이동하기 위한 관문**으로 쓰세요.

---

## 버전별 추천 시작 카드

### Swift 6.0
| 카드 | 주제 | 추천 이유 |
|---|---|---|
| [#48759 정적 멤버 진단](good-first-issues/cards/01-static-member-instance-diagnostic.md) | static member diagnostics | 짧고 명확한 diagnostics 개선형 문제 |
| [#72662 `any P!` 진단](good-first-issues/cards/02-any-iuo-diagnostic.md) | existential + optional spelling | 진단 중복/정리 연습에 좋음 |
| [#69241 opaque property fix-it](good-first-issues/cards/03-opaque-property-fixit.md) | `some` + fix-it | modern language feature를 얕고 선명하게 다룸 |

### Swift 6.1
| 카드 | 주제 | 추천 이유 |
|---|---|---|
| [#77835 `static nonmutating` 진단](good-first-issues/cards/04-static-nonmutating-diagnostic.md) | attribute/modifier wording | 6.1 라벨의 대표 diagnostics QoI 사례 |

### Swift 6.2
| 카드 | 주제 | 추천 이유 |
|---|---|---|
| [#78362 memberwise init 공개성 진단](good-first-issues/cards/05-memberwise-init-public-diagnostic.md) | conformance + memberwise init | access control과 synthesis를 함께 볼 수 있음 |
| [#83344 `@dynamicMemberLookup` fix-it](good-first-issues/cards/06-dynamicmemberlookup-fixits.md) | attribute validation | 재현이 짧고 fix-it 설계가 선명함 |
| [#76320 existential Self note](good-first-issues/cards/07-existential-self-note.md) | existential diagnostics | 왜 안 되는지 설명하는 note 설계 훈련 |

### Swift 6.3
| 카드 | 주제 | 추천 이유 |
|---|---|---|
| [#87830 `inout` capture fix-it](good-first-issues/cards/08-inout-capture-fixit.md) | closures + fix-it | 사용자 체감이 큰 진단 개선 사례 |
| [#87322 computed property 중복 진단](good-first-issues/cards/09-computed-property-redundant-diagnostic.md) | duplicate suppression | parse + sema 진단 경계 보기 좋음 |
| [#87324 computed property type fix-it](good-first-issues/cards/10-computed-property-type-fixit.md) | parse fix-it | 작은 범위로 시작하기 좋음 |
| [#85882 redundant effect fix-its](good-first-issues/cards/11-redundant-effect-fixits.md) | effect marker warnings | warning + fix-it 조합 학습용 |
| [#86693 global actor inheritance clause](good-first-issues/cards/12-global-actor-inheritance-clause.md) | accepts invalid | diagnostics가 아닌 rule enforcement 사례 |

---

## 추천 순서

### 가장 쉬운 시작 순서
1. [#48759](good-first-issues/cards/01-static-member-instance-diagnostic.md)
2. [#77835](good-first-issues/cards/04-static-nonmutating-diagnostic.md)
3. [#87324](good-first-issues/cards/10-computed-property-type-fixit.md)
4. [#85882](good-first-issues/cards/11-redundant-effect-fixits.md)

### modern language feature를 섞고 싶다면
1. [#69241](good-first-issues/cards/03-opaque-property-fixit.md)
2. [#76320](good-first-issues/cards/07-existential-self-note.md)
3. [#87830](good-first-issues/cards/08-inout-capture-fixit.md)
4. [#86693](good-first-issues/cards/12-global-actor-inheritance-clause.md)

### 같은 surface area를 대비해서 보고 싶다면
1. [#87322](good-first-issues/cards/09-computed-property-redundant-diagnostic.md)
2. [#87324](good-first-issues/cards/10-computed-property-type-fixit.md)

---

## open issue를 실제 학습으로 바꾸는 방법

이 문서에서 카드 하나를 골랐다면 바로 아래로 이동하세요.

- 분석 절차: [07-open-issue-analysis-workbook.md](07-open-issue-analysis-workbook.md)
- 카드 라이브러리: [good-first-issues/README.md](good-first-issues/README.md)
- 장기 코스: [courses/30-day-diagnostics-track.md](courses/30-day-diagnostics-track.md)

---

## 주의

open issue는 merged 사례와 다릅니다.

- 정답이 아직 없습니다.
- 이슈 설명 자체가 완전하지 않을 수 있습니다.
- 분석만으로 끝나는 세션도 충분히 가치가 있습니다.

따라서 목표는 “당장 고치기”보다 **재현, 단계 추정, 진입 파일 추정, 수정 유형 예측**을 반복하는 데 둡니다.
