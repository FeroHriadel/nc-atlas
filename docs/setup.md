# Setup notes

## Tools installed

**Terraform** — Infrastructure-as-code tool we use to define and apply Azure resources.
```
winget install --id Hashicorp.Terraform -e
```

**Azure CLI (`az`)** — needed so Terraform's `azurerm` provider can authenticate against Azure.
```
winget install --id Microsoft.AzureCLI -e
```

After either install, you need to open a **new terminal** for the updated PATH to take effect.

Logged into Azure with:
```
az login
```
This opens a browser, signs you in, and sets a default subscription (`az account show` to confirm which one).

## Terraform state — the bootstrap problem

Terraform needs somewhere to store its **state file** (a record of what it created). For a team/cloud setup we want that state in Azure Blob Storage, not on a laptop. But that storage account is itself an Azure resource — something has to create *it* first, and that something can't yet point at the very storage account it's creating.

Solution: a one-off `infra/bootstrap` config that creates just the state storage account, using **local** state (the only sane option for this single step). Every other Terraform config then points at that storage account for **remote** state.

## Commands used and why

| Command | What it does | Why we ran it |
|---|---|---|
| `terraform init` | Downloads the providers (e.g. `azurerm`) declared in `.tf` files, sets up the backend | Required once per config before any other command will work |
| `terraform plan` | Dry-run: shows what would be created/changed/destroyed, without touching real infra | Always review before `apply` so there are no surprises |
| `terraform apply` | Actually creates/updates/destroys resources in Azure to match the `.tf` config | Run after a `plan` looks correct |
| `terraform apply -auto-approve` | Same as `apply`, skips the interactive yes/no confirmation | Used here for a low-risk bootstrap step; normally you'd want the confirmation prompt |

## What we built

1. **`infra/bootstrap/`** (local state) — creates:
   - Resource group `rg-ncatlas-tfstate`
   - Storage account `ncatlastfstate`
   - Blob container `tfstate`

   Applied with `terraform init` then `terraform apply` inside `infra/bootstrap/`.

2. **`infra/envs/dev/`** (remote state) — its `backend.tf` points at the storage account/container created above, so running `terraform init` here configures Terraform to read/write state to Azure Blob Storage instead of a local file.

## Key files

- `versions.tf` — pins the Terraform version and provider versions (`azurerm ~> 4.0`)
- `backend.tf` — tells Terraform *where* to store state (only present in `envs/*`, not in `bootstrap`)
- `main.tf` — the actual resource/module definitions
- `.terraform.lock.hcl` — records exact provider versions used; **commit this to git** so everyone gets the same versions
- `.terraform/`, `*.tfstate*`, `*.tfvars` — local/generated, **gitignored** (state can contain secrets, `.terraform/` is just downloaded plugins)
