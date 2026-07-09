import { ApplicationConfig, importProvidersFrom, inject, isDevMode, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideStore, provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { MsalModule, MsalService } from '@azure/msal-angular';
import { switchMap } from 'rxjs';



import { routes } from './app.routes';
import { categoryFeature } from './state/categories/category.reducer';
import { CategoryEffects } from './state/categories/category.effects';
import { tagFeature } from './state/tags/tag.reducer';
import { TagEffects } from './state/tags/tag.effects';
import { userFeature } from './state/users/user.reducer';
import { UserEffects } from './state/users/user.effects';
import { sightFeature } from './state/sights/sight.reducer';
import { SightEffects } from './state/sights/sight.effects';
import { tripFeature } from './state/trips/trip.reducer';
import { TripEffects } from './state/trips/trip.effects';
import { msalGuardConfigFactory, msalInstanceFactory, msalInterceptorConfigFactory } from './auth/msal.config';
import { authInterceptor } from './auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes),
    provideStore(),
    provideState(categoryFeature),
    provideState(tagFeature),
    provideState(userFeature),
    provideState(sightFeature),
    provideState(tripFeature),
    provideEffects(CategoryEffects, TagEffects, UserEffects, SightEffects, TripEffects),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
    importProvidersFrom(
      MsalModule.forRoot(msalInstanceFactory(), msalGuardConfigFactory(), msalInterceptorConfigFactory())
    ),
    // MSAL must finish instance.initialize() (and process any redirect response) before
    // any other code calls into it, or it throws uninitialized_public_client_application
    provideAppInitializer(() => {
      const msal = inject(MsalService);
      return msal.initialize().pipe(switchMap(() => msal.handleRedirectObservable()));
    }),
  ]
};
