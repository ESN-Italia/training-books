import { Component, InjectionToken } from '@angular/core';
import { IDEAEnvironment, IDEAEnvironmentConfiguration } from '@idea-ionic/common';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { environment } from 'src/environments/environment.idea';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {}
}
