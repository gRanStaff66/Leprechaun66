// js/AudioManager.js
export const AudioManager = {
    tracks: {},
    currentTrack: null,
    isMuted: true, // Start muted due to browser policies
    fadeIntervals: {},
    masterVolume: 0.5,

    init() {
        // Map the scene names to your specific audio files
        const sceneAudioMap = {
            'meadow': 'Meadow_Whispers_of_the_Green_Hills.mp3',
            'rainbow': 'Rainbow_Emerald_Arc.mp3',
            'disco': 'Disco_Emerald_Groove_Machine.mp3',
            'campfire': 'Campfire_Emerald_City_Strut.mp3'
        };

        Object.entries(sceneAudioMap).forEach(([scene, filename]) => {
            const audio = new Audio(`audio/${filename}`);
            audio.loop = true;
            audio.volume = 0; // Start at 0 for fading
            this.tracks[scene] = audio;
        });
    },

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted && this.currentTrack) {
            this.fadeTrack(this.currentTrack, 0);
        } else if (!this.isMuted && this.currentTrack) {
            this.currentTrack.play().catch(e => console.log("Autoplay prevented"));
            this.fadeTrack(this.currentTrack, this.masterVolume);
        }
        return this.isMuted;
    },

    setVolume(value) {
        this.masterVolume = parseFloat(value);
        if (!this.isMuted && this.currentTrack) {
            // If currently playing and not muted, update volume immediately (or fade if preferred)
            // For simplicity, let's update current track volume directly if not fading
            if (!this.fadeIntervals[this.currentTrack.src]) {
                this.currentTrack.volume = this.masterVolume;
            } else {
                // If it's currently fading, it will eventually reach the next target volume.
                // But if we want it to reach the NEW master volume, we might need to adjust fadeTrack.
                // Let's just update the target volume for the active fade if possible,
                // but standard fade usually goes to 1 or 0.
                // Re-calling fadeTrack to the new masterVolume is better.
                this.fadeTrack(this.currentTrack, this.masterVolume);
            }
        }
    },

    playScene(sceneName) {
        const nextTrack = this.tracks[sceneName];
        if (!nextTrack || nextTrack === this.currentTrack) return;

        // Fade out current track
        if (this.currentTrack) {
            const prevTrack = this.currentTrack;
            this.fadeTrack(prevTrack, 0, () => {
                prevTrack.pause();
            });
        }

        this.currentTrack = nextTrack;

        // Fade in new track if not muted
        if (!this.isMuted) {
            this.currentTrack.play().catch(e => console.log("Autoplay prevented"));
            this.fadeTrack(this.currentTrack, this.masterVolume);
        }
    },

    // Smooth volume transition helper
    fadeTrack(track, targetVolume, onComplete) {
        if (this.fadeIntervals[track.src]) clearInterval(this.fadeIntervals[track.src]);

        const step = targetVolume > track.volume ? 0.05 : -0.05;

        this.fadeIntervals[track.src] = setInterval(() => {
            let newVolume = track.volume + step;

            if ((step > 0 && newVolume >= targetVolume) || (step < 0 && newVolume <= targetVolume)) {
                track.volume = targetVolume;
                clearInterval(this.fadeIntervals[track.src]);
                delete this.fadeIntervals[track.src];
                if (onComplete) onComplete();
            } else {
                track.volume = Math.max(0, Math.min(1, newVolume));
            }
        }, 50); // 50ms steps for a smooth ~1 second fade
    }
};
