async function test() {
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': 'AQ.Ab8RN6Jv8Jh4Tengdg7ug5Z2EC8x_PzmRFt0r8g_7aVoNi737g'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Explain how AI works in a few words' }] }]
      })
    }
  );
  console.log(await response.text());
}
test();
