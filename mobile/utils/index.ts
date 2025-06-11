export const decodeJwt = (token: string | undefined) => {
  if (!token) throw new Error('Token is required for decoding');
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload) as { user_id: number };
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};
