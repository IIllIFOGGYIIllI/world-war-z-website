// Shared protected-dashboard authorization response handling.
const handleAdminPlayerAuthorizationResponse = (
  response,
  payload = {},
  { actionRequest = false } = {}
) => {
  if (response.status === 401) {
    storageRemove(AUTH_SESSION_KEY);
    applySignedOutState();
    showView('overview', false);
    showAuthMessage('Your dashboard session expired. Sign in again to continue.', 'error');
    return true;
  }

  const explicitAdminAccessFailure =
    response.status === 403 && payload?.error_code === 'admin_access_required';
  const readEndpointAdminFailure = response.status === 403 && !actionRequest;

  if (explicitAdminAccessFailure || readEndpointAdminFailure) {
    if (authenticatedUser?.membership) authenticatedUser.membership.access_level = 'member';
    applyAccessVisibility('member');
    showView('overview', false);
    showAuthMessage('Your current Discord account no longer has Admin access.', 'error');
    return true;
  }

  return false;
};
