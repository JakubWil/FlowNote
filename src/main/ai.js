/**
 * FlowNote — AI Integration
 *
 * Two AI calls happen per note:
 *   1. Whisper API  → converts audio to text (transcription)
 *   2. Claude API   → converts messy text to structured Markdown (structuring)
 *
 * Both calls happen in the main process (Node.js) — NOT in the renderer.
 * This keeps API keys safe and gives us access to the file system.
 */

const https = require('https');
const { getApiKey } = require('./keychain');

// ─── Transcription (Whisper) ──────────────────────────────────────────────────
async function transcribeAudio(audioBuffer) {
  const apiKey = await getApiKey('openai');
  if (!apiKey) throw new Error('OpenAI API key not set. Please add it in Settings.');

  // Whisper expects multipart/form-data with an audio file
  // We use native https to avoid adding heavy dependencies
  const FormData = require('form-data'); // built into Node 18+
  const form = new FormData();
  form.append('file', audioBuffer, { filename: 'recording.wav', contentType: 'audio/wav' });
  form.append('model', 'whisper-1');
  form.append('language', 'pl'); // Polish — Whisper auto-detects but explicit is faster

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      ...form.getHeaders(),
    },
    body: form,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Whisper API error: ${error.error?.message}`);
  }

  const result = await response.json();
  return result.text;
}

// ─── Structuring (Claude) ─────────────────────────────────────────────────────
async function structureNote(transcript) {
  const apiKey = await getApiKey('anthropic');
  if (!apiKey) throw new Error('Anthropic API key not set. Please add it in Settings.');

  const systemPrompt = `You are a note-taking assistant. Your job is to take a raw, unstructured voice transcript and convert it into a clean, well-organized Markdown note.

Rules:
- Extract a short, descriptive title (max 8 words) for the note
- Organize content with appropriate headers (##), bullet points, and structure
- If there are action items or todos, put them in a ## Action Items section with checkboxes (- [ ])
- Keep ALL information from the transcript — don't remove anything
- Fix grammar and formatting, but preserve the speaker's intent
- Respond ONLY with a JSON object: { "title": "...", "content": "..." }
- The "content" field should be valid Markdown
- Do not include any explanation or preamble`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Please structure this voice note transcript:\n\n"${transcript}"`
        }
      ]
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Claude API error: ${error.error?.message}`);
  }

  const result = await response.json();
  const text = result.content[0].text;

  // Parse the JSON response from Claude
  try {
    // Strip markdown code fences if present
    const clean = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    // Fallback: if Claude didn't return valid JSON, use raw text as content
    return { title: 'Voice Note', content: text };
  }
}

module.exports = { transcribeAudio, structureNote };
