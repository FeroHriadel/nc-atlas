output "connection_string" {
  description = "Full ADO.NET connection string (ConnectionStrings__Default), ready to hand to a Container App secret"
  value       = "Server=tcp:${azurerm_mssql_server.main.fully_qualified_domain_name},1433;Initial Catalog=${azurerm_mssql_database.main.name};Persist Security Info=False;User ID=${var.administrator_login};Password=${random_password.admin.result};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
  sensitive   = true
}

output "server_fqdn" {
  value = azurerm_mssql_server.main.fully_qualified_domain_name
}
