/* ============================================================
   Beauty Studio — эмуляция «Оценка кожи по фото»
   Реального бэкенда нет: результат генерируется псевдослучайно
   на основе размера/даты файла. Фото читается через FileReader.
   ============================================================ */
(function () {
    'use strict';

    var fileInput = document.getElementById('skinPhoto');
    var dropzone = document.getElementById('dropzone');
    var preview = document.getElementById('preview');
    var previewImg = document.getElementById('previewImg');
    var analyzeBtn = document.getElementById('analyzeBtn');
    var progress = document.getElementById('progress');
    var progressFill = document.getElementById('progressFill');
    var progressLabel = document.getElementById('progressLabel');
    var result = document.getElementById('result');
    var resultType = document.getElementById('resultType');
    var resultDesc = document.getElementById('resultDesc');
    var resultList = document.getElementById('resultList');
    var resultCondition = document.getElementById('resultCondition');
    var restartBtn = document.getElementById('restartBtn');

    if (!fileInput || !dropzone) return;

    // Типы кожи + рекомендации + оценка состояния (метрики 0–100)
    var SKIN_TYPES = [
        {
            name: 'Сухая кожа',
            desc: 'Коже не хватает влаги и липидов: ощущение стянутости, склонность к шелушению и тонким морщинкам.',
            conditions: [
                { label: 'Увлажнённость', value: 40, note: 'Снижена — требуется интенсивное увлажнение' },
                { label: 'Жирность (себум)', value: 20, note: 'Низкая' },
                { label: 'Чистота пор', value: 78, note: 'Поры малозаметны' },
                { label: 'Чувствительность', value: 62, note: 'Повышена — склонность к раздражению' },
                { label: 'Тон и ровность', value: 58, note: 'Возможны тусклость и шелушение' }
            ],
            recs: [
                { title: 'Уходовая процедура на основе энзимного пилинга', url: 'services.html#enzyme-peeling' },
                { title: 'Карбокситерапия + альгинатная маска', url: 'services.html#carboxy-mask' },
                { title: 'Пилинг Bio Renewal ARKANA', url: 'services.html#bio-renewal' }
            ]
        },
        {
            name: 'Жирная кожа',
            desc: 'Повышенная активность сальных желёз: блеск, расширенные поры, склонность к воспалениям и акне.',
            conditions: [
                { label: 'Увлажнённость', value: 55, note: 'В норме' },
                { label: 'Жирность (себум)', value: 84, note: 'Повышена — есть блеск' },
                { label: 'Чистота пор', value: 44, note: 'Расширенные поры, склонность к комедонам' },
                { label: 'Чувствительность', value: 42, note: 'Умеренная' },
                { label: 'Тон и ровность', value: 54, note: 'Неровный рельеф, возможны воспаления' }
            ],
            recs: [
                { title: 'Чистка лица ультразвуковая', url: 'service-ultrasonic-cleaning.html' },
                { title: 'Чистка лица комбинированная', url: 'service-combined-cleaning.html' },
                { title: 'Пилинг для жирной/проблемной кожи', url: 'services.html#oily-peeling' }
            ]
        },
        {
            name: 'Комбинированная кожа',
            desc: 'Жирная Т-зона (лоб, нос, подбородок) и нормальная или сухая кожа на щеках.',
            conditions: [
                { label: 'Увлажнённость', value: 60, note: 'В норме, на щеках ближе к сухой' },
                { label: 'Жирность (Т-зона)', value: 70, note: 'Повышена в Т-зоне' },
                { label: 'Чистота пор', value: 56, note: 'Комедоны преимущественно в Т-зоне' },
                { label: 'Чувствительность', value: 46, note: 'Умеренная' },
                { label: 'Тон и ровность', value: 58, note: 'Смешанный рельеф' }
            ],
            recs: [
                { title: 'Консультация косметолога (онлайн/офлайн)', url: 'service-consultation.html' },
                { title: 'Чистка лица УЗ + пилинг', url: 'services.html#ultrasonic-peeling' },
                { title: 'Пилинг Джесснера', url: 'services.html#jessner-peeling' }
            ]
        }
    ];

    var currentFile = null;
    var timer = null;

    function show(el) { if (el) el.classList.add('is-visible'); }
    function hide(el) { if (el) el.classList.remove('is-visible'); }

    function resetProgress() {
        if (progressFill) progressFill.style.width = '0%';
        if (progressLabel) progressLabel.textContent = 'Подготовка…';
    }

    function setProgress(pct, text) {
        if (progressFill) progressFill.style.width = pct + '%';
        if (progressLabel) progressLabel.textContent = text;
    }

    function vary(base, salt) {
        var delta = (salt % 11) - 5; // от -5 до +5
        return Math.max(8, Math.min(96, base + delta));
    }

    function renderResult(skin) {
        if (resultType) resultType.textContent = 'Тип кожи: ' + skin.name;
        if (resultDesc) resultDesc.textContent = skin.desc;

        if (resultCondition) {
            resultCondition.innerHTML = '';
            var title = document.createElement('p');
            title.className = 'condition__title';
            title.textContent = 'Состояние кожи:';
            resultCondition.appendChild(title);

            var salt = currentFile ? currentFile.size : 0;
            skin.conditions.forEach(function (c) {
                var val = vary(c.value, salt);
                salt += 13;

                var row = document.createElement('div');
                row.className = 'condition__row';

                var head = document.createElement('div');
                head.className = 'condition__head';
                var nameEl = document.createElement('span');
                nameEl.textContent = c.label;
                var valEl = document.createElement('span');
                valEl.textContent = val + '%';
                head.appendChild(nameEl);
                head.appendChild(valEl);

                var bar = document.createElement('div');
                bar.className = 'condition__bar';
                var fill = document.createElement('div');
                fill.className = 'condition__fill';
                fill.style.width = val + '%'; // CSSOM — не блокируется CSP
                bar.appendChild(fill);

                var note = document.createElement('p');
                note.className = 'condition__note';
                note.textContent = c.note;

                row.appendChild(head);
                row.appendChild(bar);
                row.appendChild(note);
                resultCondition.appendChild(row);
            });
        }

        if (resultList) {
            resultList.innerHTML = '';
            skin.recs.forEach(function (rec) {
                var li = document.createElement('li');
                var a = document.createElement('a');
                a.href = rec.url;
                a.textContent = rec.title;
                li.appendChild(a);
                resultList.appendChild(li);
            });
        }
    }

    function startAnalysis() {
        if (!currentFile) return;
        // Псевдослучайный результат на основе размера и даты изменения файла
        var index = (currentFile.size + currentFile.lastModified) % SKIN_TYPES.length;
        var skin = SKIN_TYPES[index];

        hide(result);
        show(progress);
        if (analyzeBtn) analyzeBtn.disabled = true;
        resetProgress();

        var pct = 0;
        timer = setInterval(function () {
            pct += 6 + Math.floor(Math.random() * 9);
            if (pct >= 100) {
                pct = 100;
                clearInterval(timer);
                setProgress(100, 'Готово');
                setTimeout(function () {
                    hide(progress);
                    renderResult(skin);
                    show(result);
                    if (analyzeBtn) analyzeBtn.disabled = false;
                    if (result && result.scrollIntoView) {
                        result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }, 350);
            } else {
                setProgress(pct, 'Анализ фото: ' + pct + '%');
            }
        }, 200);
    }

    function onFile(file) {
        if (!file || !/^image\//.test(file.type)) {
            alert('Пожалуйста, выберите изображение (JPG, PNG, WebP).');
            return;
        }
        currentFile = file;
        var reader = new FileReader();
        reader.onload = function (e) {
            if (previewImg) previewImg.src = e.target.result;
            show(preview);
            hide(result);
            hide(progress);
            if (analyzeBtn) analyzeBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    fileInput.addEventListener('change', function () {
        onFile(fileInput.files && fileInput.files[0]);
    });

    // Drag & drop
    ['dragenter', 'dragover'].forEach(function (evt) {
        dropzone.addEventListener(evt, function (e) {
            e.preventDefault();
            dropzone.classList.add('is-dragover');
        });
    });
    ['dragleave', 'drop'].forEach(function (evt) {
        dropzone.addEventListener(evt, function (e) {
            e.preventDefault();
            dropzone.classList.remove('is-dragover');
        });
    });
    dropzone.addEventListener('drop', function (e) {
        var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) onFile(file);
    });

    if (analyzeBtn) analyzeBtn.addEventListener('click', startAnalysis);

    if (restartBtn) {
        restartBtn.addEventListener('click', function () {
            if (timer) clearInterval(timer);
            currentFile = null;
            if (fileInput) fileInput.value = '';
            if (previewImg) previewImg.removeAttribute('src');
            hide(preview);
            hide(progress);
            hide(result);
            resetProgress();
        });
    }

    // Защита от отправки формы по Enter
    var form = document.getElementById('skinTestForm');
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); });
})();