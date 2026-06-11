document.addEventListener('DOMContentLoaded', () => {

    /* ── 1. 로딩 애니메이션 (물결 파형) ── */
    let percent = 0;
    const loadingPage = document.getElementById('loading-page');
    const percentText = document.getElementById('loading-percent');
    const loaderCanvas = document.getElementById('loader-canvas');

    if (loaderCanvas) {
        const lctx = loaderCanvas.getContext('2d');
        const W = 160, H = 80;
        loaderCanvas.width  = W;
        loaderCanvas.height = H;

        let frame = 0;

        function drawWave(pct) {
            lctx.clearRect(0, 0, W, H);
            frame++;

            // 진행도에 따라 파형 개수·진폭 증가
            const waveCount  = 3;
            const maxVisible = pct / 100; // 0 ~ 1

            for (let w = 0; w < waveCount; w++) {
                const waveProgress = Math.max(0, Math.min(1,
                    (maxVisible - w * 0.28) / 0.45
                ));
                if (waveProgress <= 0) continue;

                const amp    = 15 * waveProgress;
                const freq   = 0.045;
                const speed  = 0.06 + w * 0.02;
                const offset = w * (W / waveCount);
                const alpha  = 0.25 + 0.55 * waveProgress - w * 0.08;

                lctx.beginPath();
                for (let x = 0; x <= W; x++) {
                    const y = H / 2
                        + Math.sin((x + frame * (speed * 60) + offset) * freq) * amp
                        + Math.sin((x * 0.7 + frame * (speed * 40) + offset) * freq * 1.4) * amp * 0.4;
                    x === 0 ? lctx.moveTo(x, y) : lctx.lineTo(x, y);
                }
                lctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
                lctx.lineWidth   = 2 - w * 0.4;
                lctx.lineCap     = 'round';
                lctx.stroke();
            }
        }

        function loopWave() {
            drawWave(percent);
            if (loadingPage && loadingPage.style.display !== 'none') {
                requestAnimationFrame(loopWave);
            }
        }
        loopWave();

        const loadingInterval = setInterval(() => {
            percent += 2;
            if (percent > 100) percent = 100;
            if (percentText) percentText.textContent = percent;
            if (percent >= 100) {
                clearInterval(loadingInterval);
                if (loadingPage) {
                    loadingPage.style.opacity = '0';
                    setTimeout(() => { loadingPage.style.display = 'none'; }, 800);
                }
            }
        }, 20);
    }


    /* ── 2. 잉크 번짐 커서 애니메이션 (Canvas) ── */
    const canvas = document.getElementById('cursor-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        class InkParticle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.size = Math.random() * 5 + 5;
                this.opacity = 0.01;
                this.vx = (Math.random() - 0.5) * 0.8;
                this.vy = (Math.random() - 0.5) * 0.8;
            }
            update() {
                this.size    += 1.2;
                this.x       += this.vx;
                this.y       += this.vy;
            }
            draw() {
                ctx.beginPath();
                const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
                grad.addColorStop(0, `rgba(17, 17, 17, ${this.opacity})`);
                grad.addColorStop(1, `rgba(17, 17, 17, 0)`);
                ctx.fillStyle = grad;
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
                if (particles[i].size > 80) {
                    particles.splice(i, 1);
                    i--;
                }
            }
            requestAnimationFrame(animate);
        }
        animate();

        window.addEventListener('mousemove', (e) => {
            for (let i = 0; i < 2; i++) {
                particles.push(new InkParticle(e.clientX, e.clientY));
            }
        });
    }
});

