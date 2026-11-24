/* ============================================================
   Beauty Studio — общий скрипт (MPA)
   - подсветка активного пункта меню
   - бургер-меню
   - карусели
   - модальное окно «Записаться»
   - лайтбокс (только там, где есть #lightbox)
   ============================================================ */
(function () {
    'use strict';

    // ---------- АКТИВНЫЙ ПУНКТ МЕНЮ ----------
    var page = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('#nav a').forEach(function (link) {
        var href = link.getAttribute('href') || '';
        if (href === 'services.html' && /^service-/.test(page)) {
            link.classList.add('active');
        } else if (href === page || (href === 'index.html' && page === '')) {
            link.classList.add('active');
        }
    });

    // ---------- БУРГЕР-МЕНЮ ----------
    var burger = document.getElementById('burger');
    var nav = document.getElementById('nav');
    var overlay = document.getElementById('navOverlay');

    function toggleMenu(force) {
        if (!nav || !burger) return;
        var willOpen = (typeof force === 'boolean') ? force : !nav.classList.contains('is-open');
        nav.classList.toggle('is-open', willOpen);
        burger.classList.toggle('is-open', willOpen);
        if (overlay) overlay.classList.toggle('is-open', willOpen);
        burger.setAttribute('aria-expanded', String(willOpen));
        document.body.style.overflow = willOpen ? 'hidden' : '';
    }

    if (burger && nav) {
        burger.addEventListener('click', function () { toggleMenu(); });
        if (overlay) overlay.addEventListener('click', function () { toggleMenu(false); });
        nav.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () { toggleMenu(false); });
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && nav.classList.contains('is-open')) toggleMenu(false);
        });
    }

    // ---------- КАРУСЕЛИ ----------
    // На больших экранах стрелки прокручивают трек на ширину карточки.
    document.querySelectorAll('.carousel__btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var track = document.querySelector(btn.dataset.target);
            if (!track) return;
            var card = track.querySelector('.card');
            if (!card) return;
            var styles = window.getComputedStyle(track);
            var gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
            var step = card.getBoundingClientRect().width + gap;
            var dir = btn.classList.contains('carousel__btn--left') ? -1 : 1;
            track.scrollBy({ left: dir * step, behavior: 'smooth' });
        });
    });

    // ---------- МОДАЛЬНОЕ ОКНО «ЗАПИСАТЬСЯ» ----------
    var modal = document.getElementById('callModal');

    function openCallMenu() {
        if (!modal) return;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeCallMenu() {
        if (!modal) return;
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    document.querySelectorAll('[data-call]').forEach(function (btn) {
        btn.addEventListener('click', openCallMenu);
    });

    if (modal) {
        var mClose = modal.querySelector('.modal__close');
        if (mClose) mClose.addEventListener('click', closeCallMenu);
        modal.addEventListener('click', function (e) {
            if (e.target === modal) closeCallMenu();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal.classList.contains('open')) closeCallMenu();
        });
    }

    // ---------- ЛАЙТБОКС (увеличение фото) ----------
    var lightbox = document.getElementById('lightbox');
    if (lightbox) {
        var lightboxImg = document.getElementById('lightboxImg');
        var lightboxScale = document.getElementById('lightboxScale');
        var lightboxStage = lightbox.querySelector('.lightbox__stage');
        var galleryImages = Array.from(document.querySelectorAll('.card img, .profile-photo img'));
        var currentIndex = -1;
        var zoomLevel = 1;
        var ZOOM_MIN = 1, ZOOM_MAX = 4, ZOOM_STEP = 0.25;
        var isDragging = false, startX = 0, startY = 0, panX = 0, panY = 0;

        function applyTransform() {
            if (!lightboxImg) return;
            lightboxImg.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + zoomLevel + ')';
            if (lightboxScale) lightboxScale.textContent = Math.round(zoomLevel * 100) + '%';
            lightboxImg.classList.toggle('is-dragging', isDragging);
        }
        function resetZoom() { zoomLevel = 1; panX = 0; panY = 0; applyTransform(); }
        function setZoom(next) {
            zoomLevel = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));
            if (zoomLevel === 1) { panX = 0; panY = 0; }
            applyTransform();
        }
        function showImage(index) {
            if (!lightboxImg || !galleryImages.length) return;
            currentIndex = (index + galleryImages.length) % galleryImages.length;
            var source = galleryImages[currentIndex];
            lightboxImg.src = source.currentSrc || source.src;
            lightboxImg.alt = source.alt || 'Просмотр изображения';
            resetZoom();
        }
        function openLightbox(index) {
            showImage(index);
            lightbox.classList.add('open');
            lightbox.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }
        function closeLightbox() {
            lightbox.classList.remove('open');
            lightbox.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            isDragging = false;
        }

        galleryImages.forEach(function (img, i) {
            img.setAttribute('draggable', 'false');
            img.addEventListener('click', function () { openLightbox(i); });
            img.setAttribute('tabindex', '0');
            img.setAttribute('role', 'button');
            img.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); }
            });
        });

        var lbClose = lightbox.querySelector('.lightbox__close');
        var lbPrev = lightbox.querySelector('.lightbox__nav--prev');
        var lbNext = lightbox.querySelector('.lightbox__nav--next');
        if (lbClose) lbClose.addEventListener('click', closeLightbox);
        if (lbPrev) lbPrev.addEventListener('click', function () { showImage(currentIndex - 1); });
        if (lbNext) lbNext.addEventListener('click', function () { showImage(currentIndex + 1); });

        lightbox.querySelectorAll('[data-zoom]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var action = btn.dataset.zoom;
                if (action === 'in') setZoom(zoomLevel + ZOOM_STEP);
                else if (action === 'out') setZoom(zoomLevel - ZOOM_STEP);
                else resetZoom();
            });
        });

        lightbox.addEventListener('wheel', function (e) {
            e.preventDefault();
            setZoom(zoomLevel + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
        }, { passive: false });

        var stage = lightboxStage || lightbox;
        stage.addEventListener('pointerdown', function (e) {
            if (zoomLevel <= 1) return;
            isDragging = true;
            startX = e.clientX - panX;
            startY = e.clientY - panY;
            if (lightboxImg) lightboxImg.classList.add('is-dragging');
            if (stage.setPointerCapture) { try { stage.setPointerCapture(e.pointerId); } catch (err) {} }
        });
        stage.addEventListener('pointermove', function (e) {
            if (!isDragging) return;
            panX = e.clientX - startX;
            panY = e.clientY - startY;
            applyTransform();
        });
        function endDrag() {
            if (!isDragging) return;
            isDragging = false;
            if (lightboxImg) lightboxImg.classList.remove('is-dragging');
        }
        stage.addEventListener('pointerup', endDrag);
        stage.addEventListener('pointercancel', endDrag);
        stage.addEventListener('pointerleave', endDrag);

        if (lightboxImg) {
            lightboxImg.setAttribute('draggable', 'false');
            lightboxImg.addEventListener('dblclick', function () { setZoom(zoomLevel > 1 ? 1 : 2); });
        }

        lightbox.addEventListener('click', function (e) {
            if (e.target === lightbox || e.target === lightboxStage) closeLightbox();
        });

        document.addEventListener('keydown', function (e) {
            if (!lightbox.classList.contains('open')) return;
            if (e.key === 'Escape') closeLightbox();
            else if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
            else if (e.key === 'ArrowRight') showImage(currentIndex + 1);
            else if (e.key === '+' || e.key === '=') setZoom(zoomLevel + ZOOM_STEP);
            else if (e.key === '-' || e.key === '_') setZoom(zoomLevel - ZOOM_STEP);
            else if (e.key === '0') resetZoom();
        });
    }
})();