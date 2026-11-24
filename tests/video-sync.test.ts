import { describe, expect, it, beforeEach } from 'vitest';
import {
  computeCumulativeSlideFrames,
  resolveOptimalVideoEncoder,
  resetVideoEncoderCacheForTesting,
  resolveWorkingFfmpegBinary,
  type VideoEncoderConfig,
} from '../src/renderer/exporter-media.js';

describe('T-05 / Issue #13: Video-Audio Sync & Timeline Drift Mitigation', () => {
  beforeEach(() => {
    resetVideoEncoderCacheForTesting();
  });

  describe('computeCumulativeSlideFrames (Cumulative Timestamp Difference Anchoring)', () => {
    it('achieves zero cumulative drift (<= 0.5 frame) across 25 non-uniform slide durations at 30fps', () => {
      const fps = 30;
      // 25 slides with non-uniform speech durations in milliseconds (totaling ~67.5 seconds)
      const nonUniformDurationsMs = [
        2333, 1785, 4512, 3120, 2677, 1999, 5410, 3215, 2890, 4105,
        1850, 3720, 2450, 3190, 4800, 2210, 1950, 3600, 2800, 4300,
        2100, 3350, 2750, 1800, 3950,
      ];

      const { perSlideFrames, slideFrameOffsets, totalFrames } = computeCumulativeSlideFrames(
        nonUniformDurationsMs.length,
        fps,
        { slideDurationsMs: nonUniformDurationsMs }
      );

      expect(perSlideFrames).toHaveLength(25);
      expect(slideFrameOffsets).toHaveLength(25);

      // Verify continuous monotonically increasing offsets
      let expectedOffset = 0;
      for (let i = 0; i < perSlideFrames.length; i++) {
        expect(slideFrameOffsets[i]).toBe(expectedOffset);
        expect(perSlideFrames[i]).toBeGreaterThanOrEqual(1);
        expectedOffset += perSlideFrames[i];
      }
      expect(totalFrames).toBe(expectedOffset);

      // Calculate total audio duration vs total video frame duration
      const totalAudioMs = nonUniformDurationsMs.reduce((a, b) => a + b, 0);
      const totalVideoMs = (totalFrames / fps) * 1000;
      const driftMs = Math.abs(totalAudioMs - totalVideoMs);
      const oneFrameMs = 1000 / fps; // 33.33ms

      // Audio and video duration difference must be strictly <= 0.5 frame (< 16.7ms at 30fps)
      expect(driftMs).toBeLessThanOrEqual(oneFrameMs * 0.5 + 0.001);

      // Contrast with naive unanchored rounding to demonstrate drift elimination
      let naiveTotalFrames = 0;
      for (const ms of nonUniformDurationsMs) {
        naiveTotalFrames += Math.round((ms / 1000) * fps);
      }
      const idealFramesFloat = (totalAudioMs / 1000) * fps;
      expect(Math.abs(totalFrames - idealFramesFloat)).toBeLessThanOrEqual(0.5);
    });

    it('validates 20+ slides deck at 60fps has total frames and audio duration alignment error <= 1 frame', () => {
      const fps = 60;
      // 24 slides with realistic, fractional millisecond TTS audio lengths
      const longDeckAudioDurationsMs = [
        2145.4, 3892.1, 1720.6, 4510.9, 2834.3, 1945.7, 5120.2, 3410.8,
        2290.5, 4180.1, 3050.4, 2670.8, 1890.2, 3740.6, 4920.3, 2310.5,
        1980.7, 3620.1, 2790.4, 4450.8, 2210.3, 3180.6, 2840.2, 3910.5,
      ];

      expect(longDeckAudioDurationsMs.length).toBeGreaterThanOrEqual(20);

      const plan = computeCumulativeSlideFrames(
        longDeckAudioDurationsMs.length,
        fps,
        { slideDurationsMs: longDeckAudioDurationsMs }
      );

      expect(plan.perSlideFrames).toHaveLength(longDeckAudioDurationsMs.length);
      expect(plan.slideFrameOffsets).toHaveLength(longDeckAudioDurationsMs.length);

      const totalAudioMs = longDeckAudioDurationsMs.reduce((a, b) => a + b, 0);
      const idealTotalFrames = (totalAudioMs * fps) / 1000;

      // 1. Total frame alignment error must be strictly <= 1 frame (specifically <= 0.5 frame)
      const frameError = Math.abs(plan.totalFrames - idealTotalFrames);
      expect(frameError).toBeLessThanOrEqual(0.5);
      expect(frameError).toBeLessThanOrEqual(1.0);

      // 2. Alignment drift in milliseconds must be <= 1 frame duration (16.67ms at 60fps)
      const oneFrameMs = 1000 / fps; // 16.667ms
      const videoDurationMs = (plan.totalFrames / fps) * 1000;
      const durationDiffMs = Math.abs(videoDurationMs - totalAudioMs);
      expect(durationDiffMs).toBeLessThanOrEqual(oneFrameMs * 0.5 + 0.001);
      expect(durationDiffMs).toBeLessThanOrEqual(15.0); // Conforms to Issue #13 < 15ms target!

      // 3. Every intermediate slide boundary must also stay anchored within <= 0.5 frame
      let runningAudioMs = 0;
      for (let i = 0; i < longDeckAudioDurationsMs.length; i++) {
        expect(plan.slideFrameOffsets[i]).toBe(Math.round((runningAudioMs * fps) / 1000));
        runningAudioMs += longDeckAudioDurationsMs[i];
        const currentEndFrame = plan.slideFrameOffsets[i] + plan.perSlideFrames[i];
        const expectedEndFrame = Math.round((runningAudioMs * fps) / 1000);
        expect(currentEndFrame).toBe(expectedEndFrame);
      }
    });

    it('maintains microsecond-level precision and prevents multi-frame cumulative drift', () => {
      // Create a 30-slide deck where each slide has a duration that ends in .500 frame to test rounding bias
      const fps = 30;
      const slideCount = 30;
      // 2550 ms at 30 fps = 76.5 frames. Naive per-slide Math.round(76.5) = 77 frames (+0.5 frame per slide).
      // Over 30 slides, naive accumulation produces 30 * 77 = 2310 frames (+15 frames = +500ms audio drift!).
      const biasedDurationsMs = Array(slideCount).fill(2550);

      const plan = computeCumulativeSlideFrames(slideCount, fps, {
        slideDurationsMs: biasedDurationsMs,
      });

      const totalAudioMs = slideCount * 2550; // 76500 ms
      const expectedTotalFrames = (totalAudioMs * fps) / 1000; // Exactly 2295 frames!

      // Cumulative anchoring stays perfectly on 2295 frames!
      expect(plan.totalFrames).toBe(expectedTotalFrames);
      expect(Math.abs(plan.totalFrames - expectedTotalFrames)).toBe(0);

      // Naive unanchored calculation would have suffered 15 frames of cumulative drift
      const naiveTotal = biasedDurationsMs.reduce((acc, ms) => acc + Math.round((ms / 1000) * fps), 0);
      expect(naiveTotal).toBe(2310);
      expect(naiveTotal - plan.totalFrames).toBe(15); // Demonstrates 15-frame drift eliminated!
    });

    it('handles uniform default secondsPerSlide cleanly', () => {
      const fps = 24;
      const slideCount = 10;
      const secondsPerSlide = 3;

      const plan = computeCumulativeSlideFrames(slideCount, fps, {
        secondsPerSlide,
      });

      expect(plan.perSlideFrames).toHaveLength(10);
      for (const count of plan.perSlideFrames) {
        expect(count).toBe(72); // 3s * 24fps = 72 frames
      }
      expect(plan.totalFrames).toBe(720);
      expect(plan.slideFrameOffsets[0]).toBe(0);
      expect(plan.slideFrameOffsets[1]).toBe(72);
      expect(plan.slideFrameOffsets[9]).toBe(648);
    });

    it('enforces minTotalFrames clamp on short decks', () => {
      const fps = 30;
      const plan = computeCumulativeSlideFrames(1, fps, {
        slideDurationsMs: [100], // 100ms = 3 frames
        minTotalFrames: 12,
      });

      expect(plan.perSlideFrames).toEqual([3]);
      expect(plan.totalFrames).toBe(12);
    });

    it('returns empty frame arrays when slideCount is 0', () => {
      const plan = computeCumulativeSlideFrames(0, 30);
      expect(plan.perSlideFrames).toEqual([]);
      expect(plan.slideFrameOffsets).toEqual([]);
      expect(plan.totalFrames).toBe(12);
    });
  });

  describe('resolveOptimalVideoEncoder (Hardware Acceleration & Encoder Fallback)', () => {
    it('returns libx264 when explicitly requested', async () => {
      const ffmpegBin = await resolveWorkingFfmpegBinary();
      const config = await resolveOptimalVideoEncoder(ffmpegBin, 'libx264');

      expect(config.encoder).toBe('libx264');
      expect(config.args).toContain('libx264');
      expect(config.args).toContain('yuv420p');
    });

    it('resolves encoder cleanly in auto mode without crashing', async () => {
      const ffmpegBin = await resolveWorkingFfmpegBinary();
      const config = await resolveOptimalVideoEncoder(ffmpegBin, 'auto');

      expect(['h264_videotoolbox', 'libx264']).toContain(config.encoder);
      expect(config.args.length).toBeGreaterThanOrEqual(4);

      // Verify cached instance returns identical config
      const cached = await resolveOptimalVideoEncoder(ffmpegBin);
      expect(cached).toBe(config);
    });

    it('gracefully falls back to libx264 if h264_videotoolbox is unavailable or probe fails', async () => {
      // Pass a non-existent binary or failing probe to ensure fallback to libx264
      const fallbackConfig = await resolveOptimalVideoEncoder('invalid_probe_binary', 'h264_videotoolbox');
      expect(fallbackConfig.encoder).toBe('libx264');
      expect(fallbackConfig.args).toContain('libx264');
      expect(fallbackConfig.args).toContain('ultrafast');
    });
  });
});
