terraform {
  backend "azurerm" {
    resource_group_name  = "rg-ncatlas-tfstate"
    storage_account_name = "ncatlastfstate"
    container_name       = "tfstate"
    key                  = "dev.tfstate"
  }
}
