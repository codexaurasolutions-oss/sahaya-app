import {detectSpeechLanguage} from '../src/Utils/speechOutput';

describe('speech output language detection', () => {
  it('uses Telugu for Telugu transcripts', () => {
    expect(detectSpeechLanguage('నాకు డ్రైవర్ కావాలి')).toBe('te-IN');
  });

  it('uses Hindi for Devanagari transcripts', () => {
    expect(detectSpeechLanguage('मुझे ड्राइवर चाहिए')).toBe('hi-IN');
  });

  it('uses Indian English for Latin transcripts', () => {
    expect(detectSpeechLanguage('Find a driver near me')).toBe('en-IN');
  });
});
