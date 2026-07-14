export const environment = {
  apiUrl: '/api/v1', // relative — FE and BE are same-origin in production
  // values from `terraform output` in infra/envs/prod (module.aad_auth) — fill in after `terraform apply`
  msal: {
    clientId: '5fc64a22-6e06-4979-8e62-d625b8ed3b03', // aad_spa_client_id
    tenantId: '062b8cc8-ac93-4abf-94d9-8b822c3c387b', // aad_tenant_id
    redirectUri: '/', // matches spa_redirect_uris in infra/envs/prod/main.tf
    apiScope: 'api://dc4cae6b-5567-4180-a364-5c6f2b5886d6/access_as_user', // aad_api_scope
  },
};
