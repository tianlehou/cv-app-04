import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CandidateSelectionService {
  private _selectedUser = new BehaviorSubject<any>(null);
  selectedUser$: Observable<any> = this._selectedUser.asObservable();

  constructor() { }

  setSelectedUser(user: any): void {
    this._selectedUser.next(user);
  }

  getSelectedUser(): any {
    return this._selectedUser.getValue();
  }
}