// Game Logic Controller, State Machine, and UI Interactions
// Match: Cristiano Ronaldo (Portugal #7) vs France Goalkeeper

class PenaltyMathGame {
    constructor() {
        // Game configuration & state
        this.playerTeam = 'portugal'; // Cristiano Ronaldo (Portugal #7)
        this.gkTeam = 'france';       // France Goalkeeper
        this.currentLevel = 1;
        this.maxUnlockedLevel = 1;
        this.totalStars = 0;
        this.levelStars = {};

        // Level State (3 penalty shots per level)
        this.shotIndex = 0;
        this.shotsScored = 0;
        this.levelQuestions = [];
        this.currentQuestion = null;
        this.shotResults = [];
        this.isProcessingShot = false;

        // Tournament Stage Names
        this.stageNames = {
            1: "Group Stage (Grade 7 Basics)",
            2: "Round of 16 (Grade 7/8 Core)",
            3: "Quarter-Final (Grade 8 Intermediate)",
            4: "Semi-Final (Grade 8/9 Advanced)",
            5: "Grand Final: Portugal vs France (Grade 9 Elite)",
            6: "Master Class (Infinite Challenge)"
        };

        this.dom = {};
        this.renderer = null;

        // Scratchpad state
        this.isDrawing = false;
        this.scratchpadColor = '#ffffff';
        this.scratchpadWidth = 3;

        this.loadProgress();
    }

    init() {
        this.cacheDOM();
        this.setupRenderer();
        this.bindEvents();
        this.setupScratchpad();
        this.renderLevelSelectGrid();
        this.updateHeaderStats();

        // Start animation loop
        this.loop();
    }

    cacheDOM() {
        this.dom = {
            // Screens
            startScreen: document.getElementById('start-screen'),
            levelSelectScreen: document.getElementById('level-select-screen'),
            gameScreen: document.getElementById('game-screen'),
            resultModal: document.getElementById('result-modal'),
            explanationModal: document.getElementById('explanation-modal'),
            scratchpadModal: document.getElementById('scratchpad-modal'),
            formulasModal: document.getElementById('formulas-modal'),

            // Canvases
            gameCanvas: document.getElementById('game-canvas'),
            scratchpadCanvas: document.getElementById('scratchpad-canvas'),

            // HUD & Scoreboard
            scoreboardTeamPlayer: document.getElementById('team-player-name'),
            scoreboardTeamOpponent: document.getElementById('team-opponent-name'),
            playerFlag: document.getElementById('player-flag'),
            opponentFlag: document.getElementById('opponent-flag'),
            stageBadge: document.getElementById('stage-badge'),
            shotDots: document.querySelectorAll('.shot-dot'),
            headerStars: document.getElementById('header-stars-count'),
            
            // Question Jumbo-Tron
            questionTopic: document.getElementById('question-topic'),
            questionBody: document.getElementById('question-body'),
            targetZones: document.querySelectorAll('.target-zone'),

            // Banners & Modals
            feedbackBanner: document.getElementById('feedback-banner'),
            modalTitle: document.getElementById('modal-title'),
            modalBadge: document.getElementById('modal-badge'),
            modalStars: document.getElementById('modal-stars-container'),
            modalScoreText: document.getElementById('modal-score-text'),
            modalSummaryList: document.getElementById('modal-summary-list'),
            nextLevelBtn: document.getElementById('next-level-btn'),
            retryLevelBtn: document.getElementById('retry-level-btn'),

            // Explanation Modal
            expTopic: document.getElementById('exp-topic'),
            expQuestion: document.getElementById('exp-question'),
            expUserChoice: document.getElementById('exp-user-choice'),
            expCorrectAns: document.getElementById('exp-correct-ans'),
            expBody: document.getElementById('exp-body'),

            // Level Select Grid
            levelsGrid: document.getElementById('levels-grid'),

            // Audio & Control Toggles
            soundToggle: document.getElementById('sound-toggle'),
            ambientToggle: document.getElementById('ambient-toggle'),
            commentaryToggle: document.getElementById('commentary-toggle')
        };
    }

    setupRenderer() {
        this.renderer = new StadiumRenderer(this.dom.gameCanvas, null);
        this.renderer.setTeams(this.playerTeam, this.gkTeam);
    }

