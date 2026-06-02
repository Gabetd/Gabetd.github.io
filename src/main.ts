import './styles.css'

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}

type ScaleDefinition = {
  name: string
  intervals: number[]
}

type SheetMusicSong = {
  name: string
  notes: string
}

type PitchResult = {
  frequency: number
  confidence: number
  rms: number
}

type NoteResult = {
  midi: number
  name: string
  octave: number
  noteIndex: number
  targetFrequency: number
  cents: number
  staffStep?: number
}

type AudioInputState = 'connected-listening' | 'connected-not-listening' | 'not-connected' | 'not-able-to-connect'
type NoteDisplayMode = 'symbols' | 'letters'

type StaffNote = NoteResult & {
  id: number
  capturedAt: number
  capturedBeat: number
  lastHeardAt: number
  confidence: number
  frequency: number
}

type SheetMusicNote = NoteResult & {
  id: number
  startBeat: number
  durationBeats: number
  label: string
  isRest: false
}

type SheetMusicRest = {
  id: number
  startBeat: number
  durationBeats: number
  label: string
  isRest: true
}

type SheetMusicItem = SheetMusicNote | SheetMusicRest

type ParsedSheetMusicUpload = {
  items: SheetMusicItem[]
  normalizedText: string
  format: string
  detectedBpm: number | null
}

type StaffLineGroup = {
  lines: number[]
  gap: number
  top: number
  bottom: number
}

type NoteHeadScore = {
  score: number
  darkPixels: number
  leftPixels: number
  rightPixels: number
  topPixels: number
  bottomPixels: number
}

type ImageNoteCandidate = {
  x: number
  y: number
  staffStep: number
  score: number
  accidentalOffset: number
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const STAFF_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const LETTER_INDEX_BY_NOTE: Record<string, number> = {
  C: 0,
  'C#': 0,
  D: 1,
  'D#': 1,
  E: 2,
  F: 3,
  'F#': 3,
  G: 4,
  'G#': 4,
  A: 5,
  'A#': 5,
  B: 6
}
const NOTE_INDEX_BY_SPELLING: Record<string, number> = {
  C: 0,
  'B#': 0,
  'C#': 1,
  DB: 1,
  D: 2,
  'D#': 3,
  EB: 3,
  E: 4,
  FB: 4,
  'E#': 5,
  F: 5,
  'F#': 6,
  GB: 6,
  G: 7,
  'G#': 8,
  AB: 8,
  A: 9,
  'A#': 10,
  BB: 10,
  B: 11,
  CB: 11
}

const SCALES: Record<string, ScaleDefinition> = {
  chromatic: {
    name: 'Chromatic',
    intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  },
  major: {
    name: 'Major',
    intervals: [0, 2, 4, 5, 7, 9, 11]
  },
  naturalMinor: {
    name: 'Natural Minor',
    intervals: [0, 2, 3, 5, 7, 8, 10]
  },
  harmonicMinor: {
    name: 'Harmonic Minor',
    intervals: [0, 2, 3, 5, 7, 8, 11]
  },
  majorPentatonic: {
    name: 'Major Pentatonic',
    intervals: [0, 2, 4, 7, 9]
  },
  minorPentatonic: {
    name: 'Minor Pentatonic',
    intervals: [0, 3, 5, 7, 10]
  },
  blues: {
    name: 'Blues',
    intervals: [0, 3, 5, 6, 7, 10]
  }
}

const DEFAULT_INPUT_VALUE = '__default__'
const STAFF_PIXELS_PER_BEAT = 92
const SHEET_MUSIC_SONGS: SheetMusicSong[] = [
  {
    name: 'Twinkle Twinkle Little Star',
    notes: `C4 C4 G4 G4 A4 A4 G4:2
F4 F4 E4 E4 D4 D4 C4:2
G4 G4 F4 F4 E4 E4 D4:2
G4 G4 F4 F4 E4 E4 D4:2
C4 C4 G4 G4 A4 A4 G4:2
F4 F4 E4 E4 D4 D4 C4:2`
  },
  {
    name: 'Hot Cross Buns',
    notes: `E4 D4 C4:2
E4 D4 C4:2
C4 C4 C4 C4
D4 D4 D4 D4
E4 D4 C4:2`
  },
  {
    name: 'Row, Row, Row Your Boat',
    notes: `C4 C4 C4 D4 E4:2
E4 D4 E4 F4 G4:4
C5 C5 C5 G4 G4 G4
E4 E4 E4 C4 C4 C4
G4 F4 E4 D4 C4:4`
  },
  {
    name: 'London Bridge',
    notes: `G4 A4 G4 F4 E4 F4 G4:2
D4 E4 F4 E4 F4 G4:2
G4 A4 G4 F4 E4 F4 G4:2
D4 G4 E4 C4:4`
  },
  {
    name: 'Ode to Joy',
    notes: `E4 E4 F4 G4
G4 F4 E4 D4
C4 C4 D4 E4
E4 D4 D4:2

E4 E4 F4 G4
G4 F4 E4 D4
C4 C4 D4 E4
D4 C4 C4:2`
  },
  {
    name: 'Jingle Bells (Chorus)',
    notes: `E4 E4 E4:2
E4 E4 E4:2
E4 G4 C4 D4 E4:4

F4 F4 F4 F4
F4 E4 E4 E4
E4 D4 D4 E4
D4 G4:4`
  },
  {
    name: 'Happy Birthday',
    notes: `C4 C4 D4 C4 F4 E4:2
C4 C4 D4 C4 G4 F4:2
C4 C4 C5 A4 F4 E4 D4:2
A#4 A#4 A4 F4 G4 F4:4`
  },
  {
    name: 'Mary Had a Little Lamb',
    notes: `E4 D4 C4 D4 E4 E4 E4:2
D4 D4 D4:2
E4 G4 G4:2

E4 D4 C4 D4 E4 E4 E4 E4
D4 D4 E4 D4 C4:4`
  }
]

const DEFAULT_SHEET_MUSIC = SHEET_MUSIC_SONGS[0]?.notes ?? 'C4 D4 E4 F4 | G4:2 G4:2 | A4 B4 C5:2 R:2'
const DEFAULT_SHEET_MUSIC_DELAY_SECONDS = 3

const toggleButton = requireElement<HTMLButtonElement>('toggle-listening')
const statusDot = requireElement<HTMLSpanElement>('status-dot')
const statusText = requireElement<HTMLSpanElement>('status-text')
const audioInputSelect = requireElement<HTMLSelectElement>('audio-input-select')
const refreshInputsButton = requireElement<HTMLButtonElement>('refresh-inputs')
const noteName = requireElement<HTMLSpanElement>('note-name')
const octave = requireElement<HTMLSpanElement>('octave')
const frequency = requireElement<HTMLElement>('frequency')
const targetFrequency = requireElement<HTMLElement>('target-frequency')
const cents = requireElement<HTMLElement>('cents')
const meterNeedle = requireElement<HTMLSpanElement>('meter-needle')
const keySelect = requireElement<HTMLSelectElement>('key-select')
const scaleSelect = requireElement<HTMLSelectElement>('scale-select')
const sensitivity = requireElement<HTMLInputElement>('sensitivity')
const bpmInput = requireElement<HTMLInputElement>('bpm-input')
const sheetMusicDelayInput = requireElement<HTMLInputElement>('sheet-music-delay')
const noteDisplaySelect = requireElement<HTMLSelectElement>('note-display-select')
const staffLetterLabelsToggle = requireElement<HTMLInputElement>('staff-letter-labels-toggle')
const sheetMusicSongSelect = requireElement<HTMLSelectElement>('sheet-music-song-select')
const sheetMusicFileInput = document.getElementById('sheet-music-file') as HTMLInputElement | null
const sheetMusicInput = requireElement<HTMLTextAreaElement>('sheet-music-input')
const loadSheetMusicButton = requireElement<HTMLButtonElement>('load-sheet-music')
const restartSheetMusicButton = requireElement<HTMLButtonElement>('restart-sheet-music')
const toggleStaffMovementButton = requireElement<HTMLButtonElement>('toggle-staff-movement')
const sheetMusicPlaybackStatus = requireElement<HTMLParagraphElement>('sheet-music-playback-status')
const sheetMusicStatus = requireElement<HTMLParagraphElement>('sheet-music-status')
const sheetMusicCountdown = requireElement<HTMLDivElement>('sheet-music-countdown')
const sheetMusicCountdownValue = requireElement<HTMLSpanElement>('sheet-music-countdown-value')
const sheetMusicCountdownBar = requireElement<HTMLSpanElement>('sheet-music-countdown-bar')
const scaleTitle = requireElement<HTMLHeadingElement>('scale-title')
const scaleMessage = requireElement<HTMLParagraphElement>('scale-message')
const scaleStrip = requireElement<HTMLDivElement>('scale-strip')
const staffCanvas = requireElement<HTMLCanvasElement>('staff-canvas')
const waveformCanvas = requireElement<HTMLCanvasElement>('waveform')
const clearStaffButton = requireElement<HTMLButtonElement>('clear-staff')
const staffContext = staffCanvas.getContext('2d')
const waveformContext = waveformCanvas.getContext('2d')

let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let mediaStream: MediaStream | null = null
let animationFrameId = 0
let staffAnimationFrameId = 0
let sheetMusicIsPlaying = true
let sheetMusicPausedAt: number | null = null
let staffResumeTimeoutId: number | null = null
let staffResumeDelayStartedAt: number | null = null
let timeData = new Float32Array(0)
let lastStableNote: NoteResult | null = null
let audioInputs: MediaDeviceInfo[] = []
let selectedInputId = DEFAULT_INPUT_VALUE
let latestAudioState: AudioInputState = 'not-connected'
let staffNotes: StaffNote[] = []
let activeStaffNote: StaffNote | null = null
let sheetMusicItems: SheetMusicItem[] = []
let nextStaffNoteId = 1
let nextSheetMusicItemId = 1
let staffStartedAt = performance.now()

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id)

  if (!element) {
    throw new Error(`Missing element #${id}`)
  }

  return element as T
}

