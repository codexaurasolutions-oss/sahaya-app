export const SPEECH_LEVEL_DB = -48;
export const SILENCE_AUTO_STOP_MS = 2000;

export const isSpeechMetering = metering =>
  Number.isFinite(Number(metering)) && Number(metering) >= SPEECH_LEVEL_DB;

export const hasTrailingSilence = ({speechDetected, lastSpeechAt, now}) =>
  speechDetected === true &&
  Number(lastSpeechAt) > 0 &&
  Number(now) - Number(lastSpeechAt) >= SILENCE_AUTO_STOP_MS;
