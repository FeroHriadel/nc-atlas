export const environment = {
  apiUrl: 'http://localhost:5000/api/v1',
  // values from `terraform output` in infra/envs/dev (module.aad_auth)
  msal: {
    clientId: '657bfeac-fca3-49b5-b43f-950abc483684', // aad_spa_client_id
    tenantId: '062b8cc8-ac93-4abf-94d9-8b822c3c387b', // aad_tenant_id
    redirectUri: 'http://localhost:4200/', // matches spa_redirect_uris in infra/envs/dev/main.tf
    apiScope: 'api://ca48cda0-57a6-499b-abe1-4ca2d3e622bb/access_as_user', // aad_api_scope
  },
};
