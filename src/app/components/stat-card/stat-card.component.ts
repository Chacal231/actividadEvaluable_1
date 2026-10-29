import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonIcon, IonSkeletonText } from '@ionic/angular';

@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonCard, IonIcon, IonSkeletonText],
})
export class StatCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = '';
  @Input() icon: string = '';
  @Input() color: string = 'primary';
  @Input() trend?: string = '';
  @Input() trendDirection: 'up' | 'down' | 'neutral' = 'up';
  @Input() loading: boolean = false;
}


