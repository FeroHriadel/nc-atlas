# Stage 1: build the Angular frontend
FROM node:22-alpine AS web-build
WORKDIR /web
COPY web/package*.json ./
# --legacy-peer-deps: @ngrx/effects, @ngrx/store, @ngrx/store-devtools (all
# ^21.1.1) declare a peer on @angular/core ^21.0.0, but the project runs
# @angular/core ^22.0.0. That's an existing mismatch in package.json, not
# something introduced here — `npm install` locally tolerates it, but `npm
# ci`'s strict peer-dep check doesn't, so it fails in a clean container.
# Worth revisiting by bumping the @ngrx/* packages to an Angular-22-compatible
# release; not addressed here since it's outside the scope of this change.
RUN npm ci --legacy-peer-deps
COPY web/ ./
RUN npm run build

# Stage 2: restore/build/publish the .NET API, bundling the Angular build into
# wwwroot before publish (Microsoft.NET.Sdk.Web globs wwwroot/** into the
# publish output automatically — no .csproj changes needed).
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS api-build
WORKDIR /src
COPY Api/*.csproj ./Api/
RUN dotnet restore Api/Api.csproj
COPY Api/ ./Api/
COPY --from=web-build /web/dist/web/browser ./Api/wwwroot
RUN dotnet publish Api/Api.csproj -c Release -o /app/publish

# Stage 3: runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=api-build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
# .NET 8+ runtime images ship a built-in non-root "app" user for exactly this.
USER app
ENTRYPOINT ["dotnet", "Api.dll"]
