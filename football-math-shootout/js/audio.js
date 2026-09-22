// Web Audio API Procedural Sound Engine & Vocal "SIUUUU!" Synthesizer
// For Cristiano Ronaldo (Portugal #7) vs France Penalty Shootout

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.soundEnabled = true;
        this.ambientEnabled = true;
        this.commentaryEnabled = true;
        this.ambientGain = null;
        this.ambientSource = null;
        this.isAmbientPlaying = false;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    startAmbientCrowd() {
        if (!this.soundEnabled || !this.ambientEnabled) return;
        this.init();
        if (this.isAmbientPlaying) return;

        try {
            // Filtered pink noise drone simulating 80,000 roaring fans in stadium
            const bufferSize = this.ctx.sampleRate * 2;
            const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
                b6 = white * 0.115926;
            }

            this.ambientSource = this.ctx.createBufferSource();
            this.ambientSource.buffer = noiseBuffer;
            this.ambientSource.loop = true;

            const bandpass = this.ctx.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.frequency.value = 420;
            bandpass.Q.value = 1.3;

            const lowpass = this.ctx.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.value = 850;

            this.ambientGain = this.ctx.createGain();
            this.ambientGain.gain.setValueAtTime(0.28, this.ctx.currentTime);

            this.ambientSource.connect(bandpass);
            bandpass.connect(lowpass);
            lowpass.connect(this.ambientGain);
            this.ambientGain.connect(this.ctx.destination);

            this.ambientSource.start();
            this.isAmbientPlaying = true;
        } catch (e) {
            console.warn("Ambient audio start error:", e);
        }
    }

    stopAmbientCrowd() {
        if (this.ambientSource) {
            try {
                this.ambientSource.stop();
                this.ambientSource.disconnect();
            } catch (e) {}
            this.ambientSource = null;
            this.isAmbientPlaying = false;
        }
    }

    playWhistle(isShort = false) {
        if (!this.soundEnabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const duration = isShort ? 0.28 : 0.85;

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';

        osc1.frequency.setValueAtTime(2650, now);
        osc1.frequency.exponentialRampToValueAtTime(2850, now + 0.08);
        osc1.frequency.exponentialRampToValueAtTime(2520, now + duration);

        osc2.frequency.setValueAtTime(3300, now);
        osc2.frequency.exponentialRampToValueAtTime(3550, now + 0.08);
        osc2.frequency.exponentialRampToValueAtTime(3150, now + duration);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.03);
        gain.gain.setValueAtTime(0.35, now + duration - 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + duration);
        osc2.stop(now + duration);
    }

    playKick() {
        if (!this.soundEnabled) return;
        this.init();
        const now = this.ctx.currentTime;

        // Heavy CR7 knuckleball / power strike thud
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.2);

        gain.gain.setValueAtTime(0.95, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        // Leather shoe-ball impact snap
        const bufferSize = this.ctx.sampleRate * 0.06;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 750;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.45, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.22);
        noise.start(now);
    }

    playNetSwish() {
        if (!this.soundEnabled) return;
        this.init();
        const now = this.ctx.currentTime;

        const bufferSize = this.ctx.sampleRate * 0.4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1500, now);
        filter.frequency.exponentialRampToValueAtTime(550, now + 0.35);
        filter.Q.value = 2.2;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.55, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        source.start(now);
    }

    // Knee slide turf friction swoosh sound
    playSlideSound() {
        if (!this.soundEnabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const duration = 1.1;

        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const progress = i / bufferSize;
            const env = Math.sin(progress * Math.PI);
            data[i] = (Math.random() * 2 - 1) * env;
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.frequency.exponentialRampToValueAtTime(450, now + duration);
        filter.Q.value = 1.8;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.65, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        source.start(now);
    }

    // Corner flag strike / spring snap impact sound
    playFlagSmashSound() {
        if (!this.soundEnabled) return;
        this.init();
        const now = this.ctx.currentTime;

        // 1. Solid impact thud / snap
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
        oscGain.gain.setValueAtTime(0.9, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);

        // 2. High frequency pole twang / plastic spring vibration
        const twang = this.ctx.createOscillator();
        const twangGain = this.ctx.createGain();
        twang.type = 'sawtooth';
        twang.frequency.setValueAtTime(580, now);
        twang.frequency.exponentialRampToValueAtTime(180, now + 0.35);
        twangGain.gain.setValueAtTime(0.4, now);
        twangGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        twang.connect(twangGain);
        twangGain.connect(this.ctx.destination);
        twang.start(now);
        twang.stop(now + 0.4);
    }

    // Iconic CR7 "SIUUUUUU!" vocal + stadium roar synthesis
    playSiuuuu() {
        if (!this.soundEnabled) return;
        this.init();
        const now = this.ctx.currentTime;

        // 1. Vocal Formant Synthesis for "S-I-U-U-U-U!"
        // Male chest voice fundamental around 125Hz to 110Hz drop
        const f0 = this.ctx.createOscillator();
        f0.type = 'sawtooth';
        f0.frequency.setValueAtTime(140, now); // Initial pitch
        f0.frequency.linearRampToValueAtTime(125, now + 0.2); // S-I
        f0.frequency.linearRampToValueAtTime(110, now + 0.6); // U-U
        f0.frequency.exponentialRampToValueAtTime(85, now + 1.6); // -U-U-U drop

        // Formant 1 (Vocal tract resonance ~ 350 Hz for /u/)
        const f1 = this.ctx.createBiquadFilter();
        f1.type = 'bandpass';
        f1.frequency.setValueAtTime(550, now); // /i/
        f1.frequency.linearRampToValueAtTime(320, now + 0.3); // transition to /u/
        f1.Q.value = 4.5;

        // Formant 2 (~ 850 Hz for /u/)
        const f2 = this.ctx.createBiquadFilter();
        f2.type = 'bandpass';
        f2.frequency.setValueAtTime(1800, now); // /i/
        f2.frequency.linearRampToValueAtTime(820, now + 0.3); // transition to /u/
        f2.Q.value = 4.0;

        // Vocal Gain envelope
        const vocalGain = this.ctx.createGain();
        vocalGain.gain.setValueAtTime(0.01, now);
        vocalGain.gain.linearRampToValueAtTime(0.85, now + 0.15); // Powerful attack
        vocalGain.gain.setValueAtTime(0.85, now + 0.9);
        vocalGain.gain.exponentialRampToValueAtTime(0.001, now + 1.7);

        f0.connect(f1);
        f0.connect(f2);
        f1.connect(vocalGain);
        f2.connect(vocalGain);
        vocalGain.connect(this.ctx.destination);

        f0.start(now);
        f0.stop(now + 1.7);

        // 2. Initial "Sssss" consonant burst
        const sBufferSize = this.ctx.sampleRate * 0.15;
        const sBuffer = this.ctx.createBuffer(1, sBufferSize, this.ctx.sampleRate);
        const sData = sBuffer.getChannelData(0);
        for (let i = 0; i < sBufferSize; i++) {
            sData[i] = (Math.random() * 2 - 1) * (1 - i / sBufferSize);
        }
        const sSource = this.ctx.createBufferSource();
        sSource.buffer = sBuffer;
        const sFilter = this.ctx.createBiquadFilter();
        sFilter.type = 'highpass';
        sFilter.frequency.value = 4500;
        const sGain = this.ctx.createGain();
        sGain.gain.setValueAtTime(0.4, now);
        sGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        sSource.connect(sFilter);
        sFilter.connect(sGain);
        sGain.connect(this.ctx.destination);
        sSource.start(now);

        // 3. Ground Shockwave Landing Thud
        const shockOsc = this.ctx.createOscillator();
        const shockGain = this.ctx.createGain();
        shockOsc.type = 'sine';
        shockOsc.frequency.setValueAtTime(95, now + 0.1);
        shockOsc.frequency.exponentialRampToValueAtTime(25, now + 0.45);
        shockGain.gain.setValueAtTime(0.9, now + 0.1);
        shockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        shockOsc.connect(shockGain);
        shockGain.connect(this.ctx.destination);
        shockOsc.start(now + 0.1);
        shockOsc.stop(now + 0.55);

        // 4. Stadium 80,000 Fans "SIUUU!" Chorus Surge
        this.playGoalRoar();
    }

    playGoalRoar() {
        if (!this.soundEnabled) return;
        this.init();
        const now = this.ctx.currentTime;

        // Stadium Horn (fanfare chord)
        const freqs = [220, 277.18, 329.63, 440];
        freqs.forEach((freq) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.linearRampToValueAtTime(freq * 1.02, now + 0.9);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 1900;

            gain.gain.setValueAtTime(0.0, now);
            gain.gain.linearRampToValueAtTime(0.14, now + 0.12);
            gain.gain.setValueAtTime(0.14, now + 0.8);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 1.4);
        });

        // Crowd Surge
        const bufferSize = this.ctx.sampleRate * 2.2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const crowdSource = this.ctx.createBufferSource();
        crowdSource.buffer = noiseBuffer;

        const crowdFilter = this.ctx.createBiquadFilter();
        crowdFilter.type = 'bandpass';
        crowdFilter.frequency.setValueAtTime(620, now);
        crowdFilter.frequency.linearRampToValueAtTime(1000, now + 0.35);
        crowdFilter.frequency.linearRampToValueAtTime(480, now + 2.2);
        crowdFilter.Q.value = 1.1;

        const crowdGain = this.ctx.createGain();
        crowdGain.gain.setValueAtTime(0.05, now);
        crowdGain.gain.linearRampToValueAtTime(0.65, now + 0.2);
        crowdGain.gain.exponentialRampToValueAtTime(0.01, now + 2.2);

        crowdSource.connect(crowdFilter);
        crowdFilter.connect(crowdGain);
        crowdGain.connect(this.ctx.destination);

        crowdSource.start(now);
    }

    playSaveSound(isPostClang = false) {
        if (!this.soundEnabled) return;
        this.init();
        const now = this.ctx.currentTime;

        // Keeper glove slap sound
        const slapOsc = this.ctx.createOscillator();
        const slapGain = this.ctx.createGain();
        slapOsc.type = 'triangle';
        slapOsc.frequency.setValueAtTime(250, now);
        slapOsc.frequency.exponentialRampToValueAtTime(65, now + 0.16);

        slapGain.gain.setValueAtTime(0.75, now);
        slapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

        slapOsc.connect(slapGain);
        slapGain.connect(this.ctx.destination);
        slapOsc.start(now);
        slapOsc.stop(now + 0.2);

        // Metallic post/crossbar sound if post hit
        if (isPostClang) {
            const postOsc = this.ctx.createOscillator();
            const postGain = this.ctx.createGain();
            postOsc.type = 'sine';
            postOsc.frequency.setValueAtTime(980, now);
            postOsc.frequency.exponentialRampToValueAtTime(960, now + 0.6);
            postGain.gain.setValueAtTime(0.5, now);
            postGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
            postOsc.connect(postGain);
            postGain.connect(this.ctx.destination);
            postOsc.start(now);
            postOsc.stop(now + 0.65);
        }

        // Crowd disappointed groan "Oooooh/Awwww"
        const bufferSize = this.ctx.sampleRate * 1.3;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const groanSource = this.ctx.createBufferSource();
        groanSource.buffer = noiseBuffer;

        const groanFilter = this.ctx.createBiquadFilter();
        groanFilter.type = 'bandpass';
        groanFilter.frequency.setValueAtTime(420, now);
        groanFilter.frequency.exponentialRampToValueAtTime(210, now + 1.1);
        groanFilter.Q.value = 3.2;

        const groanGain = this.ctx.createGain();
        groanGain.gain.setValueAtTime(0.05, now);
        groanGain.gain.linearRampToValueAtTime(0.45, now + 0.15);
        groanGain.gain.exponentialRampToValueAtTime(0.01, now + 1.3);

        groanSource.connect(groanFilter);
        groanFilter.connect(groanGain);
        groanGain.connect(this.ctx.destination);

        groanSource.start(now);
    }

    playStarChime(count = 1) {
        if (!this.soundEnabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50];

        for (let i = 0; i < count; i++) {
            const time = now + i * 0.18;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(notes[Math.min(i, notes.length - 1)], time);

            gain.gain.setValueAtTime(0.01, time);
            gain.gain.exponentialRampToValueAtTime(0.4, time + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(time);
            osc.stop(time + 0.55);
        }
    }

    playHatTrickFanfare() {
        if (!this.soundEnabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const notes = [
            { f: 392.00, d: 0.18, t: 0.00 },
            { f: 523.25, d: 0.18, t: 0.18 },
            { f: 659.25, d: 0.18, t: 0.36 },
            { f: 783.99, d: 0.30, t: 0.54 },
            { f: 1046.50, d: 0.85, t: 0.84 }
        ];

        notes.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.f, now + note.t);

            gain.gain.setValueAtTime(0.01, now + note.t);
            gain.gain.linearRampToValueAtTime(0.42, now + note.t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + note.t);
            osc.stop(now + note.t + note.d);
        });

        this.playGoalRoar();
    }

    playButtonClick() {
        if (!this.soundEnabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(820, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.06);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
    }

    speakCommentary(text, lang = 'pt-PT') {
        if (!this.commentaryEnabled || !('speechSynthesis' in window)) return;
        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.15;
            utterance.pitch = 1.05;
            utterance.lang = lang;
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.warn("Speech commentary error:", e);
        }
    }
}

// Global instance
window.soundEngine = new SoundEngine();
