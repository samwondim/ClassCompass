import * as crypto from 'crypto';
import { URLSearchParams } from 'url';

interface User {
  id?: string
  username?: string
  [key: string]: any
}
interface validatedData {
  [key: string]: string
}
interface validationResult {
  validatedData: validatedData | null
  user: User
  message: string
}
export function validateTelegramWebAppData(initData: string, botToken: string): validationResult {
  if (!botToken) {
    return { validatedData: null, user: {}, message: "Bot token is required for validation" };
  }

  const params = new URLSearchParams(initData);
  const parsed_data: { [key: string]: string } = {};
  for (const [key, value] of params.entries()) {
    parsed_data[key] = value;
  }
  if (!('hash' in parsed_data)) {
    return { validatedData: null, user: {}, message: "Invalid init data: missing hash" };
  }
  const received_hash = parsed_data.hash;
  delete parsed_data.hash;
  const data_check_arr = Object.keys(parsed_data).sort().map(key => `${key}=${parsed_data[key]}`);
  const data_check_string = data_check_arr.join('\n');
  const secret_key = crypto.createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
  const computed_hash = crypto.createHmac('sha256', secret_key)
    .update(data_check_string)
    .digest('hex');
  if (computed_hash !== received_hash) {
    return { validatedData: null, user: {}, message: "Invalid hash: data integrity check failed" };
  }
  if (!('auth_date' in parsed_data)) {
    return { validatedData: null, user: {}, message: "Invalid init data: missing auth_date" };
  }
  const auth_date = parseInt(parsed_data['auth_date']);
  if ((Date.now() / 1000) - auth_date > 86400) {
    return { validatedData: null, user: {}, message: "Data is outdated" };
  }
  if (!('user' in parsed_data)) {
    return { validatedData: null, user: {}, message: "Invalid init data: missing user" };
  }
  let user: User;
  try {
    user = JSON.parse(parsed_data['user']);
    if (user.id !== undefined) {
      user.id = user.id.toString();
    }
  } catch (e) {
    return { validatedData: null, user: {}, message: "Invalid user data" };
  }
  return { validatedData: parsed_data, user, message: "" };
}
