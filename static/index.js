const teamNum = window.TEAM_NUMBER;
const refreshMs = 7 * 60 * 1000;
let selectedEventKey = null;
let refreshTimer = null;
let scoringDt = null;
let scrollAnimationId = null;
let speed = 40;
let pause = 3;
const scoreSpeedSliderObject = document.getElementById('scoringTableScrollSpeed');
const scorePauseSliderObject = document.getElementById('scoringTableScrollPause');

document.addEventListener('DOMContentLoaded', () => {
    if (scoreSpeedSliderObject) {
        speed = scoreSpeedSliderObject.valueAsNumber;
        scoreSpeedSliderObject.addEventListener('input', () => {
            speed = scoreSpeedSliderObject.valueAsNumber;
        });
    }
    if (scorePauseSliderObject) {
        pause = scorePauseSliderObject.valueAsNumber * 1000;
        scorePauseSliderObject.addEventListener('input', () => {
            pause = scorePauseSliderObject.valueAsNumber * 1000;
        });
    }
});

function getScoringTableScrollY() {
    const card = $("#scoringTable").closest(".card");
    if (!card.length) return '300px';

    const cardInner = card.innerHeight() || 0;
    const headerH = (card.find('h3').first().outerHeight(true) || 0);
    const dtHeadH = ($('#scoringTable thead').outerHeight(true) || 0);

    let available = cardInner - headerH - dtHeadH - 40;
    if (!Number.isFinite(available) || available < 180) {
        available = 180;
    }
    return `${Math.floor(available)}px`;
}

function refreshScoringTableScroll() {
    if (!scoringDt) return;
    scoringDt.settings()[0].oScroll.sY = getScoringTableScrollY();
    scoringDt.draw(false);
}

function analyzeEvent() {
    const eventKey = $("#eventList").val();
    const eventLabel = $("#eventList option:selected").text();
    if (!eventKey) {
        showError('Please select an event');
        return;
    }

    selectedEventKey = eventKey;
    fetchAndRenderEventData();
    startAutoRefresh();
    document.getElementById('initialContainer').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'flex';
    $("#eventPlaceholder").text(eventLabel);
}

function startAutoRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }
    refreshTimer = setInterval(() => {
        if (selectedEventKey) {
            fetchAndRenderEventData(true);
        }
    }, refreshMs);
}

function fetchAndRenderEventData(isRefresh = false) {
    if (!selectedEventKey) return;

    $.ajax({
        url: '/event_data',
        type: 'POST',
        data: {
            event_key: selectedEventKey,
        },
        success: function (response) {
            if (!response || !response.success) {
                showError(response && response.error ? response.error : 'Error loading event data.');
                return;
            }
            renderTeamStats(response);
            renderScoringTable(response.scoring_table || []);
            document.getElementById('errorMessage').textContent = '';
        },
        error: function () {
            if (!isRefresh) {
                showError('Error loading event data. Please try again.');
            }
        }
    });
}

function renderTeamStats(payload) {
    const stats = payload.team_stats || {};
    const nm = stats.next_match || null;

    document.getElementById('lastUpdated').textContent = payload.last_updated || '-';
    document.getElementById('currentRank').textContent = (stats.rank !== null && stats.rank !== undefined) ? stats.rank : '-';
    document.getElementById('currentRp').textContent = (stats.rp !== null && stats.rp !== undefined) ? stats.rp : '-';

    if (stats.record && (stats.record.wins !== undefined)) {
        document.getElementById('currentRecord').textContent = `${stats.record.wins}-${stats.record.losses}-${stats.record.ties}`;
    } else {
        document.getElementById('currentRecord').textContent = '-';
    }

    if (stats.avg_match_gap_seconds) {
        const mins = Math.round(stats.avg_match_gap_seconds / 60);
        document.getElementById('avgMatchGap').textContent = `${mins} min`;
    } else {
        document.getElementById('avgMatchGap').textContent = '-';
    }

    document.getElementById('nextMatchNum').textContent = nm ? (nm.match_number ?? '-') : '-';
    const bumperColor = nm ? (nm.bumper_color ?? null) : null;
    document.getElementById('bumperColor').textContent = bumperColor ?? '-';
    document.querySelectorAll('.bumper-text').forEach(el => {
        el.style.color = bumperColor;
    });
    document.getElementById('teammates').textContent = nm ? ((nm.teammates || []).join(', ') || '-') : '-';
    document.getElementById('opponents').textContent = nm ? ((nm.opponents || []).join(', ') || '-') : '-';
}

function renderScoringTable(rows) {
    const tbody = $("#scoringTable tbody");
    tbody.empty();

    rows.forEach(r => {
        const tr = $(`<tr${r.team === teamNum ? ' class="team-highlight"' : ''}></tr>`);
        tr.append(`<td>${r.rank}</td>`);
        tr.append(`<td>${r.team}</td>`);
        tr.append(`<td>${r.matches}</td>`);
        tr.append(`<td>${r.avg_alliance_score}</td>`);
        tr.append(`<td>${r.avg_opponent_score}</td>`);
        tr.append(`<td>${r.avg_margin}</td>`);
        tbody.append(tr);
    });

    if (scoringDt) {
        scoringDt.destroy();
    }
    scoringDt = $("#scoringTable").DataTable({
        searching: false,
        paging: false,
        info: false,
        order: [[0, 'asc']],
    });

    startAutoScroll();
}

function startAutoScroll() {
    if (scrollAnimationId) cancelAnimationFrame(scrollAnimationId);

    // Small delay to let DataTables finish rendering
    setTimeout(() => {
        const scrollBody = document.getElementById('scoringTableScroll');
        if (!scrollBody) {
            console.log('scrollBody not found');
            return;
        }

        console.log('Scroll setup:', scrollBody.scrollHeight, scrollBody.clientHeight, 'canScroll:', scrollBody.scrollHeight > scrollBody.clientHeight);
        speed = scoreSpeedSliderObject.valueAsNumber;
        pause = scorePauseSliderObject.valueAsNumber * 1000;

        let pos = scrollBody.scrollTop;
        let lastTime = null;

        function animate(now) {
            if (lastTime != null) {
                pos += speed * (now - lastTime) / 1000;
                scrollBody.scrollTop = pos;
            }
            lastTime = now;

            if (Math.round(scrollBody.scrollTop) + Math.round(scrollBody.clientHeight) >= scrollBody.scrollHeight) {
                setTimeout(() => {
                    pos = 0;
                    scrollBody.scrollTop = 0;
                    lastTime = null;
                }, pause);
            }
            scrollAnimationId = requestAnimationFrame(animate);
        }

        scrollAnimationId = requestAnimationFrame(animate);
    }, 100);
}

window.addEventListener('resize', () => {
    refreshScoringTableScroll();
});

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
}