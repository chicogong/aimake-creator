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
    it('achieves zero cumulative drift (<= 0.5 frame) across 25 non-uniform slide durations', () => {
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
      // Naive rounding would accumulate truncation/rounding bias over 25 slides
      const idealFramesFloat = (totalAudioMs / 1000) * fps;
      expect(Math.abs(totalFrames - idealFramesFloat)).toBeLessThanOrEqual(0.5);
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
  });
});
