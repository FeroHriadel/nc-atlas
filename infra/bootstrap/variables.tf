variable "project_name" {
  description = "Short name used to prefix all bootstrap resources (lowercase letters/numbers only, keep it short — it's part of a globally unique storage account name)"
  type        = string
  default     = "ncatlas"
}

variable "location" {
  description = "Azure region for the state storage resources"
  type        = string
  default     = "westeurope"
}
