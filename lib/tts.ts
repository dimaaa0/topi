import textToSpeech from '@google-cloud/text-to-speech';

const ttsClient = new textToSpeech.TextToSpeechClient({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

export async function generateDialogueAudio(lines: string[]): Promise<Buffer> {
  const audioBuffers: Buffer[] = [];

  for (const line of lines) {
    if (!line || line.length < 2) continue;

    // Берем первый символ строки (M или F)
    const speakerFlag = line.charAt(0).toUpperCase(); 
    
    // Отрезаем первую букву, оставляя только корейский текст
    const textToSpeak = line.substring(1).trim(); 

    if (!textToSpeak) continue;

    // Назначаем дешевый голос Standard в зависимости от первой буквы
    const voiceName = speakerFlag === 'M' ? 'ko-KR-Standard-C' : 'ko-KR-Standard-A';

    const [response] = await ttsClient.synthesizeSpeech({
      input: { text: textToSpeak },
      voice: { languageCode: 'ko-KR', name: voiceName },
      audioConfig: { audioEncoding: 'MP3' as const },
    });

    if (response.audioContent) {
      audioBuffers.push(Buffer.from(response.audioContent as Uint8Array));
    }
  }

  return Buffer.concat(audioBuffers);
}