function clearStaffResumeDelay() {
  if (staffResumeTimeoutId === null) {
    staffResumeDelayStartedAt = null
    return
  }

  window.clearTimeout(staffResumeTimeoutId)
  staffResumeTimeoutId = null
  staffResumeDelayStartedAt = null
}



function resumeSheetMusicPlayback() {
  const now = performance.now()

  if (sheetMusicPausedAt !== null) {
    staffStartedAt += now - sheetMusicPausedAt
  }

  sheetMusicIsPlaying = true
  sheetMusicPausedAt = null
  ensureStaffAnimation()
}

function initializeControls() {
  for (const note of NOTE_NAMES) {
    const option = document.createElement('option')
    option.value = note
    option.textContent = note
    keySelect.append(option)
  }

  keySelect.value = 'C'

  for (const [key, scale] of Object.entries(SCALES)) {
    const option = document.createElement('option')
    option.value = key
    option.textContent = scale.name
    scaleSelect.append(option)
  }

  scaleSelect.value = 'chromatic'
  bpmInput.value = '100'
  sheetMusicDelayInput.value = String(DEFAULT_SHEET_MUSIC_DELAY_SECONDS)
  noteDisplaySelect.value = 'symbols'
  staffLetterLabelsToggle.checked = false
  initializeSheetMusicSongOptions()
  sheetMusicInput.value = DEFAULT_SHEET_MUSIC
  renderScale()
  loadSelectedSheetMusicSong({ resetTimeline: true })
  updateSheetMusicPlaybackButton()
  ensureStaffAnimation()
  drawStaff(performance.now())
}

function initializeSheetMusicSongOptions() {
  sheetMusicSongSelect.replaceChildren()

  for (const song of SHEET_MUSIC_SONGS) {
    const option = document.createElement('option')
    option.value = song.name
    option.textContent = song.name
    sheetMusicSongSelect.append(option)
  }

  sheetMusicSongSelect.value = SHEET_MUSIC_SONGS[0]?.name ?? ''
}

function getSelectedSheetMusicSong() {
  return SHEET_MUSIC_SONGS.find(song => song.name === sheetMusicSongSelect.value) ?? SHEET_MUSIC_SONGS[0]
}

function loadSelectedSheetMusicSong(options: { resetTimeline: boolean }) {
  const song = getSelectedSheetMusicSong()

  if (!song) {
    return
  }

  sheetMusicInput.value = song.notes
  loadSheetMusicFromInput(options, `Loaded ${song.name}.`)
}

async function initializeAudioInputs() {
  if (!navigator.mediaDevices?.enumerateDevices) {
    setAudioInputState('not-able-to-connect', 'Not able to connect: this browser cannot list microphone devices.')
    audioInputSelect.disabled = true
    toggleButton.disabled = true
    return
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    audioInputs = devices.filter(device => device.kind === 'audioinput')

    const selectedExists = selectedInputId === DEFAULT_INPUT_VALUE || audioInputs.some(device => device.deviceId === selectedInputId)

    if (!selectedExists) {
      selectedInputId = DEFAULT_INPUT_VALUE
    }

    renderAudioInputOptions()

    if (audioInputs.length === 0) {
      if (analyser) {
        stopListening()
      }

      setAudioInputState('not-connected', 'Not connected: no audio input devices were found.')
      toggleButton.disabled = true
      return
    }

    toggleButton.disabled = false

    if (analyser) {
      setAudioInputState('connected-listening', `Connected: listening to ${getSelectedInputLabel()}.`)
    } else if (latestAudioState !== 'not-able-to-connect') {
      setAudioInputState('connected-not-listening', `Connected: not listening. Selected input: ${getSelectedInputLabel()}.`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown device enumeration error'
    setAudioInputState('not-able-to-connect', `Not able to connect: ${message}`)
    toggleButton.disabled = true
  }
}

function renderAudioInputOptions() {
  audioInputSelect.replaceChildren()

  const defaultOption = document.createElement('option')
  defaultOption.value = DEFAULT_INPUT_VALUE
  defaultOption.textContent = 'Default microphone'
  audioInputSelect.append(defaultOption)

  audioInputs.forEach((device, index) => {
    const option = document.createElement('option')
    option.value = device.deviceId
    option.textContent = device.label || `Microphone ${index + 1}`
    audioInputSelect.append(option)
  })

  audioInputSelect.value = selectedInputId
  audioInputSelect.disabled = audioInputs.length === 0
}

function getSelectedInputLabel() {
  if (selectedInputId === DEFAULT_INPUT_VALUE) {
    return 'default microphone'
  }

  const selected = audioInputs.find(device => device.deviceId === selectedInputId)
  return selected?.label || 'selected microphone'
}

function getSelectedScaleNotes() {
  const rootIndex = NOTE_NAMES.indexOf(keySelect.value)
  const scale = SCALES[scaleSelect.value]

  return scale.intervals.map(interval => (rootIndex + interval) % 12)
}

function renderScale(activeNoteIndex?: number) {
  const scale = SCALES[scaleSelect.value]
  const scaleNotes = getSelectedScaleNotes()

  scaleTitle.textContent = `${keySelect.value} ${scale.name}`
  scaleStrip.replaceChildren()

  for (const noteIndex of scaleNotes) {
    const note = document.createElement('div')
    note.className = 'scale-note'
    note.textContent = NOTE_NAMES[noteIndex]

    if (activeNoteIndex === noteIndex) {
      note.classList.add('active')
    }

    scaleStrip.append(note)
  }
}

async function startListening() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setAudioInputState('not-able-to-connect', 'Not able to connect: microphone access requires HTTPS or localhost in a modern browser.')
    return
  }

  try {
    setAudioInputState('connected-not-listening', `Connected: not listening. Opening ${getSelectedInputLabel()}...`)

    const audioConstraints: MediaTrackConstraints = {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false
    }

    if (selectedInputId !== DEFAULT_INPUT_VALUE) {
      audioConstraints.deviceId = { exact: selectedInputId }
    }

    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: audioConstraints
    })

    await initializeAudioInputs()

    const AudioContextCtor = window.AudioContext ?? window.webkitAudioContext
    audioContext = new AudioContextCtor()

    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }

    const source = audioContext.createMediaStreamSource(mediaStream)
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 4096
    analyser.smoothingTimeConstant = 0

    source.connect(analyser)
    timeData = new Float32Array(analyser.fftSize)

    toggleButton.textContent = 'Stop listening'
    stopStaffAnimation()
    staffNotes = []
    activeStaffNote = null
    setAudioInputState('connected-listening', `Connected: listening to ${getSelectedInputLabel()}.`)
    animationFrameId = requestAnimationFrame(tick)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown microphone error'
    setAudioInputState('not-able-to-connect', `Not able to connect: ${message}`)
    stopListening({ keepConnectionStatus: true })
  }
}

function stopListening(options: { keepConnectionStatus?: boolean } = {}) {
  cancelAnimationFrame(animationFrameId)
  animationFrameId = 0

  if (mediaStream) {
    for (const track of mediaStream.getTracks()) {
      track.stop()
    }
  }

  if (audioContext) {
    void audioContext.close()
  }

  mediaStream = null
  audioContext = null
  analyser = null
  lastStableNote = null
  activeStaffNote = null
  toggleButton.textContent = 'Start listening'
  clearReadout()
  renderScale()
  clearWaveform()
  drawStaff(performance.now())
  ensureStaffAnimation()

  if (!options.keepConnectionStatus) {
    if (audioInputs.length > 0) {
      setAudioInputState('connected-not-listening', `Connected: not listening. Selected input: ${getSelectedInputLabel()}.`)
    } else {
      setAudioInputState('not-connected', 'Not connected: no audio input devices were found.')
    }
  }
}

function tick(now: number) {
  if (!analyser || !audioContext) {
    return
  }

  analyser.getFloatTimeDomainData(timeData)
  drawWaveform(timeData)

  const minimumRms = Number(sensitivity.value)
  const pitch = detectPitchYin(timeData, audioContext.sampleRate, minimumRms)

  if (pitch) {
    const note = frequencyToNote(pitch.frequency)
    lastStableNote = smoothNote(lastStableNote, note)
    updateReadout(lastStableNote, pitch, now)
    recordStaffNote(lastStableNote, pitch, now)
  } else {
    activeStaffNote = null
    setNoPitchReadout(now)
  }

  drawStaff(now)
  animationFrameId = requestAnimationFrame(tick)
}

function detectPitchYin(buffer: Float32Array, sampleRate: number, minimumRms: number): PitchResult | null {
  const rms = calculateRms(buffer)

  if (rms < minimumRms) {
    return null
  }

  const minFrequency = 50
  const maxFrequency = 2000
  const threshold = 0.12
  const minTau = Math.floor(sampleRate / maxFrequency)
  const maxTau = Math.min(Math.floor(sampleRate / minFrequency), buffer.length - 1)
  const difference = new Float32Array(maxTau + 1)
  const cumulativeMeanNormalizedDifference = new Float32Array(maxTau + 1)

  for (let tau = 1; tau <= maxTau; tau += 1) {
    let sum = 0

    for (let index = 0; index < buffer.length - tau; index += 1) {
      const delta = buffer[index] - buffer[index + tau]
      sum += delta * delta
    }

    difference[tau] = sum
  }

  cumulativeMeanNormalizedDifference[0] = 1
  let runningSum = 0

  for (let tau = 1; tau <= maxTau; tau += 1) {
    runningSum += difference[tau]
    cumulativeMeanNormalizedDifference[tau] = runningSum === 0
      ? 1
      : difference[tau] * tau / runningSum
  }

  let tauEstimate = -1

  for (let tau = minTau; tau <= maxTau; tau += 1) {
    if (cumulativeMeanNormalizedDifference[tau] < threshold) {
      while (
        tau + 1 <= maxTau &&
        cumulativeMeanNormalizedDifference[tau + 1] < cumulativeMeanNormalizedDifference[tau]
      ) {
        tau += 1
      }

      tauEstimate = tau
      break
    }
  }

  if (tauEstimate === -1) {
    return null
  }

  const betterTau = refineTau(cumulativeMeanNormalizedDifference, tauEstimate)
  const detectedFrequency = sampleRate / betterTau

  if (!Number.isFinite(detectedFrequency) || detectedFrequency < minFrequency || detectedFrequency > maxFrequency) {
    return null
  }

  return {
    frequency: detectedFrequency,
    confidence: 1 - cumulativeMeanNormalizedDifference[tauEstimate],
    rms
  }
}

