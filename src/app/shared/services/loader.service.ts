import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoaderService {
    private isLoading = new BehaviorSubject<boolean>(false);
    isLoading$ = this.isLoading.asObservable();

    show() {
        this.isLoading.next(true);
    }

    hide(minDuration: number = 0) {
        if (minDuration > 0) {
            setTimeout(() => this.isLoading.next(false), minDuration);
        } else {
            this.isLoading.next(false);
        }
    }
}