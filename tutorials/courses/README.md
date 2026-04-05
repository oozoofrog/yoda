# 학습 코스

이 디렉토리는 `yoda/tutorials/`에 흩어진 문서들을 **실제 학습 순서**로 묶은 코스 문서를 모아둡니다.

현재 제공 코스:
- [30-day-diagnostics-track.md](30-day-diagnostics-track.md)
- [30-day-optimizer-track.md](30-day-optimizer-track.md)
- [30-day-compiler-core-track.md](30-day-compiler-core-track.md)
- [samples/README.md](samples/README.md)


## 인터랙티브 코스 보기

30일 코스는 `../../docs/`의 웹앱에서 **Day 체크 / mastery / review queue**와 함께 볼 수 있습니다.
정적 배포 기준이라 로그인 없이도 localStorage에 진행 상태가 저장됩니다.

```bash
cd yoda
python3 scripts/build_web_content.py
python3 -m http.server 8123 -d docs
```

---
원칙:
- 문서는 많아도 하루에 소비하는 양은 적게 유지합니다.
- merged 사례와 open issue를 섞어서 배웁니다.
- 매일 반드시 로그를 남깁니다.