function refineTau(values: Float32Array, tau: number) {
  const left = values[tau - 1] ?? values[tau]
  const center = values[tau]
  const right = values[tau + 1] ?? values[tau]
  const divisor = left - 2 * center + right

  if (Math.abs(divisor) < 0.000001) {
    return tau
  }

  return tau + (left - right) / (2 * divisor)
}

function calculateRms(buffer: Float32Array) {
  let sum = 0

  for (const sample of buffer) {
    sum += sample * sample
  }

  return Math.sqrt(sum / buffer.length)
}

function frequencyToNote(inputFrequency: number): NoteResult {
  const midi = Math.round(69 + 12 * Math.log2(inputFrequency / 440))
  return midiToNote(midi, inputFrequency)
}

function midiToNote(midi: number, inputFrequency = midiToFrequency(midi)): NoteResult {
  const target = midiToFrequency(midi)
  const centsOffset = 1200 * Math.log2(inputFrequency / target)
  const noteIndex = ((midi % 12) + 12) % 12

  return {
    midi,
    name: NOTE_NAMES[noteIndex],
    octave: Math.floor(midi / 12) - 1,
    noteIndex,
    targetFrequency: target,
    cents: centsOffset,
    staffStep: getStaffStepForMidi(midi)
  }
}

function midiToFrequency(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12)
}

function smoothNote(previous: NoteResult | null, next: NoteResult) {
  if (!previous || previous.midi !== next.midi) {
    return next
  }

  return {
    ...next,
    cents: previous.cents * 0.65 + next.cents * 0.35,
    targetFrequency: next.targetFrequency
  }
}

function updateReadout(note: NoteResult, pitch: PitchResult, now: number) {
  noteName.textContent = note.name
  octave.textContent = String(note.octave)
  frequency.textContent = `${pitch.frequency.toFixed(2)} Hz`
  targetFrequency.textContent = `${note.targetFrequency.toFixed(2)} Hz`
  cents.textContent = `${formatSigned(note.cents)} cents`

  const needlePosition = clamp((note.cents + 50) / 100 * 100, 0, 100)
  meterNeedle.style.left = `${needlePosition}%`

  const scaleNotes = getSelectedScaleNotes()
  const isInScale = scaleNotes.includes(note.noteIndex)
  renderScale(note.noteIndex)

  const target = getCurrentSheetMusicNote(now)
  const targetText = target ? ` Current sheet target: ${target.name}${target.octave}.` : ''

  if (isInScale) {
    scaleMessage.textContent = `${note.name}${note.octave} is in ${keySelect.value} ${SCALES[scaleSelect.value].name}. Confidence ${Math.round(pitch.confidence * 100)}%.${targetText}`
  } else {
    const nearest = findNearestScaleNote(note.noteIndex, scaleNotes)
    scaleMessage.textContent = `${note.name}${note.octave} is outside ${keySelect.value} ${SCALES[scaleSelect.value].name}. Nearest scale tone: ${NOTE_NAMES[nearest]}.${targetText}`
  }
}

function recordStaffNote(note: NoteResult, pitch: PitchResult, now: number) {
  const bpm = getBpm()
  const captureIntervalMs = Math.max(140, 60000 / bpm / 2)
  const current = activeStaffNote

  if (current && current.midi === note.midi && now - current.lastHeardAt < captureIntervalMs) {
    current.lastHeardAt = now
    current.cents = note.cents
    current.frequency = pitch.frequency
    current.confidence = pitch.confidence
    return
  }

  if (current && current.midi === note.midi && now - current.capturedAt < captureIntervalMs) {
    current.lastHeardAt = now
    return
  }

  const staffNote: StaffNote = {
    ...note,
    id: nextStaffNoteId,
    capturedAt: now,
    capturedBeat: getElapsedBeats(now),
    lastHeardAt: now,
    confidence: pitch.confidence,
    frequency: pitch.frequency
  }

  nextStaffNoteId += 1
  staffNotes.push(staffNote)
  activeStaffNote = staffNote
}

function parseSheetMusic(input: string): SheetMusicItem[] {
  const tokens = input
    .replace(/,/g, ' ')
    .split(/\s+/)
    .map(token => token.trim())
    .filter(Boolean)

  const items: SheetMusicItem[] = []
  let beatCursor = 0

  for (const token of tokens) {
    if (/^\|+$/.test(token)) {
      continue
    }

    const [pitchToken, durationToken] = token.split(':')
    const durationBeats = parseDurationBeats(durationToken)

    if (/^(R|REST)$/i.test(pitchToken)) {
      items.push({
        id: nextSheetMusicItemId,
        startBeat: beatCursor,
        durationBeats,
        label: 'Rest',
        isRest: true
      })
      nextSheetMusicItemId += 1
      beatCursor += durationBeats
      continue
    }

    const parsed = parseNoteToken(pitchToken)

    if (!parsed) {
      throw new Error(`Could not parse "${token}". Use notes like C4, F#4, Bb3, R, or C4:2.`)
    }

    const note = midiToNote(parsed.midi)

    items.push({
      ...note,
      staffStep: parsed.staffStep,
      id: nextSheetMusicItemId,
      startBeat: beatCursor,
      durationBeats,
      label: parsed.label,
      isRest: false
    })

    nextSheetMusicItemId += 1
    beatCursor += durationBeats
  }

  return items
}

