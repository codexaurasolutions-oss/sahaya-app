import {
  hasTrailingSilence,
  isSpeechMetering,
} from '../src/Utils/voiceEndpointing';

describe('voice endpointing', () => {
  it('recognizes audible speech levels', () => {
    expect(isSpeechMetering(-30)).toBe(true);
    expect(isSpeechMetering(-80)).toBe(false);
  });

  it('auto-stops after two seconds of silence following speech', () => {
    expect(
      hasTrailingSilence({
        speechDetected: true,
        lastSpeechAt: 1000,
        now: 2999,
      }),
    ).toBe(false);
    expect(
      hasTrailingSilence({
        speechDetected: true,
        lastSpeechAt: 1000,
        now: 3000,
      }),
    ).toBe(true);
  });

  it('does not auto-stop before any speech is heard', () => {
    expect(
      hasTrailingSilence({
        speechDetected: false,
        lastSpeechAt: 0,
        now: 5000,
      }),
    ).toBe(false);
  });
});