    bindEvents() {
        // Start tournament button
        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                window.soundEngine.init();
                window.soundEngine.playButtonClick();
                window.soundEngine.startAmbientCrowd();
                this.showScreen('levelSelectScreen');
            });
        }

        // Quick play button
        const quickBtn = document.getElementById('quick-play-btn');
        if (quickBtn) {
            quickBtn.addEventListener('click', () => {
                window.soundEngine.init();
                window.soundEngine.playButtonClick();
                window.soundEngine.startAmbientCrowd();
                this.startLevel(this.maxUnlockedLevel);
            });
        }

        // Back buttons
        document.querySelectorAll('.back-to-menu-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                window.soundEngine.playButtonClick();
                this.showScreen('startScreen');
            });
        });

        document.querySelectorAll('.back-to-levels-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                window.soundEngine.playButtonClick();
                this.renderLevelSelectGrid();
                this.showScreen('levelSelectScreen');
            });
        });

        // 6 Target Zone Click Handlers
        this.dom.targetZones.forEach(zone => {
            zone.addEventListener('click', (e) => {
                if (this.isProcessingShot) return;
                const zoneIndex = parseInt(e.currentTarget.getAttribute('data-zone'));
                this.shootAtZone(zoneIndex);
            });
        });

        // Keyboard Controls (1-6 for zones, QWE/ASD)
        window.addEventListener('keydown', (e) => {
            if (this.dom.gameScreen.classList.contains('hidden') || this.isProcessingShot) return;

            const keyNum = parseInt(e.key);
            if (keyNum >= 1 && keyNum <= 6) {
                this.shootAtZone(keyNum - 1);
            }
            const keyMap = { 'q': 0, 'w': 1, 'e': 2, 'a': 3, 's': 4, 'd': 5 };
            if (keyMap[e.key.toLowerCase()] !== undefined) {
                this.shootAtZone(keyMap[e.key.toLowerCase()]);
            }
        });

        // Modal Action Buttons
        this.dom.nextLevelBtn.addEventListener('click', () => {
            window.soundEngine.playButtonClick();
            this.dom.resultModal.classList.add('hidden');
            const nextLvl = this.currentLevel + 1;
            this.startLevel(nextLvl);
        });

        this.dom.retryLevelBtn.addEventListener('click', () => {
            window.soundEngine.playButtonClick();
            this.dom.resultModal.classList.add('hidden');
            this.startLevel(this.currentLevel);
        });

        const closeExpBtn = document.getElementById('close-exp-btn');
        if (closeExpBtn) {
            closeExpBtn.addEventListener('click', () => {
                this.dom.explanationModal.classList.add('hidden');
                this.proceedAfterShot();
            });
        }

        // Scratchpad & Formulas Toggles
        const openScratchpadBtn = document.getElementById('open-scratchpad-btn');
        if (openScratchpadBtn) {
            openScratchpadBtn.addEventListener('click', () => {
                window.soundEngine.playButtonClick();
                this.dom.scratchpadModal.classList.remove('hidden');
                this.resizeScratchpad();
            });
        }

        const closeScratchpadBtn = document.getElementById('close-scratchpad-btn');
        if (closeScratchpadBtn) {
            closeScratchpadBtn.addEventListener('click', () => {
                this.dom.scratchpadModal.classList.add('hidden');
            });
        }

        const openFormulasBtn = document.getElementById('open-formulas-btn');
        if (openFormulasBtn) {
            openFormulasBtn.addEventListener('click', () => {
                window.soundEngine.playButtonClick();
                this.dom.formulasModal.classList.remove('hidden');
            });
        }

        const closeFormulasBtn = document.getElementById('close-formulas-btn');
        if (closeFormulasBtn) {
            closeFormulasBtn.addEventListener('click', () => {
                this.dom.formulasModal.classList.add('hidden');
            });
        }

        // Sound Settings Toggles
        this.dom.soundToggle.addEventListener('click', () => {
            window.soundEngine.soundEnabled = !window.soundEngine.soundEnabled;
            this.dom.soundToggle.classList.toggle('active', window.soundEngine.soundEnabled);
            this.dom.soundToggle.querySelector('span').innerText = window.soundEngine.soundEnabled ? '🔊 SFX On' : '🔇 SFX Off';
        });

        this.dom.ambientToggle.addEventListener('click', () => {
            window.soundEngine.ambientEnabled = !window.soundEngine.ambientEnabled;
            this.dom.ambientToggle.classList.toggle('active', window.soundEngine.ambientEnabled);
            this.dom.ambientToggle.querySelector('span').innerText = window.soundEngine.ambientEnabled ? '🏟️ Crowd On' : '🏟️ Crowd Off';
            if (window.soundEngine.ambientEnabled) {
                window.soundEngine.startAmbientCrowd();
            } else {
                window.soundEngine.stopAmbientCrowd();
            }
        });

        this.dom.commentaryToggle.addEventListener('click', () => {
            window.soundEngine.commentaryEnabled = !window.soundEngine.commentaryEnabled;
            this.dom.commentaryToggle.classList.toggle('active', window.soundEngine.commentaryEnabled);
            this.dom.commentaryToggle.querySelector('span').innerText = window.soundEngine.commentaryEnabled ? '🎙️ Comm On' : '🎙️ Comm Off';
        });
    }

    showScreen(screenName) {
        ['startScreen', 'levelSelectScreen', 'gameScreen'].forEach(s => {
            this.dom[s].classList.add('hidden');
        });
        this.dom[screenName].classList.remove('hidden');

        if (screenName === 'gameScreen') {
            this.renderer.resize();
        }
    }

    startLevel(levelNumber) {
        this.currentLevel = levelNumber;
        this.shotIndex = 0;
        this.shotsScored = 0;
        this.shotResults = [];
        this.isProcessingShot = false;

        // Fetch 3 curated junior high math questions
        this.levelQuestions = window.mathEngine.getLevelQuestions(levelNumber);

        // Update Level & Stage HUD
        const stageTitle = this.stageNames[levelNumber] || `Stage ${levelNumber} (Elite Tournament)`;
        this.dom.stageBadge.innerText = `STAGE ${levelNumber}: ${stageTitle}`;

        // Reset Shot Dot indicators
        this.dom.shotDots.forEach(dot => {
            dot.className = 'shot-dot';
            dot.innerText = '⚽';
        });

        this.showScreen('gameScreen');
        this.presentQuestion();

        window.soundEngine.playWhistle(true);
    }

    presentQuestion() {
        this.currentQuestion = this.levelQuestions[this.shotIndex];
        this.renderer.resetBall();
        this.isProcessingShot = false;

        // Update Question Jumbo-tron Banner
        this.dom.questionTopic.innerText = `PENALTY ${this.shotIndex + 1} OF 3 • ${this.currentQuestion.topic.toUpperCase()}`;
        this.dom.questionBody.innerHTML = this.currentQuestion.questionText;

        // Update the 6 Target Zones with shuffled options
        this.dom.targetZones.forEach((zone, index) => {
            const optionText = this.currentQuestion.options[index];
            const badge = zone.querySelector('.option-badge');
            if (badge) {
                badge.innerHTML = optionText;
            }
            zone.className = `target-zone zone-${index}`;
        });

        // Hide feedback banner
        this.dom.feedbackBanner.className = 'feedback-banner hidden';
    }

    shootAtZone(chosenZoneIndex) {
        if (this.isProcessingShot) return;
        this.isProcessingShot = true;

        const isCorrect = chosenZoneIndex === this.currentQuestion.correctZoneIndex;

        // Disable zone hover effects
        this.dom.targetZones.forEach(z => z.classList.add('disabled'));

        // Highlight chosen zone
        const chosenEl = this.dom.targetZones[chosenZoneIndex];
        chosenEl.classList.add(isCorrect ? 'picked-correct' : 'picked-wrong');

        // Goalkeeper non-repetitive AI reaction:
        // Correct answer: Goalkeeper dives wrong way / beaten
        // Wrong answer: Goalkeeper dives to chosen zone & makes save
        let gkDiveZone;
        if (isCorrect) {
            const wrongZones = [0, 1, 2, 3, 4, 5].filter(z => z !== chosenZoneIndex);
            gkDiveZone = wrongZones[Math.floor(Math.random() * wrongZones.length)];
        } else {
            gkDiveZone = chosenZoneIndex;
        }

        window.soundEngine.playKick();
        this.renderer.setGoalkeeperState('dive', gkDiveZone);

        this.renderer.startBallFlight(chosenZoneIndex, isCorrect, (goalScored) => {
            this.handleShotOutcome(goalScored, chosenZoneIndex);
        });
    }

    handleShotOutcome(isGoal, chosenZoneIndex) {
        this.shotResults.push(isGoal);
        const currentDot = this.dom.shotDots[this.shotIndex];

        if (isGoal) {
            this.shotsScored++;
            currentDot.className = 'shot-dot scored';
            currentDot.innerText = '🟢';

            // Show celebratory SIUUU banner
            this.dom.feedbackBanner.innerHTML = '<span>⚡ S I U U U U U U U ! ⚡</span><small>Cristiano Ronaldo #7 scores a thunderbolt past France!</small>';
            this.dom.feedbackBanner.className = 'feedback-banner goal-flash';

            // Speech commentary
            window.soundEngine.speakCommentary('GOLAZO DE CRISTIANO RONALDO! SIUUUUU!', 'pt-PT');

            // Allow the full iconic multi-phase celebration animation to play (Run -> Knee Slide -> Flag Smash -> SIUUUU) (~6.5 seconds)
            setTimeout(() => {
                this.proceedAfterShot();
            }, 6500);

        } else {
            currentDot.className = 'shot-dot missed';
            currentDot.innerText = '🔴';

            this.dom.feedbackBanner.innerHTML = '<span>🧤 SAVED BY THE FRENCH KEEPER!</span><small>Check the math explanation to beat the goalkeeper next time!</small>';
            this.dom.feedbackBanner.className = 'feedback-banner saved-flash';

            window.soundEngine.speakCommentary('Magnifique arrêt du gardien français!', 'fr-FR');

            setTimeout(() => {
                this.showExplanationModal(chosenZoneIndex);
            }, 1400);
        }
    }

    showExplanationModal(chosenZoneIndex) {
        const q = this.currentQuestion;
        this.dom.expTopic.innerText = q.topic;
        this.dom.expQuestion.innerHTML = q.questionText;
        this.dom.expUserChoice.innerHTML = `Your Strike: <b>${q.options[chosenZoneIndex]}</b> ❌ (Saved)`;
        this.dom.expCorrectAns.innerHTML = `Winning Target: <b>${q.correctAnswerText}</b> 🎯`;
        this.dom.expBody.innerHTML = q.explanation;

        this.dom.explanationModal.classList.remove('hidden');
    }

    proceedAfterShot() {
        this.shotIndex++;
        if (this.shotIndex < 3) {
            this.presentQuestion();
        } else {
            this.finishLevel();
        }
    }

    finishLevel() {
        const goals = this.shotsScored;
        let stars = 0;
        let isHatTrick = false;

        if (goals === 3) {
            stars = 3;
            isHatTrick = true;
        } else if (goals === 2) {
            stars = 2;
        } else if (goals === 1) {
            stars = 1;
        } else {
            stars = 0;
        }

        const prevStars = this.levelStars[this.currentLevel] || 0;
        if (stars > prevStars) {
            this.levelStars[this.currentLevel] = stars;
        }

        if (goals >= 1 && this.currentLevel === this.maxUnlockedLevel) {
            this.maxUnlockedLevel = Math.min(6, this.currentLevel + 1);
        }

        this.saveProgress();
        this.updateHeaderStats();

        // Populate Result Modal
        if (isHatTrick) {
            this.dom.modalTitle.innerText = '🏆 CR7 HAT-TRICK HERO! 🏆';
            this.dom.modalBadge.innerText = 'PERFECT 3/3 PENALTIES SCORED! SIUUU!';
            this.dom.modalBadge.className = 'modal-badge hat-trick-badge';
            window.soundEngine.playHatTrickFanfare();
            this.renderer.spawnHatTrickStars();
        } else if (goals >= 1) {
            this.dom.modalTitle.innerText = '⚽ STAGE COMPLETED! ⚽';
            this.dom.modalBadge.innerText = `${goals} of 3 Penalties Converted`;
            this.dom.modalBadge.className = 'modal-badge win-badge';
            window.soundEngine.playStarChime(stars);
        } else {
            this.dom.modalTitle.innerText = '🧤 DEFEAT ON PENALTIES';
            this.dom.modalBadge.innerText = 'France stopped your shots! Try again.';
            this.dom.modalBadge.className = 'modal-badge lose-badge';
            window.soundEngine.playSaveSound();
        }

        // Render Star Graphics (🌟🌟🌟)
        this.dom.modalStars.innerHTML = '';
        for (let i = 1; i <= 3; i++) {
            const starSpan = document.createElement('span');
            starSpan.className = `result-star ${i <= stars ? 'earned' : 'empty'}`;
            starSpan.innerText = i <= stars ? '★' : '☆';
            this.dom.modalStars.appendChild(starSpan);
        }

        this.dom.modalScoreText.innerHTML = `Ronaldo scored <b>${goals} / 3 goals</b> against France!`;

        // Render breakdown summary list
        this.dom.modalSummaryList.innerHTML = '';
        this.levelQuestions.forEach((q, idx) => {
            const li = document.createElement('li');
            const wasScored = this.shotResults[idx];
            li.className = wasScored ? 'summary-item-scored' : 'summary-item-missed';
            li.innerHTML = `
                <div class="summary-shot-icon">${wasScored ? '⚽' : '❌'}</div>
                <div class="summary-shot-info">
                    <span class="summary-shot-topic">Penalty ${idx + 1}: ${q.topic}</span>
                    <span class="summary-shot-ans">Correct Target: <b>${q.correctAnswerText}</b></span>
                </div>
            `;
            this.dom.modalSummaryList.appendChild(li);
        });

        if (goals >= 1) {
            this.dom.nextLevelBtn.classList.remove('hidden');
        } else {
            this.dom.nextLevelBtn.classList.add('hidden');
        }

        this.dom.resultModal.classList.remove('hidden');
    }

    renderLevelSelectGrid() {
        this.dom.levelsGrid.innerHTML = '';
        const totalLevels = 6;

        for (let i = 1; i <= totalLevels; i++) {
            const isUnlocked = i <= this.maxUnlockedLevel;
            const stars = this.levelStars[i] || 0;
            const stageTitle = this.stageNames[i] || `Stage ${i}`;

            const card = document.createElement('div');
            card.className = `level-card ${isUnlocked ? 'unlocked' : 'locked'}`;

            let starsHTML = '';
            for (let s = 1; s <= 3; s++) {
                starsHTML += `<span class="card-star ${s <= stars ? 'earned' : 'empty'}">${s <= stars ? '★' : '☆'}</span>`;
            }

            card.innerHTML = `
                <div class="level-card-number">${isUnlocked ? `Stage ${i}` : '🔒'}</div>
                <div class="level-card-title">${stageTitle}</div>
                <div class="level-card-stars">${starsHTML}</div>
                ${stars === 3 ? '<div class="hat-trick-tag">🎩 SIUUU HAT-TRICK</div>' : ''}
            `;

            if (isUnlocked) {
                card.addEventListener('click', () => {
                    window.soundEngine.playButtonClick();
                    this.startLevel(i);
                });
            }

            this.dom.levelsGrid.appendChild(card);
        }
    }

    updateHeaderStats() {
        let starsSum = 0;
        Object.values(this.levelStars).forEach(s => starsSum += s);
        this.totalStars = starsSum;
        if (this.dom.headerStars) {
            this.dom.headerStars.innerText = `${this.totalStars} ★`;
        }
    }

    // Scratchpad canvas functionality
    setupScratchpad() {
        const canvas = this.dom.scratchpadCanvas;
        const ctx = canvas.getContext('2d');

        const getPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        const startDraw = (e) => {
            this.isDrawing = true;
            const pos = getPos(e);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            e.preventDefault();
        };

        const draw = (e) => {
            if (!this.isDrawing) return;
            const pos = getPos(e);
            ctx.strokeStyle = this.scratchpadColor;
            ctx.lineWidth = this.scratchpadWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            e.preventDefault();
        };

        const stopDraw = () => {
            this.isDrawing = false;
        };

        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', draw);
        window.addEventListener('mouseup', stopDraw);

        canvas.addEventListener('touchstart', startDraw, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        window.addEventListener('touchend', stopDraw);

        document.querySelectorAll('.pad-color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.scratchpadColor = e.currentTarget.getAttribute('data-color');
                this.scratchpadWidth = 3;
                document.querySelectorAll('.pad-color-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        const eraserBtn = document.getElementById('pad-eraser-btn');
        if (eraserBtn) {
            eraserBtn.addEventListener('click', () => {
                this.scratchpadColor = '#151d2a';
                this.scratchpadWidth = 22;
                document.querySelectorAll('.pad-color-btn').forEach(b => b.classList.remove('active'));
                eraserBtn.classList.add('active');
            });
        }

        const clearBtn = document.getElementById('pad-clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            });
        }
    }

    resizeScratchpad() {
        const canvas = this.dom.scratchpadCanvas;
        const rect = canvas.getBoundingClientRect();
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
            const ctx = canvas.getContext('2d');
            const temp = document.createElement('canvas');
            temp.width = canvas.width;
            temp.height = canvas.height;
            const tempCtx = temp.getContext('2d');
            tempCtx.drawImage(canvas, 0, 0);

            canvas.width = rect.width;
            canvas.height = rect.height;
            ctx.drawImage(temp, 0, 0);
        }
    }

    saveProgress() {
        try {
            const data = {
                maxLevel: this.maxUnlockedLevel,
                stars: this.levelStars
            };
            localStorage.setItem('cr7_penalty_math_data', JSON.stringify(data));
        } catch (e) {}
    }

    loadProgress() {
        try {
            const raw = localStorage.getItem('cr7_penalty_math_data');
            if (raw) {
                const data = JSON.parse(raw);
                if (data.maxLevel) this.maxUnlockedLevel = data.maxLevel;
                if (data.stars) this.levelStars = data.stars;
            }
        } catch (e) {}
    }

    loop() {
        if (this.renderer) {
            this.renderer.render();
        }
        requestAnimationFrame(() => this.loop());
    }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
    window.game = new PenaltyMathGame();
    window.game.init();
});
