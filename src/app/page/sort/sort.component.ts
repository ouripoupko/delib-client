import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Collection } from 'src/app/statement';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-sort',
  templateUrl: './sort.component.html',
  styleUrls: ['./sort.component.scss']
})
export class SortComponent {

  unsorted: string[] = [];
  support: string[] = [];
  oppose: string[] = [];
  list_of_lists: {[key: string]: string[]} = {}

  constructor (
    @Inject(MAT_DIALOG_DATA) public data: {statements: Collection, ranking: string[][]}
  ) {
    this.support = [...data.ranking[0]];
    this.oppose = [...data.ranking[1]];
    this.unsorted = Object.keys(data.statements);
    this.support = this.support.filter( x => this.unsorted.includes(x) );
    this.oppose = this.oppose.filter( x => this.unsorted.includes(x) );
    this.unsorted = this.unsorted.filter( x => !this.support.includes(x) && !this.oppose.includes(x) )
    this.list_of_lists = {'unsorted': this.unsorted,
                          'support': this.support,
                          'oppose': this.oppose}
  }

  drop(event: CdkDragDrop<string[]>) {
    let key = this.list_of_lists[event.previousContainer.id][event.previousIndex];
    this.list_of_lists[event.previousContainer.id].splice(event.previousIndex, 1);
    this.list_of_lists[event.container.id].splice(event.currentIndex, 0, key);
  }

}
