// Server-scoped permission denials do not invalidate the shared Discord
// login. Only the global /api/auth/me check determines session expiry.
const handleAdminPlayerAuthorizationResponse = (
  response,
  payload = {},
  { actionRequest = false } = {}
) => {
  if (response.status !== 401 && response.status !== 403) return false;
  const message = response.status === 403
    ? (actionRequest
      ? 'This action is not permitted on the selected server.'
      : 'This Admin feature is unavailable on the selected server.')
    : 'The selected server could not authorize this request. Your Discord login remains active.';
  showAuthMessage(payload?.message || message, 'error');
  return true;
};