/* ============================
   MAIN JS
   ============================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. Header: intro 넘어가면 표시 ── */
  const header = document.getElementById('header');
  const introSection = document.getElementById('intro');

  const handleScroll = () => {
    const introHeight = introSection ? introSection.offsetHeight : window.innerHeight;
    if (window.scrollY > introHeight - 80) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll);
  handleScroll();


  /* ── 2. Works Index 클릭 → 해당 슬라이드로 스크롤 ── */
  document.querySelectorAll('.works-item[data-target]').forEach(item => {
    item.addEventListener('click', () => {
      const targetId = item.dataset.target;
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });


  /* ============================================================
      3. WORKS SLIDES (Swiper 느낌의 부드러운 스와이프 & 무한 루프)
      ============================================================ */
  const slideSections = document.querySelectorAll('.works-slide-section');
  let isMoving = false; // 팝업 방지용 변수

  slideSections.forEach(section => {
    const trackWrap = section.querySelector('.slide-track-wrap');
    const track = section.querySelector('.slide-track');
    if (!trackWrap || !track) return;

    // 1. 원본 카드 수집 및 복제 세팅 (무한 루프용)
    const originals = Array.from(track.querySelectorAll('.slide-card'));
    const total = originals.length;
    if (total === 0) return;

    track.innerHTML = '';
    const mkClone = c => {
      const cl = c.cloneNode(true);
      cl.setAttribute('aria-hidden', 'true');
      return cl;
    };

    // 왼쪽 빈 공간을 채우기 위해 앞뒤로 복제본 삽입
    originals.forEach(c => track.appendChild(mkClone(c))); // 앞쪽 복제
    originals.forEach(c => track.appendChild(c));          // 중앙 원본
    originals.forEach(c => track.appendChild(mkClone(c))); // 뒤쪽 복제

    const GAP = parseInt(getComputedStyle(track).gap) || 24;
    let currentIndex = total; // 첫 화면에 보일 인덱스 (원본의 첫 번째)
    
    // 드래그 위치 계산용 변수
    let startPos = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let isDragging = false;
    let autoTimer = null;

    // 카드 너비 계산 (반응형 대응)
    const getCardW = () => {
      const card = track.querySelector('.slide-card');
      return card ? card.offsetWidth + GAP : 304;
    };

    // 헤더 왼쪽 여백값을 offset으로 읽어서 translateX 기준점으로 사용
    const getOffset = () => {
      const header = section.querySelector('.slide-header');
      return header ? parseFloat(getComputedStyle(header).paddingLeft) || 150 : 150;
    };

    // 배너 섹션 카드 너비 동기화 (2개씩 보이도록)
    const syncBannerWidth = () => {
      if (section.id !== 'slide-banner') return;
      const offset = getOffset();
      const cardWidth = (window.innerWidth - offset - GAP) / 2;
      section.querySelectorAll('.slide-card').forEach(card => {
        card.style.width = cardWidth + 'px';
      });
    };

    const setPositionByIndex = () => {
      syncBannerWidth();
      const offset = getOffset();
      currentTranslate = currentIndex * -getCardW() + offset;
      prevTranslate = currentTranslate;
      track.style.transform = `translateX(${currentTranslate}px)`;
    };

    // 카운터 업데이트
    const updateCounter = () => {
      const counter = section.querySelector('.slide-counter');
      if (!counter) return;
      const displayIdx = (currentIndex % total) + 1;
      counter.textContent = `${String(displayIdx).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
    };

    // 2. 마우스 / 터치 드래그 이벤트 (핵심)
    const touchStart = (clientX) => {
      isDragging = true;
      isMoving = false; // 드래그 시작 시 이동 상태 초기화
      startPos = clientX;
      clearInterval(autoTimer); // 드래그 중 자동재생 정지
      track.style.transition = 'none'; // 드래그할 땐 애니메이션 없이 즉각 반응
      trackWrap.style.cursor = 'grabbing';
    };

    const touchMove = (clientX) => {
      if (!isDragging) return;
      const diff = clientX - startPos;
      
      // 5px 이상 드래그 시 클릭(팝업) 방지
      if (Math.abs(diff) > 5) isMoving = true; 
      
      // 마우스를 끄는 만큼 실시간으로 슬라이드 이동
      currentTranslate = prevTranslate + diff;
      track.style.transform = `translateX(${currentTranslate}px)`;
    };

    const touchEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      trackWrap.style.cursor = 'grab';

      // 드래그한 거리를 바탕으로 다음/이전 카드로 넘어갈지 결정 (민감도 40px)
      const movedBy = currentTranslate - prevTranslate;
      if (movedBy < -40) currentIndex++;
      else if (movedBy > 40) currentIndex--;

      // 영상처럼 부드럽게 위치로 미끄러지는 애니메이션 적용
      track.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
      setPositionByIndex();
      
      startAuto(); // 자동재생 재시작
      setTimeout(() => { isMoving = false; }, 50); // 클릭 이벤트 실행 방지 딜레이
    };

    // 3. 끊김 없는 무한 루프 트릭 (애니메이션이 끝난 직후 실행)
    track.addEventListener('transitionend', (e) => {
      // 오버레이 호버 등 다른 transitionend 이벤트 무시
      if (e.target !== track) return; 

      if (currentIndex >= total * 2) {
        // 오른쪽 끝(복제본)으로 갔을 때 몰래 원본 위치로 점프
        track.style.transition = 'none';
        currentIndex = currentIndex - total;
        setPositionByIndex();
      } else if (currentIndex < total) {
        // 왼쪽 끝(복제본)으로 갔을 때 몰래 원본 위치로 점프
        track.style.transition = 'none';
        currentIndex = currentIndex + total;
        setPositionByIndex();
      }
      updateCounter();
    });

    // 4. 자동 슬라이드 로직
    const nextSlide = () => {
      currentIndex++;
      track.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
      setPositionByIndex();
    };

    const startAuto = () => {
      clearInterval(autoTimer);
      autoTimer = setInterval(nextSlide, 3000); // 3초 간격
    };

    // PC 마우스 이벤트 연결
    trackWrap.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault(); // 기본 이미지 드래그 고스트 현상 방지
      touchStart(e.clientX);
    });
    window.addEventListener('mousemove', (e) => touchMove(e.clientX));
    window.addEventListener('mouseup', touchEnd);
    window.addEventListener('mouseleave', touchEnd); // 영역 밖으로 나가도 드래그 해제

    // 모바일 터치 이벤트 연결
    trackWrap.addEventListener('touchstart', (e) => touchStart(e.touches[0].clientX), { passive: true });
    window.addEventListener('touchmove', (e) => touchMove(e.touches[0].clientX), { passive: true });
    window.addEventListener('touchend', touchEnd);

    // 최초 화면 세팅
    track.style.transition = 'none';
    setPositionByIndex();
    updateCounter();
    startAuto();

    // 화면 크기 변경 시 padding-left 재동기화
    window.addEventListener('resize', () => {
      track.style.transition = 'none';
      setPositionByIndex();
    });
  });

  /* ── 4. 팝업 데이터 ── */
  const popupData = {
    'web-01': {
      tags: ['WEB', 'UI'],
      title: 'Project info',
      subTitle: 'Inscent Redesign',
      overview: '향수 브랜드 인센트의 기존 웹사이트를 리디자인한 프로젝트입니다. 브랜드의 감성을 살리면서도 사용자 경험을 개선하는 방향으로 작업했습니다.',
      intent: '따뜻한 베이지와 딥 버건디 톤을 사용해 브랜드 아이덴티티를 강화했습니다. 상단 비주얼에서 제품의 분위기를 먼저 전달하고, 스크롤에 따라 자연스럽게 정보가 펼쳐지는 구조를 설계했습니다.',
      imgSrc: 'imgs/29cm.jpg'
    },
    "web-01-process": {
      title: "INSCENT - DESIGN PROCESS",
      subTitle: "UI/UX PLANNING & BRANDING",
      tags: ["기획", "프로토타입", "그리드 시스템"],
      overview: "인센트 리디자인 프로젝트의 진행 과정(Process)입니다.",
      intent: "사용자 경험 분석을 바탕으로 정보 구조(IA)를 재설계하고 와이어프레임을 도출했습니다.",
      imgSrc: 'imgs/29cm-process.jpg'
    },
    'web-02': {
      tags: ['WEB', 'UI'],
      title: 'Project info',
      subTitle: 'Bakeup Redesign',
      overview: '베이커리 브랜드 베이컵의 웹사이트를 리디자인한 프로젝트입니다.',
      intent: '따뜻한 식욕을 자극하는 컬러와 레이아웃으로 브랜드의 감성을 웹에 담았습니다.',
      imgSrc: 'imgs/nikon.jpg'
    },
    "web-02-process": {
      title: "INSCENT - DESIGN PROCESS",
      subTitle: "UI/UX PLANNING & BRANDING",
      tags: ["기획", "프로토타입", "그리드 시스템"],
      overview: "인센트 리디자인 프로젝트의 진행 과정(Process)입니다.",
      intent: "사용자 경험 분석을 바탕으로 정보 구조(IA)를 재설계하고 와이어프레임을 도출했습니다.",
      imgSrc: 'imgs/nikon-process.jpg'
    },
    'web-03': {
      tags: ['WEB', 'UI'],
      title: 'Project info',
      subTitle: 'Tambourins Redesign',
      overview: '코스메틱 브랜드 탐부린즈 웹사이트를 리디자인한 프로젝트입니다.',
      intent: '미니멀하고 세련된 톤으로 브랜드의 프리미엄 이미지를 강조했습니다.',
      imgSrc: 'imgs/duover.jpg'
    },
    "web-03-process": {
      title: "INSCENT - DESIGN PROCESS",
      subTitle: "UI/UX PLANNING & BRANDING",
      tags: ["기획", "프로토타입", "그리드 시스템"],
      overview: "인센트 리디자인 프로젝트의 진행 과정(Process)입니다.",
      intent: "사용자 경험 분석을 바탕으로 정보 구조(IA)를 재설계하고 와이어프레임을 도출했습니다.",
      imgSrc: 'imgs/duover-process.jpg'
    },
    'web-04': {
      tags: ['WEB', 'UI'],
      title: 'Project info',
      subTitle: 'Tambourins Redesign',
      overview: '코스메틱 브랜드 탐부린즈 웹사이트를 리디자인한 프로젝트입니다.',
      intent: '미니멀하고 세련된 톤으로 브랜드의 프리미엄 이미지를 강조했습니다.',
      imgSrc: 'imgs/cosrx-cover.png'
    },
    "web-04-process": {
      title: "INSCENT - DESIGN PROCESS",
      subTitle: "UI/UX PLANNING & BRANDING",
      tags: ["기획", "프로토타입", "그리드 시스템"],
      overview: "인센트 리디자인 프로젝트의 진행 과정(Process)입니다.",
      intent: "사용자 경험 분석을 바탕으로 정보 구조(IA)를 재설계하고 와이어프레임을 도출했습니다.",
      imgSrc: 'imgs/cosrx-process.jpg'
    },
    'brand-01': {
      tags: ['BRANDING', 'DESIGN'],
      title: 'Project info',
      subTitle: 'Brand Identity A',
      overview: '브랜드 아이덴티티 디자인 프로젝트입니다.',
      intent: '로고, 컬러, 타이포그래피 시스템을 일관되게 구축했습니다.',
      imgSrc: 'imgs/29cm-process.jpg'
    },
    'brand-02': {
      tags: ['BRANDING'],
      title: 'Project info',
      subTitle: 'Brand Identity B',
      overview: '브랜드 로고 및 컬러 시스템을 구성했습니다.',
      intent: '브랜드의 핵심 가치를 시각적으로 표현하는 방향으로 작업했습니다.',
      imgSrc: 'imgs/29cm-process.jpg'
    },
    'banner-01': {
      tags: ['SEASON', 'PROMOTION'],
      title: 'Project info',
      subTitle: 'Black Friday 70% Off 3D',
      overview: '입체적인 핑크 3D 타이포로 할인율을 강하게 부각했습니다. 어두운 배경으로 행사 시즌의 화려함을 표현했습니다.',
      intent: '시선을 단번에 사로잡는 강렬한 비주얼과 명확한 정보 전달을 목표로 했습니다.',
      imgSrc: 'imgs/29cm-process.jpg'
    },
    'banner-02': {
      tags: ['SEASON'],
      title: 'Project info',
      subTitle: 'Season Sale Banner',
      overview: '시즌 세일 프로모션 배너 디자인입니다.',
      intent: '시즌감을 살리면서 간결한 정보 구조를 유지했습니다.',
      imgSrc: 'imgs/29cm-process.jpg'
    },
    'banner-03': {
      tags: ['LAUNCH'],
      title: 'Project info',
      subTitle: 'Launch Banner',
      overview: '신제품 런칭 배너 디자인입니다.',
      intent: '신선함과 기대감을 자극하는 비주얼로 구성했습니다.',
      imgSrc: 'imgs/29cm-process.jpg'
    },
    'detail-01': {
      tags: ['DETAIL PAGE', 'DESIGN'],
      title: 'Project info',
      subTitle: 'Comfort Chair 80 Detail',
      overview: '사용 이유와 구조를 중심으로 편안함을 설명하는 오피스 체어 상세 페이지입니다.',
      intent: '따뜻한 베이지와 라이트 그레이 톤을 사용해 편안한 분위기를 만들었습니다. 상단의 인테리어 컷과 함께 Why 섹션을 두어 이 의자를 선택해야 하는 이유를 아이콘과 짧은 카피로 먼저 요약했습니다.',
      imgSrc: 'imgs/detail-1.jpg'
    },
    'detail-02': {
      tags: ['DETAIL PAGE', 'DESIGN'],
      title: 'Project info',
      subTitle: 'Cosmetic Detail',
      overview: '코스메틱 제품 상세 페이지 디자인입니다.',
      intent: '클린한 화이트 베이스에 제품 특성을 강조하는 비주얼 구성을 했습니다.',
      imgSrc: 'imgs/29cm-process.jpg'
    },
    'detail-03': {
      tags: ['DETAIL PAGE', 'DESIGN'],
      title: 'Project info',
      subTitle: 'Headphone Detail',
      overview: '헤드폰 제품 상세 페이지 디자인입니다.',
      intent: '제품의 기술적 특성과 감성적 경험을 동시에 전달하는 레이아웃을 구성했습니다.',
      imgSrc: 'imgs/29cm-process.jpg'
    },
  };


  /* ── 5. 팝업 열기/닫기 ── */
  const overlay = document.getElementById('popup-overlay');
  const popupClose = document.getElementById('popup-close');

const openPopup = (key) => {
  const data = popupData[key];
  if (!data) return;

  const tagsEl = document.getElementById('popup-tags');
  tagsEl.innerHTML = data.tags.map(t => `<span class="popup-tag">${t}</span>`).join('');

  document.getElementById('popup-title').textContent = data.title;
  document.getElementById('popup-sub-title').textContent = data.subTitle;
  document.getElementById('popup-overview').textContent = data.overview;
  document.getElementById('popup-intent').textContent = data.intent;

  // 이미지 처리
  const imgEl = document.getElementById('popup-main-img');
  const imgWrap = document.getElementById('popup-img');
  if (imgEl) {
    if (data.imgSrc) {
      imgEl.src = data.imgSrc;
      imgEl.alt = data.subTitle || '';
      imgEl.style.display = 'block';
      if (imgWrap) imgWrap.style.display = 'block';
    } else {
      imgEl.src = '';
      imgEl.style.display = 'none';
      if (imgWrap) imgWrap.style.display = 'none';
    }
  }

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
};

  // 팝업 닫기 함수
  const closePopup = () => {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  };


  // [전체 클릭 이벤트 리스너] 
  document.addEventListener('click', (e) => {
    // 슬라이드 드래그 중(isMoving이 true)일 때는 클릭이 무시되도록 설정
    if (isMoving) return;

    // 1. SHOW DESIGN 버튼(.btn-design)을 클릭했을 때
    const designBtn = e.target.closest('.btn-design');
    if (designBtn) {
      const key = designBtn.dataset.popup; // HTML의 data-popup 값 읽기 (예: web-01)
      openPopup(key);
      return; // 이벤트 종료
    }

    // 2. SHOW PROCESS 버튼(.btn-process)을 클릭했을 때
    const processBtn = e.target.closest('.btn-process');
    if (processBtn) {
      const key = processBtn.dataset.popup; // HTML의 data-popup 값 읽기 (예: web-01-process)
      
      // [선택 A] 디자인 팝업과 똑같은 형태의 다른 팝업창을 띄우고 싶을 때:
      openPopup(key); 
      
      // [선택 B] 만약 노션이나 외부 페이지로 새 창 이동을 시키고 싶다면 위 줄을 지우고 아래 주석을 푸세요:
      // window.open('여기에_링크_주소_넣기', '_blank'); 
      return; // 이벤트 종료
    }

    // 3. 팝업 닫기 버튼(✕)을 클릭했거나, 팝업 바깥 어두운 배경을 클릭했을 때
    if (e.target === popupClose || e.target === overlay) {
      closePopup();
    }
  });

}); // DOMContentLoaded 끝나는 괄호