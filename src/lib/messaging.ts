type Message = {
  to: string;
  subject: string;
  body: string;
};

// Provider boundary for outbound email/SMS. No real provider is configured in
// this project, so messages are written to the server log. Swapping in Resend,
// Semaphore or another provider only requires changing this file.
export async function sendMessage(message: Message) {
  console.info(
    `[messaging:console] to=${message.to} subject=${message.subject}\n${message.body}`,
  );
  return { delivered: false, provider: "console" as const };
}

export async function sendSms(to: string, body: string) {
  return sendMessage({ to, subject: "Asian Leaf HOA", body });
}
