import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.scss']
})
export class AddComponent {
  statement: string = '';

  constructor(
    private dialogRef: MatDialogRef<AddComponent>
  ) {}

  close() {
    this.dialogRef.close(this.statement);
  }
}
