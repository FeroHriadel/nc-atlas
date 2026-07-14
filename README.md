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
