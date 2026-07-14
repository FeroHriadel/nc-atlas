# ATLAS
- Api: .net api
- web: angular webapp
- infra: terraform to Azure IaC



# RUN IN DEVELOPMENT MODE
We don't want to incure unnecessary cost in dev, yet we want the app to be as close to prod as possible. therefore
- infra folder: deploys the minimal infrastructure on Azure (BlobStorage, EntraID)
- Api folder: runs BE locally on http://localhost:5000 `dotnet run`
- Databse: is in docker-compose.yaml. Run it: `docker-compose up -d`
- web folder: serves FE locally on http://localhost:4200


### Deploy Dev Infrastructure
Prerequisites: [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) and Terraform `>= 1.9`, then `az login` (and `az account set --subscription <id>` if you have more than one). Auth is via your Azure CLI session — no service principal or secrets are passed as Terraform variables.

**1. Bootstrap the remote state storage (one-time only, skip if it already exists)**

`infra/envs/dev` stores its state in an `azurerm` backend (storage account `ncatlastfstate`, container `tfstate`) that has to exist before you can `init` it. `infra/bootstrap` creates that storage account and keeps its own state locally:

```bash
cd infra/bootstrap
terraform init
terraform apply
```

**2. Deploy the dev environment**

```bash
cd infra/envs/dev
terraform init
terraform plan
terraform apply
```

This provisions, into resource group `rg-ncatlas-dev` (`westeurope`):
- **Blob Storage** (`module.image_storage`) — the storage account + container used for sight images, with CORS already opened for `http://localhost:4200`.
- **Entra ID app registrations** (`module.aad_auth`) — an API app registration (with an `access_as_user` scope) and a SPA app registration pre-consented to call it, redirect URI `http://localhost:4200/`.

**3. Wire the outputs into Api and web**

```bash
terraform output                        # human-readable
terraform output -raw image_storage_connection_string   # sensitive value
```

- **Api** (`dotnet user-secrets set "Key" "Value"` from the `Api/` folder):
  - `BlobStorage:ConnectionString` ← `image_storage_connection_string`
  - `BlobStorage:ContainerName` ← `image_container_name` (already defaults to `images` in `appsettings.json`)
  - `AzureAd:ClientSecret` ← not a Terraform output — no client secret is provisioned for the API app registration yet, create one yourself (e.g. `az ad app credential reset --id <aad_api_client_id>`) and store it in user-secrets.
  - `AzureAd:TenantId` / `AzureAd:ClientId` in `Api/appsettings.Development.json` already match `aad_tenant_id` / `aad_api_client_id` — only touch these if you re-bootstrap and get new app registrations.
- **web** (`web/src/environments/environment.ts`, `msal` block) — `clientId` ← `aad_spa_client_id`, `tenantId` ← `aad_tenant_id`, `apiScope` ← `aad_api_scope` (already set up to match the current dev app registrations; only needs updating after a fresh deploy).

Note: the SQL Server database itself isn't managed by Terraform — `ConnectionStrings:Default` in Api user-secrets points at a local/manually-provisioned SQL Server instance.

**4. (One-time, tenant-wide — not per environment) Verify `nclabs.eu` as a custom domain in Entra ID**

Entra ID only lets you set a user's `UserPrincipalName`/email on a domain the *tenant* has verified. Skip this and everyone created via `/admin/users` (`GraphService.CreateUserAsync`) gets stuck on the default `<tenant-id>.onmicrosoft.com` address instead of `@nclabs.eu`. Since dev and prod are app registrations in the same Entra ID tenant (same `tenantId` in both `environment.ts` files), this only needs to be done once, ever — not once per environment.

1. Azure Portal → Entra ID → **Custom domain names** → **Add custom domain** → enter `nclabs.eu` → Add domain. Entra ID returns a TXT record for verification.
2. **DNS (AWS Route 53, `nclabs.eu` hosted zone)** — add that TXT record (same hosted zone as the `atlas.nclabs.eu` app custom domain, see step 4 under DEPLOY TO PRODUCTION). Managed manually, not Terraform.
3. Back in the Entra ID portal, click **Verify** once the TXT record has propagated.
4. From then on, `nclabs.eu` is a usable domain for `UserPrincipalName` when creating users — no need to make it the tenant's *primary* domain, just verified.


### Set up and run backend
**Set up user secrets** - you'll need to set up dotnet usersecrets like this:
`Api.csproj` already has a `UserSecretsId` committed, so you can go straight to `dotnet user-secrets set` (no `dotnet user-secrets init` needed). Run these from the `Api/` folder:

