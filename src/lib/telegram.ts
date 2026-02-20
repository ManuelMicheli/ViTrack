const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendMessage(
  chatId: number,
  text: string
): Promise<number | null> {
  const res = await fetch(`${BASE_URL}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data?.result?.message_id ?? null;
}

export async function editMessage(
  chatId: number,
  messageId: number,
  text: string
): Promise<void> {
  await fetch(`${BASE_URL}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
    }),
  });
}

export async function sendTyping(chatId: number): Promise<void> {
  await fetch(`${BASE_URL}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  });
}

export async function downloadFile(fileId: string): Promise<Buffer | null> {
  const fileRes = await fetch(`${BASE_URL}/getFile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: fileId }),
  });

  if (!fileRes.ok) return null;
  const fileData = await fileRes.json();
  const filePath = fileData?.result?.file_path;
  if (!filePath) return null;

  const downloadRes = await fetch(
    `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`
  );
  if (!downloadRes.ok) return null;

  const arrayBuffer = await downloadRes.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
