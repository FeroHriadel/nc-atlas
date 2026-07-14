variable "name_prefix" {
  description = "Prefix used for all resource names in this module, e.g. \"ncatlas-prod\""
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "resource_group_name" {
  description = "Resource group to deploy into"
  type        = string
}

variable "database_name" {
  description = "Name of the SQL database"
  type        = string
  default     = "ncatlas"
}

variable "administrator_login" {
  description = "SQL Server admin login name"
  type        = string
  default     = "ncatlasadmin"
}
