
interface SessionData {
  user: {
    telegramId: number | undefined;
    phone_number: string | undefined;
    is_manager: boolean | undefined;
  }
}

export default SessionData;