function parseDurationBeats(durationToken?: string) {
  if (!durationToken) {
    return 1
  }

  const parsed = Number(durationToken)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid duration "${durationToken}". Use a positive beat value like 0.5, 1, 2, or 4.`)
  }

  return clamp(parsed, 0.125, 16)
}

function parseNoteToken(token: string): { midi: number, label: string, staffStep: number } | null {
  const match = /^([A-Ga-g])([#bB]?)(-?\d+)$/.exec(token)

  if (!match) {
    return null
  }

  const letter = match[1].toUpperCase()
  const accidental = match[2] === 'b' ? 'B' : match[2].toUpperCase()
  const octave = Number(match[3])
  const naturalNoteIndex = NOTE_INDEX_BY_SPELLING[letter]
  const accidentalOffset = accidental === '#'
    ? 1
    : accidental === 'B'
      ? -1
      : 0

  if (naturalNoteIndex === undefined) {
    return null
  }

  return {
    midi: (octave + 1) * 12 + naturalNoteIndex + accidentalOffset,
    label: `${letter}${accidental === 'B' ? '♭' : accidental}${octave}`,
    staffStep: getStaffStepForSpelling(letter, octave)
  }
}

function loadSheetMusicFromInput(options: { resetTimeline: boolean }, prefix = 'Loaded typed sheet music.') {
  try {
    nextSheetMusicItemId = 1
    const items = parseSheetMusic(sheetMusicInput.value)
    applyLoadedSheetMusic(items, options, prefix)
  } catch (error) {
    setSheetMusicError(error)
  }

  drawStaff(performance.now())
}

async function loadSheetMusicFromFile() {
  const file = sheetMusicFileInput?.files?.[0]

  if (!file) {
    return
  }

  try {
    if (isUnsupportedSheetFile(file.name)) {
      throw new Error('This browser-only version can upload note text, ABC, XML, MusicXML, or common image files. It does not parse PDFs or compressed .mxl files.')
    }

    const result = isImageSheetMusicFile(file)
      ? await parseImageSheetMusicUpload(file)
      : parseUploadedSheetMusic(file.name, await file.text())

    sheetMusicInput.value = result.normalizedText

    if (result.detectedBpm) {
      bpmInput.value = String(clamp(Math.round(result.detectedBpm), 20, 260))
    }

    const bpmText = result.detectedBpm ? ` BPM was set from the file.` : ''
    applyLoadedSheetMusic(result.items, { resetTimeline: true }, `Uploaded ${file.name} as ${result.format}.${bpmText}`)
  } catch (error) {
    setSheetMusicError(error)
  }

  drawStaff(performance.now())
}

function parseUploadedSheetMusic(filename: string, text: string): ParsedSheetMusicUpload {
  const lowerName = filename.toLowerCase()
  const trimmedText = text.trim()

  if (!trimmedText) {
    throw new Error('The uploaded sheet music file is empty.')
  }

  if (lowerName.endsWith('.xml') || lowerName.endsWith('.musicxml') || /^<\?xml|<score-partwise|<score-timewise/i.test(trimmedText)) {
    return parseMusicXmlUpload(trimmedText)
  }

  if (lowerName.endsWith('.abc') || /^\s*[A-Z]:/m.test(trimmedText) && /^\s*K:/m.test(trimmedText)) {
    return parseAbcUpload(trimmedText)
  }

  nextSheetMusicItemId = 1
  const items = parseSheetMusic(trimmedText)

  return {
    items,
    normalizedText: trimmedText,
    format: 'note text',
    detectedBpm: null as number | null
  }
}

function isUnsupportedSheetFile(filename: string) {
  return /\.(pdf|mxl)$/i.test(filename)
}

function isImageSheetMusicFile(file: File) {
  return file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp)$/i.test(file.name)
}

async function parseImageSheetMusicUpload(file: File): Promise<ParsedSheetMusicUpload> {
  const image = await loadSheetMusicImage(file)
  const maxImageSize = 1600
  const sourceWidth = image.width
  const sourceHeight = image.height
  const scale = Math.min(1, maxImageSize / Math.max(sourceWidth, sourceHeight))
  const width = Math.max(1, Math.round(sourceWidth * scale))
  const height = Math.max(1, Math.round(sourceHeight * scale))
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })

  if (!context) {
    throw new Error('Could not scan that image because this browser did not provide a canvas context.')
  }

  canvas.width = width
  canvas.height = height
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.imageSmoothingEnabled = true
  context.drawImage(image, 0, 0, width, height)

  if ('close' in image && typeof image.close === 'function') {
    image.close()
  }

  const imageData = context.getImageData(0, 0, width, height)
  const grayscale = createGrayscaleMap(imageData.data)
  const threshold = getOtsuThreshold(grayscale)
  const dark = createDarkPixelMap(grayscale, threshold)
  const staves = findStaffLineGroups(dark, width, height)

  if (staves.length === 0) {
    throw new Error('Could not find a clear five-line staff in that image. Use a straight, high-contrast photo or crop around the staff.')
  }

  const candidates = staves.flatMap(staff => findImageNoteCandidates(dark, width, height, staff))

  if (candidates.length === 0) {
    throw new Error('Found staff lines, but could not identify note heads. Crop tighter around printed sheet music and avoid shadows or handwriting.')
  }

  nextSheetMusicItemId = 1
  let beatCursor = 0
  const items = candidates
    .slice()
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .sort((a, b) => getStaffSystemIndex(staves, a.y) - getStaffSystemIndex(staves, b.y) || a.x - b.x)
    .map(candidate => {
      const note = staffStepToNote(candidate.staffStep, candidate.accidentalOffset)
      const item: SheetMusicNote = {
        ...note,
        id: nextSheetMusicItemId,
        startBeat: beatCursor,
        durationBeats: 1,
        label: note.label,
        isRest: false
      }

      nextSheetMusicItemId += 1
      beatCursor += 1
      return item
    })

  return {
    items,
    normalizedText: normalizeSheetMusicItems(items),
    format: `scanned image (${items.length} detected notes, rhythm set to 1 beat each)`,
    detectedBpm: null
  }
}

async function loadSheetMusicImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    return createImageBitmap(file)
  }

  return new Promise((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not load that image file.'))
    }

    image.src = url
  })
}

function createGrayscaleMap(data: Uint8ClampedArray) {
  const grayscale = new Uint8Array(data.length / 4)

  for (let sourceIndex = 0, targetIndex = 0; sourceIndex < data.length; sourceIndex += 4, targetIndex += 1) {
    grayscale[targetIndex] = Math.round(data[sourceIndex] * 0.299 + data[sourceIndex + 1] * 0.587 + data[sourceIndex + 2] * 0.114)
  }

  return grayscale
}

function getOtsuThreshold(grayscale: Uint8Array) {
  const histogram = new Array<number>(256).fill(0)

  for (const value of grayscale) {
    histogram[value] += 1
  }

  const total = grayscale.length
  let sum = 0

  for (let value = 0; value < histogram.length; value += 1) {
    sum += value * histogram[value]
  }

  let backgroundWeight = 0
  let backgroundSum = 0
  let bestVariance = 0
  let bestThreshold = 160

  for (let threshold = 0; threshold < histogram.length; threshold += 1) {
    backgroundWeight += histogram[threshold]

    if (backgroundWeight === 0) {
      continue
    }

    const foregroundWeight = total - backgroundWeight

    if (foregroundWeight === 0) {
      break
    }

    backgroundSum += threshold * histogram[threshold]
    const backgroundMean = backgroundSum / backgroundWeight
    const foregroundMean = (sum - backgroundSum) / foregroundWeight
    const variance = backgroundWeight * foregroundWeight * (backgroundMean - foregroundMean) ** 2

    if (variance > bestVariance) {
      bestVariance = variance
      bestThreshold = threshold
    }
  }

  return clamp(bestThreshold + 12, 70, 210)
}

function createDarkPixelMap(grayscale: Uint8Array, threshold: number) {
  const dark = new Uint8Array(grayscale.length)

  for (let index = 0; index < grayscale.length; index += 1) {
    dark[index] = grayscale[index] <= threshold ? 1 : 0
  }

  return dark
}

function findStaffLineGroups(dark: Uint8Array, width: number, height: number): StaffLineGroup[] {
  const rowCounts = new Array<number>(height).fill(0)

  for (let y = 0; y < height; y += 1) {
    let count = 0
    const offset = y * width

    for (let x = 0; x < width; x += 1) {
      count += dark[offset + x]
    }

    rowCounts[y] = count
  }

  const lineThreshold = Math.max(width * 0.12, getPercentile(rowCounts, 0.9) * 0.72)
  const lineCenters: number[] = []
  let y = 0

  while (y < height) {
    if (rowCounts[y] < lineThreshold) {
      y += 1
      continue
    }

    let weightedSum = 0
    let weight = 0
    const start = y

    while (y < height && rowCounts[y] >= lineThreshold) {
      weightedSum += y * rowCounts[y]
      weight += rowCounts[y]
      y += 1
    }

    const thickness = y - start

    if (weight > 0 && thickness <= 10) {
      lineCenters.push(weightedSum / weight)
    }
  }

  const candidates: Array<StaffLineGroup & { score: number }> = []

  for (let index = 0; index <= lineCenters.length - 5; index += 1) {
    const lines = lineCenters.slice(index, index + 5)
    const gaps = lines.slice(1).map((line, gapIndex) => line - lines[gapIndex])
    const averageGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
    const maxGapDelta = Math.max(...gaps.map(gap => Math.abs(gap - averageGap)))

    if (averageGap < 5 || averageGap > 70 || maxGapDelta > averageGap * 0.26) {
      continue
    }

    const score = lines.reduce((sum, line) => sum + rowCounts[Math.round(line)], 0)
    candidates.push({
      lines,
      gap: averageGap,
      top: lines[0],
      bottom: lines[4],
      score
    })
  }

  const selected: StaffLineGroup[] = []

  for (const candidate of candidates.sort((a, b) => b.score - a.score)) {
    const overlaps = selected.some(staff => Math.abs(staff.top - candidate.top) < candidate.gap * 3)

    if (!overlaps) {
      selected.push(candidate)
    }
  }

  return selected.sort((a, b) => a.top - b.top)
}

function getPercentile(values: number[], percentile: number) {
  const sorted = values.slice().sort((a, b) => a - b)
  const index = clamp(Math.round((sorted.length - 1) * percentile), 0, sorted.length - 1)
  return sorted[index]
}

function findImageNoteCandidates(dark: Uint8Array, width: number, height: number, staff: StaffLineGroup): ImageNoteCandidate[] {
  const bottomLineStep = 4 * 7 + LETTER_INDEX_BY_NOTE.E
  const lineRemovedDark = removeStaffLines(dark, width, height, staff)
  const xStep = Math.max(2, Math.round(staff.gap / 4))
  const leftMargin = Math.min(width * 0.16, staff.gap * 8)
  const rightMargin = Math.max(width - staff.gap * 2, leftMargin)
  const rx = Math.max(4, staff.gap * 0.72)
  const ry = Math.max(3, staff.gap * 0.52)
  const rawCandidates: ImageNoteCandidate[] = []

  for (let staffOffset = -8; staffOffset <= 24; staffOffset += 1) {
    const y = staff.bottom - staffOffset * (staff.gap / 2)

    if (y < 0 || y >= height) {
      continue
    }

    for (let x = leftMargin; x < rightMargin; x += xStep) {
      const score = scoreNoteHead(lineRemovedDark, width, height, x, y, rx, ry)

      if (!isLikelyNoteHeadScore(score, staff.gap)) {
        continue
      }

      const staffStep = bottomLineStep + staffOffset
      rawCandidates.push({
        x,
        y,
        staffStep,
        score: score.score,
        accidentalOffset: detectImageAccidental(lineRemovedDark, width, height, staff, x, y)
      })
    }
  }

  return suppressNearbyImageCandidates(rawCandidates, staff.gap)
}

function removeStaffLines(dark: Uint8Array, width: number, height: number, staff: StaffLineGroup) {
  const cleaned = new Uint8Array(dark)
  const lineRadius = Math.max(1, Math.round(staff.gap * 0.18))

  for (const line of staff.lines) {
    const center = Math.round(line)

    for (let y = Math.max(0, center - lineRadius); y <= Math.min(height - 1, center + lineRadius); y += 1) {
      const offset = y * width

      for (let x = 0; x < width; x += 1) {
        cleaned[offset + x] = 0
      }
    }
  }

  return cleaned
}

function scoreNoteHead(
  dark: Uint8Array,
  width: number,
  height: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number
): NoteHeadScore {
  let area = 0
  let darkPixels = 0
  let leftPixels = 0
  let rightPixels = 0
  let topPixels = 0
  let bottomPixels = 0
  const minX = Math.max(0, Math.floor(cx - rx))
  const maxX = Math.min(width - 1, Math.ceil(cx + rx))
  const minY = Math.max(0, Math.floor(cy - ry))
  const maxY = Math.min(height - 1, Math.ceil(cy + ry))

  for (let y = minY; y <= maxY; y += 1) {
    const normalizedY = (y - cy) / ry
    const offset = y * width

    for (let x = minX; x <= maxX; x += 1) {
      const normalizedX = (x - cx) / rx

      if (normalizedX ** 2 + normalizedY ** 2 > 1) {
        continue
      }

      area += 1

      if (!dark[offset + x]) {
        continue
      }

      darkPixels += 1

      if (x < cx) {
        leftPixels += 1
      } else {
        rightPixels += 1
      }

      if (y < cy) {
        topPixels += 1
      } else {
        bottomPixels += 1
      }
    }
  }

  return {
    score: area > 0 ? darkPixels / area : 0,
    darkPixels,
    leftPixels,
    rightPixels,
    topPixels,
    bottomPixels
  }
}

function isLikelyNoteHeadScore(score: NoteHeadScore, lineGap: number) {
  const minimumSidePixels = Math.max(2, lineGap * 0.18)
  const minimumVerticalPixels = Math.max(2, lineGap * 0.12)

  return score.score >= 0.16 &&
    score.darkPixels >= lineGap * lineGap * 0.12 &&
    score.leftPixels >= minimumSidePixels &&
    score.rightPixels >= minimumSidePixels &&
    score.topPixels >= minimumVerticalPixels &&
    score.bottomPixels >= minimumVerticalPixels
}

function suppressNearbyImageCandidates(candidates: ImageNoteCandidate[], lineGap: number) {
  const selected: ImageNoteCandidate[] = []

  for (const candidate of candidates.sort((a, b) => b.score - a.score)) {
    const overlaps = selected.some(existing => {
      const xDistance = Math.abs(existing.x - candidate.x)
      const yDistance = Math.abs(existing.y - candidate.y)
      return xDistance < lineGap * 1.35 && yDistance < lineGap * 0.95
    })

    if (!overlaps) {
      selected.push(candidate)
    }
  }

  return selected.sort((a, b) => a.x - b.x)
}

function detectImageAccidental(
  dark: Uint8Array,
  width: number,
  height: number,
  staff: StaffLineGroup,
  noteX: number,
  noteY: number
) {
  const minX = Math.max(0, Math.round(noteX - staff.gap * 3.4))
  const maxX = Math.min(width - 1, Math.round(noteX - staff.gap * 0.85))
  const minY = Math.max(0, Math.round(noteY - staff.gap * 1.45))
  const maxY = Math.min(height - 1, Math.round(noteY + staff.gap * 1.45))

  if (minX >= maxX || minY >= maxY) {
    return 0
  }

  const columnCounts = new Array<number>(maxX - minX + 1).fill(0)
  const rowCounts = new Array<number>(maxY - minY + 1).fill(0)
  let totalDark = 0

  for (let y = minY; y <= maxY; y += 1) {
    const offset = y * width

    for (let x = minX; x <= maxX; x += 1) {
      if (!dark[offset + x]) {
        continue
      }

      totalDark += 1
      columnCounts[x - minX] += 1
      rowCounts[y - minY] += 1
    }
  }

  if (totalDark < staff.gap * staff.gap * 0.16) {
    return 0
  }

  const verticalGroups = countProjectionGroups(columnCounts, Math.max(2, (maxY - minY + 1) * 0.18))
  const horizontalGroups = countProjectionGroups(rowCounts, Math.max(2, (maxX - minX + 1) * 0.16))

  if (verticalGroups >= 2 && horizontalGroups >= 2) {
    return 1
  }

  if (verticalGroups >= 1 && horizontalGroups <= 1 && totalDark > staff.gap * staff.gap * 0.24) {
    return -1
  }

  return 0
}

function countProjectionGroups(counts: number[], threshold: number) {
  let groups = 0
  let inGroup = false

  for (const count of counts) {
    if (count >= threshold) {
      if (!inGroup) {
        groups += 1
        inGroup = true
      }

      continue
    }

    inGroup = false
  }

  return groups
}

function staffStepToNote(staffStep: number, accidentalOffset: number): NoteResult & { label: string } {
  const octave = Math.floor(staffStep / 7)
  const letter = STAFF_LETTERS[((staffStep % 7) + 7) % 7]
  const naturalNoteIndex = NOTE_INDEX_BY_SPELLING[letter]
  const midi = (octave + 1) * 12 + naturalNoteIndex + accidentalOffset
  const note = midiToNote(midi)

  return {
    ...note,
    staffStep,
    label: formatPitchLabel(letter, accidentalOffset, octave)
  }
}

function getStaffSystemIndex(staves: StaffLineGroup[], y: number) {
  let bestIndex = 0
  let bestDistance = Number.POSITIVE_INFINITY

  for (let index = 0; index < staves.length; index += 1) {
    const staff = staves[index]
    const center = (staff.top + staff.bottom) / 2
    const distance = Math.abs(center - y)

    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = index
    }
  }

  return bestIndex
}

function applyLoadedSheetMusic(items: SheetMusicItem[], options: { resetTimeline: boolean }, prefix: string) {
  sheetMusicItems = items

  if (options.resetTimeline) {
    restartSheetMusicTimeline()
  }

  const playableNotes = sheetMusicItems.filter(item => !item.isRest).length
  const totalBeats = getTotalSheetMusicBeats(sheetMusicItems)
  const delaySeconds = getStartDelaySeconds()
  const delayText = delaySeconds > 0 ? ` First note starts after ${formatDelaySeconds(delaySeconds)}.` : ''
  sheetMusicStatus.textContent = `${prefix} Loaded ${playableNotes} sheet notes across ${formatBeatCount(totalBeats)} beats.${delayText} Bold notes are the sheet music targets.`
}

function setSheetMusicError(error: unknown) {
  sheetMusicItems = []
  const message = error instanceof Error ? error.message : 'Unknown sheet music parsing error'
  sheetMusicStatus.textContent = message
}

function getTotalSheetMusicBeats(items: SheetMusicItem[]) {
  return items.reduce((largestEnd, item) => Math.max(largestEnd, item.startBeat + item.durationBeats), 0)
}

function parseMusicXmlUpload(text: string): ParsedSheetMusicUpload {
  const xml = new DOMParser().parseFromString(text, 'application/xml')
  const parserError = xml.querySelector('parsererror')

  if (parserError) {
    throw new Error('Could not parse the MusicXML file. Export it as plain .musicxml or .xml, not compressed .mxl.')
  }

  const part = Array.from(xml.documentElement.children).find(child => child.localName === 'part')

  if (!part) {
    throw new Error('No playable part was found in that MusicXML file.')
  }

  nextSheetMusicItemId = 1
  const items: SheetMusicItem[] = []
  const detectedBpm = getMusicXmlTempo(xml)
  let divisions = 1
  let beatCursor = 0
  let lastNoteStartBeat = 0

  for (const measure of getDirectChildren(part, 'measure')) {
    const divisionsText = measure.querySelector('attributes > divisions')?.textContent
    const parsedDivisions = divisionsText ? Number(divisionsText) : NaN

    if (Number.isFinite(parsedDivisions) && parsedDivisions > 0) {
      divisions = parsedDivisions
    }

    for (const child of Array.from(measure.children)) {
      if (child.localName === 'backup') {
        beatCursor = Math.max(0, beatCursor - getMusicXmlDurationBeats(child, divisions))
        continue
      }

      if (child.localName === 'forward') {
        beatCursor += getMusicXmlDurationBeats(child, divisions)
        continue
      }

      if (child.localName !== 'note') {
        continue
      }

      const durationBeats = getMusicXmlDurationBeats(child, divisions)
      const isChord = getDirectChildren(child, 'chord').length > 0
      const startBeat = isChord ? lastNoteStartBeat : beatCursor

      if (getDirectChildren(child, 'rest').length > 0) {
        items.push({
          id: nextSheetMusicItemId,
          startBeat,
          durationBeats,
          label: 'Rest',
          isRest: true
        })
        nextSheetMusicItemId += 1
      } else {
        const pitch = getDirectChildren(child, 'pitch')[0]

        if (!pitch) {
          continue
        }

        const step = getDirectChildText(pitch, 'step')?.toUpperCase()
        const octaveText = getDirectChildText(pitch, 'octave')
        const alterText = getDirectChildText(pitch, 'alter')
        const octave = octaveText ? Number(octaveText) : NaN
        const alter = alterText ? Number(alterText) : 0

        if (!step || NOTE_INDEX_BY_SPELLING[step] === undefined || !Number.isFinite(octave) || !Number.isFinite(alter)) {
          continue
        }

        const naturalNoteIndex = NOTE_INDEX_BY_SPELLING[step]
        const midi = (octave + 1) * 12 + naturalNoteIndex + alter
        const note = midiToNote(midi)

        items.push({
          ...note,
          staffStep: getStaffStepForSpelling(step, octave),
          id: nextSheetMusicItemId,
          startBeat,
          durationBeats,
          label: formatPitchLabel(step, alter, octave),
          isRest: false
        })
        nextSheetMusicItemId += 1
      }

      if (!isChord) {
        lastNoteStartBeat = startBeat
        beatCursor += durationBeats
      }
    }
  }

  if (items.length === 0) {
    throw new Error('The MusicXML file did not contain any notes or rests that this app could read.')
  }

  return {
    items,
    normalizedText: normalizeSheetMusicItems(items),
    format: 'MusicXML',
    detectedBpm
  }
}

function parseAbcUpload(text: string): ParsedSheetMusicUpload {
  nextSheetMusicItemId = 1
  const items: SheetMusicItem[] = []
  const defaultDurationBeats = getAbcDefaultDurationBeats(text)
  const detectedBpm = getAbcTempo(text)
  const body = getAbcBody(text)
  const tokenPattern = /([_=^]*)([A-Ga-gzZ])([,']*)(\d*(?:\/\d*)?)/g
  let beatCursor = 0
  let match: RegExpExecArray | null

  while ((match = tokenPattern.exec(body)) !== null) {
    const accidentalToken = match[1]
    const pitchToken = match[2]
    const octaveToken = match[3]
    const durationToken = match[4]
    const durationBeats = clamp(parseAbcDurationMultiplier(durationToken) * defaultDurationBeats, 0.125, 16)

    if (/^[zZ]$/.test(pitchToken)) {
      items.push({
        id: nextSheetMusicItemId,
        startBeat: beatCursor,
        durationBeats,
        label: 'Rest',
        isRest: true
      })
      nextSheetMusicItemId += 1
      beatCursor += durationBeats
      continue
    }

    const letter = pitchToken.toUpperCase()
    const baseOctave = pitchToken === pitchToken.toLowerCase() ? 5 : 4
    const octave = baseOctave + Array.from(octaveToken).reduce((offset, char) => {
      if (char === "'") {
        return offset + 1
      }

      if (char === ',') {
        return offset - 1
      }

      return offset
    }, 0)
    const accidentalOffset = getAbcAccidentalOffset(accidentalToken)
    const naturalNoteIndex = NOTE_INDEX_BY_SPELLING[letter]
    const midi = (octave + 1) * 12 + naturalNoteIndex + accidentalOffset
    const note = midiToNote(midi)

    items.push({
      ...note,
      staffStep: getStaffStepForSpelling(letter, octave),
      id: nextSheetMusicItemId,
      startBeat: beatCursor,
      durationBeats,
      label: formatPitchLabel(letter, accidentalOffset, octave),
      isRest: false
    })
    nextSheetMusicItemId += 1
    beatCursor += durationBeats
  }

  if (items.length === 0) {
    throw new Error('The ABC file did not contain any readable notes.')
  }

  return {
    items,
    normalizedText: normalizeSheetMusicItems(items),
    format: 'ABC notation',
    detectedBpm
  }
}

function getDirectChildren(parent: Element, localName: string) {
  return Array.from(parent.children).filter(child => child.localName === localName)
}

function getDirectChildText(parent: Element, localName: string) {
  return getDirectChildren(parent, localName)[0]?.textContent?.trim() ?? null
}

function getMusicXmlDurationBeats(element: Element, divisions: number) {
  const durationText = getDirectChildText(element, 'duration')
  const duration = durationText ? Number(durationText) : NaN

  if (!Number.isFinite(duration) || duration <= 0) {
    return 1
  }

  return clamp(duration / divisions, 0.125, 16)
}

function getMusicXmlTempo(xml: XMLDocument) {
  for (const sound of Array.from(xml.getElementsByTagName('sound'))) {
    const tempo = Number(sound.getAttribute('tempo'))

    if (Number.isFinite(tempo) && tempo > 0) {
      return tempo
    }
  }

  const perMinute = Array.from(xml.getElementsByTagName('*')).find(element => element.localName === 'per-minute')
  const tempo = perMinute?.textContent ? Number(perMinute.textContent.trim()) : NaN
  return Number.isFinite(tempo) && tempo > 0 ? tempo : null
}

function getAbcDefaultDurationBeats(text: string) {
  const match = /^\s*L:\s*(\d+)\s*\/\s*(\d+)/im.exec(text)

  if (!match) {
    return 0.5
  }

  const numerator = Number(match[1])
  const denominator = Number(match[2])

  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return 0.5
  }

  return clamp(4 * numerator / denominator, 0.125, 16)
}

function getAbcTempo(text: string) {
  const match = /^\s*Q:\s*(?:(\d+)\s*\/\s*(\d+)\s*=\s*)?(\d+)/im.exec(text)

  if (!match) {
    return null
  }

  const tempo = Number(match[3])
  return Number.isFinite(tempo) && tempo > 0 ? tempo : null
}

function getAbcBody(text: string) {
  const lines = text.split(/\r?\n/)
  const bodyLines: string[] = []
  let foundKey = false

  for (const line of lines) {
    if (!foundKey) {
      if (/^\s*K:/i.test(line)) {
        foundKey = true
      }

      continue
    }

    if (/^\s*[A-Z]:/i.test(line)) {
      continue
    }

    bodyLines.push(line.replace(/"[^"]*"/g, ' '))
  }

  return bodyLines.join(' ')
}

function parseAbcDurationMultiplier(token: string) {
  if (!token) {
    return 1
  }

  if (/^\d+$/.test(token)) {
    return Number(token)
  }

  if (token === '/') {
    return 0.5
  }

  const match = /^(\d*)\/(\d*)$/.exec(token)

  if (!match) {
    return 1
  }

  const numerator = match[1] ? Number(match[1]) : 1
  const denominator = match[2] ? Number(match[2]) : 2

  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return 1
  }

  return numerator / denominator
}

function getAbcAccidentalOffset(token: string) {
  if (token.includes('=')) {
    return 0
  }

  let offset = 0

  for (const char of token) {
    if (char === '^') {
      offset += 1
    }

    if (char === '_') {
      offset -= 1
    }
  }

  return clamp(offset, -2, 2)
}

function formatPitchLabel(letter: string, alter: number, octave: number) {
  const accidental = alter > 0
    ? '#'.repeat(Math.min(alter, 2))
    : alter < 0
      ? '♭'.repeat(Math.min(Math.abs(alter), 2))
      : ''

  return `${letter}${accidental}${octave}`
}

function normalizeSheetMusicItems(items: SheetMusicItem[]) {
  return items
    .slice()
    .sort((a, b) => a.startBeat - b.startBeat || a.id - b.id)
    .map(item => {
      const duration = item.durationBeats === 1 ? '' : `:${formatBeatCount(item.durationBeats)}`

      if (item.isRest) {
        return `R${duration}`
      }

      return `${item.label.replaceAll('♭', 'b')}${duration}`
    })
    .join(' ')
}

function restartSheetMusicTimeline() {
  clearStaffResumeDelay()

  const now = performance.now()
  staffStartedAt = now
  sheetMusicPausedAt = sheetMusicIsPlaying ? null : now
  staffNotes = []
  activeStaffNote = null
  ensureStaffAnimation()
}

function toggleSheetMusicPlayback() {
  const now = performance.now()

  if (staffResumeTimeoutId !== null) {
    clearStaffResumeDelay()
    updateSheetMusicPlaybackButton()
    drawStaff(now)
    return
  }

  if (sheetMusicIsPlaying) {
    sheetMusicIsPlaying = false
    sheetMusicPausedAt = now
    stopStaffAnimation()
    updateSheetMusicPlaybackButton()
    drawStaff(now)
    return
  }

  const resumeDelayMs = getStartDelaySeconds() * 1000

  if (resumeDelayMs <= 0) {
    resumeSheetMusicPlayback()
    updateSheetMusicPlaybackButton()
    drawStaff(now)
    return
  }

  staffResumeDelayStartedAt = now
  staffResumeTimeoutId = window.setTimeout(() => {
    staffResumeTimeoutId = null
    staffResumeDelayStartedAt = null
    resumeSheetMusicPlayback()
    updateSheetMusicPlaybackButton()
    drawStaff(performance.now())
  }, resumeDelayMs)

  ensureStaffAnimation()
  updateSheetMusicPlaybackButton()
  drawStaff(now)
}

function updateSheetMusicPlaybackButton() {
  if (staffResumeTimeoutId !== null) {
    toggleStaffMovementButton.textContent = 'Cancel play'
    toggleStaffMovementButton.setAttribute('aria-pressed', 'false')
    sheetMusicPlaybackStatus.textContent = 'Sheet music start delay is counting down. Microphone listening is unchanged.'
    return
  }

  toggleStaffMovementButton.textContent = sheetMusicIsPlaying ? 'Pause staff' : 'Play staff'
  toggleStaffMovementButton.setAttribute('aria-pressed', String(sheetMusicIsPlaying))
  sheetMusicPlaybackStatus.textContent = sheetMusicIsPlaying
    ? 'Moving staff is playing. Microphone listening is unchanged.'
    : 'Moving staff is paused. Microphone listening is unchanged.'
}

function ensureStaffAnimation() {
  if ((!sheetMusicIsPlaying && staffResumeTimeoutId === null) || analyser || staffAnimationFrameId !== 0) {
    return
  }

  staffAnimationFrameId = requestAnimationFrame(staffAnimationTick)
}

function stopStaffAnimation() {
  if (staffAnimationFrameId === 0) {
    return
  }

  cancelAnimationFrame(staffAnimationFrameId)
  staffAnimationFrameId = 0
}

function staffAnimationTick(now: number) {
  if ((!sheetMusicIsPlaying && staffResumeTimeoutId === null) || analyser) {
    staffAnimationFrameId = 0
    return
  }

  drawStaff(now)
  staffAnimationFrameId = requestAnimationFrame(staffAnimationTick)
}

function getCurrentSheetMusicNote(now: number): SheetMusicNote | null {
  const elapsedBeats = getElapsedBeats(now)

  for (const item of sheetMusicItems) {
    if (item.isRest) {
      continue
    }

    if (elapsedBeats >= item.startBeat && elapsedBeats < item.startBeat + item.durationBeats) {
      return item
    }
  }

  return null
}

function findNearestScaleNote(noteIndex: number, scaleNotes: number[]) {
  let bestNote = scaleNotes[0]
  let bestDistance = Number.POSITIVE_INFINITY

  for (const scaleNote of scaleNotes) {
    const upwardDistance = (scaleNote - noteIndex + 12) % 12
    const downwardDistance = (noteIndex - scaleNote + 12) % 12
    const distance = Math.min(upwardDistance, downwardDistance)

    if (distance < bestDistance) {
      bestDistance = distance
      bestNote = scaleNote
    }
  }

  return bestNote
}

function formatSigned(value: number) {
  const rounded = Math.round(value)
  return rounded > 0 ? `+${rounded}` : String(rounded)
}

function formatBeatCount(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

function formatDelaySeconds(value: number) {
  return `${formatBeatCount(value)} ${value === 1 ? 'second' : 'seconds'}`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getBpm() {
  return clamp(Number(bpmInput.value) || 100, 1, 260)
}

function getElapsedBeats(now: number) {
  const timelineNow = getSheetMusicTimelineNow(now)
  return (timelineNow - staffStartedAt) / 60000 * getBpm() - getStartDelayBeats()
}

function getSheetMusicTimelineNow(now: number) {
  return sheetMusicIsPlaying ? now : sheetMusicPausedAt ?? now
}

function getStartDelaySeconds() {
  return sheetMusicItems.length > 0
    ? clamp(Number(sheetMusicDelayInput.value) || 0, 0, 5)
    : 0
}

function getStartDelayBeats() {
  return getStartDelaySeconds() / 60 * getBpm()
}

function getLeadInSecondsRemaining(now: number) {
  const delaySeconds = getStartDelaySeconds()

  if (staffResumeTimeoutId !== null && staffResumeDelayStartedAt !== null) {
    return Math.max(0, delaySeconds - (now - staffResumeDelayStartedAt) / 1000)
  }

  const timelineNow = getSheetMusicTimelineNow(now)
  return Math.max(0, delaySeconds - (timelineNow - staffStartedAt) / 1000)
}

function updateSheetMusicCountdown(now: number) {
  const delaySeconds = getStartDelaySeconds()
  const isManualResumeDelay = staffResumeTimeoutId !== null && staffResumeDelayStartedAt !== null && !sheetMusicIsPlaying
  const remainingSeconds = isManualResumeDelay ? getLeadInSecondsRemaining(now) : 0
  const shouldShowCountdown = sheetMusicItems.length > 0 && delaySeconds > 0 && remainingSeconds > 0.05

  sheetMusicCountdown.hidden = !shouldShowCountdown

  if (!shouldShowCountdown) {
    sheetMusicCountdownBar.style.transform = 'scaleX(0)'
    return
  }

  sheetMusicCountdownValue.textContent = remainingSeconds >= 1
    ? String(Math.ceil(remainingSeconds))
    : remainingSeconds.toFixed(1)
  sheetMusicCountdownBar.style.transform = `scaleX(${clamp(remainingSeconds / delaySeconds, 0, 1)})`
}

function getPlayheadX(width: number) {
  return clamp(width * 0.18, 128, 190)
}

function getNoteDisplayMode(): NoteDisplayMode {
  return noteDisplaySelect.value === 'letters' ? 'letters' : 'symbols'
}

function getStaffStepForSpelling(letter: string, octave: number) {
  return octave * 7 + LETTER_INDEX_BY_NOTE[letter]
}

function getStaffStepForMidi(midi: number) {
  const noteName = NOTE_NAMES[((midi % 12) + 12) % 12]
  const octave = Math.floor(midi / 12) - 1
  return getStaffStepForSpelling(noteName, octave)
}

function getStaffYForNote(note: NoteResult) {
  const bottomLineStep = 4 * 7 + LETTER_INDEX_BY_NOTE.E
  const currentStep = note.staffStep ?? getStaffStepForMidi(note.midi)
  const bottomLineY = 172
  const lineGap = 18

  return bottomLineY - (currentStep - bottomLineStep) * (lineGap / 2)
}

function drawStaff(now: number) {
  if (!staffContext) {
    return
  }

  const width = staffCanvas.width
  const height = staffCanvas.height
  const ctx = staffContext
  const topLineY = 100
  const lineGap = 18
  const bottomLineY = topLineY + lineGap * 4
  const elapsedBeats = getElapsedBeats(now)
  const playheadX = getPlayheadX(width)
  const staffStartX = shouldShowStaffLetterLabels() ? 76 : 28

  updateSheetMusicCountdown(now)

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, width, height)

  drawBeatGrid(ctx, width, height, elapsedBeats, playheadX)

  ctx.strokeStyle = 'rgba(226, 232, 240, 0.72)'
  ctx.lineWidth = 1.5

  for (let line = 0; line < 5; line += 1) {
    const y = topLineY + line * lineGap
    ctx.beginPath()
    ctx.moveTo(staffStartX, y)
    ctx.lineTo(width - 22, y)
    ctx.stroke()
  }

  drawStaffLetterLabels(ctx, topLineY, bottomLineY, lineGap, staffStartX)
  drawClefHint(ctx, staffStartX)
  drawPlayhead(ctx, playheadX, height)
  drawSheetMusic(ctx, elapsedBeats, playheadX, width, topLineY, bottomLineY, lineGap)
  drawPlayedNotes(ctx, elapsedBeats, playheadX, width, topLineY, bottomLineY, lineGap)
  drawStaffLegend(ctx, width, height)
}

function drawBeatGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  elapsedBeats: number,
  playheadX: number
) {
  const firstBeat = Math.floor(elapsedBeats - playheadX / STAFF_PIXELS_PER_BEAT) - 1
  const lastBeat = Math.ceil(elapsedBeats + (width - playheadX) / STAFF_PIXELS_PER_BEAT) + 1

  for (let absoluteBeat = firstBeat; absoluteBeat <= lastBeat; absoluteBeat += 1) {
    const x = playheadX + (absoluteBeat - elapsedBeats) * STAFF_PIXELS_PER_BEAT
    const isMeasureStart = absoluteBeat % 4 === 0

    ctx.strokeStyle = isMeasureStart ? 'rgba(103, 232, 249, 0.34)' : 'rgba(148, 163, 184, 0.14)'
    ctx.lineWidth = isMeasureStart ? 1.5 : 1
    ctx.beginPath()
    ctx.moveTo(x, 42)
    ctx.lineTo(x, height - 42)
    ctx.stroke()

    if (isMeasureStart && absoluteBeat >= 0 && x > 36 && x < width - 36) {
      ctx.fillStyle = 'rgba(203, 213, 225, 0.74)'
      ctx.font = '12px Inter, system-ui, sans-serif'
      ctx.fillText(`bar ${Math.floor(absoluteBeat / 4) + 1}`, x + 6, 38)
    }
  }
}

function shouldShowStaffLetterLabels() {
  return staffLetterLabelsToggle.checked
}

function drawStaffLetterLabels(
  ctx: CanvasRenderingContext2D,
  topLineY: number,
  bottomLineY: number,
  lineGap: number,
  staffStartX: number
) {
  if (!shouldShowStaffLetterLabels()) {
    return
  }

  const bottomLineStep = 4 * 7 + LETTER_INDEX_BY_NOTE.E
  const lineLabelX = Math.max(24, staffStartX - 52)
  const spaceLabelX = lineLabelX + 30

  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '900 12px Inter, system-ui, sans-serif'

  for (let step = bottomLineStep; step <= bottomLineStep + 8; step += 1) {
    const y = bottomLineY - (step - bottomLineStep) * (lineGap / 2)
    const letter = STAFF_LETTERS[((step % STAFF_LETTERS.length) + STAFF_LETTERS.length) % STAFF_LETTERS.length]
    const isStaffLine = (step - bottomLineStep) % 2 === 0
    const labelX = isStaffLine ? lineLabelX : spaceLabelX

    ctx.fillStyle = isStaffLine ? 'rgba(103, 232, 249, 0.95)' : 'rgba(165, 180, 252, 0.92)'
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.34)'
    ctx.lineWidth = 1
    drawRoundedRect(ctx, labelX - 13, y - 9, 26, 18, 7)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#0f172a'
    ctx.fillText(letter, labelX, y + 0.5)
  }

  ctx.restore()
}

function drawClefHint(ctx: CanvasRenderingContext2D, staffStartX: number) {
  ctx.fillStyle = 'rgba(226, 232, 240, 0.6)'
  ctx.font = '48px Georgia, serif'
  ctx.fillText('𝄞', staffStartX + 10, 156)
}

function drawPlayhead(ctx: CanvasRenderingContext2D, playheadX: number, height: number) {
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(playheadX, 38)
  ctx.lineTo(playheadX, height - 34)
  ctx.stroke()

  ctx.fillStyle = 'rgba(250, 204, 21, 0.92)'
  ctx.font = 'bold 12px Inter, system-ui, sans-serif'
  ctx.fillText('play', playheadX - 13, 30)
}

function drawSheetMusic(
  ctx: CanvasRenderingContext2D,
  elapsedBeats: number,
  playheadX: number,
  width: number,
  topLineY: number,
  bottomLineY: number,
  lineGap: number
) {
  for (const item of sheetMusicItems) {
    const x = playheadX + (item.startBeat - elapsedBeats) * STAFF_PIXELS_PER_BEAT
    const durationWidth = item.durationBeats * STAFF_PIXELS_PER_BEAT

    if (x + durationWidth < -100 || x > width + 120) {
      continue
    }

    if (item.isRest) {
      drawSheetRest(ctx, x, durationWidth, item)
      continue
    }

    const y = getStaffYForNote(item)
    drawLedgerLines(ctx, x, y, topLineY, bottomLineY, lineGap, 'rgba(226, 232, 240, 0.82)')
    drawDurationGuide(ctx, x, y, durationWidth)
    drawNoteHead(ctx, x, y, item, true, {
      kind: 'sheet',
      label: item.label,
      alpha: 1
    })
  }
}

function drawPlayedNotes(
  ctx: CanvasRenderingContext2D,
  elapsedBeats: number,
  playheadX: number,
  width: number,
  topLineY: number,
  bottomLineY: number,
  lineGap: number
) {
  const hasSheetMusic = sheetMusicItems.length > 0

  staffNotes = staffNotes.filter(note => {
    const x = playheadX + (note.capturedBeat - elapsedBeats) * STAFF_PIXELS_PER_BEAT
    return x > -90 && x < width + 90
  })

  for (const note of staffNotes) {
    const x = playheadX + (note.capturedBeat - elapsedBeats) * STAFF_PIXELS_PER_BEAT
    const y = getStaffYForNote(note)
    const isInScale = getSelectedScaleNotes().includes(note.noteIndex)

    drawLedgerLines(ctx, x, y, topLineY, bottomLineY, lineGap, 'rgba(226, 232, 240, 0.5)')
    drawNoteHead(ctx, x, y, note, isInScale, {
      kind: 'played',
      label: `${note.name}${note.octave}`,
      alpha: hasSheetMusic ? 0.38 : 1
    })
  }
}

function drawDurationGuide(ctx: CanvasRenderingContext2D, x: number, y: number, durationWidth: number) {
  if (durationWidth <= STAFF_PIXELS_PER_BEAT * 1.05) {
    return
  }

  ctx.strokeStyle = 'rgba(238, 242, 255, 0.54)'
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x + 16, y)
  ctx.lineTo(x + durationWidth - 14, y)
  ctx.stroke()
  ctx.lineCap = 'butt'
}

function drawSheetRest(ctx: CanvasRenderingContext2D, x: number, durationWidth: number, rest: SheetMusicRest) {
  const y = 136

  ctx.save()
  ctx.globalAlpha = 0.95
  ctx.fillStyle = '#eef2ff'
  ctx.font = 'bold 30px Georgia, serif'
  ctx.fillText('𝄽', x - 10, y)

  if (durationWidth > STAFF_PIXELS_PER_BEAT * 1.05) {
    ctx.strokeStyle = 'rgba(238, 242, 255, 0.52)'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x + 20, y - 9)
    ctx.lineTo(x + durationWidth - 12, y - 9)
    ctx.stroke()
  }

  ctx.fillStyle = 'rgba(238, 242, 255, 0.86)'
  ctx.font = 'bold 12px Inter, system-ui, sans-serif'
  ctx.fillText(`${rest.durationBeats} beat rest`, x - 22, y + 30)
  ctx.restore()
}

function drawLedgerLines(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  topLineY: number,
  bottomLineY: number,
  lineGap: number,
  color: string
) {
  ctx.strokeStyle = color
  ctx.lineWidth = 1.3

  if (y < topLineY) {
    for (let lineY = topLineY - lineGap; lineY >= y - 1; lineY -= lineGap) {
      ctx.beginPath()
      ctx.moveTo(x - 14, lineY)
      ctx.lineTo(x + 14, lineY)
      ctx.stroke()
    }
  }

  if (y > bottomLineY) {
    for (let lineY = bottomLineY + lineGap; lineY <= y + 1; lineY += lineGap) {
      ctx.beginPath()
      ctx.moveTo(x - 14, lineY)
      ctx.lineTo(x + 14, lineY)
      ctx.stroke()
    }
  }
}

function drawNoteHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  note: NoteResult,
  isInScale: boolean,
  options: { kind: 'sheet' | 'played', label: string, alpha: number }
) {
  if (getNoteDisplayMode() === 'letters') {
    drawLetterNoteHead(ctx, x, y, isInScale, options)
    return
  }

  const isSheet = options.kind === 'sheet'
  const fillColor = isSheet ? '#eef2ff' : isInScale ? '#67e8f9' : '#fb7185'
  const strokeColor = isSheet ? '#ffffff' : isInScale ? '#a5f3fc' : '#fecdd3'

  ctx.save()
  ctx.globalAlpha = options.alpha
  ctx.translate(x, y)
  ctx.rotate(-0.35)
  ctx.beginPath()
  ctx.ellipse(0, 0, isSheet ? 13 : 12, isSheet ? 9 : 8, 0, 0, Math.PI * 2)
  ctx.fillStyle = fillColor
  ctx.fill()
  ctx.lineWidth = isSheet ? 3 : 1
  ctx.strokeStyle = strokeColor
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.globalAlpha = options.alpha
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = isSheet ? 3.4 : 2
  ctx.beginPath()
  ctx.moveTo(x + 10, y - 2)
  ctx.lineTo(x + 10, y - 48)
  ctx.stroke()

  const accidental = getAccidentalSymbol(options.label, note)

  if (accidental) {
    ctx.fillStyle = isSheet ? '#eef2ff' : '#cbd5e1'
    ctx.font = isSheet ? 'bold 19px Georgia, serif' : '18px Georgia, serif'
    ctx.fillText(accidental, x - 30, y + 5)
  }

  ctx.fillStyle = isSheet ? 'rgba(255, 255, 255, 0.96)' : 'rgba(226, 232, 240, 0.86)'
  ctx.font = isSheet ? 'bold 12px Inter, system-ui, sans-serif' : '12px Inter, system-ui, sans-serif'
  ctx.fillText(options.label, x - 16, y + 32)
  ctx.restore()
}

function drawLetterNoteHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isInScale: boolean,
  options: { kind: 'sheet' | 'played', label: string, alpha: number }
) {
  const isSheet = options.kind === 'sheet'
  const fillColor = isSheet ? '#eef2ff' : isInScale ? '#67e8f9' : '#fb7185'
  const strokeColor = isSheet ? '#ffffff' : isInScale ? '#a5f3fc' : '#fecdd3'
  const label = getPitchClassLabel(options.label)

  ctx.save()
  ctx.globalAlpha = options.alpha
  ctx.font = isSheet ? '900 15px Inter, system-ui, sans-serif' : '800 14px Inter, system-ui, sans-serif'
  const width = Math.max(30, ctx.measureText(label).width + 16)
  const height = isSheet ? 30 : 28

  ctx.fillStyle = fillColor
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = isSheet ? 2.4 : 1.4
  drawRoundedRect(ctx, x - width / 2, y - height / 2, width, height, 9)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#0f172a'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x, y + 0.5)
  ctx.restore()
}

function getPitchClassLabel(label: string) {
  return label.replace(/-?\d+$/, '')
}

function getAccidentalSymbol(label: string, note: NoteResult) {
  const labelAccidental = /[#♭]+/.exec(getPitchClassLabel(label))?.[0]

  if (labelAccidental) {
    return labelAccidental
  }

  return note.name.includes('#') ? '#' : ''
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const safeRadius = Math.min(radius, width / 2, height / 2)

  ctx.beginPath()
  ctx.moveTo(x + safeRadius, y)
  ctx.lineTo(x + width - safeRadius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius)
  ctx.lineTo(x + width, y + height - safeRadius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height)
  ctx.lineTo(x + safeRadius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius)
  ctx.lineTo(x, y + safeRadius)
  ctx.quadraticCurveTo(x, y, x + safeRadius, y)
  ctx.closePath()
}

function drawStaffLegend(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = 'rgba(203, 213, 225, 0.84)'
  ctx.font = '13px Inter, system-ui, sans-serif'

  const targetStyle = getNoteDisplayMode() === 'letters' ? 'bold white letters' : 'bold white notes'
  const playedStyle = getNoteDisplayMode() === 'letters' ? 'translucent letters' : 'translucent notes'

  if (sheetMusicItems.length > 0) {
    ctx.fillText(`${getBpm()} BPM · ${targetStyle} = sheet music · ${playedStyle} = played notes`, 28, height - 18)
  } else {
    ctx.fillText(`${getBpm()} BPM · played notes scroll left · one grid line per beat`, 28, height - 18)
  }

  if (staffNotes.length === 0 && sheetMusicItems.length === 0) {
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)'
    ctx.font = '16px Inter, system-ui, sans-serif'
    ctx.fillText('Enter sheet notes or start listening, then play one clear note at a time.', 116, 70)
  }

  ctx.fillStyle = 'rgba(250, 204, 21, 0.9)'
  ctx.font = '13px Inter, system-ui, sans-serif'
  ctx.fillText('playhead', width - 198, height - 18)

  ctx.fillStyle = 'rgba(238, 242, 255, 0.95)'
  ctx.font = 'bold 13px Inter, system-ui, sans-serif'
  ctx.fillText('sheet', width - 126, height - 18)

  ctx.fillStyle = sheetMusicItems.length > 0 ? 'rgba(103, 232, 249, 0.42)' : 'rgba(103, 232, 249, 0.9)'
  ctx.font = '13px Inter, system-ui, sans-serif'
  ctx.fillText('played', width - 74, height - 18)
}

function setNoPitchReadout(now: number) {
  const target = getCurrentSheetMusicNote(now)
  const leadInSeconds = getLeadInSecondsRemaining(now)
  frequency.textContent = '-- Hz'
  targetFrequency.textContent = lastStableNote ? `${lastStableNote.targetFrequency.toFixed(2)} Hz` : target ? `${target.targetFrequency.toFixed(2)} Hz` : '-- Hz'
  cents.textContent = '-- cents'

  if (leadInSeconds > 0.05 && sheetMusicItems.length > 0) {
    scaleMessage.textContent = `Sheet music starts in ${leadInSeconds.toFixed(1)} seconds. Get into position.`
    return
  }

  scaleMessage.textContent = target
    ? `Current sheet target: ${target.name}${target.octave}. Play one clear note at a time.`
    : 'No stable pitch detected. Play one clear note at a time.'
}

function clearReadout() {
  noteName.textContent = '--'
  octave.textContent = ''
  frequency.textContent = '-- Hz'
  targetFrequency.textContent = '-- Hz'
  cents.textContent = '-- cents'
  meterNeedle.style.left = '50%'
  scaleMessage.textContent = 'Detected notes will appear here.'
}

function setAudioInputState(state: AudioInputState, message: string) {
  latestAudioState = state
  statusText.textContent = message
  statusDot.className = `status-dot ${state}`
}

function drawWaveform(buffer: Float32Array) {
  if (!waveformContext) {
    return
  }

  const { width, height } = waveformCanvas
  waveformContext.clearRect(0, 0, width, height)
  waveformContext.strokeStyle = '#67e8f9'
  waveformContext.lineWidth = 2
  waveformContext.beginPath()

  for (let index = 0; index < buffer.length; index += 1) {
    const x = index / (buffer.length - 1) * width
    const y = (0.5 - buffer[index] * 0.45) * height

    if (index === 0) {
      waveformContext.moveTo(x, y)
    } else {
      waveformContext.lineTo(x, y)
    }
  }

  waveformContext.stroke()
}

function clearWaveform() {
  if (!waveformContext) {
    return
  }

  waveformContext.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height)
}

toggleButton.addEventListener('click', () => {
  if (analyser) {
    stopListening()
    return
  }

  void startListening()
})

refreshInputsButton.addEventListener('click', () => {
  void initializeAudioInputs()
})

audioInputSelect.addEventListener('change', () => {
  selectedInputId = audioInputSelect.value

  if (analyser) {
    stopListening()
    void startListening()
    return
  }

  setAudioInputState('connected-not-listening', `Connected: not listening. Selected input: ${getSelectedInputLabel()}.`)
})

keySelect.addEventListener('change', () => {
  renderScale(lastStableNote?.noteIndex)
  drawStaff(performance.now())
})

scaleSelect.addEventListener('change', () => {
  renderScale(lastStableNote?.noteIndex)
  drawStaff(performance.now())
})

bpmInput.addEventListener('input', () => {
  bpmInput.value = String(getBpm())
  drawStaff(performance.now())
})

sheetMusicDelayInput.addEventListener('input', () => {
  sheetMusicDelayInput.value = String(getStartDelaySeconds())
  drawStaff(performance.now())
})

noteDisplaySelect.addEventListener('change', () => {
  drawStaff(performance.now())
})

staffLetterLabelsToggle.addEventListener('change', () => {
  drawStaff(performance.now())
})

loadSheetMusicButton.addEventListener('click', () => {
  loadSheetMusicFromInput({ resetTimeline: true })
})

sheetMusicSongSelect.addEventListener('change', () => {
  loadSelectedSheetMusicSong({ resetTimeline: true })
})

sheetMusicFileInput?.addEventListener('change', () => {
  void loadSheetMusicFromFile()
})

restartSheetMusicButton.addEventListener('click', () => {
  restartSheetMusicTimeline()
  drawStaff(staffStartedAt)
})

toggleStaffMovementButton.addEventListener('click', () => {
  toggleSheetMusicPlayback()
})

clearStaffButton.addEventListener('click', () => {
  staffNotes = []
  activeStaffNote = null
  drawStaff(performance.now())
})

navigator.mediaDevices?.addEventListener?.('devicechange', () => {
  void initializeAudioInputs()
})

initializeControls()
void initializeAudioInputs()