```bash
dotnet user-secrets set "ConnectionStrings:Default" "Server=localhost,1434;Database=ncatlas;User Id=sa;Password=<your MSSQL_SA_PASSWORD>;TrustServerCertificate=True;"
dotnet user-secrets set "AzureAd:ClientSecret" "<see 'Deploy Dev Infrastructure' step 3>"
dotnet user-secrets set "BlobStorage:ConnectionString" "<terraform output -raw image_storage_connection_string>"
dotnet user-secrets set "BlobStorage:ContainerName" "images"
dotnet user-secrets set "Claude:ApiKey" "<your Anthropic API key>"
```

| Key | Where it comes from |
|---|---|
| `ConnectionStrings:Default` | The local SQL Server from `docker-compose up -d` above — port `1434`, user `sa`, password = whatever you set `MSSQL_SA_PASSWORD` to in a `.env` file at the repo root (create one — `docker-compose.yml` requires it, it isn't committed). The `Database` name doesn't need to pre-exist; EF Core migrations create it. |
| `AzureAd:ClientSecret` | Not a Terraform output — create it yourself (`az ad app credential reset --id <aad_api_client_id>`) once you've deployed the dev infra. |
| `BlobStorage:ConnectionString` | `terraform output -raw image_storage_connection_string` from `infra/envs/dev`. |
| `BlobStorage:ContainerName` | `terraform output image_container_name` — already defaults to `images` in `appsettings.json`, so this one's usually optional. |
| `Claude:ApiKey` | Your own Anthropic API key — powers AI sight-facts generation and trip route optimization. |

**Apply database migrations**

```bash
dotnet ef database update
```

(One-time tool install if you don't have it: `dotnet tool install --global dotnet-ef`.)

**Create your Owner account**

There's no seed data — anyone who logs in for the first time is auto-created with the default `User` role (`Api/Auth/RoleClaimsTransformation.cs`). To unlock the admin pages (including `/admin/users`) for yourself:

1. Run the backend and frontend, then log into the web app once — this creates your row in the `users` table.
2. Promote yourself straight in the database:
   ```sql
   UPDATE users SET role = 'Owner' WHERE email = 'you@example.com';
   ```
   (`Owner` and `Admin` both pass every `[Authorize(Roles = "Admin,Owner")]` check; `Owner` specifically is also the only role protected from being demoted or deleted via the admin UI — see `Api/Services/UserService.cs`.)
3. Refresh the page in the browser — the role is re-read from the database on every request, so no logout is needed.

From then on you can manage everyone else's roles from `/admin/users` instead of touching the database.


# DEPLOY TO PRODUCTION
Prod is Api serving the built Angular app on `/` from a single Docker image, running on Azure Container Apps (scale-to-zero), with Azure SQL (`Basic` tier) and Blob Storage. GitHub Actions rebuilds and redeploys on every push to `main` — Terraform is only needed for infra changes, not for routine deploys.

### 1. First-time infra deploy
Prerequisites: same as dev ([Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) + Terraform `>= 1.9`, `az login`), plus the `Microsoft.App` resource provider registered on the subscription (one-time): `az provider register --namespace Microsoft.App --wait`.

```bash
cd infra/envs/prod
cp terraform.tfvars.example terraform.tfvars   # fill in claude_api_key; leave prod_azuread_client_secret as-is for now
terraform init
terraform plan
terraform apply
```

This provisions, into resource group `rg-ncatlas-prod`:
- **SQL Database** (`module.sql_database`, `westeurope`) — Basic tier (~$5/mo), firewall open to "Azure services" only.
- **Blob Storage** + **Entra ID app registrations** (`module.image_storage`, `module.aad_auth`, `westeurope`) — same shape as dev, prod redirect URI/CORS origin.
- **Container App** (`module.container_app`) — Consumption plan, `min_replicas = 0`, `/healthz` liveness/readiness probes, starts out running a placeholder image until the first GitHub Actions deploy.
- **GitHub OIDC deploy identity** (`module.github_oidc`) — dedicated app registration + federated credential, no stored Azure secrets in GitHub.

> **Region note:** `westeurope` occasionally runs out of Container Apps (AKS-backed) capacity. If `terraform apply` fails on `azurerm_container_app_environment.main` with `ManagedEnvironmentCapacityHeavyUsageError`, change `location` for just the `container_app` module in `infra/envs/prod/main.tf` to another EU region (we're currently on `swedencentral`) and re-apply — SQL/Storage/the resource group can stay in `westeurope`, Azure resources are located per-resource, not per-resource-group.

### 2. Manual one-time steps (after the first apply)
```bash
terraform output                              # human-readable
terraform output -raw sql_connection_string   # sensitive
```

1. **AAD client secret** — not Terraform-managed (same as dev): `az ad app credential reset --id <aad_api_client_id>`, then set `prod_azuread_client_secret` in `terraform.tfvars` and re-apply so the Container App picks it up.
2. **Frontend MSAL config** — fill in `web/src/environments/environment.prod.ts`'s `msal` block: `clientId` ← `aad_spa_client_id`, `tenantId` ← `aad_tenant_id`, `apiScope` ← `aad_api_scope`. Commit it — the Docker build bundles whatever's committed.
3. **GitHub repo secrets** (Settings → Secrets and variables → Actions) — used by `.github/workflows/deploy.yml` to log into Azure via OIDC:

   | Secret | Value |
   |---|---|
   | `AZURE_CLIENT_ID` | `terraform output github_oidc_client_id` |
   | `AZURE_TENANT_ID` | `terraform output github_oidc_tenant_id` |
   | `AZURE_SUBSCRIPTION_ID` | `az account show --query id -o tsv` |

4. **GHCR package visibility** — usually already public automatically (inherited from the public repo), but worth a check after the first run at `github.com/FeroHriadel/nc-atlas/pkgs/container/nc-atlas`. If it's private, the Container App will fail to pull (no registry credentials are configured, by design).

### 3. Ongoing deploys
Just `git push` to `main`. The workflow builds the root `Dockerfile` (bundles the Angular build into the API's `wwwroot`), pushes to `ghcr.io/ferohriadel/nc-atlas`, then runs `az containerapp update` with the new image tag. Database migrations run automatically on container startup (`Program.cs`, Production-only) — no separate migration step, and no need to open the SQL firewall to CI.

### 4. Custom domain (`atlas.nclabs.eu`)
Live, pointing at the Container App. Two parts, applied differently:

- **DNS (AWS Route 53, `nclabs.eu` hosted zone)** — a `CNAME` (`atlas.nclabs.eu` → `terraform output container_app_fqdn`) and a `TXT` record (`asuid.atlas.nclabs.eu` → the environment's domain verification ID, from `az containerapp env show --name ncatlas-prod-env --resource-group rg-ncatlas-prod --query properties.customDomainConfiguration.customDomainVerificationId`). Managed manually via `aws route53 change-resource-record-sets`, not Terraform (DNS lives in a different cloud account).
- **Domain binding + managed TLS cert (Azure)** — **not** Terraform-managed. The `azurerm` provider has open bugs around managed-certificate creation for Container Apps custom domains, so this is applied directly via CLI instead:
  ```bash
  az containerapp hostname add --hostname atlas.nclabs.eu --name ncatlas-prod-api --resource-group rg-ncatlas-prod
  az containerapp hostname bind --hostname atlas.nclabs.eu --name ncatlas-prod-api --resource-group rg-ncatlas-prod --environment ncatlas-prod-env --validation-method CNAME
  ```
  Re-run these two if the Container App or its environment is ever recreated. `web/src/environments/environment.prod.ts`'s `redirectUri: '/'` is relative, so MSAL works from either the custom domain or the default `*.azurecontainerapps.io` one without changes — both stay reachable (the AAD redirect URIs and Blob CORS origins list both, see `infra/envs/prod/main.tf`).

### 5. Connecting to the prod database directly
The SQL firewall only allows Azure-internal traffic by default. To connect from your own machine (e.g. Azure Data Studio, to promote yourself to `Owner` the same way as in dev — see above):

```bash
az sql server firewall-rule create \
  --resource-group rg-ncatlas-prod --server ncatlas-prod-sql \
  --name "AllowMyIP-$(date +%Y%m%d)" \
  --start-ip-address <your public IP> --end-ip-address <your public IP>
```

Remove it again with `az sql server firewall-rule delete` once you're done, if you'd rather not leave it open.

### 6. Graph API access (admin create/delete user) — managed identity, not a client secret
The `/admin/users` create/delete actions call Microsoft Graph as the app itself (`Api/Services/GraphService.cs`). In prod this uses the Container App's **system-assigned managed identity** (`infra/modules/container-app/main.tf`: `identity { type = "SystemAssigned" }` + an `azuread_app_role_assignment` granting it Graph's `User.ReadWrite.All` application role) instead of `AzureAd:ClientSecret` — Azure rotates that identity's underlying credential internally, so there's nothing to expire or renew here, unlike the AAD client secret below. `Api/Extensions/AppServiceExtensions.cs` picks the credential type based on environment: `ManagedIdentityCredential` when `IsProduction()`, `ClientSecretCredential` otherwise (local dev has no managed identity to use).

`AzureAd:ClientSecret` is still used in prod for one thing: JWT bearer validation config (`AddMicrosoftIdentityWebApi`) reads the whole `AzureAd` section, though the secret itself isn't actually exercised by that path. It's kept for now as a fallback rather than removed outright.
